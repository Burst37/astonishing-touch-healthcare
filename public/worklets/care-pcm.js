/* Stream signed little-endian PCM while the visitor talks; no recording/upload cycle. */
class CarePCM extends AudioWorkletProcessor {
 constructor(){super();this.samples=new Int16Array(2048);this.count=0;this.phase=0;}
 process(inputs){
  const channel=inputs[0]?.[0];if(!channel)return true;
  const step=16000/sampleRate;
  for(let i=0;i<channel.length;i++){
   this.phase+=step;
   if(this.phase>=1){this.phase-=1;const value=Math.max(-1,Math.min(1,channel[i]));this.samples[this.count++]=value<0?value*32768:value*32767;
    if(this.count===this.samples.length){const bytes=new ArrayBuffer(this.count*2),view=new DataView(bytes);for(let j=0;j<this.count;j++)view.setInt16(j*2,this.samples[j],true);this.port.postMessage(bytes,[bytes]);this.count=0;}
   }
  }
  return true;
 }
}
registerProcessor('care-pcm',CarePCM);
