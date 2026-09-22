import {allowRequest} from '@/lib/rate-limit';
const noStore={'Cache-Control':'no-store'};
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 const config=process.env as Record<string,string|undefined>;
 const eleven=config.SPEECH_PROVIDER==='elevenlabs';
 if(eleven?(!config.ELEVENLABS_API_KEY||!config.ELEVENLABS_VOICE_ID):!config.GEMINI_API_KEY)return Response.json({error:'Voice is not connected.'},{status:503,headers:noStore});
 let text:string;try{const raw=await request.text();if(raw.length>30000)throw Error();const body=JSON.parse(raw);if(typeof body.text!=='string'||body.text.length>6000||!body.text.trim())throw Error();text=body.text.trim();}catch{return Response.json({error:'Enter a short reply.'},{status:400});}
 try{if(!await allowRequest(request,'speech',40))return Response.json({error:'Please wait a moment.'},{status:429,headers:{...noStore,'Retry-After':'60'}});
  if(eleven){
   const response=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(config.ELEVENLABS_VOICE_ID!)+'?output_format=mp3_44100_128',{method:'POST',headers:{'xi-api-key':config.ELEVENLABS_API_KEY!,'Content-Type':'application/json'},signal:AbortSignal.timeout(20000),body:JSON.stringify({text,model_id:config.ELEVENLABS_MODEL||'eleven_turbo_v2_5',voice_settings:{stability:.5,similarity_boost:.75,style:.15,use_speaker_boost:true,speed:Math.min(1.2,Math.max(.7,Number(config.ELEVENLABS_SPEED)||1))}})});
   if(!response.ok||!response.headers.get('content-type')?.includes('audio/'))throw Error('Voice provider unavailable');
   const audio=await response.arrayBuffer();if(audio.byteLength<1000||audio.byteLength>8_000_000)throw Error('Invalid audio');
   return new Response(audio,{headers:{...noStore,'Content-Type':'audio/mpeg','X-Voice-Provider':'elevenlabs'}});
  }
  let data:{candidates?:{content?:{parts?:{inlineData?:{mimeType:string,data:string}}[]}}[]}|undefined;
  for(let attempt=0;attempt<2;attempt++){
   const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(config.GEMINI_TTS_MODEL||'gemini-3.1-flash-tts-preview')+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':config.GEMINI_API_KEY!},signal:AbortSignal.timeout(20000),body:JSON.stringify({contents:[{parts:[{text:'Synthesize speech. Audio profile: Brittany is a warm, professional adult female virtual receptionist in her mid thirties. Scene: a calm one-to-one care conversation. Director notes: natural American English, reassuring conversational tone, clear articulation and unhurried pace. Read ONLY the transcript verbatim, without these directions. This is a synthetic character voice, not an imitation of a real person.\nTRANSCRIPT:\n'+text}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:config.GEMINI_TTS_VOICE||'Sulafat'}}}}})});
   if(r.ok){data=await r.json();break}if(r.status<500)throw Error('Voice provider unavailable');
  }
  const part=data?.candidates?.[0]?.content?.parts?.find(p=>p.inlineData)?.inlineData;if(!part||!part.mimeType.toLowerCase().includes('audio/l16'))throw Error('No PCM audio');
  const binary=atob(part.data),rate=Number(/rate=(\d+)/.exec(part.mimeType)?.[1]||24000);if(!Number.isFinite(rate)||rate<8000||rate>48000||binary.length>8_000_000)throw Error();
  const bytes=new Uint8Array(44+binary.length),view=new DataView(bytes.buffer);const label=(at:number,v:string)=>{for(let i=0;i<v.length;i++)bytes[at+i]=v.charCodeAt(i)};label(0,'RIFF');view.setUint32(4,36+binary.length,true);label(8,'WAVE');label(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);label(36,'data');view.setUint32(40,binary.length,true);for(let i=0;i<binary.length;i++)bytes[44+i]=binary.charCodeAt(i);
  return new Response(bytes,{headers:{...noStore,'Content-Type':'audio/wav'}});
 }catch{return Response.json({error:'Voice is temporarily unavailable.'},{status:502,headers:noStore})}
}
