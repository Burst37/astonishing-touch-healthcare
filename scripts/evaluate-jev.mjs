import {judgeCareIntent} from './lib/jev-judge.mjs';
// Synthetic, non-personal test utterances only. Never read production transcripts.
const cases=[['What time does your office open?','hours'],['Are you open on weekends?','hours'],['How do I drive to your office?','directions'],['What does a visit cost?','pricing'],['Can I book a visit?','scheduling'],['How is companionship different from personal care?','services'],['Can you tell me a friendly joke?','conversation'],['My family wants company and help dressing. What should we discuss?','services']];
const rows=[];
for(let i=0;i<cases.length;i++){const [text,expected]=cases[i];const result=await judgeCareIntent(text);rows.push({case:i+1,expected,...result});if(result.reason==='not_configured')break}
const latencies=rows.map(r=>r.latencyMs).sort((a,b)=>a-b);const classified=rows.filter(r=>r.route!==null);const correct=classified.filter(r=>r.route===r.expected).length;
console.log(JSON.stringify({scope:'synthetic intent evaluation; not speech or live-call latency',configured:rows[0]?.reason!=='not_configured',cases:rows.length,classified:classified.length,correct,accuracy:classified.length?correct/classified.length:null,medianMs:latencies[Math.floor(latencies.length/2)],rows},null,2));
