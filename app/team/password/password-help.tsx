'use client';
import Link from 'next/link';
import {useState,type FormEvent} from 'react';
export function PasswordHelp({configured}:{configured:boolean}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');setMessage('');try{const email=new FormData(e.currentTarget).get('email');const r=await fetch('/api/team/password/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});const p=await r.json();if(!r.ok)throw Error(p.error);setMessage(p.message)}catch(e){setError(e instanceof Error?e.message:'The reset link could not be requested.')}finally{setBusy(false)}}
 return <main className="team-app"><section className="team-panel team-login"><h1>Reset your staff password.</h1><p>Enter your staff sign-in email to request a link for a new password.</p><form onSubmit={submit}><label>Email address<input type="email" name="email" autoComplete="username" maxLength={200} required disabled={!configured}/></label><button className="team-button primary" disabled={busy||!configured}>{busy?'Requesting…':'Email reset link'}</button></form>{!configured&&<p className="team-muted">Staff access is being connected. Contact the office for help.</p>}{message&&<p className="team-notice" role="status">{message}</p>}{error&&<p className="team-error" role="alert">{error}</p>}<Link className="team-inline" href="/team">Back to staff sign-in</Link></section></main>
}
