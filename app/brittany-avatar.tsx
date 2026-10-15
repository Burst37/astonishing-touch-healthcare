'use client';
import {useEffect,useState} from 'react';

type BrittanyAvatarProps={speaking:boolean;listening:boolean;level:number;compact?:boolean};

export function BrittanyAvatar({speaking,listening,level,compact=false}:BrittanyAvatarProps){
 const [blink,setBlink]=useState(false);
 useEffect(()=>{let timer:number|undefined;let closeTimer:number|undefined;const schedule=()=>{timer=window.setTimeout(()=>{setBlink(true);closeTimer=window.setTimeout(()=>{setBlink(false);schedule()},120)},2600+Math.random()*2800)};schedule();return()=>{if(timer)clearTimeout(timer);if(closeTimer)clearTimeout(closeTimer)}},[]);
 const energy=Math.max(0,Math.min(1,level));
 const mouthY=speaking?Math.max(.12,energy):.08;
 const brow=speaking?Math.min(1,.18+energy*.8):(listening?.35:.08);
 return <div className={'brittany-avatar-rig '+(compact?'compact ':'')+(speaking?'speaking ':listening?'listening ':'idle ')+(blink?'blink':'')} style={{['--mouth-open' as string]:String(mouthY),['--voice-energy' as string]:String(energy),['--brow-lift' as string]:String(brow)}} aria-label={compact?undefined:"Animated Brittany virtual receptionist"} aria-hidden={compact?true:undefined}>
   <div className="brittany-face">
    <img src="/brand/ask-brittany.webp" alt="" draggable={false}/>
    <span className="brittany-brow brittany-brow-left"/>
    <span className="brittany-brow brittany-brow-right"/>
    <span className="brittany-eye-lid brittany-eye-left"/>
    <span className="brittany-eye-lid brittany-eye-right"/>
    <span className="brittany-mouth"><span className="brittany-mouth-inner"/></span>
   </div>
  </div>;
}
