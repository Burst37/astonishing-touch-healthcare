import {createClient} from '@supabase/supabase-js';
import {agencyTimeZone,localDay,chicagoInputToUtc,reminderText,type ScheduledVisit} from './scheduling';
export function remindersConfigured(){return process.env.VERCEL_ENV!=='preview'&&process.env.REMINDERS_ENABLED==='true'&&Boolean(process.env.TEAM_SUPABASE_URL&&process.env.TEAM_SUPABASE_SECRET_KEY&&process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&(process.env.TWILIO_MESSAGING_SERVICE_SID||process.env.TWILIO_FROM_NUMBER))}
export async function sendDailyReminders(){
 if(!remindersConfigured())return{enabled:false,accepted:0,failed:0,uncertain:0};
 const db=createClient(process.env.TEAM_SUPABASE_URL!,process.env.TEAM_SUPABASE_SECRET_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 const day=localDay(new Date()),start=chicagoInputToUtc(day+'T00:00');
 const tomorrow=new Date(Date.parse(day+'T12:00:00Z')+86400000).toISOString().slice(0,10),end=chicagoInputToUtc(tomorrow+'T00:00');
 const [people,clientResult,assignmentResult,shiftResult]=await Promise.all([db.from('ath_staff').select('id,phone,active,sms_opt_in').eq('active',true).eq('sms_opt_in',true),db.from('ath_clients').select('id,name,address,active').eq('active',true),db.from('ath_assignments').select('*').eq('active',true),db.from('ath_schedule').select('*').eq('status','scheduled').lt('starts_at',end).gt('ends_at',start)]);
 if([people,clientResult,assignmentResult,shiftResult].some(r=>r.error))throw Error('Reminder data unavailable');
 const staff=people.data||[],clients=clientResult.data||[],assignments=assignmentResult.data||[];
 const site=process.env.TEAM_PUBLIC_URL||'https://astonishing-touch-healthcare.vercel.app';
 if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(site))throw Error('Invalid staff site URL');
 for(const person of staff){
  if(!/^\+[1-9]\d{7,14}$/.test(person.phone))continue;
  const shifts=(shiftResult.data||[]).filter(s=>s.employee_id===person.id&&clients.some(c=>c.id===s.client_id)&&assignments.some(a=>a.employee_id===person.id&&a.client_id===s.client_id));
  if(!shifts.length)continue;
  const insert=await db.from('ath_sms_outbox').upsert({employee_id:person.id,work_day:day,body:reminderText(day,shifts as ScheduledVisit[],clients,site)},{onConflict:'employee_id,work_day',ignoreDuplicates:true});
  if(insert.error)throw Error('Reminder queue unavailable');
 }
 // A crashed/ambiguous send is never silently retried: the provider may have accepted it.
 await db.from('ath_sms_outbox').update({status:'uncertain',error_code:'CHECK_PROVIDER_BEFORE_RESEND'}).eq('status','sending').lt('claimed_at',new Date(Date.now()-5*60000).toISOString());
 const counts={enabled:true,accepted:0,failed:0,uncertain:0};
 const deadline=Date.now()+240000;
 while(Date.now()<deadline){
 const claim=await db.rpc('ath_claim_sms');if(claim.error)throw Error('Reminder queue unavailable');
 const job=claim.data?.[0];if(!job)break;
  const person=staff.find(p=>p.id===job.employee_id);
  if(!person||job.work_day!==day){await db.from('ath_sms_outbox').update({status:'failed',error_code:'OPT_IN_OR_DAY_CHANGED'}).eq('id',job.id);counts.failed++;continue}
  const shifts=(shiftResult.data||[]).filter(s=>s.employee_id===person.id&&clients.some(c=>c.id===s.client_id)&&assignments.some(a=>a.employee_id===person.id&&a.client_id===s.client_id));
  if(!shifts.length){await db.from('ath_sms_outbox').update({status:'failed',error_code:'NO_ACTIVE_SCHEDULE'}).eq('id',job.id);counts.failed++;continue}
  const body=new URLSearchParams({To:person.phone,Body:reminderText(day,shifts as ScheduledVisit[],clients,site),...(process.env.TWILIO_MESSAGING_SERVICE_SID?{MessagingServiceSid:process.env.TWILIO_MESSAGING_SERVICE_SID}:{From:process.env.TWILIO_FROM_NUMBER!})});
  try{
   const response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(process.env.TWILIO_ACCOUNT_SID!)}/Messages.json`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(process.env.TWILIO_ACCOUNT_SID+':'+process.env.TWILIO_AUTH_TOKEN).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body,signal:AbortSignal.timeout(10000)});
   const result=await response.json();
   if(response.ok&&/^SM[0-9a-f]{32}$/i.test(result.sid)){await db.from('ath_sms_outbox').update({status:'accepted',provider_id:result.sid}).eq('id',job.id);counts.accepted++}
   else if(response.status>=400&&response.status<500){await db.from('ath_sms_outbox').update({status:'failed',error_code:String(Number(result.code)||response.status)}).eq('id',job.id);counts.failed++}
   else{await db.from('ath_sms_outbox').update({status:'uncertain',error_code:'CHECK_PROVIDER_BEFORE_RESEND'}).eq('id',job.id);counts.uncertain++}
  }catch{await db.from('ath_sms_outbox').update({status:'uncertain',error_code:'CHECK_PROVIDER_BEFORE_RESEND'}).eq('id',job.id);counts.uncertain++}
 }
 return{...counts,timeZone:agencyTimeZone};
}
