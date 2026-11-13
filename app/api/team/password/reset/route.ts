import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {teamConfigured,teamDb,teamSession,teamResponse} from '@/lib/team-server';
import {allowRequest} from '@/lib/rate-limit';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return teamResponse({error:'Invalid origin.'},403);
 if(!teamConfigured()||process.env.VERCEL_ENV==='preview')return teamResponse({error:'Password email is not connected in this environment.'},503);
 if(!await allowRequest(request,'team-password-reset',5))return teamResponse({error:'Please wait before requesting another link.'},429);
 const site=process.env.TEAM_PUBLIC_URL;if(!site||!/^https:\/\/[a-z0-9.-]+$/i.test(site))return teamResponse({error:'The agency password-reset address is not configured.'},503);
 try{
 const raw=await request.text();if(raw.length>1000)throw Error();const input=z.union([z.object({email:z.string().email().max(200)}).strict(),z.object({staff_id:z.string().uuid()}).strict()]).parse(JSON.parse(raw));
 let email:string;let refreshed=null;
 if('staff_id' in input){
  const session=await teamSession();if(!session)return teamResponse({error:'Staff sign-in required.'},401);
  if(session.staff.role==='employee')return teamResponse({error:'Management access required.'},403,session.session);
  if(!process.env.TEAM_SUPABASE_SECRET_KEY)return teamResponse({error:'Manager password-reset emails are not connected yet.'},503,session.session);
  const target=await session.db.from('ath_staff').select('id,role,active').eq('id',input.staff_id).single();
  if(!target.data?.active||(session.staff.role!=='owner'&&target.data.role!=='employee'))return teamResponse({error:'Only the owner may reset a management account. Inactive staff cannot receive reset links.'},403,session.session);
  const admin=createClient(process.env.TEAM_SUPABASE_URL!,process.env.TEAM_SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const account=await admin.auth.admin.getUserById(input.staff_id);if(account.error||!account.data.user?.email)return teamResponse({error:'No sign-in email is available for this employee.'},400,session.session);
  email=account.data.user.email;refreshed=session.session;
 }else email=input.email;
 // Same response for existing and unknown addresses to avoid account discovery.
 await teamDb().auth.resetPasswordForEmail(email,{redirectTo:site+'/team/activate'});
 return teamResponse({message:'If this address has an account, a password-reset link will arrive by email. Check your inbox and spam folder.'},200,refreshed);
 }catch{return teamResponse({error:'Enter a valid email address or select an employee.'},400)}
}
