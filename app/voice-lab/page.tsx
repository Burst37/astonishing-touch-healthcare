import {notFound} from 'next/navigation';
import {VoiceLab} from './voice-lab';
export const dynamic='force-dynamic';
export const metadata={title:'Voice regression lab',robots:{index:false,follow:false}};
export default function Page(){if(process.env.VERCEL_ENV==='production')notFound();return <VoiceLab/>}
