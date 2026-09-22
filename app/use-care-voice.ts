'use client';
import {useEffect,useRef,useState} from 'react';
type Recognition={lang:string;continuous:boolean;interimResults:boolean;onresult:((e:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;abort:()=>void;stop:()=>void};
type VoiceWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
export function useCareVoice(open:boolean,onTranscript:(text:string)=>void){
 const [enabled,setEnabled]=useState(false),[supported,setSupported]=useState(false),[listening,setListening]=useState(false),[speaking,setSpeaking]=useState(false),[status,setStatus]=useState('Voice is off. You can type a question anytime.');
 const [conversationActive,setConversationActive]=useState(false);const conversation=useRef(false);const session=useRef(0);
 const recognition=useRef<Recognition|null>(null),audio=useRef<HTMLAudioElement|null>(null),audioUrl=useRef(''),generation=useRef(0),controller=useRef<AbortController|null>(null),isOpen=useRef(open),callback=useRef(onTranscript);
 isOpen.current=open;callback.current=onTranscript;
 function cancelRecognition(){const rec=recognition.current;recognition.current=null;if(rec){rec.onresult=null;rec.onerror=null;rec.onend=null;rec.abort()}setListening(false)}
 function endConversation(){session.current++;conversation.current=false;setConversationActive(false);cancelRecognition();stop();setStatus('Conversation ended. You can type or start talking again.')}
 function stop(){generation.current++;controller.current?.abort();audio.current?.pause();audio.current=null;if(audioUrl.current){URL.revokeObjectURL(audioUrl.current);audioUrl.current=''}if('speechSynthesis'in window)window.speechSynthesis.cancel();setSpeaking(false)}
 useEffect(()=>{const w=window as VoiceWindow;setSupported(Boolean(w.SpeechRecognition||w.webkitSpeechRecognition));if(!w.SpeechRecognition&&!w.webkitSpeechRecognition)setStatus('Microphone input is unavailable in this browser. Type a question or enable spoken replies.');return()=>{generation.current++;controller.current?.abort();recognition.current?.abort();audio.current?.pause();if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);window.speechSynthesis?.cancel()}},[]);
 useEffect(()=>{if(!open){endConversation()}},[open]); // Stop all audio and microphone work when the panel closes.
 async function speak(text:string){
  if(!isOpen.current)return;cancelRecognition();stop();const ticket=generation.current;const abort=new AbortController();controller.current=abort;setStatus('Preparing Brittany’s reply…');
  // Start with a sentence, then prepare the next passage while the current one plays.
  const spokenText=text.replace(/\[([^\]]+)\]\(https?:[^)]+\)/g,'$1').replace(/https?:\/\/\S+/g,'').replace(/[*#`]/g,'');
  const sentences=spokenText.match(/[\s\S]+?(?:[.!?](?=\s|$)|$)/g)||[spokenText];const chunks:string[]=[];
  for(const sentence of sentences){const parts=sentence.trim().replace(/\s+/g,' ').match(/.{1,650}(?:\s|$)|.{1,650}/g)||[];for(const part of parts){const last=chunks.length-1;if(last>0&&chunks[last].length+part.length<650)chunks[last]+=' '+part.trim();else chunks.push(part.trim())}}
  const prepare=async(part:string)=>{try{const r=await fetch('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:part}),signal:abort.signal});if(!r.ok)return null;return await r.blob()}catch{return null}};
  try{
   let next=prepare(chunks[0]||text);
   for(let i=0;i<chunks.length;i++){
    const blob=await next;if(ticket!==generation.current||!isOpen.current)return;if(!blob)throw Error();
    if(i+1<chunks.length)next=prepare(chunks[i+1]);
    if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);audioUrl.current=URL.createObjectURL(blob);const player=new Audio(audioUrl.current);audio.current=player;
    await new Promise<void>((resolve,reject)=>{const cancel=()=>{player.pause();resolve()};abort.signal.addEventListener('abort',cancel,{once:true});const cleanup=()=>abort.signal.removeEventListener('abort',cancel);player.onended=()=>{cleanup();resolve()};player.onerror=()=>{cleanup();reject(Error())};player.play().then(()=>{if(ticket!==generation.current){player.pause();cleanup();resolve();return}setSpeaking(true);setStatus('Brittany is speaking.');}).catch(()=>{cleanup();reject(Error())})});
    if(ticket!==generation.current||!isOpen.current)return;
   }
   setSpeaking(false);if(conversation.current)startListening();else setStatus('Tap the microphone to continue, or type your next question.');
  }catch{if(ticket!==generation.current||!isOpen.current)return;abort.abort();conversation.current=false;setConversationActive(false);setSpeaking(false);setStatus('The spoken reply was interrupted. Her full answer is in the conversation; you can continue by voice or text.');}
 }

 function startListening(){
  if(!isOpen.current)return;cancelRecognition();stop();const w=window as VoiceWindow;const C=w.SpeechRecognition||w.webkitSpeechRecognition;if(!C)return;
  const rec=new C();recognition.current=rec;let received=false;rec.lang='en-US';rec.continuous=false;rec.interimResults=false;
  rec.onresult=e=>{const text=e.results[0]?.[0]?.transcript?.trim();if(text&&isOpen.current){received=true;setStatus('Thinking about your question…');callback.current(text)}};
  rec.onerror=e=>{conversation.current=false;setConversationActive(false);setListening(false);setStatus(e.error==='not-allowed'?'Microphone permission was denied. You can still type.':e.error==='no-speech'?'I didn’t catch anything. Tap the microphone when you’re ready.':'The microphone stopped. Tap to continue or type below.');};
  rec.onend=()=>{if(recognition.current===rec){setListening(false);recognition.current=null;if(!received){conversation.current=false;setConversationActive(false)}}};
  try{rec.start();setListening(true);setEnabled(true);setStatus('Listening. Speak naturally; Brittany will listen again after her reply.');}catch{conversation.current=false;setConversationActive(false);setStatus('Microphone could not start. Please type your question.');}
 }
 function toggleListening(){if(listening){endConversation();return}conversation.current=true;setConversationActive(true);startListening();}

 function toggleEnabled(){if(enabled){endConversation();setEnabled(false);setStatus('Voice is off.');}else{setEnabled(true);void speak('Welcome to Ask Brittany, your virtual care receptionist. How can I help you today?');}}
 return {enabled,supported,listening,speaking,status,speak,stop: endConversation,toggleListening,toggleEnabled,conversationActive,endConversation,session};
}
