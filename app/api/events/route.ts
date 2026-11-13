import {careEventSchema} from '@/lib/care-events';
import {allowRequest} from '@/lib/rate-limit';
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403,headers});
 if(request.headers.get('dnt')==='1'||request.headers.get('sec-gpc')==='1')return new Response(null,{status:204,headers});
 try{
  const text=await request.text();if(text.length>500)return new Response(null,{status:413,headers});
  const event=careEventSchema.safeParse(JSON.parse(text));if(!event.success)return new Response(null,{status:400,headers});
  if(!await allowRequest(request,'care-events',60))return new Response(null,{status:429,headers});
  console.info('care_event',JSON.stringify({...event.data,environment:process.env.VERCEL_ENV||'development'}));
  return new Response(null,{status:204,headers});
 }catch{return new Response(null,{status:400,headers})}
}
