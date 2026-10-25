# Mira single-character study v1

**Status:** source study only; not a runtime asset. Chrome compositing at 60/120/240px was inspected on 25 October: the red fringe shown by the transparent-image viewer is absent in the actual browser rendering. The earlier rejection from that viewer was therefore incorrect. The four-character atlas supplies the selected runtime identity; this alternative remains a study.

## Output and provenance

- Source: `assets/sources/studies/mira-single-v1.png`
- Dimensions/mode: 1254×1254 RGBA; alpha range 0–255; all four canvas corners are fully transparent.
- SHA-256: `1D8CFA176FEB3724AAD1291191533089089C61065E2F5C3C1EE8EAA654EEDF4C`
- Generated with the built-in ImageGen tool as a fresh image. Only image reference: `public/assets/sprites/veloria-npcs-v3.webp`, used for style. The design brief was `docs/art/cast-redesign-briefs.md` (Mira row: composed/open posture, cream short jacket with park-green panels, practical trousers, small seal pin).
- No edits, crop, resize, conversion, runtime asset, or catalog/map integration were applied.

## Prompt

> Use the supplied Veloria NPC atlas only as a visual-style reference. Generate one original, single-character full-body game NPC illustration: Mira, the Normal-type gym leader from Brumalta. The canonical material does not specify Mira's gender, so present a natural, non-stereotyped person without emphasizing gender cues. Design from the cast brief: composed and approachable, relaxed open posture, rounded readable silhouette; short cream jacket with park-green panels, practical trousers, one small luminous seal pin at the collar. This character should feel like a capable local gym leader who values preparation and adapting to a team's rhythm. No other people, creatures, or text.
>
> Style: soft polished hand-painted 2D illustrated game character matching the reference's warm storybook rendering, rounded forms, gentle painterly contour, delicate but restrained fabric details, warm highlights, subtle depth. Original design; do not copy any character in the reference.
>
> Composition: one centered, front-facing orthographic south-view figure, as if a top-down RPG NPC is facing the player; neutral standing pose, both shoes visible, arms relaxed and not covering the jacket. Full figure fits in a square canvas with generous transparent padding, consistent upright proportions suitable for eventual world-map NPC sprite adaptation. The person occupies roughly 70% of canvas height.
>
> Background: genuinely transparent RGBA, no setting, no floor, no oval ground shadow, no glow. Edge quality is critical: crisp naturally antialiased silhouette with clean alpha transition, no red/green color fringe, no colored rim, no chromatic aberration, no outer glow, no stray pixels. No frame, grid, border, card, icon, labels, watermark, props except the small pin.

## Alpha/border inspection

Pillow inspection confirms RGBA and transparent corners. A pixel scan counted 6,337 partial-alpha pixels with red-dominant RGB under alpha 160; visual review confirms a red fringe remains. This is why the PNG is retained only under `assets/sources/studies/` and no public WebP was written.
