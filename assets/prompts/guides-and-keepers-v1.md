# Guides and keepers atlas v1 — Biancavetta, Passobrina, R14, Radicelmo

Built-in ImageGen atlas approved by root on 25 October 2026. Four unique narrative identities occupy a raw 2×2 RGBA atlas; the PNG is copied without pixel edits and the runtime WebP is a lossless conversion.

## Files and order

- Source: `assets/sources/veloria-guides-and-keepers-v1.png` (1254×1254 RGBA PNG; SHA-256 `b15e8a6d7ef81be4812147e22aab2a7c60e14b7df9187cb40cab15d0199f3231`)
- Runtime: `public/assets/sprites/veloria-guides-and-keepers-v1.webp` (1254×1254 lossless WebP; SHA-256 `be5233b441ece4f322c86133e88f9a039648c42fc1feedf9d09f8a47e18586cf`)
- ImageGen output: `exec-e72c8699-3665-42f9-90e0-f30873f04749.png`
- Grid: 2×2 cells, 627×627 each. Order: Biancavetta Guide / Passobrina Alpine Guide / Livia R14 / Leda Radicelmo.

## Canonical roles and proposed looks

- Frame 0 `biancavetta_guide`: local guide who discusses comparing altitude, temperature and time, and indicates services, gym and cable car. Local-guide appearance and outfit are proposals.
- Frame 1 `passobrina_guide`: alpine guide coordinating wind, temperature and snow readings before opening the white switchbacks. Mountain clothing is a proposal.
- Frame 2 `r14_guide` / Livia: guide at the Crystal Pass who directs the player among refuge, terraces and receiver. Hair and outdoor outfit are proposals.
- Frame 3 `radicelmo_keeper` / Leda: keeper of the greenhouse's ecological archive who guides seed and nursery tasks. Silver hair and gardening clothes are proposals.

The cited dialogue does not define visual appearance or age. Gender presentation, age impression, clothes, hair and body type are art-direction proposals, not canon. The profiles and Tiled objects use four distinct stable IDs and atlas frames.

## Foot anchors and QA limits

Origins use approximate midpoints between visible shoe contacts and the bottom contact rows per 627×627 cell: Biancavetta Guide `(0.504,0.937)`, Passobrina Guide `(0.467,0.944)`, Livia `(0.561,0.920)`, Leda `(0.530,0.924)`. No pixel edits were made. Browser compositing QA is still needed for alpha fringing, scale and foot placement.
