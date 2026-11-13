import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import type {Staff} from './team';

export function teamConfigured(){return Boolean(process.env.TEAM_SUPABASE_URL?.startsWith('https://')&&process.env.TEAM_SUPABASE_PUBLISHABLE_KEY)}
export function teamDb(token?:string){
 if(!teamConfigured())throw Error('Team workspace is not connected yet.');
 return createClient(process.env.TEAM_SUPABASE_URL!,process.env.TEAM_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},...(token?{global:{headers:{Authorization:'Bearer '+token}}}:{})});
}
export async function teamSession(){
 if(!teamConfigured())return null;
 const jar=await cookies();let access=jar.get('ath_access')?.value;const refresh=jar.get('ath_refresh')?.value;let session:{access_token:string;refresh_token:string;expires_in:number}|null=null;
 let auth=access?await teamDb().auth.getUser(access):null;
 if(!auth?.data.user&&refresh){const result=await teamDb().auth.refreshSession({refresh_token:refresh});if(result.data.session){session=result.data.session;access=session.access_token;auth=await teamDb().auth.getUser(access)}}
 if(!auth?.data.user||!access)return null;
 const db=teamDb(access);const {data:staff}=await db.from('ath_staff').select('id,name,role,active').eq('id',auth.data.user.id).single();
 if(!staff?.active||!['owner','manager','employee'].includes(staff.role))return null;
 return{db,staff:staff as Staff,email:auth.data.user.email,session};
}
export function teamResponse(body:unknown,status=200,session?:{access_token:string;refresh_token:string;expires_in:number}|null){
 const response=NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie'}});
 if(session){const options={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict' as const,path:'/'};response.cookies.set('ath_access',session.access_token,{...options,maxAge:session.expires_in});response.cookies.set('ath_refresh',session.refresh_token,{...options,maxAge:7*86400})}
 return response;
}
