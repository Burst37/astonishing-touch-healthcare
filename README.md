# Astonishing Touch — cinematic care website

Nine full-screen service films with alternating scroll entrances, 12-second hero film, team film, accessible navigation, personal care inquiries and private owner inbox.

## Routes
- `/`: website
- `/privacy`: inquiry and care-guide privacy details
- `/inquiries`: informational page (no Vercel inbox)
- `/api/inquiries`: validated and rate-limited HTTPS webhook delivery
- `/api/assistant`: published-information care guide, optional configured AI adapter

## Working state
H3 movies generated and integrated. Typography/motion/source checks complete. Native video posters and static copy remain available when motion is disabled or media fails. Browser end-to-end QA has not been performed.

The care guide can use Gemini for AI answers and the selected ElevenLabs voice for Brittany's spoken replies. See [voice setup](docs/VOICE_UPGRADE.md) for server-side settings. Calendar booking, telephony and email notifications are not configured. Inquiry delivery requires the configured webhook; appointments are not promised.

See [operations](docs/OPERATIONS.md), [design](docs/DESIGN_DNA.md), [motion](docs/MOTION_MAP.md), [typography](docs/TYPOGRAPHY_SYSTEM.md), [build contract](docs/BUILD_CONTRACT.md) and [QA ledger](docs/QA_LEDGER.md).

## Development
Use `npm install` and `npm run build` for the Vercel-compatible Next.js app. The legacy Cloudflare tooling is excluded from the build. Inquiry delivery requires `INQUIRY_WEBHOOK_URL`; see [Vercel handoff](VERCEL-HANDOFF.md). Do not replace `.openai/hosting.json` if maintaining the separate Sites project.

## Publication
Initial publication is private and noindex. Before public launch, connect the required service integrations, verify business details, configure final domain metadata and change crawl settings. Never commit production keys. Source images and video provenance are recorded in the project docs.
