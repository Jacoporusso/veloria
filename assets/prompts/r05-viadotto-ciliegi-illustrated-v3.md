# R05 Viadotto dei Ciliegi — illustrated 2D candidate v3 (bridge-foot extension)

ImageGen edit of the existing R05 v2 scene, with Petalora v3 used as a style reference only. The candidate was inspected against `public/tilemaps/r05_viadotto_ciliegi.tmj` and the redesign direction in `docs/58_FULL_WORLD_AND_CAST_REDESIGN_v0.1.md`. It is bound in `content/maps/r05_viadotto_ciliegi.map.json` and the Tiled scenery-image sprite property. The object remains at `(0,0)`, `1472×832`, renderDepth `-4`; gameplay geometry and paths were not edited.

## Files

- Source: `assets/sources/veloria-r05_viadotto_ciliegi-illustrated-v3.png` (1670×942 PNG, RGB; SHA-256 `2ba335864abf54f3f69140059985d969f82e881e9d868608d7042b4ec13974fc`)
- Runtime: `public/assets/scenery/veloria-r05_viadotto_ciliegi-illustrated-v3.webp` (1670×942 lossless WebP, RGB; SHA-256 `cac8195ae3076713dd932b98f50a22d6453e1d78452feae4477b6a0242a38d27`)
- Edit target: `assets/sources/veloria-r05_viadotto_ciliegi-illustrated-v2.png`
- Style reference: `assets/sources/veloria-petalora-illustrated-v3.png`
- Tiled map: `public/tilemaps/r05_viadotto_ciliegi.tmj` (46×26 cells, 32×32 px)

## Static alignment

The map's west exit is `[0,17,1,3]` and east exit is `[45,5,1,3]`. The west path mouth covers the first exit row, and the east path enters the middle exit row. The river occupies collision columns 22–24; rows 0–4 and 8–25 are blocked, leaving the only walkable crossing at rows 5–7. The final bridge deck is centered on and extends across that opening. Its posts and decorative rails extend beyond the 3×3 walkable corridor, so the outer image silhouette is not a collision rectangle. The upper elevated rail remains aligned over x1–44 at y2–3 and reads as infrastructure, not a footpath; it contains no train or station marker.

The lower wooden bridge deck was extended to about y295px, with the south bank/grass meeting it through about y320px. The expected feet projection for logical bridge row 7 is about y296px, so the floor continues under that projection. This is a static source-image measurement; in-game traversal still needs browser QA. The scene contains no visible NPC, trainer name, sign, encounter icon, habitat marker, text, UI, or watermark. Oren's real Tiled location and all trigger/encounter positions are unchanged. No runtime path, collision, browser, build, cache, or offline verification was run in this image task.

## Iteration notes

The first generated pass softened the path and removed glossy paving but dropped the elevated rail and left the crossing too far north. A second pass restored the elevated rail but moved the pedestrian deck too far south. The selected third pass used a temporary Tiled-aligned guide to put the deck on the x22–24/y5–7 opening and retain a distinct overhead rail. A later static QA review compared the logical foot projection with the rendered floor: the initial deck ended at y273px while row-7 feet project near y296px. The approved follow-up extends the deck to approximately y295px and meets the south bank through approximately y320px. The final source was generated from ImageGen edit `exec-e997b723-877e-4912-9555-f484c5153de2.png`; the source and lossless WebP dimensions are both 1670×942 and their RGB pixels compare equal. Temporary guides and rejected drafts stayed outside the repository. This candidate is not an assertion that the route has passed a real traversal test.

## Final edit prompt

> Edit the current R05 Viadotto dei Ciliegi image. Use Petalora v3 as a style reference only, never as a layout source. Keep the 46×26 map composition, cherry trees, water channel, vegetation masses, rocks, west bend, northbound trail, bridge, and east continuation. Use matte modern illustrated 2D forms, soft light, clear foliage and water, a pale compacted-earth trail, natural grass margins, and only sparse stones. Remove glossy metal, ornate tile medallions, and excessive paving detail. Align the exits exactly: west mouth x0/y17–19; east mouth x45/y5–7. The only walkable river crossing is x22–24 over y5–7, centered at row y6; blocked water starts at y8 below the crossing and at y4 above it. Keep the walkable deck continuously over that opening. Posts and rails can overhang decoratively, but do not depict any extra route across water. Preserve the elevated rail across x1–44 at rows y2–3 as a slim raised structure, visually distinct from a ground trail. No train, characters, NPCs, name labels, signs, encounter icons, habitat markers, text, UI, logo, watermark, or new paths/buildings.

The art candidate still requires browser traversal and visual rendering review before broader release acceptance. No cache, service-worker, registry, parity manifest, or content version was changed here.
