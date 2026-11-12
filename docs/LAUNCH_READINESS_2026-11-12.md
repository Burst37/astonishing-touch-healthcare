# Main website deployment readiness - 12 November 2026

The public-site source includes every reviewed visual/content fix and the latest SEO/AEO work. It builds for Vercel. This does not mean the Wix domain has been cut over or that the separate staff/SMS system has been activated.

## Verified

| Requirement | Evidence |
| --- | --- |
| Transparent header | Hosted computed background is transparent with no box shadow, including after scrolling to Our Story. |
| Bold neumorphic controls | Primary buttons, navigation and nine service CTAs compute to weight 900. Existing directional inset/cast shadows and hover behavior are preserved. |
| No double service pills | Nine service sections each retain one primary CTA and a plain underlined secondary action. |
| Original story and mission | Full approved content, 2018 founding and Brittany Wadley retained in initial HTML and the hosted page. |
| Video handoffs | Reserved pin spacing fades the outgoing whole scene to zero before the next enters. No overlapping video crossfade is implemented. Physical touch-scroll smoothness still requires device review. |
| Soundless films | FFprobe confirms the 12-second hero, story film and nine service films are H.264 video-only files, without audio streams. Poster fallback remains available. |
| Final team media | Hosted team section contains the corrected still portrait and no video element. |
| Responsive layout | Hosted 390px review iframe: inner document has matching 375px client/scroll widths; nine services remain present. Phone menu opens with expected destinations. Desktop has no horizontal overflow. This is viewport testing, not certification on a physical phone. |
| Gallery | Hosted second-slide control changes the counter to 02 and caption to Fresh air & friendship / More moments out in the world. |
| Contact | Three-step care planner reaches a clearly labeled unsent email draft and direct office call option. No inquiry webhook or calendar booking is represented as connected. No email/call was sent during review. |
| Spoken conversation | Hosted browser lab: spoken greeting plus two naturally paused synthetic questions/replies; correct weekday hours and weekend closure; 1,518 capture packets, 76 scheduled reply chunks, output context running. Physical microphone and acoustic speaker output remain unverified. |
| Voice permission delay | New fix refreshes a credential older than 45 seconds before opening the Live socket. Regressions cover a 65-second permission delay and cancellation during refresh. |
| SEO/AEO | Latest answer passages, guide authorship, page metadata and sitemap work included. Hosted HTTP audit: 19 pages, zero failures; titles, H1s, canonicals, structured data and intentional review noindex verified. |
| Build and regressions | Production build, TypeScript and 54 tests pass. |

The hosted browser checks used the SEO/AEO preview at commit 0a62fc7. The new permission-delay fix is separately verified in the regression suite and must be included in the deployment candidate. A short synthetic dialogue is not an exact latency or physical-device benchmark. Browser-extension metadata errors were observed; no application error was identified from them.

## Launch sequence and remaining inputs

1. For the client's requested Wix hosting, obtain the site-specific Headless Migration prompt and authenticated access from the existing site's owner/co-owner. Follow docs/WIX_REPLACEMENT.md. A Next.js deployment cannot be dropped directly into classic Wix Editor. The current reviewed build is ready to stage on Vercel; Wix requires adapting and testing the supported scaffold and server endpoints before its final migration action.
2. Open the final-domain candidate on the owner's actual phone, allow microphone access and confirm greeting, two-way conversation, interruption and reply audio. The permission-delay defect is fixed; physical capture is still an acceptance check.
3. Verify legacy URL redirects, domain certificates, voice endpoints and actual email/call handoffs on the chosen publishing platform. Preserve mail DNS records. If automatic web inquiry storage or confirmed booking is required, connect the agency's inbox/webhook or scheduler before describing those as active.
4. At the authorized real-domain launch only, enable public indexing; verify robots, canonicals and sitemap. Submit Search Console/Bing using agency access. No ranking or citation guarantees.
5. Keep staff login, private client storage and SMS disabled until the dedicated agency account, email templates and messaging setup are complete. These are separate activation dependencies and do not block publishing the informational site with honest call/email contact options.

No Wix migration, DNS mutation, production promotion, real invitation, SMS, booking, inquiry submission or search-console submission occurred during this readiness pass.
