# Veloria League Council atlas — prompt and provenance

**Status:** accepted for static League Council use after browser compositing QA (`.tmp/council-compositing.png`), which confirms clean silhouettes. The colored fringe in the alpha-viewer preview was not present in the composite. This atlas is for static full-body art, not a four-direction animation set.

## Deliverables and provenance

- Source PNG: `assets/sources/veloria-league-council-v1.png`
- Lossless WebP candidate: `public/assets/sprites/veloria-league-council-v1.webp`
- Both are 1254×1254 RGBA with alpha range 0–255, four equal 627×627 cells in reading order: Nerea (League Council), Silvo, Brando, Luce. All four canvas corners are fully transparent.
- SHA-256 PNG: `677F098792C124751A8C2A54A452DC24BCD1C1E7E58BBA3B34CE19575A3CE188`
- SHA-256 WebP: `4D6D99E97F9965CB447DEF1C972FD6E3BB4FA7C70609AB4B5354F2176BF3770A`
- Generated with the built-in ImageGen tool. Style references inspected: approved `public/assets/sprites/veloria-gym-leaders-a-v1.webp`, `public/assets/sprites/veloria-gym-leaders-b-v1.webp`, and `public/assets/sprites/veloria-npcs-v3.webp`. They were used only for illustration style and scale; no reference character was copied.
- No crop, resize, or alpha repair was applied. The catalog and four League Council MapDefinitions/Tiled NPC objects now reference this atlas. No asset register, version, or service-worker change was made.
- Nerea in frame 0 is the League Council member, not a consolidated identity with Portolume's gym leader. The source material does not settle whether these two Nereas are the same person.

## Generation prompt

> Generate a completely NEW original 2×2 atlas for Veloria's League Council, using only the three provided images as style/scale references. Do not copy any reference character. Output a square 1254×1254 transparent atlas with four equal 627×627 cells, reading order: Nerea of the League Council, Silvo, Brando, Luce. One original full-body human per cell, front-facing orthographic south view, relaxed formal standing pose, both complete shoes visible, consistent scale/baseline, ample transparent gutters, no frame/divider/text. Never crop or overlap a figure across the cell cross.
>
> Nerea is the Council member and is NOT the Portolume gym leader's casual harbor identity: tailored deep navy and pearl formal outfit, long simple vertical lines and subtle silver current motif, composed hands-at-rest pose, smaller dark updo or short shaped hairstyle, tiny metal clasp. Avoid harbor cape, turquoise coat, coral, notebook, whistle.
>
> Silvo: distinctly practical short layered jacket with forest green and ochre, a small closed field-notebook pouch; compact easy-moving shape. Avoid dark navy, long robe, and insect costume.
>
> Brando: broad squared silhouette, short petrol-blue council jacket with clean amber seams and a flat metal clasp, sturdy stance, distinct close-cropped dark hair. Avoid bulky armor and tool-heavy workshop outfit.
>
> Luce MUST look clearly different from Selene in the reference: use short neat dark auburn or espresso hair, no braid, no long hair, no lens, no prism, no glasses. Make a slim but sharp tailored ivory-and-plum silhouette with a short structured jacket over dark plum trousers and one understated silver line clasp, a thoughtful but upright pose. Avoid long coat, long scarf, layered flowing robe, lilac hair, purple braid. Keep each design immediately distinguishable by silhouette, hair, body proportions, garment construction and pose—not color alone.
>
> Canon does not specify character genders; use natural open presentations without stereotypes. Keep Nerea of the Council visually distinct from Nerea of Portolume. Render in the references' soft polished warm storybook-painted 2D illustration style, gentle highlights, subtle depth, rounded readable shapes, calm League setting implied only through clothing, not background. Genuine RGBA alpha transparency. Clean antialiased boundaries. No floor, cast shadow, glow, chromatic aberration, red/green fringe, stray pixels, background, checkerboard, scenery, border, words, logos, watermarks, extra people, pixel art, photorealism, 3D, dramatic perspective, side/back views.

## Alpha and cell-foot review

The source PNG has genuine alpha (transparent corners) and an exact square 2×2 canvas. A static crop inspection confirms dimensions divide exactly into four 627×627 frames. Alpha≥128 silhouette bounds, in local cell coordinates, are:

| Frame | Character | Bounds `(x0,y0)–(x1,y1)` | Crop check |
|---:|---|---|---|
| 0 | Nerea (Council) | `(238,9)–(489,627)` | within cell; feet reach final pixel row |
| 1 | Silvo | `(142,18)–(418,627)` | within cell; feet reach final pixel row |
| 2 | Brando | `(196,0)–(531,615)` | within cell; hair touches first pixel row |
| 3 | Luce | `(160,9)–(416,615)` | within cell |

The cell rectangles are isolated source crops; no silhouette bounding box exceeds its own cell and no neighboring figure is carried into a frame. The Nerea and Silvo feet sit on the cell's last row, and Brando's hair begins on its first row, but those pixels belong to their complete crop and do not overlap the adjacent frame.

To compare the transparent-viewer red fringe against approved gym atlases, pixels were classified with the project QA threshold `R > 180 && R > 2*G && R > 2*B`:

| Alpha range | Council atlas red pixels | Gym atlas A red pixels | Gym atlas B red pixels |
|---|---:|---:|---:|
| 1–15 | 1,233 / 36,855 | 3,921 / 41,331 | 3,488 / 70,589 |
| 16–127 | 0 / 8,303 | 0 / 9,862 | 0 / 9,208 |
| 128–254 | 4 / 402,404 | 521 / 353,685 | 2,518 / 448,140 |
| 255 | 0 / 934 | 0 / 925 | 0 / 532 |

Strong red is confined almost entirely to the lowest-alpha band (1,233 pixels); only four such pixels occur in alpha 128–254 and none in fully opaque pixels. This matches the low-opacity color behavior of the already accepted atlases and is not evidence of a visible halo after compositing. The browser composite confirms clean boundaries.

Foot anchors were measured per 627×627 cell using the alpha≥128 silhouette. The horizontal anchor is the midpoint between weighted shoe centers in the lower 8% band; narrow coat/accessory runs were excluded. Vertical origin is the bottom of the visible silhouette. Values are rounded to four decimal places:

| Frame | Character | Left/right shoe centers (cell px) | Anchor (x, y) |
|---:|---|---:|---:|
| 0 | Nerea (Council) | 327.6 / 448.4 | 0.6188, 1.0000 |
| 1 | Silvo | 229.1 / 371.2 | 0.4787, 1.0000 |
| 2 | Brando | 289.6 / 482.2 | 0.6154, 0.9809 |
| 3 | Luce | 225.8 / 375.9 | 0.4799, 0.9809 |
