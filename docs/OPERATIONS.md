# Astonishing Touch operation

## Implemented
- Nine distinct service chapters, silent inline videos, scroll reveals, a looping hero, pause control and reduced-motion support.
- Mobile service films retain the full landscape frame so hands and task actions are not cropped away. Gallery uses rounded spatial cards, swipe, arrows and pause controls.
- Official supplied logo is used in the header/footer and organization metadata.
- Ask Brittany uses server-configured conversational AI, site-specific knowledge, current-information search with source links, directions and a pricing handoff to a live employee.
- Server-generated speech supports ElevenLabs and Gemini TTS. Last selected ElevenLabs voice: P7x743VjyZEOihNNygQ9; existing hosted configuration is preserved.
- Microphone input uses browser speech recognition where supported. Conversation mode listens after each spoken reply, with explicit stop/interrupt controls. Typed chat remains available.
- Care inquiries are sent to the configured HTTPS `INQUIRY_WEBHOOK_URL`. The `/inquiries` page is informational on Vercel; it is not an owner inbox. The visitor receives a reference only after the webhook accepts the inquiry, not a booking confirmation.
- Metadata and organization/service/FAQ structured data use published company facts. No invented reviews, credentials or rates.

## Owner connections still required for public launch
- Set BOOKING_URL to the business's scheduler to expose real appointment slots. No calendar is connected by this code update; the user's personal calendar is not used.
- Configure and verify `INQUIRY_WEBHOOK_URL` before launch so the owner can receive inquiries. This app does not send email or claim a notification was sent.
- This deployment remains owner-private and noindex. Public search indexing requires an authorized public launch, the intended domain, crawlable robots/canonical configuration and a sitemap. No search or LLM ranking is guaranteed.
- Runtime credentials stay in hosted secrets and must never be committed.

## Media history
- docs/medication-reminder-cinematic.json records the user-approved medication film, preserved unchanged.
- docs/cinematic-final.json records each new cinematic prompt, reference and generation job. Camera/lens/meta-token descriptions are generation direction, not claims about physical filming equipment.
- Generated care scenes are illustrative; founder/team imagery retains the supplied identities.
