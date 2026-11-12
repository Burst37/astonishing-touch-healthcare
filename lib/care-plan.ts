export const careTimings=['Exploring options','Would like to discuss care soon','Need a callback from the office'] as const;
export const careRelationships=['For myself','For a family member','For someone I support'] as const;
export const careActions=['request_care','schedule_visit','directions','call_office'] as const;
export type CareAction=typeof careActions[number];
export function isCareAction(value:unknown):value is CareAction{return typeof value==='string'&&(careActions as readonly string[]).includes(value)}
export function safeBookingUrl(value:string|undefined){try{const url=new URL(value||'');return url.protocol==='https:'&&!url.username&&!url.password?url.href:undefined}catch{return undefined}}
export function carePlanSummary(service:string,relationship:string,timing:string){return `Care conversation request\n\nSupport: ${service}\nRequest: ${relationship}\nTiming: ${timing}\n\nPlease contact me to discuss availability, pricing and next steps. This is a request, not a confirmed appointment.\n\nMy preferred callback number: `}
