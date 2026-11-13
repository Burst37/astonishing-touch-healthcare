import {notFound} from 'next/navigation';
import {TeamWorkspace} from '../workspace';
import '../team.css';
export const dynamic='force-dynamic';
export const metadata={title:'Team workspace review | Astonishing Touch',robots:{index:false,follow:false}};
export default function Demo(){if(process.env.VERCEL_ENV==='production')notFound();return <TeamWorkspace configured={false} demo/>}
