# R01 east-exit alignment audit

24 October 2026. Follow-up to `r01-sentiero-alba-exit-raccordo-v3.md`. The request was to center the sole east-edge path mouth on Tiled exit `[29,8,1,1]`: x=98.3%, y=42.5% (pixel y=435.2 in the 1536×1024 artwork). The final ImageGen output was not integrated because it did not meet this target.

## Exact guide

A single headless Chrome canvas session over the original source read from `HEAD` produced `.tmp/r01-alignment-guide/r01-exit-guide.png`. It overlays a magenta road corridor and exit box over the original image. Its centerline connects `(26/30,10/20) → (28/30,9/20) → (29.5/30,8.5/20) → (30/30,8.5/20)`, with the mouth centered on y=42.5%. The guide itself was visually checked; no game page or test was opened.

## Failed guided edit prompt

The edit used ImageGen's built-in tool with the original Git image as image 1 and the canvas guide as image 2:

> Image 1 is the ORIGINAL Veloria R01 map background to edit. Image 2 is a temporary alignment guide over the same image. Treat image 2 as geometry only: remove all magenta color, the dashed line, box, dot, and text from the final result.
>
> Edit only the last 4 map cells at the east end of the existing dirt road. Replace that road's current straight eastward ending with ONE smooth continuous bend that follows the centerline shown in magenta in image 2: from grid coordinate (26/30,10/20), through (28/30,9/20), through (29.5/30,8.5/20), then across the east map edge at y=42.5%. The center of the visible road opening at the right border must align with the center of the magenta target box. Keep the same road width and soft pale compacted-earth material.
>
> The guide marks the main road's replacement route, not a second road. Remove the old horizontal road's continuation to the east at y50–60% in the final 4 cells and fill that lower edge area with matching grass/meadow. There must be exactly one road crossing the east border, centered at y=42.5%. Do not create an upper spur or a separate branch.
>
> Preserve all of image 1 everywhere else: composition, 3:2 proportions, water, trees, rocks, foliage, color, lighting, and orthographic painted style. No added objects, words, symbols, lines or markers.

Output: `C:/Users/jacop/.codex/generated_images/01a16e40-9a76-7c52-b71e-a5f8bd731fa9/exec-3f30e453-159b-4eb6-aaf4-630e7886e596.png`.

## Output measurements

RGB sampling of the last 36 columns found tan road pixels over approximately y=303–394, weighted center y≈342 (33.4%), plus separate small tan fragments around y=485 and lower down. The road was visibly above the 42.5% exit target and the lower route still suggested another eastward continuation. This was insufficient evidence for integration.

Other attempts in this audit are retained in the generated-image session directory and measured as follows:

| Output | Prompt focus | Right-edge observation |
|---|---|---|
| `exec-23b77c0e-c9ca-409b-9ff8-91a0f035b8c3.png` | set road mouth y=435 px | tan band center about y=382 px (37.3%) |
| `exec-e44d4ff7-d533-4b50-bb07-7a7da4e86de4.png` | move mouth down 55 px | an upper band centered y=355 px (34.7%) and a second east-edge band centered y=543 px (53.1%) |
| `exec-12c6254a-b219-482c-88e8-b26d617d8f24.png` | remove lower second road | tan band center about y=364 px (35.6%) |
| `exec-315816ff-56df-4920-adfd-1c307c1ca29e.png` | move mouth down 70 px | a large band centered y=579 px (56.6%); an upper branch remained |
| `exec-32b1927b-0491-4fb0-a2d7-3365c13ca387.png` | remove y=57% second connection | tan band center about y=328 px (32.0%) |

These measurements use a simple warm-dirt color filter over the last 36 pixels, so they locate painted road-like pixels, not collision or pathfinding. The rendered art was also inspected visually.

## Integration status

No candidate was integrated. `assets/sources/veloria-r01_sentiero_alba-illustrated-v2.png` and its WebP runtime derivative were restored byte-for-byte from `HEAD`; only the R01 hash/revision fields in `assets/map-parity-v2.json` were restored. Tiled metadata and geometry were left unchanged. The root task found that the physical map edges are open and plans to widen only the R01 east `map-exit` trigger over the painted path, preserving its destination and flags. This avoids claiming that the generated artwork reached the requested pixel target.
