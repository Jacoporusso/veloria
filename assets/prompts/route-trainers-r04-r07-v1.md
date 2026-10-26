# Route trainers R04–R07 — illustrated atlas v1

Generated with built-in ImageGen as a 2×2 RGBA character atlas. The frame order is Nila / Oren / Iris (R06 trainer) / Dario. The atlas is bound to four existing NPC identities without changing their narrative IDs, dialogue, trainer records, Tiled positions, collision, or battle behavior. The canvas is 1254×1254, split into four 627×627 cells. The lossless WebP has identical decoded alpha and visible RGBA pixels; only RGB values under fully transparent pixels differ.

## Files

- Source: `assets/sources/veloria-route-trainers-r04-r07-v1.png` (1254×1254 RGBA; SHA-256 `a7b805ec250bd5459143aaec2d4d72358f5d07f3e319057fea536d2c389b09d3`)
- Runtime: `public/assets/sprites/veloria-route-trainers-r04-r07-v1.webp` (1254×1254 lossless WebP, RGBA; SHA-256 `616d9c9ec6310eb710974af96cd4e8842ec86448afddef65fb0c878da8ffb3fa`)
- Map bindings: R04 Salita dei Petali, R05 Viadotto dei Ciliegi, R06 Anello Magnetico, and R07 Condotto Risonante
- Narrative references: `content/dialogue/world.v1.json` and the respective trainer records under `content/trainers/`

## Identity mapping and foot anchors

| Frame | Profile ID | Stable NPC/dialogue ID | Alpha bbox within cell, alpha ≥128 | Tiled origin |
|---|---|---|---|---|
| 0 | `route-trainer-nila` | `nila_r04` | `(227,88)–(473,596)` | `(0.558,0.951)` |
| 1 | `route-trainer-oren` | `oren_r05` | `(153,75)–(434,602)` | `(0.468,0.960)` |
| 2 | `route-trainer-iris-r06` | `r06_iris` | `(240,42)–(504,561)` | `(0.593,0.895)` |
| 3 | `route-trainer-dario` | `r07_dario` | `(172,44)–(448,565)` | `(0.494,0.901)` |

The catalog stores each identity separately and connects it to the authored `npcId` and dialogue ID. The concept's apparent gender, age, clothing, and body shape are art proposals only; none of these details is stated in the narrative sources. Iris the R06 trainer remains distinct from Delta Biologist Iris (`delta_iris`). Oren remains distinct from Ivo and Rami; the route trainer is not a railway employee.

## Style and alpha review

The atlas uses individual traveler silhouettes with distinct palette and prop cues: Nila's pale petal accents and travel bag; Oren's slate/berry field jacket and binoculars; R06 Iris's petrol/mineral training layers and compass clasp; Dario's charcoal/copper route outfit and wrist wraps. These details support the character briefs but do not add narrative facts. No names, labels, scenery, or map markers are baked into the atlas.

The RGBA source has transparent corners and graduated alpha edges. Native composites on light and dark flat backgrounds showed clean edges without obvious colored fringes. This is a static image check; browser-scale compositing, in-game anchor, screen placement, and portrait/landscape visibility remain to be checked by the root's visual QA.

## Prompt

> Create a transparent 2×2 atlas of four distinct full-body optional route trainers in the approved modern illustrated 2D style: matte painterly shading, readable silhouettes, soft light, no pixel art, no 3D gloss. Each character stands alone in one equal-sized cell, with clear transparent margins and shoes visible for foot anchoring. Top-left: Nila of R04, pale practical travel layers, gentle pink petal accents, a route bag and reflective clasp. Top-right: Oren of R05, a robust field-trainer silhouette in slate and muted berry layers with binoculars and a backpack; he is a traveler, not railway staff. Bottom-left: Iris the optional R06 trainer, distinct from Delta Biologist Iris, in practical petrol/mineral-gray training layers with a small compass clasp. Bottom-right: Dario of R07, charcoal and copper practical trainer clothes, wrist wraps and a friendly confident stance. Distinguish all four through silhouette and prop as well as color. Do not infer canonical gender or age from names; apparent age and presentation are visual proposals only. No text, labels, panels, ground shadows outside the character silhouette, logo or watermark. Keep all four feet visible and leave generous per-cell gutters for a 2×2 atlas.

No browser, build, or gameplay test was run during this integration.
