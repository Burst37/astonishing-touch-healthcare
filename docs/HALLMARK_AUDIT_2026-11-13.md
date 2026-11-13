# Hallmark cleanup, November 13, 2026

Used the supplied hallmark-main.zip, version 2.0.0, including its actual sloplint script and redesign/polish guidance. The existing site and wiring were preserved. This is a polish of the approved cinematic design, not a theme replacement.

## Before

The initial three-file scan found 418 Floor failures, 229 Reflex findings and 23 warnings. Many were repeated hardcoded color/font declarations accumulated in older stylesheets. Eight emphasized headings, Georgia/Arial styling, tracked uppercase section labels, decorative numbering and repeated slogans were visible on the live site. The initial automatic render tier did not run because no live URL was supplied; the live site was separately inspected in the browser.

## Fixed

- Upright Satoshi throughout: regular body, bold headings, black hero and pill labels. All old serif, italic heading accents and literal family declarations outside the font-face definitions were removed.
- Shared color and type tokens for the public site and workspace, preserving the agency's navy/teal palette and supplied assets.
- Public pills: muted slate faces, directional dark shadows and contained highlights. No outer light, colored shadow halo or brightness jump on hover. Existing pill boxes are retained.
- Removed repeated decorative section labels, numbered service headings and rotated hero slogan. The actual service name now heads each service scene.
- Header, logo, films, gallery, original company story/mission, FAQ answers, contact details and behavior remain intact. The original company logo is artwork and is not redrawn to remove its lettering style.
- Removed projected chromatic halos from workspace metric/background decoration; the separately requested glass shell and glossy gel controls are retained.
- Removed the gallery image's extra hover zoom, tokenized the legacy palette, capped wide-screen content, constrained prose, themed selection/carets, added instant focus-visible coverage, and made disabled controls distinguishable by fill, ink and cursor.
- Replaced height-based accordion animation with an opacity fade. Motion stays optional; content remains visible without JavaScript.

## Copy changes

Hero: “Care that feels like home.” to “Home care in Creve Coeur.” The lead now states the existing 2018 founding and listed nonmedical support.

Services: “Small moments. Real support.” to “Our home-care services.” Each service's existing name replaces its decorative two-line slogan.

Team: “Good people. A personal touch.” to “Meet our care team.”

Steps: “It starts with a conversation.” to “How to arrange care.”

FAQ: “A little clarity. A little comfort.” to “Your care questions.”

Contact: “Let’s make home feel like home.” to “Talk with our team.”

Gallery: “Life happens. Let’s be part of it.” to “Time together. Care at home.”

Staff authentication headings now say “Staff sign-in”, “Set your staff password” and “Reset your staff password” in place of decorative greetings. Office-hour ranges use “to” rather than a dash. Decorative arrows/middle-dot link separators were removed; no destinations, input names or handlers changed. Consent, company story and mission text were retained.

## Remaining craft warnings, reviewed

Hallmark's static scan covers 31 app files and their imported CSS. It reports zero Floor failures and zero Reflex findings. This is static source evidence, not a claim that a score proves design quality.

The retained cinematic section sequence, autoplay gallery with pause controls, responsive spacing, pill controls and navy/teal brand are explicit project choices. The polish does not rebuild the page's composition or reduce its useful SEO text to meet generic screen word limits. Glass on the gallery label and service navigation is retained as part of the existing treatment. Gallery images are below the fold and intentionally lazy-loaded. Long location-exception actions must wrap on phones rather than overflow. Heading balance and tabular figures are provided in shared rules. Browser verification checks the actual resulting appearance in addition to the source scan.
