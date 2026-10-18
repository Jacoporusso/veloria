# Borgofonte illustrated plants v1

Mode: built-in ImageGen. Original transparent 2D environment atlas, generated 2026-10-17 for Veloria. Four frame positions in a 2×2 atlas: 0 sage shrubs with cream flowers; 1 meadow grass with pink/yellow flowers; 2 fern and broadleaf plants with lavender buds; 3 mossy stones with tiny white flowers.

## Prompt

Use case: stylized-concept
Asset type: reusable transparent 2D environment sprite atlas for a polished modern illustrated family adventure game.
Primary request: one exact 2 by 2 square sprite atlas with four distinct small decorative plants and ground clusters for the grassy village of Borgofonte in Veloria. Cell order: top-left rounded clump of sage and mint shrubs with a few cream flowers; top-right low soft jade grass tufts with small pink and pale yellow wildflowers; bottom-left a compact fern and broadleaf plant cluster with a few tiny lavender buds; bottom-right a little cluster of smooth warm stones, moss and two tiny white flowers.
Scene/backdrop: no scene, each single prop isolated on true transparent alpha.
Style/medium: premium contemporary hand-painted 2D game illustration, elegant soft dimension and crisp clean silhouette, same visual language as refined painted village buildings, NPCs and canopy in Veloria; clearly not pixel art, not flat vector, not 3D render, not photorealistic.
Composition/framing: exactly four individual plants, one centered inside each equal square cell of a 1024 by 1024 PNG atlas; consistent top-down three-quarter map view; each prop fills most of its cell but stays fully within it, clear silhouette at 48 to 64 pixels display size, no overlap between cells. Ground view from above with only a small subtle contact shadow attached directly below the object. Preserve true transparency around each plant.
Lighting/mood: gentle warm daylight from upper left, luminous and welcoming.
Color palette: jade, mint, sage, cream, tiny coral-pink and lavender accents, warm muted stone.
Materials/textures: layered soft leaves with a few painted veins, natural variation, restrained detail suited for mobile scale.
Constraints: four separate original Veloria decorations, no background and no checkerboard pattern; true transparent alpha outside the objects.
Avoid: whole trees, tall objects, pots, buildings, characters, animals, letters, signs, labels, gridlines, panel borders, ground tiles, large cast shadows, checkerboard, background color, watermark, pixel art.

## Integration

public/assets/sprites/veloria-borgofonte-plants-v1.png is a 1254 × 1254 RGBA atlas, sliced into equal cells at runtime. Borgofonte declares the image in renderAssets and places eight 56 × 48 instances in the Tiled decorations object layer. They are decorative only; collision and movement use separate layers. Content version 0.3.27.
