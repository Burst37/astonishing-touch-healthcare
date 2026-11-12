# Astonishing Touch — voice and answer-search upgrade

Implementation date: November 12, 2026. This extends the existing repair branch rather than rebuilding the site.

## Search work that goes beyond a keyword list

The earlier competitor research was a relevance baseline. Three competitor homepages were rechecked on November 12: Visiting Angels Creve Coeur, AccuCare and Cooperative Home Care. They already expose service categories, decision support and company evidence. Their overall SEO/AEO maturity was not scored; a homepage sample cannot prove their full sites are underoptimized.

| Observed competitor evidence | Work added here | What remains to establish an advantage |
| --- | --- | --- |
| Visiting Angels links companion/personal/respite care, costs, FAQs, process and local coverage | A visible comparison table and a full companion/personal/respite guide, with reciprocal links to relevant service pages | Real-domain indexing and measured query performance |
| AccuCare links service pages, care process, FAQs, caregiver information and company history | A practical first-conversation checklist; original founder/story retained | Genuine agency-specific policies, staff evidence and permitted customer reviews |
| Cooperative Home Care exposes funding, services, locations and family resources | A clear nonmedical versus clinical-care guide, without borrowing their coverage or clinical-service claims | Confirmed funding and actual coverage facts from the agency |

New public resources:
- `/care-guides`: a server-rendered educational hub.
- `/care-guides/companion-care-vs-personal-care`: a useful service comparison and planning questions.
- `/care-guides/first-home-care-conversation-checklist`: a family preparation checklist.
- `/care-guides/nonmedical-home-care-vs-home-health`: clear task boundaries and official further reading.

Each guide has a unique title, description and canonical, a concise answer in initial HTML, contents links, named sections, independent references and related services. Article metadata reflects the actual publication date and publisher; no invented reviewer or clinical author credentials. The guides link to each other, the answer hub and appropriate service pages. All nine service pages link back to relevant guides. The sitemap includes all four new routes. The care-question hub adds an accessible comparison table and links to the deeper guides. Internal route navigation now uses Next Link without prefetching the entire service collection.

These improvements strengthen useful content, discoverability and consistent entity information. They are not a claim of superiority over competitors or a promise of rankings, citations or leads.

### The actual launch boundary

The Vercel review build remains noindex. Canonicals point to `https://www.astonishingtouchhealthcare.org`. The original domain/platform migration is not part of changing a preview. Ranking requires the approved content to be deployed on that real domain, the real-domain robots/canonicals/redirects verified, and Search Console/Bing ownership and sitemap submission completed. If Wix is the final platform, its actual pages must receive the implementation. No fabricated service-radius/city pages, reviews, awards, prices, coverage or clinical services were added.

Field Core Web Vitals, real search demand, competitor backlinks, Google Business ownership, sitewide competitor audits and search-engine citation share remain unmeasured. Do not describe a schema test as an SEO score or a full competitive audit.

## Faster voice: real changes to the hot path

- The microphone worklet now emits 320 samples at 16 kHz: 20ms per packet instead of 2048 samples / 128ms. This removes up to 108ms of packet accumulation; it is not a measured total conversational speedup.
- Authentication overlaps microphone permission/audio initialization instead of beginning after device setup.
- Live audio uses a dedicated prompt with one copy of authoritative service facts. Measured source payload: 12,162 bytes versus 25,010 for the full text-assistant prompt, before the previous Live-specific suffix.
- Context-window compression is configured for longer audio sessions; session resumption is not implemented.
- Typed conversation context is carried into a newly opened Live session before microphone frames are sent.
- Existing streamed playback, interruption cancellation, mobile gesture-unlocked audio and native-rate resampling remain.
- The output queue fails with a clear reconnect message instead of accepting many seconds of stale upload backlog.
- Typed TTS begins with its first sentence instead of combining that sentence with a long first segment. Later segments are prepared while the current one plays.

Gemini Live is the actual spoken-conversation path. Typed messages still use reasoning followed by TTS; text streaming is not implemented. Live uses a supported prebuilt voice independently of the saved custom TTS identity. An ethnicity or age in a style prompt is a creative direction, not proof of the audible result. The owner must judge voice identity and quality with an actual listening test.

## Jev: integrated evaluation seam, not an unmeasured audio dependency

Source skill: `Burst37/Space-Age-Skills/skills/jev-routing/SKILL.md`, read in full. The existing Build Partner reference contains the same guidance. Current TypeSafe docs list `jev-1.14.0` and the `/v1/systemone` endpoint. Jev returns bounded decisions; it does not synthesize speech or create conversational answer text.

The optional `scripts/lib/jev-judge.mjs` adapter follows the skill's confidence, timeout, validation and bypass contract. It is exercised by `npm run evaluate:jev` using only synthetic questions. It has no import in the production voice or chat path, sends no production transcripts, and never blocks live audio. Missing credentials, low confidence, malformed distributions and provider failures escalate to the normal path. No raw prompt or secret is logged.

No `TYPESAFE_API_KEY` is configured in the inspected deployment environment; the only visible keys were Gemini credentials/voice configuration. The live Jev benchmark therefore reports `not_configured`, not a manufactured latency score. It must beat a direct-Gemini/no-router baseline on representative tasks before becoming a synchronous customer-facing dependency. The adapter alone is not a running Jev/Gemini hybrid.

## Original team media

Recovered completed MiniMax H3 job `379e016e-d264-49c2-b471-eb6f19b82e5f`, using the original team photograph. Frame review shows the white-blazer woman straightening her head, opening one palm in welcome and smiling, without the repeated tilt/smirk action. The source contained an audio stream; the delivered copy removes it losslessly and enables fast start. The site keeps the requested static team portrait. The alternate animation is a separate deliverable.

## Verification and limits

- Production build and TypeScript passed; 28 automated tests passed after the initial implementation.
- ESLint passes with warnings for existing raw image usage and hook lifecycle patterns; native CommonJS tests use scoped lint rules.
- Tests cover 20ms resampling, concurrent auth, typed-to-live context, audio interruption/cleanup, Jev confidence/timeouts, metadata, guide discovery, matching schema, comparison-table semantics and invalid slugs.
- On the previous hosted preview, browser speaker playback and an office-hours AI reply worked. The cloud browser had no microphone device; this cannot certify capture on the owner's phone.
- `scripts/verify-hosted-voice.py` uses synthetic spoken questions to probe the real Live API; it excludes physical microphone and speaker behavior.
- `scripts/audit-search.mjs` checks deployed HTTP status, initial-HTML metadata, H1 count, schema parsing and review indexing restrictions. It is not a search-ranking or field-performance measurement.
- The inquiry webhook and booking URL were not configured in the inspected environment. The contact dialog now presents direct phone/email actions instead of an unusable save form when storage is absent. Configured deployments retain the existing validated form. This is not a booking integration.
- Baseline hosted synthetic probe: setup acknowledgment 307ms; first audio 499ms and 547ms after the two synthetic inputs. Two turns are a diagnostic sample, not a latency percentile or phone benchmark.

## Primary references checked

- https://developers.google.com/search/docs/appearance/ai-features
- https://ai.google.dev/gemini-api/docs/live-api/best-practices
- https://ai.google.dev/gemini-api/docs/live-api/session-management
- https://docs.typesafe.ai/models
- https://docs.typesafe.ai/api/system-one
- https://www.visitingangels.com/crevecoeur/home
- https://www.accucare.com/
- https://cooperativehomecare.com/

Official care-education resources are linked in each guide; they do not endorse this agency.
