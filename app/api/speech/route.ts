import {allowRequest} from '@/lib/rate-limit';

const noStore = {'Cache-Control':'no-store'};
type AudioStep = {type?:string;content?:{type?:string;data?:string;mime_type?:string}[]};

export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 const config=process.env as Record<string,string|undefined>;
 // A configured Gemini key takes priority for the requested 3.8 voice upgrade.
 // Keep ElevenLabs as a fallback when Gemini has not been connected.
 const eleven=config.SPEECH_PROVIDER==='elevenlabs'&&!config.GEMINI_API_KEY;
 if(eleven?(!config.ELEVENLABS_API_KEY||!config.ELEVENLABS_VOICE_ID):!config.GEMINI_API_KEY)return Response.json({error:'Voice is not connected.'},{status:503,headers:noStore});
 let text:string;try{const raw=await request.text();if(raw.length>30000)throw Error();const body=JSON.parse(raw);if(typeof body.text!=='string'||body.text.length>6000||!body.text.trim())throw Error();text=body.text.trim();}catch{return Response.json({error:'Enter a short reply.'},{status:400});}
 try{
  if(!await allowRequest(request,'speech',40))return Response.json({error:'Please wait a moment.'},{status:429,headers:{...noStore,'Retry-After':'60'}});
  if(eleven){
   const response=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(config.ELEVENLABS_VOICE_ID!)+'?output_format=mp3_44100_128',{method:'POST',headers:{'xi-api-key':config.ELEVENLABS_API_KEY!,'Content-Type':'application/json'},signal:AbortSignal.timeout(20000),body:JSON.stringify({text,model_id:config.ELEVENLABS_MODEL||'eleven_turbo_v2_5',voice_settings:{stability:.5,similarity_boost:.75,style:.15,use_speaker_boost:true,speed:Math.min(1.2,Math.max(.7,Number(config.ELEVENLABS_SPEED)||1))}})});
   if(!response.ok||!response.headers.get('content-type')?.includes('audio/'))throw Error('Voice provider unavailable');
   const audio=await response.arrayBuffer();if(audio.byteLength<1000||audio.byteLength>8_000_000)throw Error('Invalid audio');
   return new Response(audio,{headers:{...noStore,'Content-Type':'audio/mpeg','X-Voice-Provider':'elevenlabs'}});
  }
  // Gemini 3.8 TTS uses Interactions, with a verbatim transcript and separate delivery metadata.
  // Unary requests return a complete WAV file; the old generateContent route returned raw PCM.
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{
   method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':config.GEMINI_API_KEY!},signal:AbortSignal.timeout(20000),
   body:JSON.stringify({model:config.GEMINI_TTS_MODEL?.startsWith('gemini-3.8-')?config.GEMINI_TTS_MODEL:'gemini-3.8-flash-tts',input:[{type:'user_input',content:[{type:'text',text,annotations:[{type:'speech_metadata',style:'Warm, natural, professional American English; clear and conversational, with a reassuring pace.'}]}]}],response_format:{type:'audio'},generation_config:{speech_config:[{voice:config.GEMINI_TTS_VOICE||'Sulafat'}]}})
  });
  if(!response.ok)throw Error('Voice provider unavailable');
  const result=await response.json() as {steps?:AudioStep[]};
  const audio=result.steps?.filter(step=>step.type==='model_output').flatMap(step=>step.content||[]).filter(part=>part.type==='audio'&&typeof part.data==='string').at(-1);
  if(!audio?.data||audio.data.length>11_000_000)throw Error('Missing audio');
  const bytes=Uint8Array.from(atob(audio.data),c=>c.charCodeAt(0));
  if(bytes.byteLength<1000||bytes.byteLength>8_000_000||String.fromCharCode(...bytes.subarray(0,4))!=='RIFF')throw Error('Invalid WAV audio');
  return new Response(bytes,{headers:{...noStore,'Content-Type':'audio/wav','X-Voice-Provider':'gemini-3.8'}});
 }catch{return Response.json({error:'Voice is temporarily unavailable.'},{status:502,headers:noStore})}
}
