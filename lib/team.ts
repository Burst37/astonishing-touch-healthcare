import type {ScheduledVisit,Reminder} from './scheduling';
export type TeamRole='owner'|'manager'|'employee';
export type LocationStatus='within_range'|'outside_range'|'uncertain'|'unavailable';
export type Staff={id:string;name:string;role:TeamRole;active:boolean;phone?:string;address?:string;photo_path?:string|null;sms_opt_in?:boolean;photo_url?:string};
export type Client={id:string;name:string;address:string;latitude:number;longitude:number;radius_m:number;active:boolean;phone?:string;photo_path?:string|null;photo_url?:string};
export type Assignment={employee_id:string;client_id:string;active:boolean};
export type Visit={id:string;employee_id:string;client_id:string;clock_in:string;clock_out:string|null;in_lat:number|null;in_lng:number|null;in_accuracy:number|null;in_status:LocationStatus;out_lat:number|null;out_lng:number|null;out_accuracy:number|null;out_status:LocationStatus|null;review_status:'pending'|'approved'|'needs_review';review_reason:string|null};
export type Audit={id:string;visit_id:string;actor_id:string;action:string;reason:string|null;created_at:string};
export type TeamData={staff:Staff[];clients:Client[];assignments:Assignment[];visits:Visit[];audit:Audit[];schedule?:ScheduledVisit[];reminders?:Reminder[];capabilities?:{invitations:boolean;sms:boolean}};
export function distanceMeters(a:number,b:number,c:number,d:number){const r=Math.PI/180;const x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 6371000*2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,x))))}
export function locationStatus(client:Client,lat:number|null,lng:number|null,accuracy:number|null):LocationStatus{
 if(lat===null||lng===null||accuracy===null)return 'unavailable';
 const distance=distanceMeters(client.latitude,client.longitude,lat,lng);
 if(accuracy>100)return 'uncertain';
 if(distance+accuracy<=client.radius_m)return 'within_range';
 if(distance-accuracy>client.radius_m)return 'outside_range';
 return 'uncertain';
}
export function visitHours(v:Visit){return v.clock_out?Math.max(0,(Date.parse(v.clock_out)-Date.parse(v.clock_in))/3600000):0}
export const locationLabels:Record<LocationStatus,string>={within_range:'Within assigned area',outside_range:'Outside assigned area',uncertain:'GPS uncertain',unavailable:'Location unavailable'};
export function csvCell(value:unknown){const text=String(value??'');return '"'+(/^[=+\-@\t\r\n]/.test(text)?"'"+text:text).replaceAll('"','""')+'"'}
export function timesheetCsv(data:TeamData){const header=['Employee','Client','Clock in (UTC)','Clock out (UTC)','Hours (unrounded)','Clock-in location','Clock-out location','Review'];const rows=data.visits.map(v=>[data.staff.find(s=>s.id===v.employee_id)?.name||v.employee_id,data.clients.find(c=>c.id===v.client_id)?.name||v.client_id,v.clock_in,v.clock_out,visitHours(v).toFixed(6),v.in_status,v.out_status,v.review_status]);return [header,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n')}
