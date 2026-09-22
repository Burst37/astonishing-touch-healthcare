# Home-care cinematic website kit

A reusable, unbranded presentation starter plus an agent skill and cinematic production recipe. The completed Astonishing Touch site remains in its own git history (published source commit 73e18a4c0ce65052f0dcb7f4a098c4bd68966e77). This kit does not include that client's images, identity, credentials, voice ID or customer data.

## Preview
Run `python -m http.server 8080 --directory assets/starter`, then open http://localhost:8080. Edit `assets/starter/agency.json`; enable and verify only the services the new agency actually offers. All optional services start disabled. Add approved images/video and the actual logo. Run `python assets/starter/validate.py`; use `--launch` for the additional content check.

The starter includes a silent hero slot, on-view playback, alternating reveals, rounded spatial gallery, reduced-motion behavior and a shared verified service catalog. It is a starting point, not a duplicate of the complete production application's voice, database or appointment integrations. Add those per agency using server-side secrets and verified business destinations. The included React motion source preserves the production scroll technique for reuse in a React build.

## Production workflow
Read SKILL.md, references/skill-routing.md, references/service-storyboards.md and references/cinematic-prompt.json. Replace placeholders, confirm business facts, adapt copy and visual identity, connect real inquiries/voice/scheduling, test mobile and keyboard access, and review each movie at normal speed. Keep noindex during private review; change only for an authorized public launch. Add real sitemap/canonical metadata after a domain is chosen. Never promise search ranking or carry over another agency's services or credentials.

## Validation scope
Configuration and JavaScript syntax are checked in this delivery. Hosted browser interaction and new agency integrations require validation during the next build. The original production update has its own QA ledger.
