'use client';

type BrittanyAvatarProps={speaking:boolean;listening:boolean;level:number;compact?:boolean};

// A still portrait accompanies the voice. Do not simulate lip sync by warping
// the photograph: that distorts facial features and can move the neck instead.
export function BrittanyAvatar({compact=false}:BrittanyAvatarProps){
 return <div className={'brittany-avatar-rig '+(compact?'compact':'')} aria-label={compact?undefined:'Brittany virtual receptionist portrait'} aria-hidden={compact?true:undefined}>
   <div className="brittany-face">
    <img className="brittany-base" src="/brand/ask-brittany.webp" alt="" draggable={false}/>
   </div>
  </div>;
}
