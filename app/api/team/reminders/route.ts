import {timingSafeEqual} from 'node:crypto';
import {sendDailyReminders} from '@/lib/reminders-server';
import {teamResponse,teamSession} from '@/lib/team-server';
import {allowRequest} from '@/lib/rate-limit';
export const maxDuration=300;
export async function GET(request:Request){
 const expected=process.env.CRON_SECRET,token=request.headers.get('authorization');
 if(!expected||!token||Buffer.byteLength(token)!==Buffer.byteLength('Bearer '+expected)||!timingSafeEqual(Buffer.from(token),Buffer.from('Bearer '+expected)))return teamResponse({error:'Unauthorized.'},401);
 try{return teamResponse(await sendDailyReminders())}catch{return teamResponse({error:'Reminders could not be processed. Review the outbox before retrying.'},503)}
}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return teamResponse({error:'Invalid origin.'},403);
 const session=await teamSession();if(!session||session.staff.role==='employee')return teamResponse({error:'Management sign-in required.'},403);
 if(!await allowRequest(request,'manual-reminders',3))return teamResponse({error:'Please wait before checking reminders again.'},429,session.session);
 try{return teamResponse(await sendDailyReminders(),200,session.session)}catch{return teamResponse({error:'Reminders could not be processed. Review the outbox before retrying.'},503,session.session)}
}
