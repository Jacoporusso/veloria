# Coastal cast atlas v1 — Acquariva, Portolume, R08, Delta

Built-in ImageGen candidate approved by root on 25 October 2026. This is one raw RGBA 2×2 atlas with four distinct figures, ordered Tessa / Capitana Marina / Viola / Iris Delta. The original PNG is copied without crop, compositing, recoloring, or pixel editing; the runtime WebP is a lossless conversion.

## Files

- Source: `assets/sources/veloria-coastal-cast-v1.png` (1254×1254 RGBA PNG; SHA-256 `a3684901f5d8e8e8c63876ba2f10ced759696e857dd8900568722135341f525e`)
- Runtime: `public/assets/sprites/veloria-coastal-cast-v1.webp` (1254×1254 lossless WebP; SHA-256 `a4ad40c80baa730752df49765afb813030fdfE905b0dfdf45ed6d6f18ca7a440`)
- Raw ImageGen candidate: `exec-f900d763-82ed-4b74-84da-377fbb09e756.png`
- Atlas: two columns × two rows; frame size 627×627.

## Narrative assignments

- Frame 0: Tessa, Acquariva observatory researcher (`acquariva_tessa`). Her dialogue compares lake observations with Iris’s Delta report and emphasizes repeated measurements. Field jacket and sample bag are art proposals.
- Frame 1: Capitana Marina, Portolume captain (`portolume_captain`). Her dialogue introduces fishing and comparing tide observations with Ferraluce. Navy captain-style coat is an art proposal.
- Frame 2: Viola, optional R08 trainer (`r08_viola`). Her dialogue offers an optional type-focused battle before Portolume. Sport clothing is an art proposal.
- Frame 3: Iris, Delta biologist (`delta_iris`). Her dialogue guides three observations: current, reeds, and natural nursery. She is a different identity from trainer Iris of R06.

The four identities have unique profiles and frames. No gender or age is specified in the cited canon; apparent presentation and clothing are visual art direction proposals, not narrative facts. Tessa, Marina, Viola, and Delta Iris are bound only to their matching stable NPC and dialogue IDs.

## Anchors and QA limits

The profile origins use the midpoint of visible shoe contacts as a static estimate within each 627×627 cell: Tessa `(0.592,0.903)`, Marina `(0.546,0.911)`, Viola `(0.621,0.880)`, Iris `(0.570,0.887)`. Root has approved the identities and roles. Browser compositing QA is still needed to assess alpha-edge fringing, sprite-to-player scale, and foot placement. No character pixel cleanup was done.
