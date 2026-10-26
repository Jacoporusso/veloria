# R06 Anello Magnetico — illustrated 2D candidate v3

ImageGen edit of the existing R06 v2 scene, using the approved R05 v3 illustration as a style reference only and a temporary Tiled-coordinate guide for the final route alignment. The guide and rejected iterations remain outside the repository. This is a new scenery image binding only; map geometry, collision, encounter triggers, exits, NPCs and interactions are unchanged.

## Files

- Source: `assets/sources/veloria-r06_anello_magnetico-illustrated-v3.png` (1448×1086 PNG, RGB; SHA-256 `343d2db91038f3a89af04db7160a95320a427964dcae75e8857820bf32336516`)
- Runtime: `public/assets/scenery/veloria-r06_anello_magnetico-illustrated-v3.webp` (1448×1086 lossless WebP, RGB; SHA-256 `6e2d376164b5a380e06531eb9a426a6d1c23ee62264906b77667ce6a33110ff8`)
- Edit target: `assets/sources/veloria-r06_anello_magnetico-illustrated-v2.png`
- Style reference: `assets/sources/veloria-r05_viadotto_ciliegi-illustrated-v3.png`
- Tiled map: `public/tilemaps/r06_anello_magnetico.tmj` (40×30 cells, 32×32 px)

## Static alignment

The background object remains `(0,0)`, `1280×960`, `renderDepth -4`. The west exit is x0/y14–16 and the east exit is x39/y24–26. The west route follows rows14–16 and turns south around x19–21; the lower route meets the east edge in the east trigger band, with its visible center near tile row24.2. Root approved this candidate for traversal QA; verify the actual player reaches the east trigger at row24 or 25. The elevated railway remains distinct across x5–34 at row8. Four encounter habitats remain visually open at NW x3–7/y3–7, NE x29–33/y3–7, SW x3–7/y20–23 and SE x29–33/y20–23. The sign `(11,15)`, instrument `(18,15)` and Iris `(21,16)` are not baked into the image.

Source and runtime are both 1448×1086 (4:3), matching the 40×30 world area's 4:3 ratio. Their RGB pixels compare equal after lossless WebP conversion. This verifies asset parity and static composition only; no browser, build, collision, traversal, cache, offline or service-worker verification was run.

## Final edit prompt

> Edit the existing R06 Anello Magnetico background into a soft, matte, modern illustrated 2D scene. Use R05 v3 only as a style reference. Preserve the 40×30 composition, two exits and four habitat locations. Keep the WEST exit at x0/y14–16 and EAST exit at x39/y24–26. Connect the west path along y14–16 to the central area, continue south around x19–21, then turn east and reach the east edge through rows24–26. Keep the central route legible and the eastbound segment centered on the actual trigger band. Preserve the elevated rail as a narrow structure across x5–34 at row8, visually separate from the ground path. Use light compacted earth, sparse stones, readable grass, restrained foliage and soft daylight. Keep four distinct open habitat clearings at NW x3–7/y3–7, NE x29–33/y3–7, SW x3–7/y20–23 and SE x29–33/y20–23. Remove the glossy paving, ornate center medallion and nested circular decorations. Leave tiles (11,15), (18,15), and (21,16) clear for runtime sign, measuring instrument and Iris. Do not bake NPCs, props, signs, sensors, encounter glyphs, symbols, labels, text or UI. No fake exits or extra ground routes. Full image, same framing, no crop.

The candidate is approved for runtime traversal and rendered-surface QA, not yet accepted as passed QA.
