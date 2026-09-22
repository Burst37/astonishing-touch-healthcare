'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Pause,Play} from 'lucide-react';
const moments=[
 {id:'company',title:'Good company',line:'A shared memory. A brighter day.',image:'/images/gallery/moment-0.webp',alt:'Caregiver and older woman laughing over a photo album',href:'#companionship'},
 {id:'park',title:'Fresh air & friendship',line:'More moments out in the world.',image:'/images/gallery/moment-3.webp',alt:'Caregivers and older adults enjoying conversation in a leafy park',href:'#contact'},
 {id:'meals',title:'Around the kitchen',line:'Good food. Better company.',image:'/images/gallery/moment-1.webp',alt:'Caregiver and older man preparing vegetables together',href:'#meal-preparation'},
 {id:'cards',title:'Game afternoon',line:'A little friendly competition.',image:'/images/gallery/moment-4.webp',alt:'Two caregivers and four older adults enjoying a card game',href:'#companionship'},
 {id:'respite',title:'Time to recharge',line:'Peace of mind for the whole family.',image:'/images/respite-care-at-home.webp',alt:'Caregiver supporting an older woman while her family member leaves home',href:'#respite-care'},
 {id:'garden',title:'Together is better',line:'Room for joy. Time for connection.',image:'/images/gallery/moment-5.webp',alt:'Caregivers and older adults sharing a garden gathering with flowers and refreshments',href:'#contact'},
 {id:'personal',title:'Your independence',line:'Support that starts with respect.',image:'/images/service-personal-care.webp',alt:'Caregiver helping an older man put on a cardigan',href:'#personal-care'},
 {id:'welcome',title:'A familiar welcome',line:'A personal touch at your door.',image:'/images/home-visit-errands-support.webp',alt:'Astonishing Touch caregiver greeting an older woman at her front door',href:'#errands'},
];
export function CareGallery({paused=false}:{paused?:boolean}){
 const stage=useRef<HTMLDivElement>(null),cards=useRef<(HTMLElement|null)[]>([]),cursor=useRef(0),target=useRef(0),drag=useRef<{x:number,position:number}|null>(null),hover=useRef(false),focus=useRef(false),visible=useRef(false),lastActive=useRef(0),moved=useRef(false);
 const [active,setActive]=useState(0),[playing,setPlaying]=useState(true);
 const count=moments.length;
 useEffect(()=>{
  const el=stage.current;if(!el)return;let frame=0,last=0;
  const observer=new IntersectionObserver(([entry])=>{visible.current=entry.isIntersecting},{threshold:.1});observer.observe(el);
  const tick=(time:number)=>{
   const dt=Math.min((time-last)/1000||0,.05);last=time;
   const reduced=paused||matchMedia('(prefers-reduced-motion: reduce)').matches;
   if(visible.current&&!document.hidden){
    if(playing&&!reduced&&!hover.current&&!focus.current&&!drag.current)target.current+=dt*.14;
    cursor.current=reduced?target.current:cursor.current+(target.current-cursor.current)*Math.min(1,dt*9);
    const current=((Math.round(cursor.current)%count)+count)%count;
    if(current!==lastActive.current){lastActive.current=current;setActive(current)}
    const narrow=el.clientWidth<650,spacing=el.clientWidth*(narrow?.78:.46);
    cards.current.forEach((card,i)=>{if(!card)return;const distance=((i-cursor.current+count*100+count/2)%count)-count/2,abs=Math.abs(distance);card.style.transform=`translate(-50%,-50%) translate3d(${distance*spacing}px,${Math.min(abs,2)*24}px,${-Math.min(abs,3)*190}px) rotateY(${-distance*(reduced?0:20)}deg) rotateZ(${distance*(reduced?0:2.4)}deg) scale(${1-Math.min(abs,3)*.07})`;card.style.opacity=String(Math.max(0,1-Math.max(0,abs-1.05)*1.1));card.style.zIndex=String(20-Math.round(abs*5));card.style.visibility=abs>2.1?'hidden':'visible';card.style.setProperty('--image-shift',`${distance*-14}px`);});
   }
   frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);observer.disconnect()};
 },[count,paused,playing]);
 function select(i:number){setPlaying(false);const current=target.current;const delta=((i-current+count*100+count/2)%count)-count/2;target.current=current+delta}
 function step(direction:number){setPlaying(false);target.current=Math.round(target.current)+direction}
 const item=moments[active];
 return <section className="care-gallery gallery-showcase" id="gallery" aria-label="Care moments gallery"><div className="gallery-heading section-pad" data-reveal="left"><p className="eyebrow">LIFE, WITH A LITTLE MORE SUPPORT</p><h2>Life happens.<br/><em>Let’s be part of it.</em></h2><p>Good company. Shared adventures. A little more joy.</p></div><div className="gallery-theatre"><div className="gallery-aura" style={{backgroundImage:`url(${item.image})`}} aria-hidden="true"/><div className="gallery-orbit" ref={stage} role="region" aria-roledescription="carousel" aria-label="Care moments. Swipe or use the arrow buttons." tabIndex={0} onMouseEnter={()=>{hover.current=true}} onMouseLeave={()=>{hover.current=false}} onFocusCapture={()=>{focus.current=true}} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))focus.current=false}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1)}if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}}} onPointerDown={e=>{if((e.target as HTMLElement).closest('a,button'))return;drag.current={x:e.clientX,position:target.current};moved.current=false;setPlaying(false);e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!drag.current)return;const change=e.clientX-drag.current.x;if(Math.abs(change)>8)moved.current=true;target.current=drag.current.position-change/(e.currentTarget.clientWidth*.55)}} onPointerUp={()=>{drag.current=null;target.current=Math.round(target.current)}} onPointerCancel={()=>{drag.current=null;target.current=Math.round(target.current)}}>{moments.map((s,i)=><article key={s.id} ref={el=>{cards.current[i]=el}} className={'orbit-card '+(i===active?'orbit-active':'')} role="group" aria-roledescription="slide" aria-label={`${i+1} of ${count}: ${s.title}`} onClick={()=>{if(!moved.current)select(i)}}><img src={s.image} alt={s.alt} draggable={false} loading="lazy" width={1800} height={1005}/><div className="orbit-card-gloss"/><span className="orbit-card-label">{s.title}</span></article>)}</div><div className="gallery-caption" aria-live={playing?'off':'polite'}><p className="eyebrow">{String(active+1).padStart(2,'0')} / MOMENTS THAT MATTER</p><h3 key={item.id}>{item.line}</h3><a className="text-link" href={item.href}>Explore care with us <ArrowUpRight size={18}/></a></div></div><div className="gallery-controls orbit-controls"><button className="gallery-play" aria-label={playing&&!paused?'Pause gallery motion':'Play gallery motion'} aria-pressed={playing&&!paused} disabled={paused} onClick={()=>setPlaying(v=>!v)}>{playing&&!paused?<Pause size={18}/>:<Play size={18}/>}</button><div className="gallery-dots">{moments.map((s,i)=><button key={s.id} aria-label={'Show '+s.title} aria-current={i===active?'true':undefined} onClick={()=>select(i)}/>)}</div><div className="gallery-arrows"><button aria-label="Previous gallery image" onClick={()=>step(-1)}><ArrowLeft/></button><button aria-label="Next gallery image" onClick={()=>step(1)}><ArrowRight/></button></div></div><p className="gallery-note">Illustrative care moments. Ask our team about support and activities available for your care plan.</p></section>
}
