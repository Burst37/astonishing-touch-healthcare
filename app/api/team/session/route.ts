import {z} from 'zod';
import {teamConfigured,teamDb,teamSession,teamResponse} from '@/lib/team-server';
import {allowRequest} from '@/lib/rate-limit';
export async function GET(){const session=await teamSession();return teamResponse({configured:teamConfigured(),staff:session?.staff||null},200,session?.session)}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return teamResponse({error:'Invalid origin.'},403);
 if(!teamConfigured())return teamResponse({error:'Staff sign-in is awaiting its secure workspace connection. Please contact the office.'},503);
 if(!await allowRequest(request,'staff-login',8))return teamResponse({error:'Too many attempts. Please wait a minute.'},429);
 try{const text=await request.text();if(text.length>1500)return teamResponse({error:'Request too large.'},413);const input=z.object({email:z.string().email().max(200),password:z.string().min(8).max(200)}).strict().parse(JSON.parse(text));const db=teamDb();const {data,error}=await db.auth.signInWithPassword(input);if(error||!data.session||!data.user)return teamResponse({error:'Sign-in was not accepted. Check your details or contact the office.'},401);const check=await teamDb(data.session.access_token).from('ath_staff').select('id,name,role,active').eq('id',data.user.id).single();if(!check.data?.active)return teamResponse({error:'This account has no active staff access. Contact the office.'},403);return teamResponse({staff:check.data},200,data.session)}catch{return teamResponse({error:'Check your email and password.'},400)}
}
export async function DELETE(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return teamResponse({error:'Invalid origin.'},403);
 const response=teamResponse({signedOut:true});response.cookies.set('ath_access','',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});response.cookies.set('ath_refresh','',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});return response;
}
