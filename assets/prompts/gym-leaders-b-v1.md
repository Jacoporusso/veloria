# Gym leaders atlas B — prompt and provenance

**Status:** accepted for static use on gyms 5–8 after browser compositing QA. The earlier red fringe impression in the transparent-image preview was not present in the browser composite (`.tmp/leaders-b-compositing.png`). This is a static full-body atlas, not a four-direction animation set. Nerea here is the Portolume gym leader; keep her separate from the Nerea of the League Council because canon does not resolve whether they are the same person.

## Deliverables and provenance

- Source PNG: `assets/sources/veloria-gym-leaders-b-v1.png`
- Lossless WebP candidate: `public/assets/sprites/veloria-gym-leaders-b-v1.webp`
- Both are 1254×1254 RGBA with alpha range 0–255; four equal 627×627 cells in reading order Nerea, Selene, Nives, Aurel. All four canvas corners are transparent.
- SHA-256 PNG: `9E34BF49E10CAE29A5EF95872F9CFD991295E8922B207EB76CD3B8B107B0278B`
- SHA-256 WebP: `D85A2756CB84510629F1839BDC26C8516A333651EEBD1B2F6306F7BA8FCE221C`
- Generated with the built-in ImageGen tool. Style references only: `public/assets/sprites/veloria-npcs-v3.webp` and accepted `public/assets/sprites/veloria-gym-leaders-a-v1.webp`. The designs do not copy the people in either reference.
- No crop, rescale, or alpha repair was applied. The catalog and only the four leader objects in gym 5–8 MapDefinitions/Tiled maps now reference this asset; no asset register, service worker, manifest, or version was changed.

## Generation prompt

> Create a fresh original 2×2 illustrated atlas for the second group of Veloria gym leaders, matching the warm soft painterly 2D finish of reference image 1 and the character scale / rendering consistency of approved reference image 2. These references guide style and scale only; do not reproduce any people from them. Exactly four different original human leaders in reading order: top-left Nerea, top-right Selene, bottom-left Nives, bottom-right Aurel. One centered full-body figure inside each equal square cell, facing forward in an orthographic south-facing RPG NPC view, neutral confident standing pose, both shoes visible. Maintain a square canvas divided into exactly four equal square transparent cells; no divider lines, no panels, clear gutter at the center cross, no figure crosses the cross. Use consistent figure scale and baseline across all cells, with generous transparent padding. No text, labels, logos, badges with writing, or extra characters.
>
> Nerea, Water leader at Portolume: composed, observant; flowing but practical short harbor coat, deep turquoise, sand and muted coral; a small waterproof tide ledger or whistle as one signature accessory. Do not make her a mermaid or caricatured sailor.
>
> Selene, Psychic leader at Acquariva: calm, focused and observant; distinct long clean silhouette, smoke lilac and soft aqua with restrained silver; a small prism pendant or flat optical lens as a puzzle reference, not a magical emblem. No mystical costume clichés.
>
> Nives, Ice leader at Biancavetta: compact diagonal silhouette in warm layered cold-weather clothes, midnight blue, snow white and a small amber lining accent; grip gloves or a cable-car buckle. Practical alpine clothing, no supernatural ice powers.
>
> Aurel, Dragon leader at Concordia: composed authority without royal regalia; geometric ivory and deep teal overcoat, antique gold accents and a small clasp shaped from two arcs to suggest balance. No crown, scales, horns or wearable dragon imagery.
>
> Make every person unmistakable by facial shape, hair, body silhouette, outfit construction and pose, not palette alone. Keep gender presentation open and natural because canon does not specify it. Soft storybook-painted 2D game illustration, rounded readable forms, warm gentle highlights, delicate fabric texture, restrained detail, consistent with reference 2. True transparent RGBA background and gutters; clean naturally antialiased edges. No ground shadow, floor, outline glow, chromatic aberration, stray pixels, red/green color fringe, opaque background, checkerboard, scene, frames, borders, watermarks, pixel art, photorealism, 3D render, dramatic perspective, side/back views, cropped feet, overlap, duplicate designs.

## Alpha and cell-foot review

The generated PNG is a square 2×2 atlas with all corners transparent. To compare the apparent red fringe in the transparent-image preview against atlas A, pixels were classified with the project QA threshold `R > 180 && R > 2*G && R > 2*B`:

| Alpha range | Atlas B red pixels | Atlas A red pixels |
|---|---:|---:|
| 1–15 | 3,488 / 70,589 | 3,921 / 41,331 |
| 16–127 | 0 / 9,208 | 0 / 9,862 |
| 128–254 | 2,518 / 448,140 | 521 / 353,685 |
| 255 | 0 / 532 | 0 / 925 |

The alpha-1–15 red fraction is lower in B than A. Within three pixels outside the alpha≥128 silhouette, the same red test finds 839 B pixels versus 981 A pixels; at the alpha≥128 inner edge it finds 16/11,999 B pixels versus 0/11,568 A pixels. Most strong-red B pixels are fully inside silhouettes (including Nerea’s muted-coral fabric and small warm details), not a broad red outer halo. Browser compositing review confirms clean edges over the scene, so the initial preview impression was a false positive.

Foot origins use the same measurement as atlas A: alpha≥128 silhouette in each 627×627 cell; the horizontal anchor is the midpoint of weighted shoe centers found in the lower 8% band, and vertical anchor is the bottom of the alpha≥128 silhouette. Values are rounded to four decimal places:

| Frame | Leader | Left/right shoe centers (cell px) | Anchor (x, y) |
|---:|---|---:|---:|
| 0 | Nerea | 320.9 / 461.5 | 0.6239, 0.9936 |
| 1 | Selene | 214.4 / 326.6 | 0.4314, 0.9920 |
| 2 | Nives | 276.5 / 436.0 | 0.5682, 0.9585 |
| 3 | Aurel | 225.8 / 382.8 | 0.4853, 0.9761 |
