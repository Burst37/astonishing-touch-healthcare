import {allowRequest} from '@/lib/rate-limit';

const noStore={'Cache-Control':'no-store'};
type AudioStep={type?:string;content?:{type?:string;data?:string;mime_type?:string}[]};

export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 const config=process.env as Record<string,string|undefined>;
 if(!config.GEMINI_API_KEY){
  console.error('Ask Brittany TTS is not configured: GEMINI_API_KEY is missing.');
  return Response.json({error:'Brittany voice is not connected.'},{status:503,headers:noStore});
 }
 let text:string;try{const raw=await request.text();if(raw.length>30000)throw Error();const body=JSON.parse(raw);if(typeof body.text!=='string'||body.text.length>6000||!body.text.trim())throw Error();text=body.text.trim();}catch{return Response.json({error:'Enter a short reply.'},{status:400});}
 try{
  if(!await allowRequest(request,'speech',40))return Response.json({error:'Please wait a moment.'},{status:429,headers:{...noStore,'Retry-After':'60'}});

  const model='gemini-3.8-flash-tts';
  const voice=config.GEMINI_TTS_VOICE||'Kore';
  const designedVoice=voice.startsWith('voice_')||voice.startsWith('voicekey_');
  const style=designedVoice
   ? 'Warm, calm, polished and reassuring. Conversational American English with clear diction, measured pace, subtle empathy and confident professionalism.'
   : 'A poised, educated African American woman in her mid-40s working as a senior home-healthcare receptionist in St. Louis. Warm, intelligent, composed and reassuring; natural American English, clear diction, moderate pace, subtle empathy, confident professionalism, never theatrical or overly cheerful.';

  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{
   method:'POST',
   headers:{'Content-Type':'application/json','x-goog-api-key':config.GEMINI_API_KEY},
   signal:AbortSignal.timeout(25000),
   body:JSON.stringify({
    model,
    input:[{type:'user_input',content:[{type:'text',text,annotations:[{type:'speech_metadata',style}]}]}],
    response_format:{type:'audio'},
    generation_config:{speech_config:[{voice}]}
   })
  });

  if(!response.ok){
   const detail=(await response.text()).slice(0,700);
   console.error('Gemini 3.8 TTS request failed',response.status,detail);
   throw Error('Voice provider unavailable');
  }

  const result=await response.json() as {steps?:AudioStep[]};
  const audio=result.steps?.filter(step=>step.type==='model_output').flatMap(step=>step.content||[]).filter(part=>part.type==='audio'&&typeof part.data==='string').at(-1);
  if(!audio?.data||audio.data.length>11_000_000)throw Error('Missing audio');
  const bytes=Uint8Array.from(atob(audio.data),c=>c.charCodeAt(0));
  if(bytes.byteLength<1000||bytes.byteLength>8_000_000||String.fromCharCode(...bytes.subarray(0,4))!=='RIFF')throw Error('Invalid WAV audio');
  return new Response(bytes,{headers:{...noStore,'Content-Type':'audio/wav','X-Voice-Provider':'gemini','X-Voice-Model':model,'X-Voice-Identity':designedVoice?'custom':'prebuilt'}});
 }catch(error){
  console.error('Ask Brittany speech generation failed',error instanceof Error?error.message:'unknown error');
  return Response.json({error:'Voice is temporarily unavailable.'},{status:502,headers:noStore});
 }
}
