import {allowRequest} from '@/lib/rate-limit';
import {business,services,faqs,directionsUrl} from '@/app/content';
import {brittanyInstructions} from '@/app/care-knowledge';
import {currentInformation,currentTopic} from '@/app/current-information';
function guide(message:string){
 const q=message.toLowerCase();
 if(/emergency|chest pain|can.t breathe|suicid/.test(q))return 'If someone may be in immediate danger, call 911. This care guide cannot provide emergency help.';
 if(/diagnos|dosage|dose|symptom|treat|pain|blood|medicine|medication/.test(q)&&!/remind|service/.test(q))return 'I can explain our services, but I cannot give medical advice. Please ask your healthcare professional. For questions about our medication reminder service, call (314) 479-5673.';
 if(/price|cost|insurance|medicaid|medicare|pay/.test(q))return 'Please call (314) 479-5673 to discuss pricing, payment options and eligibility. I do not have verified rates or insurance information.';
 if(/hours|open|close|weekend/.test(q))return faqs[4].a;
 if(/where|address|location|serve|area|zip/.test(q))return faqs[2].a;
 if(/book|start|schedule|appointment|care plan|contact|phone|call/.test(q))return faqs[3].a;
 const service=services.find(s=>q.includes(s.title.toLowerCase())||q.includes(s.id.replace(/-/g,' ')));
 if(service)return service.desc+' Our team can discuss including this in your care plan. Call (314) 479-5673.';
 if(/service|offer|help|care|companio|respite|hygiene|meal|laundry|errand|housekeep/.test(q))return faqs[0].a;
 if(/hello|hi\b|hey/.test(q))return 'Hello! I can help with our services, office hours, location or how to start a care inquiry.';
 return 'I can help with published information about our care services, office hours and how to get started. For other questions, call (314) 479-5673 or email '+business.email+'.';
}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin.'},{status:403});
 let message='';let history:{role:'user'|'assistant',content:string}[]=[];try{const raw=await request.text();if(raw.length>140000)throw Error();const body=JSON.parse(raw);if(typeof body.message!=='string')throw Error();message=body.message.trim().slice(0,3000);if(!message)throw Error();if(body.history!==undefined){if(!Array.isArray(body.history)||body.history.length>20)throw Error();history=body.history.map((m:{role:string,content:string})=>{if(!m||(m.role!=='user'&&m.role!=='assistant')||typeof m.content!=='string'||m.content.length>6000)throw Error();return {role:m.role as 'user'|'assistant',content:m.content}})}}catch{return Response.json({error:'Please enter your question.'},{status:400})}
 const fallback=guide(message);
 // Urgent help must not wait for storage, search or an AI provider.
 if(/emergency|chest pain|can[’']?t breathe|cannot breathe|suicid/i.test(message))return Response.json({reply:'If someone may be in immediate danger, call 911. This care guide cannot provide emergency help.',mode:'guide'},{headers:{'Cache-Control':'no-store'}});

 let allowed=false;try{allowed=await allowRequest(request,'guide',20)}catch{return Response.json({reply:fallback,mode:'guide'},{headers:{'Cache-Control':'no-store'}})}
 if(!allowed)return Response.json({reply:'Please pause a moment before asking again. You can also call (314) 479-5673.',mode:'guide'},{status:429,headers:{'Retry-After':'60','Cache-Control':'no-store'}});
const priceQuestion=/\b(price|prices|pricing|cost|costs|costing|rate|rates|fee|fees|quote|quotes|estimate|estimates|charge|charges|discount|discounts|afford|affordable|budget|payment|payments|paying|pay|expensive|cheaper|billing)\b|how much|per hour|hourly|\$/i;
 const lastUser=history.filter(m=>m.role==='user').at(-1)?.content||'';
 const pricingFollowup=priceQuestion.test(lastUser)&&/\b(that|it|those|include|included|more|less|weekend|overnight|monthly|daily|weekly|insurance|medicare|medicaid)\b/i.test(message);
 if(priceQuestion.test(message)||pricingFollowup)return Response.json({reply:'A live Astonishing Touch team member can walk you through pricing and payment questions. Please call '+business.phone+', Monday through Friday, 9 a.m. to 5 p.m., or select Request a care conversation below. I cannot provide quotes or estimates here.',mode:'guide',handoff:'pricing'},{headers:{'Cache-Control':'no-store'}});
const config=process.env as Record<string,string|undefined>;
 const booking=/\b(booking|appointments?|schedule (?:a |my |the )?(?:visit|consultation|call)|reserve a time|book (?:a |my |the )?(?:visit|appointment|consultation|call))\b/i.test(message);
 if(booking){const url=config.BOOKING_URL;const valid=url?.startsWith('https://');return Response.json({reply:valid?'You can choose a real opening using Schedule an appointment below. Your appointment is confirmed only when the scheduler confirms it. Would you like help deciding what to discuss at the visit?':'I can help you get an appointment arranged. Online scheduling isn’t connected yet, so call our office at '+business.phone+' or use Request a care conversation. The office will confirm the time with you.',mode:'guide',bookingUrl:valid?url:undefined},{headers:{'Cache-Control':'no-store'}})}
 if(/\b(directions|navigate|navigation|drive to|driving|how do i get|where are you|your address)\b/i.test(message))return Response.json({reply:'Our office is at '+business.address+', '+business.city+'. Tap Get directions below for a route from your starting location. Our office hours are Monday through Friday, 9 a.m. to 5 p.m. Please call ahead to arrange your visit.',mode:'guide',directionsUrl},{headers:{'Cache-Control':'no-store'}});
 const newsFollowup=currentTopic.test(lastUser)&&/\b(that|those|it|more|else|why|when|where|what about|tell me)\b/i.test(message);
 if((currentTopic.test(message)&&(!/\b(office|hours|your care|your services|care today|care tomorrow)\b/i.test(message)||/\b(news|headlines|weather|forecast)\b/i.test(message)))||newsFollowup)return Response.json(await currentInformation(message,history),{headers:{'Cache-Control':'no-store'}});

 // Use Gemini directly when selected, or when a Gemini key is present and no
 // separate completion provider is configured. Low thinking reduces voice wait time.
 if(config.GEMINI_API_KEY&&config.CARE_AI_PROVIDER!=='openai'){
  try{
   const model=config.CARE_AI_MODEL?.startsWith('gemini-3.8-')?config.CARE_AI_MODEL:'gemini-3.8-flash';
   const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{
    method:'POST',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','x-goog-api-key':config.GEMINI_API_KEY},
    body:JSON.stringify({systemInstruction:{parts:[{text:brittanyInstructions()}]},contents:[...history.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),{role:'user',parts:[{text:message}]}],generationConfig:{maxOutputTokens:1200,thinkingConfig:{thinkingLevel:'low'}}})
   });
   if(response.ok){const data=await response.json() as {candidates?:{content?:{parts?:{text?:string}[]};finishReason?:string}[]};const candidate=data.candidates?.[0];const reply=candidate?.content?.parts?.map(p=>p.text||'').join('').trim();if(reply&&reply.length<=6000&&candidate?.finishReason!=='MAX_TOKENS')return Response.json({reply,mode:'ai'},{headers:{'Cache-Control':'no-store'}})}
  }catch{/* bounded published-information fallback */}
  return Response.json({reply:fallback,mode:'guide'},{headers:{'Cache-Control':'no-store'}});
 }
 // Any OpenAI-compatible completion provider; secrets stay on the server.
 if(config.CARE_AI_ENDPOINT?.startsWith('https://')&&config.CARE_AI_KEY&&config.CARE_AI_MODEL){
 try{const response=await fetch(config.CARE_AI_ENDPOINT,{method:'POST',signal:AbortSignal.timeout(30000),headers:{Authorization:'Bearer '+config.CARE_AI_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:config.CARE_AI_MODEL,max_tokens:2400,reasoning_effort:config.CARE_AI_MODEL==='gemini-2.5-flash'?'none':'low',messages:[{role:'system',content:brittanyInstructions()},...history,{role:'user',content:message}]})});if(response.ok){const data=await response.json() as {choices?:{finish_reason?:string,message?:{content?:string}}[]};const reply=data.choices?.[0]?.message?.content;if(typeof reply==='string'&&reply.trim().length>0&&reply.length<=6000&&data.choices?.[0]?.finish_reason!=='length')return Response.json({reply,mode:'ai'},{headers:{'Cache-Control':'no-store'}})}}catch{/* bounded published-information fallback */}}
 return Response.json({reply:fallback,mode:'guide'},{headers:{'Cache-Control':'no-store'}});
}
