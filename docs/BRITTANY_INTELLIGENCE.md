# Brittany conversational knowledge

Brittany supports business questions, ordinary conversation, current local/national news, weather, sports, events and directions. Default local context is Creve Coeur / greater St. Louis, Missouri. A visitor's requested location overrides the default and should be preserved in follow-ups.

## Business knowledge

The live core includes contact details, hours, founder, full approved company story and mission, all nine services, task boundaries, FAQs, privacy and care-planning guidance. Detailed questions can invoke `lookup_business_information` without restarting voice. It retrieves relevant source pages from maintained repository content: company/about/contact, nine full service explanations and their specific answers, public FAQs, all three complete family guides, privacy and general-care concepts. Typed answers also receive relevant published-page context. Updating these maintained source files updates the next response/session; no model fine-tuning is required.

The retrieval route uses no private staff/client records or credentials. It cannot know unpublished rates, payer participation, actual staff availability or new policies unless the business supplies them. It explicitly instructs the model to identify those unknowns and ask staff to confirm. Pricing remains a live-employee handoff. Clinical-care claims are not inferred from the legal business name.

## Current information and directions

Current-information responses use Google Search grounding and require actual returned source links; unsourced or failed responses disclose that the update could not be verified. Instructions distinguish event/publication dates, weather observations/forecast periods, completed games/upcoming fixtures, event venues/times and unverified ticket availability. Dates and conversational schedules use Central Time. Sources and checked times now appear in voice conversations too, alongside the spoken reply; source URLs are not read aloud.

Directions default to the agency office only when no other destination is requested. `Directions to ...` and `How do I get to ...` preserve the specified destination in a visitor-controlled Google Maps or Apple Maps route link. The site does not invent turn-by-turn navigation or transmit a starting address. Live current-information tools can return the same route links to the chat panel.

Broad date words alone no longer send normal agency-care questions to external search. Follow-ups to weather/news/sports/events can reuse the prior topic. Six quick prompts expose care, local news, weather, sports, weekend events and directions. Short phone screens can scroll these prompts horizontally.

## Verification and limits

On the existing hosted SEO/AEO preview, synthetic typed checks returned sourced AI answers for Creve Coeur weather (4 sources), St. Louis news (3), upcoming local sports (3) and weekend events (8). These prove the search integration responds with grounding; they are a diagnostic sample, not an independent fact-check of every returned claim or a reliability percentile. No user recordings or personal details were used.

Regression checks cover full-page business retrieval, requested-destination routing, conversational follow-ups, normal-care routing, source-required search, live source/directions callbacks and both map destinations, voice lifecycle and microphone-permission credential refresh. Final real-phone microphone/voice identity and final-domain playback remain acceptance checks. No email, call, event ticket, reservation or booking is completed by these informational tools.
