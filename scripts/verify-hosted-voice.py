"""Synthetic two-turn API probe. No user microphone, credentials or recordings in output."""
import array,base64,io,json,sys,threading,time,urllib.request,wave
from websockets.sync.client import connect
base=sys.argv[1].rstrip('/')
def post(path,body):
 req=urllib.request.Request(base+path,data=json.dumps(body).encode(),headers={'Origin':base,'Content-Type':'application/json'},method='POST')
 with urllib.request.urlopen(req,timeout=35) as response:return response.read()
def speech(text):
 raw=post('/api/speech',{'text':text})
 with wave.open(io.BytesIO(raw),'rb') as wav:
  if wav.getnchannels()!=1 or wav.getsampwidth()!=2:raise RuntimeError('Expected mono PCM16 synthetic input')
  rate=wav.getframerate();samples=array.array('h',wav.readframes(wav.getnframes()))
  if sys.byteorder!='little':samples.byteswap()
 out=array.array('h');scale=rate/16000
 for n in range(int(len(samples)/scale)):
  position=n*scale;i=int(position);fraction=position-i
  out.append(round(samples[i]*(1-fraction)+samples[min(i+1,len(samples)-1)]*fraction))
 if sys.byteorder!='little':out.byteswap()
 return out.tobytes()
questions=['What are your office hours?','And what about weekends?']
audios=[speech(q) for q in questions]
token=json.loads(post('/api/live-token',{}));url='wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token='+urllib.parse.quote(token['token'])
setup=threading.Event();done=threading.Event();state={'first':None,'transcript':'','bytes':0,'error':None};rows=[]
with connect(url,open_timeout=25,close_timeout=3,max_size=4000000) as socket:
 def receive():
  try:
   for raw in socket:
    message=json.loads(raw)
    if 'setupComplete' in message:setup.set()
    if 'error' in message:state['error']='Provider rejected session';done.set();setup.set()
    content=message.get('serverContent',{})
    state['transcript']+=content.get('outputTranscription',{}).get('text','')
    for part in content.get('modelTurn',{}).get('parts',[]):
     audio=part.get('inlineData',{})
     if audio.get('mimeType','').startswith('audio/pcm'):
      if state['first'] is None:state['first']=time.perf_counter()
      state['bytes']+=len(base64.b64decode(audio['data']))
    if content.get('turnComplete'):done.set()
  except Exception as error:
   state['error']=type(error).__name__;setup.set();done.set()
 worker=threading.Thread(target=receive,daemon=True);worker.start();start=time.perf_counter()
 socket.send(json.dumps({'setup':{'model':'models/'+token['model']}}))
 if not setup.wait(25) or state['error']:raise RuntimeError('Live setup did not complete: '+str(state['error']))
 setup_ms=round((time.perf_counter()-start)*1000)
 for question,audio in zip(questions,audios):
  state.update(first=None,transcript='',bytes=0,error=None);done.clear()
  for i in range(0,len(audio),640):
   socket.send(json.dumps({'realtimeInput':{'audio':{'data':base64.b64encode(audio[i:i+640]).decode(),'mimeType':'audio/pcm;rate=16000'}}}));time.sleep(.02)
  ended=time.perf_counter();socket.send(json.dumps({'realtimeInput':{'audioStreamEnd':True}}))
  if not done.wait(30) or state['error']:raise RuntimeError('Live response did not complete: '+str(state['error']))
  rows.append({'syntheticQuestion':question,'firstAudioAfterInputMs':round((state['first']-ended)*1000) if state['first'] else None,'outputAudioBytes':state['bytes'],'reply':state['transcript']})
  print('Completed synthetic turn '+str(len(rows)),file=sys.stderr,flush=True)
 socket.close();worker.join(timeout=2)
print(json.dumps({'scope':'Synthetic streamed API test; excludes physical phone microphone and speaker playback','setupMs':setup_ms,'turns':rows},indent=2))
