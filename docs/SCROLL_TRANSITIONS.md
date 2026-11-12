# Film transitions

The previous effect inset and rounded each service independently. Adjacent videos still met at a straight horizontal boundary.

The replacement uses a sequential fade through dark. GSAP holds the last viewport of the outgoing scene and reserves a 32vh handoff interval. The whole scene, including video and headings, fades completely out over the first 24vh. Only after that reserved interval can the next scene enter the viewport; it then fades in over 40vh. There is no feather mask, double exposure, camera push, or overlapping visible video. Reverse scrolling reverses the same sequence.

Applied to hero → story, all nine service scenes, and the final service → static team portrait. Long chapters remain in natural flow until their bottom reaches the viewport bottom. Mobile retains readable 16:9 service media and complete descriptions/actions. Native scrolling, browser touch momentum, anchors and keyboard navigation remain. Pause motion and reduced-motion remove every pin and fade. The header stays transparent. GSAP contexts and font/load refresh callbacks are cleaned up on unmount.

## Reference review

- https://studio.motionsites.ai/ and https://motionsites.ai/ — browsed design/section libraries; useful direction for media-led editorial scenes. No paid templates or code copied.
- https://recent.design/websites — website inspiration feed; Godly's requested URL redirected to Recent.
- https://land-book.com/changelog/motion-on-website-pages — motion previews accompanying complete website designs; homepage was unavailable to the research fetch (403).
- https://landdding.com/ — landing-page examples and health/medical categories.
- https://60fps.design/shots/filter/scroll — scroll interaction reference collection; direction for reversible, input-linked transitions.
- https://www.fontinlogo.com/ — typography reference, outside the current transition change.

The fade-through-dark sequence is an original implementation suited to this site's existing films, rather than a claim that any listed site uses this exact effect.

Implementation documentation: https://gsap.com/docs/v3/Plugins/ScrollTrigger/ and https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/ .

`/motion-review` provides a 390 × 844 same-origin iframe for preview layout checks. Production returns 404. This verifies a narrow browser viewport, not physical-device touch performance.
