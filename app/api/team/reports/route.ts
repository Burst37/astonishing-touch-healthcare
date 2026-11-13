import {teamSession,teamResponse} from '@/lib/team-server';
import {reportBounds,type ReportFilters} from '@/lib/team-reports';
import {allowRequest} from '@/lib/rate-limit';
export async function GET(request:Request){
 const session=await teamSession();if(!session)return teamResponse({error:'Staff sign-in required.'},401);
 if(session.staff.role==='employee')return teamResponse({error:'Reports require management access.'},403,session.session);
 if(!await allowRequest(request,'team-report',10))return teamResponse({error:'Please wait before downloading another report.'},429,session.session);
 const params=new URL(request.url).searchParams;const filters={kind:params.get('kind'),from:params.get('from')||'',to:params.get('to')||'',employee:params.get('employee')||''} as ReportFilters;
 let bounds;try{bounds=reportBounds(filters);if(filters.employee&&!/^[a-f0-9-]{36}$/i.test(filters.employee))throw Error('Choose an employee.')}catch(e){return teamResponse({error:e instanceof Error?e.message:'Check the report dates.'},400,session.session)}
 try{
 const {db}=session;
 // Page every query: the dashboard's 500-record window must not truncate reports.
 async function pages(query:(offset:number)=>PromiseLike<{data:unknown[]|null;error:unknown}>){const rows:unknown[]=[];for(let offset=0;offset<=10000;offset+=500){const result=await query(offset);if(result.error)throw Error('Report data could not be loaded. Retry or contact the office.');rows.push(...(result.data||[]));if(rows.length>10000)throw Error('This report exceeds 10,000 records. Select a shorter period or one employee.');if((result.data||[]).length<500)return rows}throw Error('Select a shorter report period.')}
 const kind=filters.kind==='schedule',column=kind?'starts_at':'clock_in';
 const records=await pages(offset=>{let q=db.from(kind?'ath_schedule':'ath_visits').select('*').gte(column,bounds.start).lt(column,bounds.end).order(column).order('id');if(filters.employee)q=q.eq('employee_id',filters.employee);return q.range(offset,offset+499)});
 const [staff,clients]=await Promise.all([pages(offset=>db.from('ath_staff').select('id,name').order('id').range(offset,offset+499)),pages(offset=>db.from('ath_clients').select('id,name,address').order('id').range(offset,offset+499))]);
 const corrections:unknown[]=[];
 if(!kind){const ids=records.map(row=>(row as {id:string}).id);for(let i=0;i<ids.length;i+=100){corrections.push(...await pages(offset=>db.from('ath_visit_audit').select('id,visit_id,actor_id,reason,created_at,before_state,after_state').eq('action','adjust').in('visit_id',ids.slice(i,i+100)).order('created_at').order('id').range(offset,offset+499)));if(corrections.length>10000)throw Error('Too many corrections. Select a shorter period.')}}
 return teamResponse({filters,staff,clients,visits:kind?[]:records,schedule:kind?records:[],corrections,generatedAt:new Date().toISOString(),demo:false},200,session.session);
 }catch(e){return teamResponse({error:e instanceof Error?e.message:'The report could not be prepared.'},503,session.session)}
}
