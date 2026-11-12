# Astonishing Touch — SEO and AI-search strategy

Research date: November 11, 2026, America/Chicago. Google captures were taken at approximately 10:18 p.m. Central (November 12, 04:18 UTC).

## What changed in this build

- The header phone number is now a single right-aligned, click-to-call neumorphic pill. The separate floating phone label has been removed. The existing pill dimensions are retained.
- The homepage title, description and visible service introduction now identify nonmedical home care, companionship, personal care, respite and the Creve Coeur office.
- All nine existing service URLs have distinct service-plus-location titles, descriptions and headings. Their URLs are preserved.
- `/care-questions` provides eight original, server-rendered answers, a service comparison, a family conversation checklist and links to relevant services. The answers and FAQ markup match.
- The question hub is linked from the homepage, service pages, resource navigation, footer and sitemap. Brittany's business knowledge includes the same answers.
- Organization markup now includes the documented 2018 founding date and founder, Brittany Wadley. No unverified ratings, awards, payment coverage or service radius were added.

## The first launch requirement

**The review build currently says `noindex, nofollow`, and its robots file blocks crawling.** This is deliberate while the build is under review. It cannot earn normal search rankings or become an indexed Google AI Overview source in that state. Its canonical URLs point to `https://www.astonishingtouchhealthcare.org`, where the original website still exists.

Before launch, choose the final publishing platform and connect the approved build to the real domain. If publishing through Wix, carry these page titles, visible answers, links, canonicals and structured data into the actual Wix pages; a separate Vercel preview does not optimize Wix automatically. Preserve valuable existing URLs or create direct 301 redirects to their closest equivalents. Only then enable public indexing, check the live domain's robots/meta directives, and submit its sitemap. Production and indexing were not changed in this task.

## What Google actually showed

Method: live Google organic results, English, desktop/Windows, location set to St. Louis, Missouri. Positions below are positions among organic results, not among all page elements. Local-map results are recorded separately. They are a small, dated sample; rankings vary with query, user location, device and time. No search-volume, keyword-difficulty or traffic numbers were inferred.

| Query | Observed organic results relevant to this market | Separate local-map sample |
|---|---|---|
| home care Creve Coeur MO | AccuCare #1; Cooperative Home Care #2; Visiting Angels #5; Seniors Home Care #6; Advantage Home Care #8. Directories and hospice results also appeared. | ComForCare; Private Home Care; St. Mary's Complete Home Care |
| companion care St Louis MO | ComForCare #1; Senior Helpers #2; Circle of Care St. Louis #3; SYNERGY HomeCare #5; TheKey #7. Jobs and directories also appeared. | Care Companions of Clayton CDS; Cooperative Home Care; Visiting Angels |

Astonishing Touch was not in the organic results returned for these two samples. This is not proof that it never ranks for other queries or elsewhere in the results.

### AI Overview sample

Neither of those commercial local searches returned an AI Overview in the captured response. A third informational query, **what is companion care**, did return one. Its references included Careforth, Comfort Keepers, Corewood Care, AARP, Visiting Angels, Village Caregiving and ComForCare, among others.

These are observed citations for one informational query, not a universal ranking of AI-search competitors. Careforth and Comfort Keepers are useful answer-format benchmarks; their presence in this answer does not establish that they outrank local agencies for Creve Coeur enquiries. ChatGPT and Perplexity visibility were not measured. Long-term AI share-of-voice and account-based keyword metrics remain unmeasured; Ahrefs and OpenSEO are not connected.

## Competitor patterns worth adapting

The pages inspected included AccuCare, Cooperative Home Care, Visiting Angels Creve Coeur, ComForCare's Saint Louis page, Assistance Home Care's Creve Coeur page, Brookdale at Home Creve Coeur, Careforth's companion-care article, and Comfort Keepers' companion-care guide. Page titles, descriptions, headings, service links and answer structures were inspected; full-site audits were not performed.

| Benchmark | Observed pattern | Astonishing Touch application |
|---|---|---|
| AccuCare | Local market and home-care terms in title/description; service and town links; a clear identity and founding history | Emphasize Creve Coeur, nonmedical support and Brittany's documented 2018 founding. Do not borrow nurse-led, awards or 24-hour claims. |
| Cooperative Home Care | St. Louis home-care positioning and sections addressing family needs, services and getting started | Make the services and next step explicit. Avoid importing its funding, medical-care or volume claims. |
| Visiting Angels | Local service hub, separate companion/personal/respite pages, costs, FAQs and getting-started links | Connect the existing nine service pages to a question hub and the office contact page. |
| ComForCare | Service/location page, daily-life examples, care categories and visible questions | Use a clear local heading and practical explanations tied to the services actually listed. |
| Assistance Home Care | Dedicated Creve Coeur page, family questions and a clear explanation of care options | Answer local questions directly; create additional town pages only after service coverage and useful town-specific facts are confirmed. |
| Brookdale at Home | Senior home-care and Creve Coeur terms paired with companion/personal/respite navigation | Keep the primary service categories easy to find; distinguish home support from residential senior living. |
| Careforth / Comfort Keepers | Definition-led articles, practical tasks, comparisons and related reading | Publish original explanations of companion versus personal care, respite and the first care conversation. |

This adopts search intent and information architecture. Competitors' distinctive wording, reviews, guarantees, statistics and unverified services are not reproduced.

## Keyword-to-page map

These are relevance targets derived from the sample and confirmed service list, not volume-ranked keywords. Use them naturally in a useful page, not repeatedly in every heading.

| Page | Primary intent | Supporting terms |
|---|---|---|
| `/` | nonmedical home care Creve Coeur MO | in-home support, locally owned home care, personalized care plan |
| `/services` | home care services Creve Coeur | daily living support, home-care options |
| `/services/companionship` | companion care Creve Coeur | friendly companionship, conversation, shared activities |
| `/services/personal-care` | personal care Creve Coeur | dressing help, everyday self-care support |
| `/services/respite-care` | respite care Creve Coeur | family caregiver break, respite at home |
| `/services/hygiene-assistance` | hygiene assistance Creve Coeur | grooming support, personal routines |
| `/services/meal-preparation` | meal preparation help Creve Coeur | meal planning, everyday meals |
| `/services/housekeeping` | light housekeeping Creve Coeur | household support, routine tidying |
| `/services/laundry` | laundry assistance Creve Coeur | clothing and linen routines |
| `/services/medication-reminders` | medication reminders Creve Coeur | established medication routine; reminders versus administration |
| `/services/errands` | errand assistance Creve Coeur | grocery-shopping help, everyday errands |
| `/care-questions` | what is nonmedical home care; companion care versus personal care | respite explained, how to start care, home-care questions |
| `/about` | Astonishing Touch founder and mission | Brittany Wadley, established in 2018, Creve Coeur agency |
| `/contact` | Astonishing Touch phone and address | office hours, directions, care availability |

St. Louis is an important market to research further, but confirmed office location is not proof of a countywide service area. Do not add dozens of similar city pages, “near me” repetitions, skilled nursing, dementia treatment, 24/7 care, Medicare/Medicaid acceptance, transportation or low-price claims without business confirmation.

## Recommended priorities

### Before launch

1. **Finish the domain/platform migration and indexing checks.** Verify the public canonical domain and page redirects before requesting indexing. Confirm important text appears in the initial rendered page, not only after a chatbot conversation.
2. **Verify Google Search Console and Bing Webmaster Tools.** Submit the real-domain sitemap, inspect key URLs, and investigate indexing exclusions. Do not submit private previews.
3. **Complete and reconcile the Google Business Profile.** Verify ownership, use the most accurate available business category, list the real services, confirm address/customer-visit eligibility, hours and phone, and record the actual service areas. Match the website and reputable directory listings. Local visibility depends on relevance, distance and prominence; keywords alone do not control the map pack.
4. **Add genuine business evidence.** Confirm staff credentials and the original company statements with Brittany. Add authentic team information, permitted real photographs and customer reviews when available. Do not treat illustrative AI care scenes as evidence of actual clients or clinical services.

### First month after launch

5. **Improve the strongest service pages before expanding the site.** Add business-specific answers about the first care conversation, task boundaries, communication and scheduling once the office supplies verified details. Keep all pricing enquiries with live staff, as requested.
6. **Earn real local references.** Build accurate listings and relationships with appropriate community organizations, caregiver resources and local professional networks. Ask customers for honest reviews without incentives or review gating. Do not buy links or fabricate testimonials.
7. **Measure mobile performance on the actual public domain.** Keep the silent cinematic videos, but check transfer sizes, lazy loading, poster images, text contrast and layout shifts. Use PageSpeed lab checks initially and real Core Web Vitals when field data becomes available; no performance score was measured in this research.
8. **Track enquiries and query quality.** Review Search Console impressions, clicks, positions and landing pages for service/location terms. Track call-link and enquiry actions without sending private chat or form content to analytics. Separate care enquiries from job-search traffic.

### For answer engines

9. **Keep answers factual, public and easy to cite.** Lead with a concise explanation, follow with practical examples and limitations, and link to the relevant service. Maintain consistent company name, founder, office and contact details across the site and trusted listings. This is an editorial recommendation, not a guarantee of AI citation.
10. **Keep structured data aligned with visible content.** Use real organization, service, breadcrumb and FAQ information. FAQ markup does not guarantee Google rich results, and there is no special “AEO schema” required for AI Overviews. No fabricated ratings or unsupported medical schema should be added.
11. **Allow search discovery at public launch.** Review Googlebot, Bingbot and OAI-SearchBot access, plus hosting/firewall restrictions. OpenAI search crawling and model-training controls are separate decisions. Do not unblock the private review build just to test visibility.
12. **Repeat a small, consistent AI-search benchmark.** Test the same local and informational questions with date, location, device and engine recorded. Record actual cited URLs, not simply whether an answer sounds familiar. Compare Google organic results, the map pack and AI citations as different measurements. Do not claim that ChatGPT, Google and Perplexity have one shared ranking.

Useful repeat queries: home care Creve Coeur MO; companion care Creve Coeur; respite care Creve Coeur; companion care St Louis MO; what is companion care; companion care versus personal care; how do I start home care in Creve Coeur?

## Verification performed

Production build passed. Automated checks cover unique service metadata, preserved canonical URLs, the new sitemap entry, a discoverable question hub and exact agreement between visible answers and FAQ markup. Review indexing remains blocked intentionally. Live header/layout verification is recorded with the final preview; no phone call is placed during that check. Search Console ownership, actual phone-device behavior, public-domain migration and post-launch ranking changes are not verified by these tests.

## Sources

Competitor pages:

- https://www.accucare.com/
- https://cooperativehomecare.com/
- https://www.visitingangels.com/crevecoeur/home
- https://www.comforcare.com/missouri/central-st-louis/about-us/areas-served/saint-louis/
- https://www.assistancehomecare.com/senior-home-care-services-in-creve-coeur-mo-assistance-home-care/
- https://www.brookdale.com/en/brookdale-at-home/creve-coeur.html
- https://careforth.com/blog/what-is-companion-care-companion-caregiver-costs-duties-and-more/
- https://www.comfortkeepers.com/offices/new-york/pittsford/resources/resources/what-is-companion-care/

Official implementation guidance:

- Google AI features: https://developers.google.com/search/docs/appearance/ai-features
- Google generative-search guidance: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google local ranking: https://support.google.com/business/answer/7091
- Google FAQ eligibility: https://developers.google.com/search/blog/2023/08/howto-faq-changes
- OpenAI crawler controls: https://developers.openai.com/api/docs/bots
- Independent family education: https://www.nia.nih.gov/health/caregiving/services-older-adults-living-home

Google positions and AI references above came from live Google SERP data, not the ordering of a general web-search tool. They should be rechecked after launch and are not forecasts or ranking guarantees.
