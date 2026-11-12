import {lookupBusinessInformation} from '@/app/business-information';
import {allowRequest} from '@/lib/rate-limit';
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin.'},{status:403,headers});
 if(!await allowRequest(request,'business-knowledge',30))return Response.json({error:'Please wait a moment and retry.'},{status:429,headers});
 try{const raw=await request.text();if(raw.length>2000)throw Error();const input=JSON.parse(raw);if(typeof input.query!=='string'||!input.query.trim())throw Error();return Response.json(lookupBusinessInformation(input.query.trim().slice(0,600)),{headers})}catch{return Response.json({error:'Please provide a business question.'},{status:400,headers})}
}
