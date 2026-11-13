import {z} from 'zod';
import {teamSession,teamDb,teamResponse} from '@/lib/team-server';
import {allowRequest} from '@/lib/rate-limit';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return teamResponse({error:'Invalid origin.'},403);
 const session=await teamSession();if(!session)return teamResponse({error:'Staff sign-in required.'},401);
 if(!await allowRequest(request,'team-password-change',5))return teamResponse({error:'Please wait before retrying.'},429,session.session);
 try{
 const raw=await request.text();if(raw.length>2000)throw Error();const input=z.object({current_password:z.string().min(1).max(200),password:z.string().min(12).max(200)}).strict().parse(JSON.parse(raw));
 if(!session.email)return teamResponse({error:'Contact the office to confirm your account email.'},400,session.session);
 const db=teamDb();const verified=await db.auth.signInWithPassword({email:session.email,password:input.current_password});
 if(verified.error||!verified.data.session||verified.data.user?.id!==session.staff.id)return teamResponse({error:'Your current password was not accepted.'},401,session.session);
 const changed=await db.auth.updateUser({password:input.password});if(changed.error)return teamResponse({error:'The new password was not accepted. Choose a different strong password or contact the office.'},400,session.session);
 return teamResponse({changed:true},200,verified.data.session);
 }catch{return teamResponse({error:'Enter your current password and a new password of at least 12 characters.'},400,session.session)}
}
