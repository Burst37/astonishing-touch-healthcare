import {socialProfiles} from './content';

export function SocialLinks(){
 return <nav className="social-links" aria-label="Astonishing Touch social media">{socialProfiles.map(profile=><a key={profile.name} href={profile.url} target="_blank" rel="noopener noreferrer" aria-label={'Astonishing Touch on '+profile.name+' (opens in a new tab)'} title={profile.name}><svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" focusable="false">{profile.name==='Facebook'?<path fill="currentColor" d="M14 21v-8h3l.5-4H14V7c0-1 .3-2 2-2h2V1.5A24 24 0 0 0 15 1c-3 0-5 1.8-5 5v3H7v4h3v8z"/>:<g fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></g>}</svg></a>)}</nav>;
}
