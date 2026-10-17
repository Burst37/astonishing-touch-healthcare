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
test('Stopping microphone detaches late events; restarting retires previous recognizer',()=>{
 const effects=[],recognizers=[],transcripts=[];
 global.window={SpeechRecognition:class {constructor(){recognizers.push(this)}start(){}abort(){this.aborted=true;this.onerror?.({error:'aborted'});this.onend?.()}}};
 const {useCareVoice}=load('app/use-care-voice.ts',{react:{useState:value=>[value,()=>{}],useRef:value=>({current:value}),useEffect:fn=>effects.push(fn)}});
 const voice=useCareVoice(true,text=>transcripts.push(text));
 voice.toggleListening();const old=recognizers[0];
 voice.toggleListening();assert.equal(old.aborted,true);assert.equal(old.onresult,null);
 const latest=recognizers[1];voice.endConversation();
 assert.equal(latest.aborted,true);assert.equal(latest.onresult,null);assert.equal(latest.onerror,null);assert.equal(latest.onend,null);
 assert.equal(voice.session.current,1);assert.deepEqual(transcripts,[]);
 delete global.window;
});
test('Replies reuse gesture-unlocked audio and stop never closes its context',async()=>{
 const previous={window:global.window,Audio:global.Audio,fetch:global.fetch,raf:global.requestAnimationFrame,caf:global.cancelAnimationFrame};
 let contexts=0,players=0,sources=0,resumes=0,closes=0;const effects=[];
 class Player {constructor(){players++;this.onended=null;}setAttribute(){}pause(){}play(){if(this.src.startsWith('blob:'))setImmediate(()=>this.onended?.());return Promise.resolve()}}
 class Context {constructor(){contexts++;this.state='suspended';}resume(){resumes++;this.state='running';return Promise.resolve()}close(){closes++;this.state='closed';return Promise.resolve()}createAnalyser(){return {fftSize:0,frequencyBinCount:128,connect(){},disconnect(){},getByteFrequencyData(){}}}createMediaElementSource(){assert.equal(this.state,'running');sources++;return {connect(){},disconnect(){}}}}
 try{
 global.Audio=Player;global.window={AudioContext:Context};global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};global.fetch=async()=>({ok:true,blob:async()=>new Blob(['audio'],{type:'audio/wav'})});
 const {useCareVoice}=load('app/use-care-voice.ts',{react:{useState:value=>[value,()=>{}],useRef:value=>({current:value}),useEffect:fn=>effects.push(fn)}});
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
 const {useCareVoice}=load('app/use-care-voice.ts',{react:{useState:value=>[value,next=>values.push(next)],useRef:value=>({current:value}),useEffect(){}}});
 await useCareVoice(true,()=>{}).speak('Hello.');
 assert.ok(values.includes('Tap Play reply to enable Brittany’s audio.'));assert.ok(values.includes(true));
 }finally{global.window=previous.window;global.Audio=previous.Audio;global.fetch=previous.fetch;}
});
