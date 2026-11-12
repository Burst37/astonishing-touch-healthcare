import {chicagoInputToUtc,localDay,type ScheduledVisit} from './scheduling';
import type {TeamData,Visit} from './team';
export type ReportKind='schedule'|'attendance';
export type ReportFilters={kind:ReportKind;from:string;to:string;employee:string};
export type ReportCorrection={id:string;visit_id:string;actor_id:string;reason:string|null;created_at:string;before_state:{clock_in?:string;clock_out?:string|null}|null;after_state:{clock_in?:string;clock_out?:string|null}|null};
export type TeamReport={filters:ReportFilters;staff:{id:string;name:string}[];clients:{id:string;name:string;address:string}[];visits:Visit[];schedule:ScheduledVisit[];corrections:ReportCorrection[];generatedAt:string;demo:boolean};
function day(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error('Choose valid report dates.');return value}
export function reportBounds(filters:ReportFilters){
 day(filters.from);day(filters.to);if(!['schedule','attendance'].includes(filters.kind))throw Error('Choose a report type.');
 const days=(Date.parse(filters.to)-Date.parse(filters.from))/86400000;
 if(days<0||days>365)throw Error('Choose an end date on or after the start, within one year.');
 const next=new Date(Date.parse(filters.to+'T12:00:00Z')+86400000).toISOString().slice(0,10);
 return {start:chicagoInputToUtc(filters.from+'T00:00'),end:chicagoInputToUtc(next+'T00:00')};
}
export function reportPreset(kind:'week'|'month',now=new Date()){
 const today=localDay(now),date=new Date(today+'T12:00:00Z');
 if(kind==='week'){const offset=(date.getUTCDay()+6)%7;date.setUTCDate(date.getUTCDate()-offset);const from=date.toISOString().slice(0,10);date.setUTCDate(date.getUTCDate()+6);return{from,to:date.toISOString().slice(0,10)}}
 return{from:today.slice(0,7)+'-01',to:new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0,12)).toISOString().slice(0,10)};
}
export function demoReport(data:TeamData,filters:ReportFilters):TeamReport{
 const {start,end}=reportBounds(filters);const matches=(row:{employee_id:string},value:string)=>value>=start&&value<end&&(!filters.employee||row.employee_id===filters.employee);
 return{filters,staff:data.staff.map(({id,name})=>({id,name})),clients:data.clients.map(({id,name,address})=>({id,name,address})),visits:filters.kind==='attendance'?data.visits.filter(v=>matches(v,v.clock_in)):[],schedule:filters.kind==='schedule'?(data.schedule||[]).filter(s=>matches(s,s.starts_at)):[],corrections:[],generatedAt:new Date().toISOString(),demo:true};
}
