# Borgofonte illustrated buildings v1

Mode: built-in ImageGen. Original transparent 2D environment atlas, generated 2026-10-17 for Veloria. Four frame positions are stable and assigned in Tiled: 0 Casa di Borgofonte, 1 Emporio, 2 Laboratorio di Elia, 3 Officina. The atlas is registered as prototype art; human visual review remains pending.

## Prompt

Use case: stylized-concept
Asset type: transparent 2D illustrated environment sprite atlas for a modern family adventure game, displayed as small top-down RPG map buildings.
Primary request: one exact 2 by 2 atlas of four distinct original village building sprites for fictional Veloria, square 1024 by 1024 image, equal 512 by 512 cells. Cell order: top-left cozy Borgofonte family home; top-right little village emporium; bottom-left botanical research laboratory for a friendly professor; bottom-right crafts workshop.
Scene/backdrop: none; each building isolated on truly transparent alpha, viewed from above at a clear top-down three-quarter game-map angle, front facade faces the bottom edge and roof visible behind facade.
Style/medium: polished contemporary hand-painted 2D game illustration, smooth dimensional painted shading, crisp readable silhouettes, fine but not noisy detail, premium illustrated indie adventure game, welcoming for children, clearly not pixel art, not 3D render, not flat geometric vector.
Composition/framing: exactly four complete buildings, one centered in each equal cell, same scale and camera, complete roof, walls, foundation and front steps visible within each cell with slight transparent margin. Each is a wide low village structure, readable when displayed at about 192 by 160 game pixels. No overlap across cells.
Lighting/mood: soft warm daylight from upper left, gentle highlights and very subtle contact shadows immediately beneath each building only.
Color palette: warm cream stone, honey wood, muted terracotta, deep teal, sage, mint, a little copper; soft and vivid enough for a children’s game.
Materials/textures: painted roof tiles and wood grain with refined detail. Family home has flower windows and charming gable; emporium has green striped awning and tidy shop window; laboratory has distinctive glass botanical roof lantern, brass and teal details while remaining a village house; workshop has timber gable, copper tools emblem without lettering.
Constraints: four clearly different original architectural illustrations. Consistent orientation and scale. True transparent background, no checkerboard pattern; preserve transparent alpha outside each complete building.
Avoid: pixel grid, retro 8-bit or 16-bit style, isometric diamond floor, landscape scene, grass patches, roads, fences, characters, animals, labels, words, letter-like signs, frames, panel dividers, any background color, checkerboard, watermark.

## Integration

public/assets/sprites/veloria-borgofonte-buildings-v1.png is a 1254 x 1254 RGBA atlas; Phaser slices its equal 627 x 627 cells at render time. Tiled house objects use houseSprite and houseFrame (0–3). Their world bounds, collision geometry, labels, entry triggers, and dialogue remain in Tiled. No save schema or gameplay rules changed.
