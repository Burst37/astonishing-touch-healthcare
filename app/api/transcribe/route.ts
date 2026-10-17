import {allowRequest} from '@/lib/rate-limit';

const headers={'Cache-Control':'no-store'};
const maxBytes=3_000_000;
const formats:Record<string,string>={'audio/webm':'audio/webm','audio/ogg':'audio/ogg','audio/mp4':'audio/m4a','audio/m4a':'audio/m4a','audio/x-m4a':'audio/m4a','audio/aac':'audio/aac','audio/wav':'audio/wav','audio/mpeg':'audio/mpeg'};
export const maxDuration=30;

export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin.'},{status:403,headers});
 const mime=formats[(request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()];
 if(!mime)return Response.json({error:'This recording format is not supported.'},{status:415,headers});
 if(Number(request.headers.get('content-length'))>maxBytes)return Response.json({error:'Please keep voice messages under one minute.'},{status:413,headers});
 if(!process.env.GEMINI_API_KEY)return Response.json({error:'Microphone transcription is not connected.'},{status:503,headers});
 try{
  if(!await allowRequest(request,'transcribe',20))return Response.json({error:'Please wait a moment before recording again.'},{status:429,headers:{...headers,'Retry-After':'60'}});
  const reader=request.body?.getReader();if(!reader)return Response.json({error:'No recording was received.'},{status:400,headers});
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>maxBytes){await reader.cancel();return Response.json({error:'Please keep voice messages under one minute.'},{status:413,headers})}chunks.push(part.value)}
  if(length<100)return Response.json({error:'No microphone audio was captured. Please record again.'},{status:400,headers});
  const audio=Buffer.concat(chunks);
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe:generateContent',{
   method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},signal:AbortSignal.timeout(18000),
   body:JSON.stringify({contents:[{role:'user',parts:[{inlineData:{mimeType:mime,data:audio.toString('base64')}}]}],generationConfig:{audioTranscriptionConfig:{languageCodes:['en-US'],customVocabulary:['Astonishing Touch','Brittany','Creve Coeur']}}})
  });
  if(!response.ok){console.error('Brittany transcription provider failed',response.status);return Response.json({error:'Speech transcription is temporarily unavailable. Please try again or type your question.'},{status:502,headers})}
  const data=await response.json() as {candidates?:{content?:{parts?:{text?:string;audioTranscription?:{text?:string}}[]};finishReason?:string}[]};
  const candidate=data.candidates?.[0];const transcript=candidate?.content?.parts?.map(p=>p.audioTranscription?.text||p.text||'').join('').trim()||'';
  if(candidate?.finishReason==='MAX_TOKENS'||transcript.length>3000)return Response.json({error:'Please record a shorter question.'},{status:422,headers});
  return Response.json({transcript},{headers});
 }catch(error){console.error('Brittany transcription failed',error instanceof Error?error.name:'unknown');return Response.json({error:'The recording could not be transcribed. Please try again or type your question.'},{status:502,headers})}
}
