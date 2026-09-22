# QA ledger

Current status (2026-09-17): see the final entry below. Earlier entries are historical, including completed generation jobs and previous verification limitations.
Pending build/structural checks. Browser QA not explicitly requested; no visual scores or independent visual consensus claimed.
Video generation active. Two pending submissions hit provider concurrency cap; retry after current jobs complete.
Original website retrieved 2026-09-05: https://www.astonishingtouchhealthcare.org/
Chosen guidance: Cinematic Website Director V7 + modules 01–06, Caveman (internal output only), local SEO entity consistency (verified fields only).
Design-loop reviewed, not invoked: its mandatory interview/visual comparison is unnecessary for this already-directed build and no browser QA requested.
Screenshot-to-code ZIP reviewed: separate AI code generator requiring provider keys, not needed to implement this site directly.

## Technical review and fixes
Independent source reviewer: emergency short-circuit before AI, atomic request limits, complete pause control, content-driven chapter heights for text zoom, active chapter selection by center. All repaired. Follow-up found final chapter padding specificity; removed obsolete override. No remaining high/medium source findings from reviewer.
TypeScript passed after generating Cloudflare runtime types. ESLint has zero errors; expected native-img warning because supplied images are already optimized to WebP and sized explicitly.
Visual evidence: film contact sheet inspected; faces, uniforms and scene coherence retained in sampled frames. H3 delivered hero macro/medium/wide sequence. Section masters edited with restrained detail cuts. No browser visual QA performed or claimed.

All 11 H3 generations completed. Generation failures were submission-time concurrency rejections only; no duplicate successful jobs. Dedicated films mapped to each of nine services, plus hero and team. SQL migrations, inquiry insert, atomic rate counter smoke check passed using SQLite.
Final production build succeeded; TypeScript check passed. All 11 MP4 references exist; H.264, 16:9, 8s section clips and 12.2s hero. Web video payload about 17.5 MB total, loaded near viewport rather than eagerly. Hero about 3 MB. No performance benchmark score claimed. Both generated D1 migrations packaged.

Playback fix: removed data-saver coupling to global pause; added explicit silent inline autoplay, early buffering, retained elements, readiness retries and poster-to-video fade. No new video generation.

## 2026-09-16 cinematic completion
- Eight service films and the 12-second hero replaced using cinematic JSON direction and corrected source images. Approved medication film preserved. Team arm insert removed; park outing retained.
- Every active film has a unique SHA-256, H.264 encoding and no audio stream. Half-second contact sheets checked for actual service actions. Hero first/last decoded-frame mean absolute RGB difference: 0.94/255 at 160x90 after loop finishing.
- Narrow service layouts preserve full 16:9 action frames with rounded corners. Section transitions reduced to gentle scale/pan, edge reveal and dimming; pause and reduced-motion handling retained.
- TypeScript passes. Four existing component tests pass. The old Node-only rendered-HTML test cannot import cloudflare:workers. A local Wrangler smoke attempt also failed on this environment's network-interface enumeration; no browser or full hosted voice/calendar test is claimed.
- Public-domain sitemap added; organization logo path corrected; llms.txt expanded with per-service definitions. Private deployment remains noindex.
- External dependencies are documented in OPERATIONS.md: business scheduler, inquiry notifications and public-domain launch.

## 2026-09-17 finish pass
- Preserved all approved design, service media, logo, gallery, search pages, private audience and noindex configuration. No media generation or provider changes.
- Fixed urgent assistant routing: immediate-danger questions now return the emergency response before database, pricing, search or AI work. Regression cases cover mixed pricing/emergency questions and straight/curly apostrophes.
- Fixed microphone cancellation: detach recognition callbacks before aborting, retire prior recognition when restarting, and stop microphone capture before speech output. This prevents late recognition events after stop/close and overlapping capture during playback.
- Production runtime reports Gemini `gemini-3.8-flash`; speech remains ElevenLabs `eleven_turbo_v2_5`, voice `P7x743VjyZEOihNNygQ9`, speed 1.08. No secrets copied into source.
- Authenticated live endpoint checks passed: substantive AI comparison of respite/companionship; pricing referral without quotes; speech returned 47,691 bytes of audio/mpeg from ElevenLabs. Audio playback/listening quality was not verified.
- Live inquiry endpoint returned 201 with reference AT-1995F69D. Confirmed that reference in the deployed D1 inquiries table. The record is explicitly named “Website QA — TEST ONLY — no callback” and uses a fictional test number. No email or booking was sent. Inbox data persistence verified; owner-authenticated inbox UI not verified.
- All 12 active media files probed: no audio streams; hero 12 seconds; nine service films 8 seconds; retained team film 5.71 seconds. Existing category mappings checked. No claim of a new full-speed visual action review.
- Five focused tests passed (two receptionist lifecycle/routing regressions and three search-structure checks); TypeScript and production build passed.
- Supervised preview reported running, but access returned 502 / connection refused and the cloud-browser navigation did not complete. Desktop/mobile visual checks, autoplay/scroll/gallery interaction and real microphone conversation remain unverified in this environment. Do not mark full browser QA complete.
- Owner dependencies remain business booking URL, optional inquiry email destination/provider, and public launch/domain/search-console access. Private publishing does not enable indexing.

## 2026-09-17 requested visual refinement
- All nine service topics now share left-aligned placement, larger bold category labels and bold editorial headlines. Kept mobile full-frame service films.
- Unified short upward text reveals and added restrained scroll-linked copy movement; pause and reduced-motion overrides retained.
- Main buttons, service selections, voice controls and gallery arrows have raised neumorphic shading and inset pressed/selected states, with high-contrast borders and existing focus rings.
- Fine-pointer gallery hover adds a small image zoom, soft highlight and shadow within the existing spatial cards; it does not replace carousel transforms or mobile swipe controls.
- Existing browser-preview infrastructure limitation remains; no new browser visual verification claimed.

## 2026-09-17 first-screen correction
- User screenshot showed the previous button relief was too faint over the hero video. Replaced it with stronger bevels, light/dark shadows, recessed surrounds and inset active faces; kept contrast and focus outlines.
- Removed the header/footer logo tile and integrated a transparent-background edit of the supplied logo. Original JPEG retained. PNG alpha verified; CSS frames the visible wordmark without a white backing.
- Browser preview remains unavailable; source/build checks do not constitute screenshot verification.

## 2026-09-17 complete neumorphic control pass
- Applied one light soft-surface control system across all rendered buttons, action links, service selections, navigation choices, FAQ disclosures, gallery selectors, microphone/voice/chat controls, menu and close controls. Removed prior hard-rim CTA styling.
- Ask Brittany's portrait surround and label now share the raised surface; active controls have inset shadows. Preserved keyboard focus, disabled states and reduced-motion handling.
- Replaced the soft transparent logo with a clean high-resolution restoration from the original reference; removed glow/drop-shadow filters. Verified transparent alpha and adjusted framing for the full logo.
- Separated hero playback controls from the receptionist launcher at narrow widths and allowed gallery controls to wrap.
- Browser preview limitation remains; no full visual QA claimed.
