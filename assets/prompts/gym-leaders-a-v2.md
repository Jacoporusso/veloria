# Gym leaders atlas A v2 — prompt and provenance

**Status:** rejected study, not approved for production integration. This was a fresh generation using only the existing Veloria NPC atlas as a style reference; it was not derived from the v1 generated image. The image has real alpha (RGBA, alpha range 0–255, transparent corners), the apparent red/green fringes in the transparent viewer are not reliable evidence of a compositing defect (the selected v1 was subsequently verified clean in Chrome). Its canvas is 1295×1214 rather than square, so its nominal 2×2 regions are not four equal square cells. Registered only for source provenance with status rejected-study; no public runtime asset or character binding.

## Deliverables

- Source study: `assets/sources/studies/veloria-gym-leaders-a-v2.png`
- No runtime WebP was created. The rejected v1 public WebP was removed from `public/assets/sprites/veloria-gym-leaders-a-v1.webp` after verifying that exact absolute path was inside `C:\Projects\Veloria`.
- Style reference: `public/assets/sprites/veloria-npcs-v3.webp`, inspected and supplied as the only image reference. No previous generated art was used as input.
- Generated with the built-in ImageGen tool. No map, catalog, runtime code, or asset register was changed.

## Prompt

> Create an entirely NEW original 2×2 character atlas, using the provided image only as a reference for Veloria's soft, warm, painterly 2D illustration style. Do not copy, edit, or reuse any person in the reference. Exactly four distinct gym leader characters, one centered full-body figure in each equal square quadrant, in this reading order: top-left Mira, top-right Dalia, bottom-left Aster, bottom-right Rhea. South-facing orthographic front view like a top-down RPG NPC shown from the front, neutral standing pose, both shoes visible, same scale and baseline. Each cell has generous clear transparent padding and no dividers; absolutely no overlap across the center cross.
>
> Mira: approachable composed Normal-type leader, cream short jacket with park-green panels, practical trousers and one small seal pin, rounded open silhouette. Dalia: practical botanical Grass-type leader, distinct flowing but functional sage overshirt with muted pink lining, gathered sleeves, seed belt and compact watering tool. Aster: technical Electric-type leader, clearly different tall asymmetric deep-blue technical jacket with restrained circuit-yellow accents, pale trousers and terminal clip. Rhea: sturdy mobile Steel-type leader, short workshop apron over slate-blue clothes, muted copper/brushed-steel accents, magnetic glove or compact wrench.
>
> They must have individually distinct facial shapes, hair, body shapes, outfits and poses, not recolors. Soft high-quality hand-painted storybook rendering, warm even light, clean readable outlines, painterly fabric, understated details, consistent visual scale. Genuine transparent alpha background and transparent gutters. IMPORTANT EDGE QUALITY: clean natural antialiased cutout boundaries, no colored rim, no outline glow, no chromatic aberration, no edge fringing, no stray pixels, no cast shadow, no floor oval. No text, labels, logos, scenery, borders, extra people, panels or watermarks. No pixel art, no photorealism, no 3D, no dramatic perspective. Keep each full figure entirely inside its own equal square cell.

## Review

The role props and color families differentiate the four designs and fit the soft illustrated reference. The conspicuous edge halos and non-square atlas canvas fail production requirements, so only the source study is retained. No resizing, cropping, matte repair, or runtime conversion was applied.
