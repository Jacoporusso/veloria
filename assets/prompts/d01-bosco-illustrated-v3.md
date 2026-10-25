# Bosco dei Veli — illustrated 2D candidate v3

Built-in ImageGen candidate generated 25 October 2026 from the v2 source map. It is now bound as the illustrated scenery image in this map's `MapDefinition` and Tiled scenery object only. This one-map iteration does not mark the world redesign complete; the asset registry, parity manifest, cache, and content version were not changed.

## Files

- Source: `assets/sources/veloria-d01_bosco_veli-illustrated-v3.png` (1536×1024 PNG, RGB; SHA-256 `036a043c133181eb377f6a59b6ab3a83707bacdba79304a73f6078589492caac`)
- Runtime-format candidate: `public/assets/scenery/veloria-d01_bosco_veli-illustrated-v3.webp` (1536×1024 lossless WebP, RGB; SHA-256 `ee5f7c0cde0f14fbbd5bb40dc40e45c56bff2497d036ebc12eba97413c49a648`)
- Edit target: `assets/sources/veloria-d01_bosco_veli-illustrated-v2.png`
- Gameplay layout checked against: `public/tilemaps/d01_bosco_veli.tmj`

## Tiled alignment review

The target is 30×20 cells (3:2). The ground-path color mask in the selected 1536×1024 source spans y45.02–60.16%; its bounding midpoint is y52.59%, against the Tiled road rows 9–11 (y45–60%, midpoint y52.5%). The alternative warm-earth threshold gives y45.12–59.86%. The road is continuous across the west and east edges. These measurements are raster-mask estimates, not collision validation.

The pond is visibly confined to the existing upper-right pool area, aligned approximately with Tiled water cells x22–26/y3–5 (x73.3–90% / y15–30%). Its shoreline is softly painted, so the illustrated edge is not a hard pixel mask. The open corridor x0–29/y9–11 and central clearing x8–22/y8–12 remain visibly clear. The two fern areas remain at [2,7,4,2] and [20,13,4,2]. Ada, sensor, plaque, sign and marker are not painted into the candidate.

This was a static image and coordinate review only. No browser, runtime, build, or gameplay path test was run. The Tiled object dimensions and Ada/sensor placement remain unchanged: Ada at (13,10), sensor at (17,10), plaque at (16,9), and sign at (2,10). The image is not evidence that all maps or characters have been redesigned.

## Prompt sequence

### Base edit

Edit the current Bosco dei Veli map background as a modern illustrated 2D overhead forest game environment. Keep the exact 30×20 composition and 3:2 ratio. Use a level orthographic north-up view, softly painted terrain, gentle warm daylight, a narrow pale-earth path and rich but readable foliage along the margins. Preserve the existing forest arrangement, tree/trunk groupings and two fern habitat areas. The west-to-east trail must be continuous through rows 9–11 (y45–60%, centered y52.5%) and the central clearing x8–22/y8–12 must remain open. Keep the single pond exactly at x22–26/y3–5 (x73.3–90%, y15–30%), bounded by its existing shore. Leave Ada (13,10), sensor (17,10), plaque (16,9), and sign (2,10) as clear ground because those are runtime objects. Do not draw NPCs, Pokémon, signs, sensors, plaques, icons, markers, UI, text, grid, buildings, new obstacles, new paths, or extra water. Avoid pixel art, 3D rendering and isometric perspective.

### Final pond adjustment prompt

> Use case: precise-object-edit. Asset type: 1536x1024, 30x20 orthographic map background. Primary request: Correct only the existing pond footprint in Image 1. Keep the road and every other pixel composition unchanged. Exact Tiled geometry: each tile is 5% of image width and height. The pond water is tiles x22–26 and y3–5, so the actual water must occupy the full rectangle x73.33%–90.0%, y15.0%–30.0% (pixel bounds about x1126–1382, y154–307). Image 1's clear-water core is too narrow on the east side and begins too far south. Expand/move the visible water so its irregular shoreline water body fits that exact rectangle. Do not extend any water beyond that rectangle; leave the rocky/fern margin outside it dry. Maintain one small calm woodland pool, not an oversized lake. Keep the road continuously open from left edge to right edge, centered at y52.5% within y45%–60%. Preserve all forest foliage, trunks, two fern habitat areas, open central clearing and light exactly. Keep Ada, sensor, plaque and sign as clear background ground only. No new water, paths, buildings, objects, characters, UI, text, grids, borders, 3D or pixel art.
