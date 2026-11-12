export type LiveState='connecting'|'listening'|'speaking'|'idle';
type Role='user'|'assistant';
export type VoiceHistory={role:Role;content:string};
type Callbacks={onState:(state:LiveState)=>void,onTranscript:(role:Role,text:string,id:string)=>void,onError:(message:string)=>void,onInputLevel?:(level:number)=>void,onTurnComplete?:()=>void,onStatus?:(message:string)=>void};
type ServerContent={interrupted?:boolean,turnComplete?:boolean,inputTranscription?:{text?:string},outputTranscription?:{text?:string},modelTurn?:{parts?:{inlineData?:{data?:string,mimeType?:string}}[]}};

export function canUseLiveVoice(){return typeof window!=='undefined'&&!!navigator.mediaDevices?.getUserMedia&&typeof AudioWorkletNode!=='undefined'&&typeof WebSocket!=='undefined'}
function toBase64(bytes:Uint8Array){let value='';for(const b of bytes)value+=String.fromCharCode(b);return btoa(value)}
export class CareLiveVoice {
 private socket:WebSocket|null=null;
 private stream:MediaStream|null=null;
 private input:AudioContext|null=null;
 private recorder:AudioWorkletNode|null=null;
 private source:MediaStreamAudioSourceNode|null=null;
 private sink:GainNode|null=null;
 private abort=new AbortController();
 private stopped=false;
 private ready=false;
 private sources=new Set<AudioBufferSourceNode>();
 private nextTime=0;
 private turn=0;
 private texts:Record<Role,string>={user:'',assistant:''};
 private nonce=Date.now().toString(36)+Math.random().toString(36).slice(2,7);
 private setupTimer:ReturnType<typeof setTimeout>|undefined;
 private inputHealthTimer:ReturnType<typeof setTimeout>|undefined;
 private capturedPackets=0;
 private playbackEpoch=0;
 private playbackQueue:Promise<void>=Promise.resolve();
 private drainTimer:ReturnType<typeof setTimeout>|undefined;
 constructor(private output:AudioContext,private callbacks:Callbacks,private history:VoiceHistory[]=[],private inputFactory?:()=>Promise<MediaStream>){}
 get bufferedOutputSeconds(){return Math.max(0,this.nextTime-this.output.currentTime)}
 get connected(){return this.ready&&!this.stopped}
 async start(){
  this.callbacks.onState('connecting');
  // Fetch authentication while the device grants permission and initializes audio.
  const tokenRequest=fetch('/api/live-token',{method:'POST',signal:this.abort.signal}).then(async response=>{
   const data=await response.json() as {token?:string,model?:string,error?:string};
   if(!response.ok||!data.token)throw Error(data.error||'Brittany could not connect. Please try again.');
   return {...data,token:data.token};
  });
  void tokenRequest.catch(()=>{});
  try{
   // Resume audio in the tap handler, before awaiting permission/network.
   // Use the hardware's native rate; the worklet converts it to 16 kHz.
   // Forcing 16 kHz fails on devices that only expose 44.1/48 kHz audio.
   // Use the gesture-unlocked context for both capture and playback.
   this.input=this.output;
   const audioReady=this.output.resume();
   void audioReady.catch(()=>{});
   const stream=await (this.inputFactory?this.inputFactory():navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}}));
   if(this.stopped){stream.getTracks().forEach(t=>t.stop());return}this.stream=stream;
   await audioReady;
   // Microphone permission/audio routing may suspend a context that was running.
   await this.resumeOutput();if(this.stopped)return;
   stream.getAudioTracks().forEach(track=>{track.addEventListener('ended',()=>{if(!this.stopped)this.fail('The microphone disconnected. Tap Talk to Brittany to reconnect.')});track.addEventListener('mute',()=>{if(!this.stopped)this.callbacks.onStatus?.('Your microphone is temporarily muted by the device. End any phone call or voice recording, then try again.')});track.addEventListener('unmute',()=>{if(!this.stopped){void this.output.resume();this.callbacks.onStatus?.('Your microphone is available again. Please continue.')}})});
   await this.input.audioWorklet.addModule('/worklets/care-pcm.js');if(this.stopped)return;
   this.recorder=new AudioWorkletNode(this.input,'care-pcm');this.source=this.input.createMediaStreamSource(stream);this.sink=this.input.createGain();this.sink.gain.value=0;
   this.source.connect(this.recorder);this.recorder.connect(this.sink);this.sink.connect(this.input.destination);
   this.recorder.port.onmessage=event=>{this.capturedPackets++;if(this.connected){const samples=new Int16Array(event.data);let peak=0;for(const value of samples)peak=Math.max(peak,Math.abs(value)/32768);this.callbacks.onInputLevel?.(Math.min(1,peak*4));if((this.socket?.bufferedAmount||0)>32000){this.fail('The voice connection is too slow. Tap Talk to Brittany to reconnect.');return}this.send({realtimeInput:{audio:{data:toBase64(new Uint8Array(event.data)),mimeType:'audio/pcm;rate=16000'}}})}};
   const data=await tokenRequest;if(this.stopped)return;
   this.socket=new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token='+encodeURIComponent(data.token));
   this.setupTimer=setTimeout(()=>this.fail('The voice connection timed out. Please try again.'),20000);
   this.socket.onopen=()=>this.send({setup:{model:'models/'+data.model}});
   this.socket.onmessage=event=>{void this.receive(event.data)};
   this.socket.onerror=()=>this.fail('Brittany’s voice connection failed. Please try again.');
   this.socket.onclose=event=>{if(!this.stopped){console.warn('Brittany live connection closed',event.code);this.fail(event.code===1006?'The browser lost the voice connection. Check your connection or open this page in Chrome or Safari.':'The voice connection ended. Tap Talk to Brittany to reconnect.')}};
  }catch(error){if(this.stopped)return;const name=error instanceof Error?error.name:'';
   this.fail(name==='NotAllowedError'?'Microphone access is blocked. Allow microphone access in your browser and try again.':name==='NotFoundError'?'No microphone was found. Check your device microphone or type your question.':name==='NotReadableError'?'Your microphone is busy. End any phone call or close the other voice app, then try again.':error instanceof Error?error.message:'Unable to start the microphone.');
  }
 }
 private send(value:unknown){if(!this.stopped&&this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify(value))}
 greet(){if(this.connected)this.send({clientContent:{turns:[{role:'user',parts:[{text:'Hello.'}]}],turnComplete:true}})}
 sendText(text:string){if(!this.connected)return false;this.interrupt();this.transcript('user',text);this.send({clientContent:{turns:[{role:'user',parts:[{text}]}],turnComplete:true}});return true}
 private transcript(role:Role,text:string){if(!text)return;this.texts[role]+=text;this.callbacks.onTranscript(role,this.texts[role],this.nonce+'-'+this.turn+'-'+role)}
 private async receive(raw:string|Blob|ArrayBuffer){
  try{
   const text=typeof raw==='string'?raw:raw instanceof Blob?await raw.text():new TextDecoder().decode(raw);if(this.stopped)return;
   const message=JSON.parse(text) as {setupComplete?:object,error?:object,goAway?:object,toolCall?:{functionCalls?:{id:string,name:string,args?:{query?:string}}[]},serverContent?:ServerContent};
   if(message.error){this.fail('Brittany’s live voice is unavailable. Please try again.');return}
   if(message.setupComplete){
    clearTimeout(this.setupTimer);
    // Preserve typed conversation when switching to voice, before sending mic audio.
    const turns=this.history.slice(-12).filter(m=>(m.role==='user'||m.role==='assistant')&&typeof m.content==='string'&&m.content.trim()).map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content.slice(0,3000)}]}));
    if(turns.length)this.send({clientContent:{turns,turnComplete:false}});
    this.ready=true;this.callbacks.onState('listening');
    this.inputHealthTimer=setTimeout(()=>{if(this.connected&&!this.capturedPackets)this.fail('Your browser connected but is not sending microphone audio. Open this page in Chrome or Safari, allow the microphone, then try again.')},3000);
   }
   const content=message.serverContent;
   if(content){
    if(content.interrupted){this.interrupt();this.nextTurn()}
    if(content.inputTranscription?.text)this.transcript('user',content.inputTranscription.text);
    if(content.outputTranscription?.text)this.transcript('assistant',content.outputTranscription.text);
    for(const part of content.modelTurn?.parts||[]){const audio=part.inlineData;if(audio?.data&&audio.mimeType?.startsWith('audio/pcm'))this.play(audio.data,Number(audio.mimeType.match(/rate=(\d+)/)?.[1]||24000))}
    if(content.turnComplete){this.nextTurn();this.waitForDrain();this.callbacks.onTurnComplete?.()}
   }
   for(const call of message.toolCall?.functionCalls||[]){void this.lookup(call)}
   if(message.goAway){this.fail('This voice session has ended. Tap Talk to Brittany to start a new one.')}
  }catch{if(!this.stopped)this.fail('Brittany’s audio connection was interrupted. Please reconnect.')}
 }
 private nextTurn(){this.turn++;this.texts={user:'',assistant:''}}
 private async lookup(call:{id:string,name:string,args?:{query?:string}}){
  if(call.name!=='lookup_current_information'||!call.args?.query){this.send({toolResponse:{functionResponses:[{id:call.id,name:call.name,response:{error:'Unsupported request'}}]}});return}
  try{const response=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},signal:this.abort.signal,body:JSON.stringify({message:call.args.query,history:[]})});const data=await response.json();this.send({toolResponse:{functionResponses:[{id:call.id,name:call.name,response:data}]}})}catch{this.send({toolResponse:{functionResponses:[{id:call.id,name:call.name,response:{error:'Current information could not be verified.'}}]}})}
 }
 private async resumeOutput(){await this.output.resume();if(this.output.state&&this.output.state!=='running')throw Error('Your browser paused audio. Tap Talk to Brittany again to enable sound.')}
 private play(base64:string,rate:number){
  const epoch=this.playbackEpoch;
  this.playbackQueue=this.playbackQueue.then(async()=>{
   if(this.stopped||epoch!==this.playbackEpoch)return;
   if(this.output.state&&this.output.state!=='running'){
    await this.resumeOutput();
   }
   if(this.stopped||epoch!==this.playbackEpoch)return;
  const binary=atob(base64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  const view=new DataView(bytes.buffer),count=Math.floor(bytes.length/2);if(!count)return;
  const buffer=this.output.createBuffer(1,count,rate),samples=buffer.getChannelData(0);for(let i=0;i<count;i++)samples[i]=view.getInt16(i*2,true)/32768;
  const source=this.output.createBufferSource();source.buffer=buffer;source.connect(this.output.destination);this.sources.add(source);
  source.onended=()=>{source.disconnect();this.sources.delete(source)};
  this.nextTime=Math.max(this.output.currentTime+.025,this.nextTime);source.start(this.nextTime);this.nextTime+=buffer.duration;
  this.callbacks.onState('speaking');this.waitForDrain();
  }).catch(()=>this.fail('Spoken audio was paused by your browser. Tap Talk to Brittany again to enable sound.'));
 }
 private waitForDrain(){clearTimeout(this.drainTimer);this.drainTimer=setTimeout(()=>{if(!this.stopped)this.callbacks.onState('listening')},Math.max(0,this.nextTime-this.output.currentTime)*1000+50)}
 interrupt(){this.playbackEpoch++;clearTimeout(this.drainTimer);for(const source of this.sources){source.onended=null;try{source.stop()}catch{}source.disconnect()}this.sources.clear();this.nextTime=0;if(this.connected)this.callbacks.onState('listening')}
 private fail(message:string){if(this.stopped)return;this.close();this.callbacks.onError(message)}
 close(){if(this.stopped)return;this.stopped=true;this.ready=false;clearTimeout(this.setupTimer);clearTimeout(this.inputHealthTimer);this.abort.abort();this.interrupt();this.recorder?.port.close();this.recorder?.disconnect();this.source?.disconnect();this.sink?.disconnect();this.stream?.getTracks().forEach(t=>t.stop());if(this.input&&this.input!==this.output)void this.input.close();this.socket?.close();this.callbacks.onState('idle')}
}
