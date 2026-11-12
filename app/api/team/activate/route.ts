import {z} from 'zod';
import {teamConfigured,teamDb,teamResponse} from '@/lib/team-server';
import {allowRequest} from '@/lib/rate-limit';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return teamResponse({error:'Invalid origin.'},403);
 if(!teamConfigured())return teamResponse({error:'Staff access is not connected yet.'},503);
 if(!await allowRequest(request,'team-activate',5))return teamResponse({error:'Please wait and retry.'},429);
 try{
 const raw=await request.text();if(raw.length>2000)throw Error();const input=z.object({token_hash:z.string().min(20).max(500),password:z.string().min(12).max(200),type:z.enum(['invite','recovery']).default('invite')}).strict().parse(JSON.parse(raw));
 const db=teamDb();const verified=await db.auth.verifyOtp({token_hash:input.token_hash,type:input.type});
 if(verified.error||!verified.data.session||!verified.data.user)return teamResponse({error:'This invitation or reset link is invalid or expired. Request a new link or contact your manager.'},401);
 const staff=await teamDb(verified.data.session.access_token).from('ath_staff').select('id,active').eq('id',verified.data.user.id).single();
 if(!staff.data?.active)return teamResponse({error:'The staff profile is not active. Contact the office.'},403);
 const changed=await db.auth.updateUser({password:input.password});if(changed.error)return teamResponse({error:'The password could not be set. Contact the office.'},400);
 return teamResponse({activated:true},200,verified.data.session);
 }catch{return teamResponse({error:'Use the invitation link and a password of at least 12 characters.'},400)}
}
