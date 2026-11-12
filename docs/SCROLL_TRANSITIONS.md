# Film transitions

The previous effect inset and rounded each service independently. Adjacent videos still met at a straight horizontal boundary.

The replacement uses GSAP ScrollTrigger: the outgoing scene holds its last viewport while the next scene scrolls above it through a feathered transparency mask. The feather reduces to zero by the top of the viewport. The outgoing film gains a restrained push-in and darkens as it is covered. Scrolling backward reverses the effect. Long chapters remain in natural flow before the outgoing viewport holds.

Applied to hero → story, all nine service scenes, and the final service → static team portrait. Mobile keeps the readable 16:9 service media and complete descriptions/actions; feather depth is shorter. Native scrolling, browser touch momentum, anchors and keyboard navigation remain. No Lenis dependency or synthetic wheel handling. Pause motion and reduced-motion remove all pins and masks. GSAP contexts and font/load refresh callbacks are cleaned up on unmount.

## Reference review

- https://studio.motionsites.ai/ and https://motionsites.ai/ — browsed design/section libraries; useful direction for media-led editorial scenes. No paid templates or code copied.
- https://recent.design/websites — website inspiration feed; Godly's requested URL redirected to Recent.
- https://land-book.com/changelog/motion-on-website-pages — motion previews accompanying complete website designs; homepage was unavailable to the research fetch (403).
- https://landdding.com/ — landing-page examples and health/medical categories.
- https://60fps.design/shots/filter/scroll — scroll interaction reference collection; direction for reversible, input-linked transitions.
- https://www.fontinlogo.com/ — typography reference, outside the current transition change.

The overlap/dissolve is an original implementation suited to this site's existing films, rather than a claim that any listed site uses this exact effect.

Implementation documentation: https://gsap.com/docs/v3/Plugins/ScrollTrigger/ and https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/ .

`/motion-review` provides a 390 × 844 same-origin iframe for preview layout checks. Production returns 404. This verifies a narrow browser viewport, not physical-device touch performance.
