import {allowRequest} from '@/lib/rate-limit';
import {brittanyLiveInstructions} from '@/app/care-knowledge';

export const maxDuration=30;
const headers={'Cache-Control':'no-store'};
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin.'},{status:403,headers});
 if(!process.env.GEMINI_API_KEY)return Response.json({error:'Live voice is not connected.'},{status:503,headers});
 if(!await allowRequest(request,'live-token',10))return Response.json({error:'Please wait a moment before starting another conversation.'},{status:429,headers});
 // Saved TTS voice IDs are not accepted by the Live model. Keep its
 // prebuilt voice separate from GEMINI_TTS_VOICE (used for typed replies).
 const model='gemini-3.8-live';
 const configuredVoice=process.env.GEMINI_LIVE_VOICE?.trim();
 const voice=configuredVoice&&!/^voice(?:key)?_/i.test(configuredVoice)?configuredVoice:'Kore';
 const date=new Intl.DateTimeFormat('en-US',{dateStyle:'full',timeZone:'America/Chicago'}).format(new Date());
 const setup={
  model:'models/'+model,
  generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}},
  systemInstruction:{parts:[{text:brittanyLiveInstructions()+`\nToday is ${date} in America/Chicago.`}]},
  contextWindowCompression:{triggerTokens:'12000',slidingWindow:{targetTokens:'6000'}},
  inputAudioTranscription:{},outputAudioTranscription:{},
  realtimeInputConfig:{automaticActivityDetection:{disabled:false,silenceDurationMs:300,prefixPaddingMs:40}},
  tools:[{functionDeclarations:[{name:'show_care_action',description:'Show a relevant next-step button in the visitor’s chat panel when they ask to start care, arrange a visit, get directions or call the office. This displays a button only; never claim a call was placed, an email sent, a request saved, or an appointment booked.',parameters:{type:'OBJECT',properties:{action:{type:'STRING',enum:['request_care','schedule_visit','directions','call_office']}},required:['action']}},{name:'lookup_business_information',description:'Retrieve detailed published business facts, complete company story and mission, service explanations, FAQs, family guides and privacy information. Use for business details beyond the core prompt. Never infer unpublished policies.',parameters:{type:'OBJECT',properties:{query:{type:'STRING'}},required:['query']}},{name:'lookup_current_information',description:'Verify current local/national news, weather, sports scores/schedules, local events, traffic, or directions to a requested destination. Include the requested location and relevant date; default to greater St. Louis only when no other location is named. Never include personal or health information in the query.',parameters:{type:'OBJECT',properties:{query:{type:'STRING'}},required:['query']}}]}],
 };
 try{
  const now=Date.now();
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens',{method:'POST',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({uses:1,expireTime:new Date(now+30*60000).toISOString(),newSessionExpireTime:new Date(now+60000).toISOString(),bidiGenerateContentSetup:setup})});
  if(!response.ok)throw Error('Token unavailable');
  const data=await response.json() as {name?:string};if(!data.name)throw Error('Token unavailable');
  // The entire session setup is bound to this one-use credential. Never send the API key.
  return Response.json({token:data.name,model},{headers});
 }catch{return Response.json({error:'Brittany could not connect. Please try again.'},{status:502,headers})}
}
