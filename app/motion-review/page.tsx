import {notFound} from 'next/navigation';
import Link from 'next/link';

export const dynamic='force-dynamic';

/** Preview-only responsive review surface; never exposed in production. */
export default async function MotionReview({searchParams}:{searchParams:Promise<{surface?:string;width?:string}>}){
 if(process.env.VERCEL_ENV==='production')notFound();
 const params=await searchParams;const team=params.surface==='team';const width=[320,390,768,1024,1440].includes(Number(params.width))?Number(params.width):390;
 return <main style={{background:'var(--neo-face)',minHeight:'100vh',padding:20}}>
  <h1 style={{fontSize:24,marginBottom:12}}>{team?'Team workspace':'Phone layout'} · {width} × 844</h1>
  <p style={{marginBottom:16}}>Scroll inside the frame to review layout and controls. <Link href="/">Open full site</Link></p>
  <iframe title="Phone layout review" src={team?'/team/demo':'/'} style={{display:'block',width,height:844,border:0,background:'var(--care-ink)'}}/>
 </main>;
}
