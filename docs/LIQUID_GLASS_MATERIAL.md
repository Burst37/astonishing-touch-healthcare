# Space Age liquid glass material

Reference: Mr. Black’s Liquid Glass UI Kit image. Approved direction on November 12, 2026: clear sculpted glass, saturated violet and turquoise raised controls, pearl/peach/slate background, visible physical depth. The rejected iteration was pale, opaque and flat.

## Required light layers

1. Surface: a neutral warm-to-slate canvas, with broad subdued color beneath transparent objects.
2. Projected light: small turquoise, violet, pink and warm-white pools on the background underneath glass. Align them with object edges. Keep the surrounding cast shadow visible. A broad generic glow alone does not satisfy this.
3. Glass body: transparent layered fill, restrained backdrop blur, directional reflection and a double bevel.
4. Edge glints: local bright white highlights with turquoise/pink dispersion, especially lower corners. Do not wash out the entire border.
5. Controls: rich violet primary/selected pills, turquoise secondary actions, pearly neutral controls, raised cast shadow and inner highlights. Preserve color in hover, active and selected states.

## Implementation

Use `app/team/team.css`: `.team-app::before` projects static ambient light, `.team-shell::after` catches frame edges, `.team-metrics::before` projects card reflections, and `.team-metric::before` adds local specular glints. These are CSS approximations of light and refraction, not a physical ray-traced renderer. Keep decorative layers pointer-transparent and behind text, with no animation or large extra blur filters. Keep mobile light pools smaller, contain horizontal overflow, and hide decorative light layers for reduced-transparency and forced-colors preferences.

Keep the public website’s neumorphic controls and transparent logo independent from this dashboard material. Never apply a glow to the logo. Keep text crisp and readable. Do not change data, access controls or workflows to achieve the look.

## Review

Compare rendered desktop and phone views with the reference. Check colored reflections underneath objects, small bright edge highlights, clear glass instead of milky white cards, raised shadows, vivid controls and readable labels. Exercise selected/hover states so broad application button rules cannot bleach the violet controls. Run a production build and check a narrow phone view for document overflow before sharing a preview.
