const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function load(file,deps={}){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>deps[id],module,module.exports);return module.exports}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function environment(permission){
 const saved=Object.fromEntries(['navigator','AudioContext','AudioWorkletNode','WebSocket','fetch'].map(k=>[k,Object.getOwnPropertyDescriptor(global,k)]));
 const sent=[],sockets=[],nodes=[],started=[],stopped=[],events=[];let tracksStopped=0,contextsClosed=0;
 const stream={getTracks:()=>[{stop(){tracksStopped++}}],getAudioTracks:()=>[{addEventListener(){}}]};
 Object.defineProperty(global,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:permission||(async()=>stream)}}});
 class Context{constructor(){this.currentTime=10;this.destination={};this.audioWorklet={addModule:async()=>{}}}resume(){return Promise.resolve()}close(){contextsClosed++;return Promise.resolve()}createMediaStreamSource(){return {connect(){},disconnect(){}}}createGain(){return {gain:{value:1},connect(){},disconnect(){}}}createBuffer(ch,n,rate){return {duration:n/rate,getChannelData:()=>new Float32Array(n)}}createBufferSource(){const source={connect(){},disconnect(){},start(t){started.push(t)},stop(){stopped.push(source)}};return source}}
 global.AudioContext=Context;global.AudioWorkletNode=class {constructor(){this.port={onmessage:null,close(){}};nodes.push(this)}connect(){}disconnect(){}};
 global.WebSocket=class {static OPEN=1;constructor(url){this.url=url;this.readyState=1;this.bufferedAmount=0;sockets.push(this)}send(v){sent.push(JSON.parse(v))}close(){this.readyState=3}};
 global.fetch=async()=>Response.json({token:'one-use-token',model:'gemini-3.8-live'});
 const {CareLiveVoice}=load('app/care-live-voice.ts');const voice=new CareLiveVoice(new Context(),{onState:s=>events.push(s),onTranscript:(...args)=>events.push(args),onError:m=>events.push(m)});
 return {voice,sent,sockets,nodes,started,stopped,events,stream,counts:()=>({tracksStopped,contextsClosed}),restore(){voice.close();for(const [k,d] of Object.entries(saved)){if(d)Object.defineProperty(global,k,d);else delete global[k]}}};
}
test('Live microphone streams without recording and waits for authenticated setup',async()=>{
 const e=environment();try{
 await e.voice.start();assert.match(e.sockets[0].url,/access_token=one-use-token/);e.sockets[0].onopen();assert.deepEqual(e.sent[0],{setup:{model:'models/gemini-3.8-live'}});
 e.nodes[0].port.onmessage({data:new ArrayBuffer(16)});assert.equal(e.sent.length,1);
 e.sockets[0].onmessage({data:JSON.stringify({setupComplete:{}})});await flush();
 e.nodes[0].port.onmessage({data:new ArrayBuffer(16)});assert.equal(e.sent[1].realtimeInput.audio.mimeType,'audio/pcm;rate=16000');assert.ok(e.voice.connected);
 e.voice.close();assert.equal(e.counts().tracksStopped,1);assert.equal(e.counts().contextsClosed,1);assert.equal(e.sockets[0].readyState,3);
 }finally{e.restore()}
});
test('Each audio chunk plays before turn completion and interruption clears every queued source',async()=>{
 const e=environment();try{
 await e.voice.start();const socket=e.sockets[0];socket.onmessage({data:JSON.stringify({setupComplete:{}})});await flush();
 const part={inlineData:{data:Buffer.alloc(4800).toString('base64'),mimeType:'audio/pcm;rate=24000'}};
 socket.onmessage({data:JSON.stringify({serverContent:{modelTurn:{parts:[part,part]},outputTranscription:{text:'Hello there.'}}})});await flush();
 assert.equal(e.started.length,2);assert.ok(e.started[1]>e.started[0]);assert.ok(e.events.includes('speaking'));assert.ok(e.events.some(v=>Array.isArray(v)&&v[0]==='assistant'&&v[1]==='Hello there.'));
 socket.onmessage({data:JSON.stringify({serverContent:{interrupted:true}})});await flush();assert.equal(e.stopped.length,2);assert.ok(e.voice.sendText('What are your hours?'));assert.equal(e.sent.at(-1).clientContent.turnComplete,true);
 e.voice.close();socket.onmessage({data:JSON.stringify({serverContent:{modelTurn:{parts:[part]}}})});await flush();assert.equal(e.started.length,2);
 }finally{e.restore()}
});
test('Ending while microphone permission is pending stops late tracks and never creates a socket',async()=>{
 let allow;const e=environment(()=>new Promise(resolve=>allow=resolve));try{const pending=e.voice.start();e.voice.close();allow(e.stream);await pending;assert.equal(e.counts().tracksStopped,1);assert.equal(e.sockets.length,0)}finally{e.restore()}
});
test('Live token locks model, custom identity, instructions and one-use expiry without exposing API key',async()=>{
 const previous={key:process.env.GEMINI_API_KEY,voice:process.env.GEMINI_TTS_VOICE,fetch:global.fetch};process.env.GEMINI_API_KEY='server-secret';process.env.GEMINI_TTS_VOICE='voice_test';let body,calls=0;
 try{
 global.fetch=async(url,options)=>{calls++;body=JSON.parse(options.body);assert.match(url,/auth_tokens$/);assert.equal(options.headers['x-goog-api-key'],'server-secret');return Response.json({name:'ephemeral-secret'})};
 const {POST}=load('app/api/live-token/route.ts',{'@/lib/rate-limit':{allowRequest:async()=>true},'@/app/care-knowledge':{brittanyInstructions:()=> 'Never quote prices.'}});
 const req=origin=>new Request('https://example.test/api/live-token',{method:'POST',headers:{origin}});
 assert.equal((await POST(req('https://other.test'))).status,403);assert.equal(calls,0);
 const response=await POST(req('https://example.test'));assert.deepEqual(await response.json(),{token:'ephemeral-secret',model:'gemini-3.8-live'});assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal(body.uses,1);assert.ok(!('fieldMask' in body));assert.equal(body.bidiGenerateContentSetup.generationConfig.speechConfig.voiceConfig.voice,'voice_test');assert.match(body.bidiGenerateContentSetup.systemInstruction.parts[0].text,/Never quote prices/);assert.ok(Date.parse(body.newSessionExpireTime)<Date.now()+61000);assert.ok(!JSON.stringify(body).includes('server-secret'));
 }finally{global.fetch=previous.fetch;for(const [k,v] of [['GEMINI_API_KEY',previous.key],['GEMINI_TTS_VOICE',previous.voice]]){if(v===undefined)delete process.env[k];else process.env[k]=v}}
});
