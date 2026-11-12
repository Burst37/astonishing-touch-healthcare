'use client';
import type {CareEventName,CareEvent} from '@/lib/care-events';
export function trackCareEvent(event:CareEventName,source:CareEvent['source']='site',durationMs?:number){
 if(typeof navigator==='undefined'||navigator.doNotTrack==='1'||(navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl)return;
 const body=JSON.stringify({event,source,...(durationMs===undefined?{}:{durationMs:Math.min(120000,Math.max(0,Math.round(durationMs)))})});
 try{if(navigator.sendBeacon?.('/api/events',new Blob([body],{type:'text/plain'})))return;void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{})}catch{/* Measurement never blocks a visitor action. */}
}
