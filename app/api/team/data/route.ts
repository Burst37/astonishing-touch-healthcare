import {z} from 'zod';
import {teamSession,teamResponse} from '@/lib/team-server';
import {allowRequest} from '@/lib/rate-limit';
const uuid=z.string().uuid();
const coordinate=z.object({latitude:z.number().min(-90).max(90).nullable(),longitude:z.number().min(-180).max(180).nullable(),accuracy:z.number().min(0).max(50000).nullable(),sampledAt:z.string().datetime().nullable()}).strict().refine(d=>[d.latitude,d.longitude,d.accuracy,d.sampledAt].every(v=>v===null)||[d.latitude,d.longitude,d.accuracy,d.sampledAt].every(v=>v!==null),'Provide a complete reading or mark location unavailable.');
const inputSchema=z.discriminatedUnion('action',[
 z.object({action:z.enum(['clock_in','clock_out']),client_id:uuid,request_id:uuid,location:coordinate}).strict(),
 z.object({action:z.literal('client'),data:z.object({id:uuid.optional(),name:z.string().trim().min(2).max(100),address:z.string().trim().min(3).max(240),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),radius_m:z.number().int().min(50).max(1000),active:z.boolean(),phone:z.string().max(32).optional()}).strict()}).strict(),
 z.object({action:z.literal('staff'),data:z.object({id:uuid,name:z.string().trim().min(2).max(100),role:z.enum(['owner','manager','employee']),active:z.boolean()}).strict()}).strict(),
 z.object({action:z.literal('staff_contact'),data:z.object({id:uuid,name:z.string().trim().min(2).max(100),phone:z.string().max(32),address:z.string().max(240),sms_opt_in:z.boolean()}).strict().refine(d=>!d.sms_opt_in||/^\+[1-9]\d{7,14}$/.test(d.phone),'SMS requires an international phone number.')}).strict(),
 z.object({action:z.literal('schedule'),data:z.object({id:uuid.optional(),employee_id:uuid,client_id:uuid,starts_at:z.string().datetime(),ends_at:z.string().datetime(),status:z.enum(['scheduled','cancelled'])}).strict()}).strict(),
 z.object({action:z.literal('assignment'),data:z.object({employee_id:uuid,client_id:uuid,active:z.boolean()}).strict()}).strict(),
 z.object({action:z.literal('review'),data:z.object({id:uuid,status:z.enum(['approved','needs_review']),reason:z.string().trim().min(10).max(500)}).strict()}).strict(),
 z.object({action:z.literal('adjust'),data:z.object({id:uuid,clock_in:z.string().datetime(),clock_out:z.string().datetime().nullable(),reason:z.string().trim().min(10).max(500)}).strict()}).strict(),
]);
export async function GET(){
 const session=await teamSession();if(!session)return teamResponse({error:'Staff sign-in required.'},401);
 const db=session.db;
 const results=await Promise.all([db.from('ath_staff').select('*').order('name'),db.from('ath_clients').select('*').order('name'),db.from('ath_assignments').select('*'),db.from('ath_visits').select('*').order('clock_in',{ascending:false}).limit(500),db.from('ath_visits').select('*').is('clock_out',null),db.from('ath_visit_audit').select('id,visit_id,actor_id,action,reason,created_at').order('created_at',{ascending:false}).limit(100),db.from('ath_schedule').select('*').order('starts_at',{ascending:false}).limit(500),db.from('ath_sms_outbox').select('id,employee_id,work_day,status,provider_id,error_code,created_at').order('created_at',{ascending:false}).limit(100)]);
 if(results.some(r=>r.error))return teamResponse({error:'Workspace data could not be loaded. Contact the office.'},503,session.session);
 const [staff,clients,assignments,recent,open,audit,schedule,reminders]=results.map(r=>r.data||[]);
 const visits=[...new Map([...open,...recent].map(v=>[v.id,v])).values()];
 const paths=[...staff,...clients].map(p=>p.photo_path).filter(Boolean);
 const signed=paths.length?await db.storage.from('ath-profile-photos').createSignedUrls(paths,120):null;
 const photos=new Map((signed?.data||[]).map(p=>[p.path,p.signedUrl]));
 const withPhotos=(rows:typeof staff)=>rows.map(p=>({...p,photo_url:photos.get(p.photo_path)}));
 return teamResponse({staff:withPhotos(staff),clients:withPhotos(clients),assignments,visits,audit,schedule,reminders,capabilities:{invitations:process.env.VERCEL_ENV!=='preview'&&Boolean(process.env.TEAM_SUPABASE_SECRET_KEY),sms:process.env.VERCEL_ENV!=='preview'&&process.env.REMINDERS_ENABLED==='true'&&Boolean(process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&(process.env.TWILIO_MESSAGING_SERVICE_SID||process.env.TWILIO_FROM_NUMBER))}},200,session.session);
}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return teamResponse({error:'Invalid origin.'},403);
 const session=await teamSession();if(!session)return teamResponse({error:'Staff sign-in required.'},401);
 if(!await allowRequest(request,'team-write',30))return teamResponse({error:'Please wait a moment and retry.'},429,session.session);
 let input:z.infer<typeof inputSchema>;
 try{const raw=await request.text();if(raw.length>4000)return teamResponse({error:'Request too large.'},413,session.session);input=inputSchema.parse(JSON.parse(raw))}catch{return teamResponse({error:'Check the fields and provide a reason of at least 10 characters for reviews or corrections.'},400,session.session)}
 if(input.action==='clock_in'||input.action==='clock_out'){
  const {latitude,longitude,accuracy,sampledAt}=input.location;
  const {data,error}=await session.db.rpc('ath_clock_visit',{p_action:input.action,p_client:input.client_id,p_request:input.request_id,p_lat:latitude,p_lng:longitude,p_accuracy:accuracy,p_sampled:sampledAt});
  if(error)return teamResponse({error:'The clock action was not accepted. Refresh and check your active visit and assignment before retrying.'},409,session.session);
  return teamResponse({visit:data},200,session.session);
 }
 if(session.staff.role==='employee'||(input.action==='staff'&&session.staff.role!=='owner'))return teamResponse({error:'This action requires management access.'},403,session.session);
 const management=input as Exclude<z.infer<typeof inputSchema>,{action:'clock_in'|'clock_out'}>;
 const {data,error}=await session.db.rpc('ath_manage',{p_action:management.action,p_data:management.data});
 if(error)return teamResponse({error:'The change was not accepted. Check the account IDs, times and review reason. Owners cannot change their own access.'},409,session.session);
 return teamResponse({record:data},200,session.session);
}
