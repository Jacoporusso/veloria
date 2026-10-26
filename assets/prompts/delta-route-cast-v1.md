# Delta and mountain-route cast atlas v1

Built-in ImageGen atlas approved by root on 25 October 2026. Four distinct source-backed identities occupy one raw 2×2 RGBA atlas, ordered Teo / Celia / Ruben / Alma. PNG was copied without pixel edits; WebP is a lossless conversion.

## Files

- Source: `assets/sources/veloria-delta-route-cast-v1.png` (1254×1254 RGBA PNG; SHA-256 `98797b541dafd0ec45927a3001428189b99fb1551aa4bc0da7bf6634f3777698`)
- Runtime: `public/assets/sprites/veloria-delta-route-cast-v1.webp` (1254×1254 lossless WebP; SHA-256 `69c6fdae1b5ffabaf8d371005836d5505cc2f1f5114dd66b7771d897e924d713`)
- ImageGen output: `exec-5b149917-ab08-4a5b-98a3-d18c3f3ad259.png`
- Grid: 2×2 cells, each 627×627.

## Narrative bindings

- Frame 0 Teo (`delta_teo`): Delta naturalist who discusses ecological observation and dual-type resistances. Field vest and binoculars are art proposals.
- Frame 1 Celia (`r11_celia`): optional trainer on the waterfall route, before Selene. Teal/slate outdoor clothes are art proposals.
- Frame 2 Ruben (`r12_ruben`): optional trainer on the wind-valley route. Winter clothing is an art proposal.
- Frame 3 Alma (`r13_alma`): optional trainer on the white switchbacks, who points out type differences in snowy-route Pokémon. Winter clothing and braid are art proposals.

The source dialogue does not specify ages or physical appearance. Apparent gender, age, clothing, body type, hair and accessories are visual proposals, not canon. Teo, Celia, Ruben and Alma use distinct appearance IDs and atlas frames. In particular, Teo is separate from Delta biologist Iris.

## Foot anchors and QA limits

Origins are estimated from visible shoe-contact midpoints and the bottom contact rows within each cell: Teo `(0.587,0.966)`, Celia `(0.539,0.969)`, Ruben `(0.603,0.914)`, Alma `(0.452,0.930)`. Other Tiled collision, trainer, special-Pokémon, and quest objects were preserved. Browser compositing QA remains necessary for alpha-edge fringing and rendered scale/foot placement.
