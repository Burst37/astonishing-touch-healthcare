import {notFound} from 'next/navigation';
import Link from 'next/link';

export const dynamic='force-dynamic';

/** Preview-only responsive review surface; never exposed in production. */
export default function MotionReview(){
 if(process.env.VERCEL_ENV==='production')notFound();
 return <main style={{background:'#dbe4e9',minHeight:'100vh',padding:20}}>
  <h1 style={{fontSize:24,marginBottom:12}}>Phone layout · 390 × 844</h1>
  <p style={{marginBottom:16}}>Scroll inside the phone to review scene transitions. <Link href="/">Open full site</Link></p>
  <iframe title="Phone layout review" src="/" style={{display:'block',width:390,height:844,border:0,background:'#102c46'}}/>
 </main>;
}
