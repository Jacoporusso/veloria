# Gym leaders atlas A — prompt and provenance

**Status:** accepted for static use on the first four gym maps. The earlier rejection based on the alpha viewer was a false positive: it showed fringe colors from the transparency representation. Browser compositing review (`.tmp/leaders-compositing.png`) confirms clean silhouettes over the actual scene; no red fringe is visible. This is a static full-body atlas, not a four-direction animation set.

## Deliverables

- Source: `assets/sources/veloria-gym-leaders-a-v1.png` (same PNG retained as a study at `assets/sources/studies/veloria-gym-leaders-a-v1.png`).
- Runtime: `public/assets/sprites/veloria-gym-leaders-a-v1.webp`, encoded losslessly from the source PNG.
- Both are 1254×1254 RGBA, arranged 2×2 in reading order: Mira, Dalia, Aster, Rhea. The image has transparent corners and gutters; alpha range is 0–255.
- SHA-256 PNG: `3D24E80BDEF2C03D31E07C6CA8F750E685FB7823C0C0AF6AD30FCE6807913F96`
- SHA-256 WebP: `D2AB42454FA8AE7F6C1AC20C9D53C99F825F567AC6EF14AF10B1BB16C227839D`
- Style reference inspected: `public/assets/sprites/veloria-npcs-v3.webp` (style only, not a character reference).
- Generated with the built-in ImageGen tool. Integrated only in the first four gym MapDefinitions and their leader NPC objects via catalog; no other runtime, manifest, service worker, asset-register, or version changes.

## Generation prompt

> Create one clean 2×2 atlas with exactly four distinct original human characters, one per equal square cell, for Veloria gym leaders Mira, Dalia, Aster, Rhea. Follow the NPC atlas reference for its soft polished storybook-painted rendering, rounded readable forms, gentle linework, warm highlights and subtle depth. New characters, not copies. Top-left Mira: approachable composed Normal leader, cream short jacket with park-green panels, practical trousers, small luminous seal pin. Top-right Dalia: practical botanical leader, sage-green overshirt with muted-pink lining, gathered sleeves, seed belt and small irrigation tool. Bottom-left Aster: technical Electric leader, tall asymmetric deep-blue technical jacket, restrained circuit-yellow accents, pale trousers and terminal clip. Bottom-right Rhea: sturdy mobile Steel leader, short workshop apron over slate-blue clothes, muted copper and brushed-steel accents, one magnetic glove or compact wrench. Distinct faces, hair, body proportions, garments and poses, not palette swaps. Soft painterly 2D game illustration, warm subdued highlights, readable silhouettes. Square 2×2 atlas, equal cells and transparent gutters, no visible grid lines. Exactly one centered full-body figure per cell, front-facing orthographic south view, relaxed neutral pose, both shoes visible, consistent figure height and ground baseline, no overlap or bleed. Genuinely transparent background, no scenery, text, labels, logos, watermark or extra people. Avoid pixel art, photorealism, 3D, dramatic perspective, side/back views, duplicate outfits and opaque backgrounds.

## Refinement prompt

> Edit the generated atlas only to clean the cutout edges. Keep the exact same four characters, clothes, poses, order, square 2×2 placement, proportions, art style and accessories. Remove colored fringe, red/green halo pixels, stray specks and outline glow; use naturally antialiased silhouettes with clean transparent pixels outside. Preserve genuine transparency and gutters. Keep all four full bodies and both shoes visible. Do not redraw or change faces, costumes, palette or composition. No background, grid lines, labels or text.

## Review note and anchors

The supplied reference uses a similarly soft painted finish, and the four figures have distinct role-specific silhouettes/accessories. The initial alpha-viewer impression of red/green halos was incorrect; the browser composite shows clean boundaries. Source alpha was measured in equal 627×627 cells. `origin.x` is the midpoint between the two weighted shoe centers in the lower foot band; `origin.y` is the bottom of the alpha≥128 silhouette. Catalog values are rounded to four decimal places:

| Frame | Leader | Left/right shoe centers (px) | Anchor (x, y) |
|---:|---|---:|---:|
| 0 | Mira | 300.79 / 409.84 | 0.5667, 0.9761 |
| 1 | Dalia | 242.16 / 347.19 | 0.4700, 0.9761 |
| 2 | Aster | 322.40 / 444.59 | 0.6116, 0.9553 |
| 3 | Rhea | 223.54 / 383.75 | 0.4843, 0.9553 |
