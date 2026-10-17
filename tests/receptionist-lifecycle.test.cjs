const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function load(file,dependencies){const module={exports:{}};const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',source)(id=>{if(!(id in dependencies))throw Error(id);return dependencies[id]},module,module.exports);return module.exports}
test('Urgent questions return help before storage, pricing or provider routing',async()=>{
 let storageCalls=0;
 const {POST}=load('app/api/assistant/route.ts',{'@/lib/rate-limit':{allowRequest(){storageCalls++;throw Error('storage unavailable')}},'cloudflare:workers':{env:{}},'@/app/content':{business:{},services:[],faqs:[],directionsUrl:''},'@/app/care-knowledge':{},'@/app/current-information':{}});
 for(const message of ['I have chest pain. How much does care cost?','My dad can’t breathe','She cannot breathe']){
  const response=await POST(new Request('https://example.test/api/assistant',{method:'POST',headers:{origin:'https://example.test'},body:JSON.stringify({message})}));
  assert.equal(response.status,200);assert.match((await response.json()).reply,/call 911/);
 }
 assert.equal(storageCalls,0);
});
test('Replies reuse gesture-unlocked audio and stop never closes its context',async()=>{
 const previous={window:global.window,Audio:global.Audio,fetch:global.fetch,raf:global.requestAnimationFrame,caf:global.cancelAnimationFrame};
 let contexts=0,players=0,sources=0,resumes=0,closes=0;const effects=[];
 class Player {constructor(){players++;this.onended=null;}setAttribute(){}pause(){}play(){if(this.src.startsWith('blob:'))setImmediate(()=>this.onended?.());return Promise.resolve()}}
 class Context {constructor(){contexts++;this.state='suspended';}resume(){resumes++;this.state='running';return Promise.resolve()}close(){closes++;this.state='closed';return Promise.resolve()}createAnalyser(){return {fftSize:0,frequencyBinCount:128,connect(){},disconnect(){},getByteFrequencyData(){}}}createMediaElementSource(){assert.equal(this.state,'running');sources++;return {connect(){},disconnect(){}}}}
 try{
 global.Audio=Player;global.window={AudioContext:Context};global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};global.fetch=async()=>({ok:true,blob:async()=>new Blob(['audio'],{type:'audio/wav'})});
 const {useCareVoice}=load('app/use-care-voice.ts',{'./care-live-voice':load('app/care-live-voice.ts',{}),react:{useState:value=>[value,()=>{}],useRef:value=>({current:value}),useEffect:fn=>effects.push(fn)}});
 const voice=useCareVoice(true,()=>{});const cleanup=effects[0]();
 voice.prepareAudio();assert.equal(resumes,1);
 await voice.speak('First reply.');await voice.speak('Second reply.');voice.endConversation();
 assert.equal(players,1);assert.equal(contexts,1);assert.equal(sources,1);assert.equal(closes,0);
 cleanup();assert.equal(closes,1);
 }finally{global.window=previous.window;global.Audio=previous.Audio;global.fetch=previous.fetch;global.requestAnimationFrame=previous.raf;global.cancelAnimationFrame=previous.caf;}
});
test('Browser autoplay rejection offers a gesture-based Play reply action',async()=>{
 const previous={window:global.window,Audio:global.Audio,fetch:global.fetch};const values=[];
 try{
 global.window={};global.Audio=class {pause(){}play(){return Promise.reject(new DOMException('gesture required','NotAllowedError'))}};global.fetch=async()=>({ok:true,blob:async()=>new Blob(['audio'],{type:'audio/wav'})});
 const {useCareVoice}=load('app/use-care-voice.ts',{'./care-live-voice':load('app/care-live-voice.ts',{}),react:{useState:value=>[value,next=>values.push(next)],useRef:value=>({current:value}),useEffect(){}}});
 await useCareVoice(true,()=>{}).speak('Hello.');
 assert.ok(values.includes('Tap Play reply to enable Brittany’s audio.'));assert.ok(values.includes(true));
 }finally{global.window=previous.window;global.Audio=previous.Audio;global.fetch=previous.fetch;}
});

function microphoneEnvironment(getUserMedia){
 const saved={navigator:Object.getOwnPropertyDescriptor(global,'navigator'),window:global.window,MediaRecorder:global.MediaRecorder,fetch:global.fetch};const recorders=[];
 Object.defineProperty(global,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia}}});global.window={};
 global.MediaRecorder=class {
  static isTypeSupported(type){return type==='audio/webm;codecs=opus'}
  constructor(stream,options){this.stream=stream;this.mimeType=options?.mimeType||'audio/webm';this.state='inactive';recorders.push(this)}
  start(){this.state='recording'}
  stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob(['a'.repeat(300)],{type:this.mimeType})});this.onstop?.()})}
 };
 return {recorders,restore(){if(saved.navigator)Object.defineProperty(global,'navigator',saved.navigator);else delete global.navigator;global.window=saved.window;global.MediaRecorder=saved.MediaRecorder;global.fetch=saved.fetch}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('Actual microphone recording is submitted, transcribed and its tracks released',async()=>{
 let stopped=0;const env=microphoneEnvironment(async()=>({getTracks:()=>[{stop(){stopped++}}]}));const transcripts=[],states=[],errors=[];
 try{
 global.fetch=async(url,options)=>{assert.equal(url,'/api/transcribe');assert.equal(options.headers['Content-Type'],'audio/webm;codecs=opus');assert.ok(options.body instanceof Blob);return {ok:true,json:async()=>({transcript:'What services do you offer?'})}};
 const {CareMicrophone,canRecordMicrophone}=load('app/care-microphone.ts',{});assert.equal(canRecordMicrophone(),true);
 const mic=new CareMicrophone({onState:s=>states.push(s),onStatus(){},onError:e=>errors.push(e),onTranscript:t=>transcripts.push(t)});
 await mic.start();assert.equal(env.recorders[0].state,'recording');mic.finish();await flush();
 assert.deepEqual(transcripts,['What services do you offer?']);assert.deepEqual(errors,[]);assert.equal(stopped,1);assert.ok(states.includes('transcribing'));mic.dispose();
 }finally{env.restore()}
});
test('Ending conversation during microphone permission retires the arriving stream',async()=>{
 let resolvePermission,stopped=0;const env=microphoneEnvironment(()=>new Promise(resolve=>resolvePermission=resolve));
 try{
 const {CareMicrophone}=load('app/care-microphone.ts',{});const mic=new CareMicrophone({onState(){},onStatus(){},onError(){},onTranscript(){assert.fail('late transcript')}});
 const pending=mic.start();mic.cancel();resolvePermission({getTracks:()=>[{stop(){stopped++}}]});await pending;assert.equal(stopped,1);assert.equal(env.recorders.length,0);mic.dispose();
 }finally{env.restore()}
});
test('A late transcription cannot send a question after conversation ends',async()=>{
 let resolveTranscription,requestSignal;const env=microphoneEnvironment(async()=>({getTracks:()=>[{stop(){}}]}));const transcripts=[];
 try{
 global.fetch=async(_url,options)=>{requestSignal=options.signal;return new Promise(resolve=>resolveTranscription=resolve)};
 const {CareMicrophone}=load('app/care-microphone.ts',{});const mic=new CareMicrophone({onState(){},onStatus(){},onError(){},onTranscript:t=>transcripts.push(t)});
 await mic.start();mic.finish();await flush();mic.cancel();assert.equal(requestSignal.aborted,true);resolveTranscription({ok:true,json:async()=>({transcript:'Late question'})});await flush();assert.deepEqual(transcripts,[]);mic.dispose();
 }finally{env.restore()}
});
test('A busy device microphone produces an actionable error',async()=>{
 const env=microphoneEnvironment(async()=>{throw new DOMException('in use','NotReadableError')});const errors=[];
 try{const {CareMicrophone}=load('app/care-microphone.ts',{});const mic=new CareMicrophone({onState(){},onStatus(){},onError:e=>errors.push(e),onTranscript(){}});await mic.start();assert.match(errors[0],/microphone is busy/);mic.dispose()}finally{env.restore()}
});
test('Transcription route validates origin and normalizes recorded audio for Google',async()=>{
 const originalKey=process.env.GEMINI_API_KEY,originalFetch=global.fetch;process.env.GEMINI_API_KEY='test-key';let calls=0;
 try{
 const {POST}=load('app/api/transcribe/route.ts',{'@/lib/rate-limit':{allowRequest:async()=>true}});
 global.fetch=async(url,options)=>{calls++;assert.match(url,/gemini-3.5-transcribe/);const body=JSON.parse(options.body);assert.equal(body.contents[0].parts[0].inlineData.mimeType,'audio/m4a');assert.equal(Buffer.from(body.contents[0].parts[0].inlineData.data,'base64').length,200);return Response.json({candidates:[{content:{parts:[{audioTranscription:{text:'Please help me with laundry.'}}]},finishReason:'STOP'}]})};
 const response=await POST(new Request('https://example.test/api/transcribe',{method:'POST',headers:{origin:'https://example.test','content-type':'audio/mp4;codecs=mp4a'},body:Buffer.alloc(200,1)}));assert.equal(response.status,200);assert.equal((await response.json()).transcript,'Please help me with laundry.');assert.equal(response.headers.get('cache-control'),'no-store');
 for(const [origin,type,size,status] of [['https://other.test','audio/webm',200,403],['https://example.test','text/plain',200,415],['https://example.test','audio/webm',20,400]]){const r=await POST(new Request('https://example.test/api/transcribe',{method:'POST',headers:{origin,'content-type':type},body:Buffer.alloc(size)}));assert.equal(r.status,status)}assert.equal(calls,1);
 }finally{if(originalKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=originalKey;global.fetch=originalFetch}
});
test('Pausing after speech automatically sends the microphone recording',async()=>{
 const saved={interval:global.setInterval,clear:global.clearInterval,now:Date.now};let tick,now=1000,voiced=true;const transcripts=[];
 const env=microphoneEnvironment(async()=>({getTracks:()=>[{stop(){}}]}));
 try{
 global.setInterval=callback=>{tick=callback;return 1};global.clearInterval=()=>{};Date.now=()=>now;
 global.window.AudioContext=class {constructor(){this.state='running'}resume(){return Promise.resolve()}close(){return Promise.resolve()}createMediaStreamSource(){return {connect(){},disconnect(){}}}createAnalyser(){return {disconnect(){},getByteTimeDomainData(a){a.fill(voiced?132:128)}}}};
 global.fetch=async()=>({ok:true,json:async()=>({transcript:'My question was recorded.'})});
 const {CareMicrophone}=load('app/care-microphone.ts',{});const mic=new CareMicrophone({onState(){},onStatus(){},onError:e=>assert.fail(e),onTranscript:t=>transcripts.push(t)});
 await mic.start();for(let i=0;i<4;i++){now+=100;tick()}assert.equal(env.recorders[0].state,'recording');voiced=false;
 for(let i=0;i<14;i++){now+=100;tick()}assert.equal(env.recorders[0].state,'recording');now+=200;tick();await flush();assert.deepEqual(transcripts,['My question was recorded.']);mic.dispose();
 }finally{global.setInterval=saved.interval;global.clearInterval=saved.clear;Date.now=saved.now;env.restore()}
});
