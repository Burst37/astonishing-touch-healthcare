'use client';
import {useEffect} from 'react';
export function useSectionTransitions(paused:boolean){
 useEffect(()=>{
  const sections=Array.from(document.querySelectorAll<HTMLElement>('.service-chapter,.team-feature,.intro,.next-step,.faq-section,.contact-section'));
  let frame=0;const clamp=(n:number)=>Math.min(1,Math.max(0,n));
  const update=()=>{frame=0;const h=innerHeight;for(const el of sections){const rect=el.getBoundingClientRect();if(rect.bottom<0||rect.top>h)continue;const entrance=paused?1:clamp((h-rect.top)/(h*.65));const exit=paused?0:clamp(-rect.top/Math.max(rect.height,h));const edge=1-entrance;el.style.setProperty('--scene-in',String(entrance));el.style.setProperty('--scene-edge',String(edge));el.style.setProperty('--scene-radius',`${edge*32}px`);el.style.setProperty('--scene-inset',`${edge*1.6}%`);el.style.setProperty('--scene-scale',String(1+edge*.045+exit*.02));el.style.setProperty('--scene-pan',`${paused?0:exit*-18}px`);el.style.setProperty('--scene-dim',String(exit*.14));el.style.setProperty('--scene-copy-shift',`${paused?0:edge*18-exit*12}px`);}};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};schedule();addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);document.documentElement.classList.add('scene-transitions');
  return()=>{cancelAnimationFrame(frame);removeEventListener('scroll',schedule);removeEventListener('resize',schedule);document.documentElement.classList.remove('scene-transitions')};
 },[paused]);
}
