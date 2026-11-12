export type ScheduledVisit={id:string;employee_id:string;client_id:string;starts_at:string;ends_at:string;status:'scheduled'|'cancelled'};
export type Reminder={id:string;employee_id:string;work_day:string;status:'pending'|'sending'|'accepted'|'delivered'|'failed'|'uncertain';provider_id?:string|null;created_at:string;error_code?:string|null};
export const agencyTimeZone='America/Chicago';
export function localDay(date:Date){return new Intl.DateTimeFormat('en-CA',{timeZone:agencyTimeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}
export function agencyTime(value:string){return new Intl.DateTimeFormat('en-US',{timeZone:agencyTimeZone,hour:'numeric',minute:'2-digit'}).format(new Date(value))}
export function chicagoInputToUtc(value:string){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('Enter a valid date and time.');
 const base=Date.parse(value+':00Z');
 const format=(d:Date)=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:agencyTimeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);const get=(t:string)=>parts.find(p=>p.type===t)?.value;return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`};
 const candidates=[5,6].map(h=>new Date(base+h*3600000)).filter(d=>format(d)===value);
 if(candidates.length!==1)throw Error('This time falls in a daylight-saving clock change. Choose an unambiguous time or contact the office.');
 return candidates[0].toISOString();
}
export function reminderText(day:string,shifts:ScheduledVisit[],clients:{id:string;name:string;address:string}[],site:string){
 const list=shifts.filter(s=>s.status==='scheduled').sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 const lines=list.map(s=>{const c=clients.find(c=>c.id===s.client_id);return `${agencyTime(s.starts_at)}–${agencyTime(s.ends_at)}: ${c?.name||'Assigned client'}; ${c?.address||'See your secure schedule'}`});
 let body=`Astonishing Touch — ${day}\nYour schedule (Central Time):\n`;
 for(const line of lines){if((body+line+site).length>1300){body+='More visits are listed in your secure schedule.\n';break}body+=line+'\n'}
 return body+`Details: ${site}/team\nReply STOP to opt out. Contact the office for changes.`;
}
