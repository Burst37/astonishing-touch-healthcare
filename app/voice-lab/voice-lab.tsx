'use client';
import {useEffect,useRef,useState} from 'react';
import {CareLiveVoice} from '../care-live-voice';
export function VoiceLab(){
 const [running,setRunning]=useState(false),[state,setState]=useState('Ready'),[lines,setLines]=useState<string[]>([]),[packets,setPackets]=useState(0),[replyChunks,setReplyChunks]=useState(0),[contextState,setContextState]=useState('not started');
 const cleanup=useRef<()=>void>(()=>{});
 useEffect(()=>()=>cleanup.current(),[]);
 async function run(){
  setRunning(true);setLines([]);setPackets(0);setReplyChunks(0);setState('Preparing fixed synthetic speech');
  const output=new AudioContext(),sourceContext=new AudioContext();void output.resume();void sourceContext.resume();
  const destination=sourceContext.createMediaStreamDestination();let voice:CareLiveVoice|null=null;
  cleanup.current=()=>{voice?.close();void output.close();void sourceContext.close()};
  try{
   const questions=['What are your office hours?','And what about weekends?'];const audio:AudioBuffer[]=[];
   for(const text of questions){const response=await fetch('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});if(!response.ok)throw Error('Synthetic input preparation failed');audio.push(await sourceContext.decodeAudioData(await response.arrayBuffer()))}
   let readyResolve:()=>void=()=>{};const ready=new Promise<void>(r=>readyResolve=r);let complete:()=>void=()=>{};
   voice=new CareLiveVoice(output,{onState:s=>{setState(s);setContextState(output.state);if(s==='listening')readyResolve();if(s==='speaking')setReplyChunks(n=>n+1)},onInputLevel:()=>setPackets(n=>n+1),onTranscript:(role,text,id)=>setLines(current=>{const prefix=id+' ';const entry=prefix+role+': '+text;return current.some(x=>x.startsWith(prefix))?current.map(x=>x.startsWith(prefix)?entry:x):[...current,entry]}),onError:m=>{setState('FAILED: '+m);complete();readyResolve()},onTurnComplete:()=>complete()},[],async()=>destination.stream);
   await voice.start();await Promise.race([ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Setup timeout')),25000))]);
   for(let i=0;i<audio.length;i++){
    const ended=new Promise<void>(r=>complete=r);const source=sourceContext.createBufferSource();source.buffer=audio[i];source.connect(destination);source.start();
    await Promise.race([ended,new Promise((_,reject)=>setTimeout(()=>reject(Error('No natural-pause response on turn '+(i+1))),30000))]);
    if(!voice.connected)throw Error('Voice connection ended');
    await new Promise(resolve=>setTimeout(resolve,voice!.bufferedOutputSeconds*1000+200));source.disconnect();
   }
   setState('PASS: two spoken questions received two streamed spoken replies');setContextState(output.state);
  }catch(error){setState('FAILED: '+(error instanceof Error?error.message:'unknown error'))}finally{cleanup.current();setRunning(false)}
 }
 return <main style={{padding:32,maxWidth:950,margin:'auto'}}><h1>Browser voice regression lab</h1><p>Preview-only. Two fixed synthetic questions pass through the real browser audio graph, capture worklet, live socket and speaker output. This does not use a physical microphone.</p><button className="button" disabled={running} onClick={run}>Run synthetic dialogue</button><p role="status">{state}</p><p>Captured worklet packets: {packets}. Scheduled reply audio chunks: {replyChunks}. Output context: {contextState}.</p>{lines.map((line,i)=><p key={i}>{line}</p>)}</main>
}
