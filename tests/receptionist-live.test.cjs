const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function load(file,deps={}){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>id==='@/lib/care-plan'?load('lib/care-plan.ts'):deps[id],module,module.exports);return module.exports}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function environment(permission){
 const saved=Object.fromEntries(['navigator','AudioContext','AudioWorkletNode','WebSocket','fetch'].map(k=>[k,Object.getOwnPropertyDescriptor(global,k)]));
 const sent=[],sockets=[],nodes=[],started=[],stopped=[],events=[];let tracksStopped=0,contextsClosed=0;
 const stream={getTracks:()=>[{stop(){tracksStopped++}}],getAudioTracks:()=>[{addEventListener(){}}]};
 Object.defineProperty(global,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:permission||(async()=>stream)}}});
 class Context{constructor(options){if(options?.sampleRate)throw new DOMException('Device only supports its native sample rate','NotSupportedError');this.state='suspended';this.sampleRate=48000;this.currentTime=10;this.destination={};this.audioWorklet={addModule:async()=>{}}}resume(){this.state='running';return Promise.resolve()}close(){contextsClosed++;return Promise.resolve()}createMediaStreamSource(){return {connect(){},disconnect(){}}}createGain(){return {gain:{value:1},connect(){},disconnect(){}}}createBuffer(ch,n,rate){return {duration:n/rate,getChannelData:()=>new Float32Array(n)}}createBufferSource(){const source={connect(){},disconnect(){},start(t){started.push(t)},stop(){stopped.push(source)}};return source}}
 global.AudioContext=Context;global.AudioWorkletNode=class {constructor(){this.port={onmessage:null,close(){}};nodes.push(this)}connect(){}disconnect(){}};
 global.WebSocket=class {static OPEN=1;constructor(url){this.url=url;this.readyState=1;this.bufferedAmount=0;sockets.push(this)}send(v){sent.push(JSON.parse(v))}close(){this.readyState=3}};
 global.fetch=async()=>Response.json({token:'one-use-token',model:'gemini-3.8-live'});
 const {CareLiveVoice}=load('app/care-live-voice.ts');const output=new Context();const voice=new CareLiveVoice(output,{onState:s=>events.push(s),onTranscript:(...args)=>events.push(args),onError:m=>events.push(m),onAction:action=>events.push(['action',action])});
 return {voice,output,sent,sockets,nodes,started,stopped,events,stream,counts:()=>({tracksStopped,contextsClosed}),restore(){voice.close();for(const [k,d] of Object.entries(saved)){if(d)Object.defineProperty(global,k,d);else delete global[k]}}};
}
test('Live microphone streams without recording and waits for authenticated setup',async()=>{
 const e=environment();try{
 await e.voice.start();assert.match(e.sockets[0].url,/access_token=one-use-token/);e.sockets[0].onopen();assert.deepEqual(e.sent[0],{setup:{model:'models/gemini-3.8-live'}});
 e.nodes[0].port.onmessage({data:new ArrayBuffer(16)});assert.equal(e.sent.length,1);
 e.sockets[0].onmessage({data:JSON.stringify({setupComplete:{}})});await flush();
 e.nodes[0].port.onmessage({data:new ArrayBuffer(16)});assert.equal(e.sent[1].realtimeInput.audio.mimeType,'audio/pcm;rate=16000');assert.ok(e.voice.connected);
 e.voice.close();assert.equal(e.counts().tracksStopped,1);assert.equal(e.counts().contextsClosed,0);assert.equal(e.sockets[0].readyState,3);
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
test('Live token uses a compatible prebuilt voice separately from saved TTS identity',async()=>{
 const previous={key:process.env.GEMINI_API_KEY,voice:process.env.GEMINI_TTS_VOICE,liveVoice:process.env.GEMINI_LIVE_VOICE,fetch:global.fetch};process.env.GEMINI_API_KEY='server-secret';process.env.GEMINI_TTS_VOICE='voice_test';delete process.env.GEMINI_LIVE_VOICE;let body,calls=0;
 try{
 global.fetch=async(url,options)=>{calls++;body=JSON.parse(options.body);assert.match(url,/auth_tokens$/);assert.equal(options.headers['x-goog-api-key'],'server-secret');return Response.json({name:'ephemeral-secret'})};
 const {POST}=load('app/api/live-token/route.ts',{'@/lib/rate-limit':{allowRequest:async()=>true},'@/app/care-knowledge':{brittanyLiveInstructions:()=> 'Never quote prices.'}});
 const req=origin=>new Request('https://example.test/api/live-token',{method:'POST',headers:{origin}});
 assert.equal((await POST(req('https://other.test'))).status,403);assert.equal(calls,0);
 const response=await POST(req('https://example.test'));assert.deepEqual(await response.json(),{token:'ephemeral-secret',model:'gemini-3.8-live'});assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal(body.uses,1);assert.ok(!('fieldMask' in body));assert.deepEqual(body.bidiGenerateContentSetup.generationConfig.speechConfig.voiceConfig,{prebuiltVoiceConfig:{voiceName:'Kore'}});assert.match(body.bidiGenerateContentSetup.systemInstruction.parts[0].text,/Never quote prices/);assert.ok(Date.parse(body.newSessionExpireTime)<Date.now()+61000);assert.ok(!JSON.stringify(body).includes('server-secret'));
 process.env.GEMINI_LIVE_VOICE='voice_saved_tts';assert.equal((await POST(req('https://example.test'))).status,200);assert.equal(body.bidiGenerateContentSetup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName,'Kore');
 process.env.GEMINI_LIVE_VOICE='Aoede';assert.equal((await POST(req('https://example.test'))).status,200);assert.equal(body.bidiGenerateContentSetup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName,'Aoede');
 }finally{global.fetch=previous.fetch;for(const [k,v] of [['GEMINI_API_KEY',previous.key],['GEMINI_TTS_VOICE',previous.voice],['GEMINI_LIVE_VOICE',previous.liveVoice]]){if(v===undefined)delete process.env[k];else process.env[k]=v}}
});

test('Native 48 kHz microphone streams 20ms 16 kHz PCM packets',()=>{
 const vm=require('node:vm');const packets=[];let Processor;
 const context={sampleRate:48000,AudioWorkletProcessor:class {constructor(){this.port={postMessage:buffer=>packets.push(buffer)}}},registerProcessor:(_name,type)=>Processor=type};
 vm.runInNewContext(fs.readFileSync('public/worklets/care-pcm.js','utf8'),context);
 const processor=new Processor();
 for(let block=0;block<48;block++)processor.process([[new Float32Array(128).fill(.5)]]);
 assert.equal(packets.length,6);assert.equal(packets[0].byteLength,640);
 const samples=new Int16Array(packets[0]);assert.equal(samples.length,320);assert.ok(samples.every(value=>Math.abs(value-16383)<=1));
});
test('Busy microphone reports phone call contention and releases audio resources',async()=>{
 const e=environment(async()=>{throw new DOMException('Device in use','NotReadableError')});
 try{await e.voice.start();assert.ok(e.events.some(value=>typeof value==='string'&&value.includes('End any phone call')));assert.equal(e.sockets.length,0);assert.equal(e.counts().contextsClosed,0);assert.equal(e.voice.connected,false)}finally{e.restore()}
});

test('Authentication starts while microphone permission is pending',async()=>{
 let allow,calls=0;const e=environment(()=>new Promise(resolve=>allow=resolve));const original=global.fetch;
 try{global.fetch=async()=>{calls++;return Response.json({token:'one-use-token',model:'gemini-3.8-live'})};const pending=e.voice.start();assert.equal(calls,1);assert.equal(e.sockets.length,0);allow(e.stream);await pending;assert.equal(e.sockets.length,1)}finally{global.fetch=original;e.restore()}
});
test('Switching from typed chat carries recent context before microphone frames',async()=>{
 const e=environment();try{e.voice.history=[{role:'user',content:'I am asking about laundry.'},{role:'assistant',content:'We can discuss laundry assistance.'}];await e.voice.start();e.sockets[0].onmessage({data:JSON.stringify({setupComplete:{}})});await flush();assert.equal(e.sent[0].clientContent.turnComplete,false);assert.equal(e.sent[0].clientContent.turns[0].parts[0].text,'I am asking about laundry.');assert.equal(e.sent[0].clientContent.turns[1].role,'model');e.nodes[0].port.onmessage({data:new ArrayBuffer(640)});assert.ok(e.sent[1].realtimeInput)}finally{e.restore()}
});


test('Microphone permission cannot leave the reply context suspended',async()=>{
 let e;e=environment(async()=>{e.output.state='suspended';return e.stream});
 try{await e.voice.start();assert.equal(e.output.state,'running')}finally{e.restore()}
});


test('Returned PCM resumes browser audio before scheduling a spoken reply',async()=>{
 const e=environment();try{await e.voice.start();const socket=e.sockets[0];socket.onmessage({data:JSON.stringify({setupComplete:{}})});await flush();e.output.state='suspended';socket.onmessage({data:JSON.stringify({serverContent:{modelTurn:{parts:[{inlineData:{data:Buffer.alloc(4800).toString('base64'),mimeType:'audio/pcm;rate=24000'}}]}}})});await flush();assert.equal(e.output.state,'running');assert.equal(e.started.length,1)}finally{e.restore()}
});
test('Interruption discards reply chunks waiting for audio to resume',async()=>{
 const e=environment();try{await e.voice.start();const socket=e.sockets[0];socket.onmessage({data:JSON.stringify({setupComplete:{}})});await flush();let resume;e.output.state='suspended';e.output.resume=()=>new Promise(resolve=>resume=()=>{e.output.state='running';resolve()});socket.onmessage({data:JSON.stringify({serverContent:{modelTurn:{parts:[{inlineData:{data:Buffer.alloc(4800).toString('base64'),mimeType:'audio/pcm;rate=24000'}}]}}})});await flush();socket.onmessage({data:JSON.stringify({serverContent:{interrupted:true}})});resume();await flush();assert.equal(e.started.length,0)}finally{e.restore()}
});
test('An authenticated session with no capture packets reports the microphone failure',async()=>{
 const e=environment();const original=global.setTimeout;const timers=[];try{await e.voice.start();global.setTimeout=(fn,ms)=>{timers.push({fn,ms});return 123};e.sockets[0].onmessage({data:JSON.stringify({setupComplete:{}})});await flush();timers.find(x=>x.ms===3000).fn();assert.ok(e.events.some(x=>typeof x==='string'&&x.includes('not sending microphone audio')));assert.equal(e.voice.connected,false)}finally{global.setTimeout=original;e.restore()}
});
test('A new voice conversation can greet without fabricating a visitor transcript',async()=>{
 const e=environment();try{await e.voice.start();e.sockets[0].onmessage({data:JSON.stringify({setupComplete:{}})});await flush();e.voice.greet();assert.equal(e.sent.at(-1).clientContent.turns[0].parts[0].text,'Hello.');assert.equal(e.sent.at(-1).clientContent.turnComplete,true);assert.equal(e.events.some(x=>Array.isArray(x)&&x[0]==='user'),false)}finally{e.restore()}
});

test('Live care action opens the requested review card without claiming a completed booking',async()=>{const e=environment();try{await e.voice.start();e.sockets[0].onmessage({data:JSON.stringify({setupComplete:{}})});await flush();e.sockets[0].onmessage({data:JSON.stringify({toolCall:{functionCalls:[{id:'action-1',name:'show_care_action',args:{action:'schedule_visit'}}]}})});await flush();assert.ok(e.events.some(v=>Array.isArray(v)&&v[0]==='action'&&v[1]==='schedule_visit'));const result=e.sent.at(-1).toolResponse.functionResponses[0].response;assert.equal(result.shown,true);assert.match(result.note,/No call, email, inquiry submission or appointment has been completed/)}finally{e.restore()}});


test('Delayed microphone permission refreshes the short-lived credential before opening a socket',async()=>{
 let allow,calls=0,clock=100000;const originalNow=Date.now;const e=environment(()=>new Promise(resolve=>allow=resolve));
 try{Date.now=()=>clock;global.fetch=async()=>Response.json({token:'credential-'+(++calls),model:'gemini-3.8-live'});const pending=e.voice.start();await flush();clock+=65000;allow(e.stream);await pending;assert.equal(calls,2);assert.equal(e.sockets.length,1);assert.match(e.sockets[0].url,/access_token=credential-2/)}finally{Date.now=originalNow;e.restore()}
});
test('Cancelling while a stale credential refreshes never opens a late voice socket',async()=>{
 let allow,refresh,calls=0,clock=100000;const originalNow=Date.now;const e=environment(()=>new Promise(resolve=>allow=resolve));
 try{Date.now=()=>clock;global.fetch=async()=>++calls===1?Response.json({token:'old',model:'gemini-3.8-live'}):new Promise(resolve=>refresh=resolve);const pending=e.voice.start();await flush();clock+=65000;allow(e.stream);await flush();assert.equal(calls,2);e.voice.close();refresh(Response.json({token:'new',model:'gemini-3.8-live'}));await pending;assert.equal(e.sockets.length,0);assert.equal(e.counts().tracksStopped,1)}finally{Date.now=originalNow;e.restore()}
});

test('Live business and current-information tools return source cards and requested directions without a voice restart',async()=>{
 const e=environment();try{const references=[];e.voice.callbacks.onReference=r=>references.push(r);await e.voice.start();e.sockets[0].onmessage({data:JSON.stringify({setupComplete:{}})});await flush();const urls=[];global.fetch=async(url,options)=>{urls.push([url,JSON.parse(options.body)]);return Response.json(url==='/api/business-information'?{reply:'Published business facts',knowledge:[{content:'Original company story'}],sources:[{url:'https://www.astonishingtouchhealthcare.org/about',title:'Company story'}]}:{reply:'Current checked answer',directionsUrl:'https://www.google.com/maps/dir/?api=1&destination=Forest%20Park'})};for(const name of ['lookup_business_information','lookup_current_information']){e.sockets[0].onmessage({data:JSON.stringify({toolCall:{functionCalls:[{id:name,name,args:{query:'Relevant public question'}}]}})});await flush()}assert.equal(urls[0][0],'/api/business-information');assert.equal(urls[0][1].query,'Relevant public question');assert.equal(urls[1][0],'/api/assistant');assert.equal(references.length,2);assert.match(references[1].directionsUrl,/Forest/);assert.equal(e.sent.at(-1).toolResponse.functionResponses[0].response.reply,'Current checked answer');assert(e.voice.connected)}finally{e.restore()}
});
