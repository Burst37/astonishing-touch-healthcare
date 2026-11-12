'use client';
import {ArrowUpRight,Phone,MapPin} from 'lucide-react';
import {business,directionsUrl} from './content';
import type {CareAction} from '@/lib/care-plan';
import {trackCareEvent} from './care-events';
export function CareActionCard({action,onContact,bookingUrl}:{action:CareAction,onContact:()=>void,bookingUrl?:string}){
 return <div className="care-action-card" role="status">
  {action==='directions'?<><p>Directions to our Creve Coeur office</p><a className="message-action" href={directionsUrl} target="_blank" rel="noopener noreferrer">Get directions <MapPin size={17}/></a></>:action==='call_office'?<><p>Speak with our care team</p><a className="message-action" href={'tel:'+business.tel}>Call {business.phone} <Phone size={17}/></a></>:action==='schedule_visit'&&bookingUrl?<><p>Choose a time in the connected scheduler. Only the scheduler can confirm your appointment.</p><a className="message-action" href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={()=>trackCareEvent('booking_click','guide')}>Schedule a consultation <ArrowUpRight size={17}/></a></>:<><p>{action==='schedule_visit'?'The office will need to confirm a time. Prepare a request to discuss a consultation.':'Prepare your care conversation in three short steps.'}</p><button onClick={onContact}>Open care planner <ArrowUpRight size={17}/></button></>}
 </div>;
}
