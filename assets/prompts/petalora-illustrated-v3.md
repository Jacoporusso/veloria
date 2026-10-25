# Petalora — illustrated 2D candidate v3

This is an approved illustrated background candidate for Petalora. It was generated with the built-in ImageGen editing tool, reviewed against `public/tilemaps/petalora.tmj` and `docs/32_EARLY_MAP_ART_CONSTRAINTS_v0.1.md`, and then bound to the map's scenery-image render asset. This is one map-art iteration; it does not mean Petalora or the full-world redesign is complete.

## Files and provenance

- Source: `assets/sources/veloria-petalora-illustrated-v3.png` (1461×1077 PNG, RGB; SHA-256 `5f153bea37657b276639019c8eac7491c51fc7ec38305c7b6b1e835387cc4366`)
- Runtime image: `public/assets/scenery/veloria-petalora-illustrated-v3.webp` (1461×1077 lossless WebP, RGB; SHA-256 `0902cd872f3e2b70d81a3772f69789725afdb4c5177ceaff68e48df896dbec8a`)
- Edit target: `assets/sources/veloria-petalora-illustrated-v2.png`
- Style-only references: `assets/sources/veloria-r02_viale_fronde-illustrated-v3.png`, `assets/sources/veloria-borgofonte-illustrated-v3.png`, and `assets/sources/veloria-radicelmo-illustrated-v3.png`
- Map canvas: `public/tilemaps/petalora.tmj` (38×28 cells, 32×32 px; image aspect ratio 1.3565 vs map ratio 1.3571)

The decoded PNG and WebP were compared as RGB arrays: both are 1461×1077 and pixel-identical. Map binding updates only the scenery-image asset key/path; the Tiled image object remains at (0,0), 1216×896, renderDepth -4. No collision, trigger, encounter, spawn, quest, NPC, map layout, cache, service-worker, registry, parity manifest, or version data was changed.

## Static alignment review

The vertical route is centered in the x17–19 corridor and continues from the north edge to the south edge. The east branch crosses rows y11–13 and reaches the east map edge. The west side has a short approach from the community-center door to the main axis; it does not continue as a second west-edge road. The shop door has a visible approach to the same east–west branch. The doors retain their Tiled footprints: community center `[7,3,6,5]` and shop `[25,3,6,5]`.

The only water crossing is the central bridge over water rows y17–18. Static grid review confirms the three logical crossing centers x17.5, 18.5, and 19.5 are over the deck; adjacent centers x16.5 and x20.5 are outside the walkable deck. The outer posts/rails are decorative and extend beyond the 3-cell walkable deck, so the art's outer pixel bounding box should not be read as a 3-cell collision mask. Root's game-path QA is responsible for confirming traversal through all three logical lanes and access to both services; this document does not claim those runtime paths passed.

Runtime locations remain background-only: Ivo at `(19,8)`, the sign at `(17,9)`, monorail at `(24,13)`, and arrival at `(24,14)` are not baked into the image. The image contains no NPCs, signs, markers, sensors, monorail props, text, or UI.

## Image edit iterations

1. The first layout pass established the cherry-town palette, compacted-earth routes, houses, canal, and bridge. It incorrectly painted a westward road through the map edge.
2. A style pass referenced the approved matte 2D Radicelmo art, but kept the west-edge road.
3. A topology edit removed that false west-edge route while retaining the east branch and the short service approach from the left building.
4. A final localized edit restored a short community-center approach that joins the central axis without creating another map exit. The approved result keeps the bridge, axis, east branch, houses, and runtime object spaces aligned with the Tiled constraints.

## Final image prompt

> Edit the current Petalora map image. Use the supplied R02 v3, Borgofonte v3, and Radicelmo v3 images as style references only, never as layout sources. Keep a modern illustrated 2D look with matte painterly forms, soft light, readable foliage, and pale compacted-earth paths with sparse stones. Preserve the exact map composition and Tiled geometry: 38×28-cell layout; central north–south route in columns x17–19; east branch at y11–13 to the east edge; one water crossing only at x17–19 over water rows y17–18; community center footprint [7,3,6,5] and shop footprint [25,3,6,5], each with a short visible door approach to the central/east–west route. Do not extend the east–west road to the west boundary. Keep all routes and open service approaches readable and continuous. Bridge posts and rails may be decorative overhangs; keep the walkable deck aligned to the three central lane positions. Leave Ivo (19,8), the sign (17,9), monorail (24,13), and arrival (24,14) as clear background only. Do not bake NPCs, signs, markers, sensors, monorail objects, text, UI, or additional crossings. No pixel art, 3D, glossy surfaces, dense paving, new roads, buildings, or obstacles.

No browser, build, or gameplay test was run by this image task. Static raster/Tiled alignment and lossless-format parity were checked; runtime traversal QA remains pending.

## Runtime QA finale0.3.141

Tre corsie attraversate con input UI e posizioni salvate verificate a ogni passo; screenshot al centro delle colonne17/18/19 revisionati da root. Raggiunti i prompt di cure, bottega e monorotaia. Rendering portrait/landscape verificato sia con animazioni complete sia ridotte; fondale decodificato anche nella cache PWA senza rete.
