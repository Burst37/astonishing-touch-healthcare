# Astonishing Touch — cinematic care website

Nine full-screen service films with alternating scroll entrances, 12-second hero film, team film, accessible navigation, personal care inquiries and private owner inbox.

## Routes
- `/`: website
- `/privacy`: inquiry and care-guide privacy details
- `/inquiries`: owner-only inquiry inbox (ChatGPT sign-in + LEAD_ADMIN_EMAIL match)
- `/api/inquiries`: validated/rate-limited D1 capture, no public listing
- `/api/assistant`: published-information care guide, optional configured AI adapter

## Working state
H3 movies generated and integrated. Typography/motion/source checks complete. Native video posters and static copy remain available when motion is disabled or media fails. Browser end-to-end QA has not been performed.

Care guide currently uses published-information answers and optional browser read-aloud. Live AI requires CARE_AI_ENDPOINT, CARE_AI_MODEL, CARE_AI_KEY. Calendar booking, telephony and email notifications are not configured. Inquiries are saved; appointments are not promised.

See [operations](docs/OPERATIONS.md), [design](docs/DESIGN_DNA.md), [motion](docs/MOTION_MAP.md), [typography](docs/TYPOGRAPHY_SYSTEM.md), [build contract](docs/BUILD_CONTRACT.md) and [QA ledger](docs/QA_LEDGER.md).

## Development
Use the existing Sites build/install flow in Work. Outside Work, the project uses the packaged npm scripts. Native D1 bindings and generated Drizzle migrations are required for inquiry storage. Do not replace `.openai/hosting.json` with a new identity.

## Publication
Initial publication is private and noindex. Before public launch, connect the required service integrations, verify business details, configure final domain metadata and change crawl settings. Never commit production keys. Source images and video provenance are recorded in the project docs.
