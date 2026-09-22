import Link from 'next/link';
export const dynamic='force-dynamic';
export const metadata={title:'Care inquiries | Astonishing Touch',robots:{index:false,follow:false}};
export default async function Inquiries(){
 return <main className="section-pad"><Link className="text-link" href="/">← Website</Link><h1 style={{fontSize:'clamp(2.7rem,6vw,5rem)',margin:'30px 0 20px'}}>Care inquiries</h1><p>Care inquiries are delivered to the configured secure inquiry webhook. This private database inbox is not enabled on the Vercel deployment.</p></main>
}
