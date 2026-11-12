'use client';
import {useEffect} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
export function useSectionTransitions(paused:boolean){
 useEffect(()=>{
  if(paused)return;
  gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   const root=document.documentElement;
   root.classList.add('film-transitions');
   const chapters=Array.from(document.querySelectorAll<HTMLElement>('.service-chapter,.team-feature'));
   const hero=document.querySelector<HTMLElement>('.hero');
   const story=document.querySelector<HTMLElement>('.promise-scene');
   const groups=[...(hero&&story?[[hero,story]]:[]),chapters];
   const context=gsap.context(()=>{
    for(const scenes of groups){
     scenes.forEach((scene,index)=>{
      gsap.set(scene,{zIndex:index+1});
      const next=scenes[index+1];
      if(!next)return;
      // Hold only the outgoing scene's last viewport; longer text stays scrollable.
      ScrollTrigger.create({trigger:scene,start:'bottom bottom',endTrigger:next,end:'top top',pin:true,pinSpacing:false,anticipatePin:1,invalidateOnRefresh:true});
      const mobile=matchMedia('(max-width: 600px)').matches;
      gsap.fromTo(next,{'--film-feather':mobile?'100px':'220px'},{'--film-feather':'0px',ease:'none',scrollTrigger:{trigger:next,start:'top bottom',end:'top top',scrub:true,invalidateOnRefresh:true}});
      const picture=scene.querySelector<HTMLElement>('.chapter-image .film,.hero-film,.promise-scene>.film');
      if(picture)gsap.to(picture,{scale:mobile?1.015:1.045,yPercent:-2,ease:'none',scrollTrigger:{trigger:next,start:'top bottom',end:'top top',scrub:true,invalidateOnRefresh:true}});
      gsap.fromTo(scene,{'--film-dim':0},{'--film-dim':.32,ease:'none',scrollTrigger:{trigger:next,start:'top bottom',end:'top top',scrub:true}});
     });
    }
   });
   let alive=true;
   void document.fonts.ready.then(()=>{if(alive)ScrollTrigger.refresh()});
   const refresh=()=>ScrollTrigger.refresh();
   addEventListener('load',refresh,{once:true});
   return()=>{alive=false;removeEventListener('load',refresh);context.revert();root.classList.remove('film-transitions')};
  });
  return()=>media.revert();
 },[paused]);
}
