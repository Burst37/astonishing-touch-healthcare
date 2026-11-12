import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {teamSession,teamResponse} from '@/lib/team-server';
import {allowRequest} from '@/lib/rate-limit';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return teamResponse({error:'Invalid origin.'},403);
 const session=await teamSession();if(!session||session.staff.role==='employee')return teamResponse({error:'Management access required.'},403);
 if(!process.env.TEAM_SUPABASE_SECRET_KEY||process.env.VERCEL_ENV==='preview')return teamResponse({error:'Staff invitations are not connected in this environment.'},503,session.session);
 if(!await allowRequest(request,'team-invite',5))return teamResponse({error:'Please wait before inviting another employee.'},429,session.session);
 try{
 const raw=await request.text();if(raw.length>1000)throw Error();
 const input=z.object({name:z.string().trim().min(2).max(100),email:z.string().email().max(200)}).strict().parse(JSON.parse(raw));
 const site=process.env.TEAM_PUBLIC_URL;if(!site||!/^https:\/\/[a-z0-9.-]+$/i.test(site))return teamResponse({error:'The agency’s invitation address is not configured.'},503,session.session);
 const admin=createClient(process.env.TEAM_SUPABASE_URL!,process.env.TEAM_SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const invited=await admin.auth.admin.inviteUserByEmail(input.email,{redirectTo:site+'/team/activate'});
 if(invited.error||!invited.data.user)return teamResponse({error:'The invitation could not be created. Check whether this email already has an account.'},409,session.session);
 const profile=await session.db.rpc('ath_manage',{p_action:'register_employee',p_data:{id:invited.data.user.id,name:input.name}});
 if(profile.error)return teamResponse({error:'An invitation was requested, but staff setup is incomplete. Contact the owner before retrying.'},503,session.session);
 return teamResponse({created:true},201,session.session);
 }catch{return teamResponse({error:'Check the employee name and email.'},400,session.session)}
}
