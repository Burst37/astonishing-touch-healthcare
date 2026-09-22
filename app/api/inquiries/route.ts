import {allowRequest} from '@/lib/rate-limit';
import {z} from 'zod';
import {services} from '@/app/content';
const schema=z.object({name:z.string().trim().min(2).max(100),phone:z.string().trim().max(25).refine(s=>s.replace(/\D/g,'').length>=10&&s.replace(/\D/g,'').length<=15,'Enter a valid phone number.'),email:z.union([z.string().email().max(200),z.literal('')]).optional(),service:z.string().refine(s=>s==='Not sure yet'||services.some(x=>x.title===s)),consent:z.literal('yes'),website:z.string().max(0).optional()});
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Please submit from our website.'},{status:403});
 if(Number(request.headers.get('content-length')||0)>4000)return Response.json({error:'Request too large.'},{status:413});
 let body;try{const text=await request.text();if(text.length>4000)return Response.json({error:'Request too large.'},{status:413});body=JSON.parse(text)}catch{return Response.json({error:'Please check your information.'},{status:400})}
 const parsed=schema.safeParse(body);if(!parsed.success)return Response.json({error:'Please check your name, phone, email and consent.'},{status:400});
 const d=parsed.data, reference='AT-'+crypto.randomUUID().slice(0,8).toUpperCase();
 try{if(!await allowRequest(request,'inquiry',5))return Response.json({error:'Please wait one minute before sending another inquiry.'},{status:429,headers:{'Retry-After':'60'}});const webhook=process.env.INQUIRY_WEBHOOK_URL; if(!webhook?.startsWith('https://')) throw new Error('Inquiry storage not configured'); const response=await fetch(webhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reference,name:d.name,phone:d.phone,email:d.email||null,service:d.service,consent:true,createdAt:new Date().toISOString()})}); if(!response.ok) throw new Error('Inquiry webhook failed'); return Response.json({reference},{status:201,headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'We could not save your inquiry. Please call (314) 479-5673.'},{status:503})}
}
