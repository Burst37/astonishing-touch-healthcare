import {PasswordHelp} from './password-help';
import {teamConfigured} from '@/lib/team-server';
import '../team.css';
export const dynamic='force-dynamic';
export const metadata={title:'Password help | Astonishing Touch',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function Page(){return <PasswordHelp configured={teamConfigured()}/>}
