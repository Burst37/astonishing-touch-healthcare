# Local and AI search implementation — 2026-09-16

Implemented server-rendered service directory, nine distinct service pages, about page and contact/directions page. Each service has a unique title, description, canonical URL, visible definition, planning details, service-specific Q&A, accessible video description and cross-links. Structured Service, LocalBusiness, BreadcrumbList and FAQPage data reflects visible content. No invented prices, ratings, coverage radius, credentials or clinical services. One service-details source supplies pages and Ask Brittany grounding. Homepage links expose all service routes. Sitemap contains all public-intended routes; private inquiry/API routes are excluded. Existing llms.txt is an optional inventory, not a ranking mechanism.

Research used:
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/appearance/ai-features
- https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a
- User skill: Burst37/web-agent/skills/sa-local-seo-geo/SKILL.md

Applied primary-source guidance over unsupported skill claims. No fake first-hand testimonials, invented medical review, fabricated statistics, mandatory schema fields or automated directory submissions. Genuine founder stories can be added when supplied by Brittany. Office location is explicitly distinguished from an unconfirmed service area. FAQ markup does not guarantee a rich result or AI citation.

## Launch dependencies
Current audience remains owner-private. searchConfig.publicIndexing=false deliberately keeps robots/noindex blocked. At authorized public launch, connect the correct production domain, verify canonical host, set publicIndexing=true and confirm rendered robots/meta/sitemap after deployment. Verify Search Console and Bing Webmaster Tools with owner access, submit sitemap and monitor indexing/citations. Review Google Business Profile and Bing Places facts with the owner. Do not confuse training crawler permissions with search inclusion. No new training permissions were introduced.

## Verification
TypeScript, production build and three focused rendered-component tests: all service metadata and sitemap entries; visible/schema Q&A parity; video and contact links; unknown service rejection; private robots; JSON-LD HTML escaping. This is component/server-content verification, not a hosted browser or live indexing test. Voice and booking provider calls were not exercised.
