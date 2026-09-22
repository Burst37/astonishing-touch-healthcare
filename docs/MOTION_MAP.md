# Motion map — level 3 ceiling
Hero: actual H3 film, muted/inline, 12s. Poster immediately visible. Pause toggle; reduced motion: poster by default, explicit play allowed.
Services: sticky chapter index desktop; current chapter tracked with IntersectionObserver; no pinning on mobile. Films buffer one viewport ahead and retain their elements for reverse scroll, play only when visible, pause offscreen and hidden tab. 8s loops. Poster fallback on error.
Section headings: one-time clip reveal, 700ms ease-out; not every paragraph. Photos: bounded vertical translate <=22px desktop, no mobile/reduced motion transforms. Native scroll.
No animation may hide essential content without JavaScript.

User steering: full-screen service sections. Alternating text entrances from left/right, retriggered on both forward and reverse scroll. Desktop 65px, mobile 26px, ~950ms ease-out; stagger labels/headline/body/CTA. IntersectionObserver toggles visible state at 20% viewport intersection. Reduced motion: all copy static and visible. Films reframed 1.055→1 with visible entry; native scroll remains free. Compact service chapter navigation sticky below main header.

Autoplay fix: explicit muted inline autoPlay plus DOM mute flags before play. Start at 12% visible; retry on decoded-media readiness, tab return and user gestures. Data-saving no longer silently selects global Pause; operating-system reduced-motion remains respected. Offscreen clips pause, next clip buffers automatically, playing frames fade over poster.
