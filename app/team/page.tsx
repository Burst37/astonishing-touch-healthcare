import {TeamWorkspace} from './workspace';
import {teamConfigured} from '@/lib/team-server';
import './team.css';
export const dynamic='force-dynamic';
export const metadata={title:'Team workspace | Astonishing Touch',robots:{index:false,follow:false}};
export default function Team(){return <TeamWorkspace configured={teamConfigured()}/>}
