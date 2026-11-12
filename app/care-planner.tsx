'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {ArrowUpRight,Phone,Check,Loader2} from 'lucide-react';
import {DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {business,services} from './content';
import {careRelationships,careTimings,carePlanSummary} from '@/lib/care-plan';
import {trackCareEvent} from './care-events';

export function CarePlanner({initialService,storageAvailable,bookingUrl}:{initialService:string,storageAvailable:boolean,bookingUrl?:string}){
 const [step,setStep]=useState(1),[service,setService]=useState(initialService),[relationship,setRelationship]=useState<string>(careRelationships[1]),[timing,setTiming]=useState<string>(careTimings[0]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[reference,setReference]=useState('');
 const summary=carePlanSummary(service,relationship,timing);
 const draft='mailto:'+business.email+'?subject='+encodeURIComponent('Astonishing Touch care conversation request')+'&body='+encodeURIComponent(summary);
 function next(){setStep(s=>Math.min(3,s+1));if(step===2)trackCareEvent('care_planner_complete','planner')}
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setError('');
  const data=Object.fromEntries(new FormData(event.currentTarget));
  try{const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,service,relationship,timing})});const result=await response.json();if(!response.ok||!result.reference)throw Error(result.error||'Your request could not be saved.');setReference(result.reference);trackCareEvent('inquiry_saved','planner')}
  catch(e){setError(e instanceof Error?e.message:'Please try again or call our office.');trackCareEvent('inquiry_failed','planner')}
  finally{setBusy(false)}
 }
 return <>
  <DialogTitle>{reference?'Your inquiry is saved.':step===3?'Your next step.':'Let’s find the right conversation.'}</DialogTitle>
  <DialogDescription>{reference?'This is a care inquiry, not a confirmed appointment.':'A few practical details will help you speak with our team. No medical details are needed.'}</DialogDescription>
  {reference?<div className="success"><Check size={32}/><p>Your reference is <strong>{reference}</strong>.</p><p>Call our office to discuss availability and next steps. Mention your reference.</p><a className="button" href={'tel:'+business.tel}>Call our care team <Phone size={18}/></a></div>:<div className="care-planner">
   <p className="planner-progress" role="status">Step {step} of 3 · {step===1?'Support':step===2?'Timing':'Contact'}</p>
   {step===1?<><label className="planner-label">What would you like help with?<select value={service} onChange={e=>setService(e.target.value)}><option>Not sure yet</option>{services.map(s=><option key={s.id}>{s.title}</option>)}</select></label><fieldset><legend>Who is the support for?</legend>{careRelationships.map(value=><label className="planner-choice" key={value}><input type="radio" name="relationship" value={value} checked={relationship===value} onChange={()=>setRelationship(value)}/><span>{value}</span></label>)}</fieldset></>:null}
   {step===2?<fieldset><legend>Where are you in the process?</legend>{careTimings.map(value=><label className="planner-choice" key={value}><input type="radio" name="timing" value={value} checked={timing===value} onChange={()=>setTiming(value)}/><span>{value}</span></label>)}<p className="form-note">Our team must confirm service coverage, availability and pricing. Choosing a timing preference does not reserve care.</p></fieldset>:null}
   {step===3?<><dl className="planner-summary"><div><dt>Support</dt><dd>{service}</dd></div><div><dt>Request</dt><dd>{relationship}</dd></div><div><dt>Timing</dt><dd>{timing}</dd></div></dl>
    {storageAvailable?<form className="inquiry-form" onSubmit={submit}><label>Your name<input name="name" autoComplete="name" required maxLength={100}/></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" required minLength={10} maxLength={25}/></label><label>Email (optional)<input name="email" type="email" autoComplete="email" maxLength={200}/></label><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className="consent"><input type="checkbox" name="consent" value="yes" required/><span>I agree to have my contact details saved for this care inquiry. <Link href="/privacy">Privacy details</Link>.</span></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button" disabled={busy}>{busy?<><Loader2 size={18} className="spin"/>Saving…</>:<>Save my care inquiry <ArrowUpRight size={18}/></>}</button></form>:<><p>Your selections are ready. Open a prepared email, add your callback number, then review and send it from your email app.</p><a className="button" href={draft} onClick={()=>trackCareEvent('email_draft_open','planner')}>Prepare my email <ArrowUpRight size={18}/></a><p className="form-note">Opening the draft does not send it. These selections have not been submitted or saved by Astonishing Touch.</p></>}
    <a className="planner-call" href={'tel:'+business.tel}><Phone size={17}/>Call {business.phone}</a>{bookingUrl&&<a className="planner-call" href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={()=>trackCareEvent('booking_click','planner')}>Choose an appointment time <ArrowUpRight size={17}/></a>}<p className="form-note">Office: Monday–Friday, 9 a.m.–5 p.m. After hours: <a href="tel:+13142764607">{business.afterHours}</a>.</p>
   </>:<button className="button" onClick={next}>Continue <ArrowUpRight size={18}/></button>}
   {step>1&&<button className="planner-back" onClick={()=>setStep(s=>s-1)} disabled={busy}>← Back</button>}
  </div>}
 </>;
}
