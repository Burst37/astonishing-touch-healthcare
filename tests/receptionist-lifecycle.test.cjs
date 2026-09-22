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
