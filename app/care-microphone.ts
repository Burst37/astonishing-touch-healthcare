export type MicrophoneState='idle'|'requesting'|'recording'|'transcribing';
type Callbacks={onState:(state:MicrophoneState)=>void;onStatus:(text:string)=>void;onTranscript:(text:string)=>void;onError:(text:string)=>void};
export function canRecordMicrophone(){return typeof navigator!=='undefined'&&Boolean(navigator.mediaDevices?.getUserMedia)&&typeof MediaRecorder!=='undefined'}

// Records the actual microphone instead of depending on the browser's separate
// speech-recognition service. A generation token retires every late callback.
export class CareMicrophone{
 private ticket=0;
 private recorder:MediaRecorder|null=null;
 private stream:MediaStream|null=null;
 private timer:ReturnType<typeof setInterval>|null=null;
 private request:AbortController|null=null;
 private context:AudioContext|null=null;
 private source:MediaStreamAudioSourceNode|null=null;
 private meter:AnalyserNode|null=null;
 constructor(private callbacks:Callbacks){}
 private release(){
  if(this.timer!==null){clearInterval(this.timer);this.timer=null}
  this.source?.disconnect();this.source=null;this.meter?.disconnect();this.meter=null;
  this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;
 }
 cancel(){
  this.ticket++;this.request?.abort();this.request=null;
  const recorder=this.recorder;this.recorder=null;
  if(recorder){recorder.ondataavailable=null;recorder.onstop=null;recorder.onerror=null;if(recorder.state!=='inactive')recorder.stop()}
  this.release();this.callbacks.onState('idle');
 }
 dispose(){this.cancel();void this.context?.close();this.context=null}
 finish(){if(this.timer!==null){clearInterval(this.timer);this.timer=null}if(this.recorder?.state==='recording'){this.callbacks.onStatus('Sending your recording…');this.recorder.stop()}}
 async start(){
  this.cancel();const ticket=this.ticket;this.callbacks.onState('requesting');this.callbacks.onStatus('Allow microphone access when your browser asks.');
  try{
   if(!canRecordMicrophone())throw new DOMException('Microphone recording is unavailable in this browser. Open this site in Chrome or Safari.','NotSupportedError');
   // Create/resume in the original tap, then reuse through automatic next turns.
   const C=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   try{if(C){if(!this.context)this.context=new C();void this.context.resume().catch(()=>{})}}catch{/* Manual Send still works without silence detection. */}
   const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});
   if(ticket!==this.ticket){stream.getTracks().forEach(track=>track.stop());return}
   this.stream=stream;
   const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].find(type=>MediaRecorder.isTypeSupported(type));
   const recorder=new MediaRecorder(stream,mime?{mimeType:mime,audioBitsPerSecond:64000}:undefined);this.recorder=recorder;
   const chunks:Blob[]=[];let bytes=0;
   recorder.ondataavailable=event=>{if(ticket===this.ticket&&event.data.size){chunks.push(event.data);bytes+=event.data.size;if(bytes>2_900_000)this.finish()}};
   recorder.onerror=()=>{if(ticket!==this.ticket)return;this.cancel();this.callbacks.onError('The microphone recording stopped unexpectedly. Please try again.');};
   recorder.onstop=()=>{if(ticket!==this.ticket)return;this.recorder=null;this.release();void this.transcribe(new Blob(chunks,{type:recorder.mimeType||mime||'audio/webm'}),ticket)};
   recorder.start(250);this.callbacks.onState('recording');this.callbacks.onStatus('Listening. Speak, then pause or tap Send voice message.');
   const ctx=this.context;
   if(ctx?.state==='running'){try{this.source=ctx.createMediaStreamSource(stream);this.meter=ctx.createAnalyser();this.meter.fftSize=1024;this.source.connect(this.meter)}catch{this.source=null;this.meter=null}}
   const started=Date.now();let lastVoice=started,voicedMs=0;const samples=new Uint8Array(1024);
   this.timer=setInterval(()=>{
    if(ticket!==this.ticket)return;
    const now=Date.now();
    if(this.meter){this.meter.getByteTimeDomainData(samples);let sum=0;for(const sample of samples){const value=(sample-128)/128;sum+=value*value}if(Math.sqrt(sum/samples.length)>.012){lastVoice=now;voicedMs+=100}}
    if(voicedMs>=300&&now-lastVoice>1500){this.finish();return}
    if(now-started>=60000)this.finish();
   },100);
  }catch(error){
   if(ticket!==this.ticket)return;this.cancel();
   const name=error instanceof Error?error.name:'';
   this.callbacks.onError(name==='NotAllowedError'?'Microphone access was denied. Allow the microphone in this site’s browser permissions, then tap Talk to Brittany.':name==='NotFoundError'?'No microphone was found. Check your device microphone or type your question.':name==='NotReadableError'?'The microphone is busy or unavailable. Close other voice apps, then try again.':name==='NotSupportedError'?(error as Error).message:'The microphone could not start. Please try again or type your question.');
  }
 }
 private async transcribe(blob:Blob,ticket:number){
  if(blob.size<100){this.callbacks.onState('idle');this.callbacks.onError('No microphone audio was captured. Please try recording again.');return}
  this.callbacks.onState('transcribing');this.callbacks.onStatus('Turning your voice into text…');
  const request=new AbortController();this.request=request;const timeout=setTimeout(()=>request.abort(),25000);
  try{
   const response=await fetch('/api/transcribe',{method:'POST',headers:{'Content-Type':blob.type||'audio/webm'},body:blob,signal:request.signal});
   const result=await response.json() as {transcript?:string;error?:string};if(ticket!==this.ticket)return;
   if(!response.ok)throw Error(result.error||'The recording could not be transcribed. Please try again.');
   const text=result.transcript?.trim();this.callbacks.onState('idle');
   if(!text){this.callbacks.onError('I did not catch any words. Please speak closer to the microphone and try again.');return}
   this.callbacks.onStatus('Thinking about your question…');this.callbacks.onTranscript(text);
  }catch(error){if(ticket===this.ticket){this.callbacks.onState('idle');this.callbacks.onError(request.signal.aborted?'Transcription took too long. Please record again.':error instanceof Error?error.message:'Transcription failed. Please try again.')}}
  finally{clearTimeout(timeout);if(this.request===request)this.request=null}
 }
}
