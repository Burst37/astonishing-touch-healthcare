'use client';
import {useEffect,useRef,useState} from 'react';
type Recognition={lang:string;continuous:boolean;interimResults:boolean;onresult:((e:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;abort:()=>void;stop:()=>void};
type VoiceWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};

export function useCareVoice(open:boolean,onTranscript:(text:string)=>void){
 const [enabled,setEnabled]=useState(true),[supported,setSupported]=useState(false),[listening,setListening]=useState(false),[speaking,setSpeaking]=useState(false),[voiceLevel,setVoiceLevel]=useState(0),[status,setStatus]=useState('Voice replies are on. You can type or talk to Brittany.');
 const [needsPlay,setNeedsPlay]=useState(false);const lastReply=useRef('');
 const [conversationActive,setConversationActive]=useState(false);const conversation=useRef(false);const session=useRef(0);
 const recognition=useRef<Recognition|null>(null),audio=useRef<HTMLAudioElement|null>(null),audioUrl=useRef(''),generation=useRef(0),controller=useRef<AbortController|null>(null),isOpen=useRef(open),callback=useRef(onTranscript),audioContext=useRef<AudioContext|null>(null),analyser=useRef<AnalyserNode|null>(null),sourceNode=useRef<MediaElementAudioSourceNode|null>(null),levelFrame=useRef<number|null>(null);
 isOpen.current=open;callback.current=onTranscript;

 function cancelRecognition(){const rec=recognition.current;recognition.current=null;if(rec){rec.onresult=null;rec.onerror=null;rec.onend=null;rec.abort()}setListening(false)}
 function stopLevelMeter(){if(levelFrame.current!==null){cancelAnimationFrame(levelFrame.current);levelFrame.current=null}setVoiceLevel(0)}
 // Run synchronously from a click/tap, before any request. Reuse this unlocked
 // player and context for all turns; recreating them loses mobile permission.
 function prepareAudio(){
  try{
   if(!audio.current){audio.current=new Audio();audio.current.preload='auto';audio.current.setAttribute('playsinline','true');
    audio.current.src='data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA==';
    void audio.current.play().catch(()=>{});
   }
   const C=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   if(C){if(!audioContext.current)audioContext.current=new C();if(audioContext.current.state!=='running')void audioContext.current.resume().catch(()=>{});}
  }catch{/* Native playback remains available without the animation meter. */}
 }

 function startLevelMeter(player:HTMLAudioElement){
  stopLevelMeter();
  const ctx=audioContext.current;
  // Never route audible playback through a suspended context.
  if(!ctx||ctx.state!=='running'){if(sourceNode.current)throw new DOMException('Tap Play reply to enable audio.','NotAllowedError');return;}
  try{
   if(!sourceNode.current){const meter=ctx.createAnalyser();meter.fftSize=256;meter.smoothingTimeConstant=.72;
    const source=ctx.createMediaElementSource(player);source.connect(meter);meter.connect(ctx.destination);analyser.current=meter;sourceNode.current=source;}
   const meter=analyser.current;if(!meter)return;
   const data=new Uint8Array(meter.frequencyBinCount);let smooth=0;
   const tick=()=>{meter.getByteFrequencyData(data);let sum=0;for(let i=0;i<data.length;i++)sum+=data[i];const raw=(sum/data.length)/128;smooth+=(Math.min(1,raw*1.35)-smooth)*.3;setVoiceLevel(smooth);levelFrame.current=requestAnimationFrame(tick)};
   levelFrame.current=requestAnimationFrame(tick);
  }catch(error){if(error instanceof DOMException&&error.name==='NotAllowedError')throw error;setVoiceLevel(0)}
 }
 function stopPlayback(){generation.current++;controller.current?.abort();audio.current?.pause();stopLevelMeter();if(audio.current){audio.current.onended=null;audio.current.onerror=null;}if(audioUrl.current){URL.revokeObjectURL(audioUrl.current);audioUrl.current=''}if('speechSynthesis'in window)window.speechSynthesis.cancel();setSpeaking(false)}
 function endConversation(){setNeedsPlay(false);session.current++;conversation.current=false;setConversationActive(false);cancelRecognition();stopPlayback();setStatus('Conversation ended. You can type or start talking again.')}

 useEffect(()=>{const w=window as VoiceWindow;setSupported(Boolean(w.SpeechRecognition||w.webkitSpeechRecognition));if(!w.SpeechRecognition&&!w.webkitSpeechRecognition)setStatus('Voice replies are on. Microphone input is unavailable in this browser, but you can still type and hear Brittany.');return()=>{generation.current++;controller.current?.abort();recognition.current?.abort();audio.current?.pause();if(levelFrame.current!==null)cancelAnimationFrame(levelFrame.current);sourceNode.current?.disconnect();analyser.current?.disconnect();void audioContext.current?.close();if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);window.speechSynthesis?.cancel()}},[]);
 useEffect(()=>{if(!open){endConversation()}},[open]);

 function speakWithDeviceFallback(text:string,ticket:number){
  return new Promise<boolean>(resolve=>{
   if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined'){resolve(false);return}
   const utterance=new SpeechSynthesisUtterance(text);
   const voices=window.speechSynthesis.getVoices();
   const preferred=voices.find(v=>/Microsoft (Aria|Jenny)|Google US English|Samantha|Ava/i.test(v.name)&&/^en(-|_)?US/i.test(v.lang||''))
    ||voices.find(v=>/^en(-|_)?US/i.test(v.lang||''));
   if(preferred)utterance.voice=preferred;utterance.lang='en-US';utterance.rate=.96;utterance.pitch=.96;utterance.volume=1;
   let fallbackPulse:number|undefined;utterance.onstart=()=>{if(ticket===generation.current){setSpeaking(true);setStatus('Brittany is speaking.');fallbackPulse=window.setInterval(()=>setVoiceLevel(.18+Math.random()*.52),90)}};
   utterance.onend=()=>{if(fallbackPulse)clearInterval(fallbackPulse);setVoiceLevel(0);setSpeaking(false);resolve(true)};
   utterance.onerror=()=>{if(fallbackPulse)clearInterval(fallbackPulse);setVoiceLevel(0);setSpeaking(false);resolve(false)};
   window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance);
  });
 }

 async function speak(text:string,force=false){
  if(!isOpen.current||(!enabled&&!force))return;
  lastReply.current=text;setNeedsPlay(false);
  cancelRecognition();stopPlayback();const ticket=generation.current;const abort=new AbortController();controller.current=abort;setStatus('Preparing Brittany’s reply…');
  const spokenText=text.replace(/\[([^\]]+)\]\(https?:[^)]+\)/g,'$1').replace(/https?:\/\/\S+/g,'').replace(/[*#`]/g,'').trim();
  const sentences=spokenText.match(/[\s\S]+?(?:[.!?](?=\s|$)|$)/g)||[spokenText];const chunks:string[]=[];
  for(const sentence of sentences){const parts=sentence.trim().replace(/\s+/g,' ').match(/.{1,650}(?:\s|$)|.{1,650}/g)||[];for(const part of parts){const last=chunks.length-1;if(last>=0&&chunks[last].length+part.length<650)chunks[last]+=' '+part.trim();else chunks.push(part.trim())}}
  const prepare=async(part:string)=>{try{const r=await fetch('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:part}),signal:abort.signal});if(!r.ok)return null;return await r.blob()}catch{return null}};

  try{
   let next=prepare(chunks[0]||spokenText);
   for(let i=0;i<chunks.length;i++){
    const blob=await next;if(ticket!==generation.current||!isOpen.current)return;
    if(!blob){
     const fellBack=await speakWithDeviceFallback(chunks.slice(i).join(' '),ticket);
     if(!fellBack)throw Error('No speech output');
     if(ticket!==generation.current||!isOpen.current)return;
     if(conversation.current)startListening();else setStatus('Brittany’s studio voice is unavailable, so your device voice was used. Tap the microphone to continue.');
     return;
    }
    if(i+1<chunks.length)next=prepare(chunks[i+1]);
    if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);audioUrl.current=URL.createObjectURL(blob);const player=audio.current||new Audio();audio.current=player;player.src=audioUrl.current;player.volume=1;player.muted=false;startLevelMeter(player);
    await new Promise<void>((resolve,reject)=>{const cancel=()=>{player.pause();stopLevelMeter();resolve()};abort.signal.addEventListener('abort',cancel,{once:true});const cleanup=()=>abort.signal.removeEventListener('abort',cancel);player.onended=()=>{cleanup();stopLevelMeter();resolve()};player.onerror=()=>{cleanup();stopLevelMeter();reject(Error())};player.play().then(()=>{if(ticket!==generation.current){player.pause();cleanup();stopLevelMeter();resolve();return}setSpeaking(true);setStatus('Brittany is speaking.');}).catch(error=>{cleanup();stopLevelMeter();reject(error)})});
    if(ticket!==generation.current||!isOpen.current)return;
   }
   setSpeaking(false);if(conversation.current)startListening();else setStatus('Voice replies are on. Ask another question anytime.');
  }catch(error){
   if(ticket!==generation.current||!isOpen.current)return;
   if(error instanceof DOMException&&error.name==='NotAllowedError'){setSpeaking(false);setNeedsPlay(true);setStatus('Tap Play reply to enable Brittany’s audio.');return;}
   const fellBack=await speakWithDeviceFallback(spokenText,ticket);
   if(!fellBack){abort.abort();conversation.current=false;setConversationActive(false);setSpeaking(false);setStatus('Voice playback is unavailable right now. Her full answer is still in the conversation.');return}
   if(conversation.current)startListening();else setStatus('Brittany’s studio voice is unavailable, so your device voice was used.');
  }
 }

 function startListening(){
  if(!isOpen.current)return;cancelRecognition();stopPlayback();const w=window as VoiceWindow;const C=w.SpeechRecognition||w.webkitSpeechRecognition;if(!C)return;
  const rec=new C();recognition.current=rec;let received=false;rec.lang='en-US';rec.continuous=false;rec.interimResults=false;
  rec.onresult=e=>{const text=e.results[0]?.[0]?.transcript?.trim();if(text&&isOpen.current){received=true;setStatus('Thinking about your question…');callback.current(text)}};
  rec.onerror=e=>{conversation.current=false;setConversationActive(false);setListening(false);setStatus(e.error==='not-allowed'?'Microphone permission was denied. You can still type and hear replies.':e.error==='no-speech'?'I didn’t catch anything. Tap the microphone when you’re ready.':'The microphone stopped. Tap to continue or type below.');};
  rec.onend=()=>{if(recognition.current===rec){setListening(false);recognition.current=null;if(!received){conversation.current=false;setConversationActive(false)}}};
  try{rec.start();setListening(true);setEnabled(true);setStatus('Listening. Speak naturally; Brittany will listen again after her reply.');}catch{conversation.current=false;setConversationActive(false);setStatus('Microphone could not start. Please type your question.');}
 }

 function toggleListening(){prepareAudio();if(listening){endConversation();return}conversation.current=true;setConversationActive(true);setEnabled(true);startListening();}
 function toggleEnabled(){prepareAudio();if(enabled){endConversation();setEnabled(false);setStatus('Voice replies are off.');}else{setEnabled(true);setStatus('Voice replies are on.');void speak('Welcome to Ask Brittany, your virtual care receptionist. How can I help you today?',true);}}
 function replay(){prepareAudio();setEnabled(true);if(lastReply.current)void speak(lastReply.current,true);}
 return {prepareAudio,needsPlay,replay,enabled,supported,listening,speaking,voiceLevel,status,speak,stop:endConversation,toggleListening,toggleEnabled,conversationActive,endConversation,session};
}
