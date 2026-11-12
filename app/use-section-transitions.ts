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
      // Reserve a dark handoff: finish fading this scene BEFORE the next enters.
      // Pin spacing is essential here. Without it, the images overlap in the viewport.
      ScrollTrigger.create({trigger:scene,start:'bottom bottom',end:()=>'+='+innerHeight*.32,pin:true,pinSpacing:true,anticipatePin:1,invalidateOnRefresh:true});
      gsap.fromTo(scene,{'--film-leave':1},{'--film-leave':0,ease:'none',scrollTrigger:{trigger:scene,start:'bottom bottom',end:()=>'+='+innerHeight*.24,scrub:true,invalidateOnRefresh:true}});
      gsap.fromTo(next,{'--film-enter':0},{'--film-enter':1,ease:'none',scrollTrigger:{trigger:next,start:'top bottom',end:'top 60%',scrub:true,invalidateOnRefresh:true}});
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
