# Adding a playable map

Playable areas are authored in Tiled as orthogonal `.tmj` files using 32 × 32 px tiles. Keep visual tile data and object data in Tiled; keep stable IDs, spawn points, and map connections in the adjacent `*.map.json` `MapDefinition`.

## Files

- Put map metadata in `content/maps/<map-id>.map.json`.
- Put its Tiled file in `public/tilemaps/<map-id>.tmj` and set `tiledAsset` to `tilemaps/<map-id>.tmj`.
- `map-registry.ts` discovers every `*.map.json` in this folder automatically. A new map does not need a scene or renderer change.

## Tiled layers

The renderer expects `ground` and `terrain_detail` tile layers, plus these object layers:

- `collision`: rectangles that block player movement.
- `characters`: NPCs and other moving characters.
- `canopy_overhead`: trees and objects drawn above the player when appropriate.
- `interactions`: houses, signs, rocks, and landmarks.
- `triggers`: map exits and area message triggers.

`shadows` is available as an optional visual layer. Keep object coordinates aligned to the 32 px tile grid where practical.

## Object properties

Use the Tiled custom property `kind` to select a renderer:

- `npc`: set `npcId` to a stable content ID. `prof_elia`, `nilo`, and `trainer_route01_*` currently have dialogue handlers.
- `house`, `tree`, `sign`, `mill-wheel`, and `rock`: rendered as landmarks. Object names provide their visible labels.
- `triggers`: set `kind` to `map-exit` or `message`. For a map exit, set both `destinationMapId` and `destinationSpawnId`; add `requiredFlag` to gate it. For an area message, set `message`. Message zones show once each time the player enters them.

Add matching `spawns` and `connections` in the MapDefinition. Spawn coordinates must be inside the Tiled map and outside collision objects; each destination spawn ID must exist in its target map. Map IDs and spawn IDs are persistent save data, so do not rename them after players have saved.

Run `python tools/validate_examples.py` and `npm run build` after adding a map. The validator checks Tiled layers, dimensions, tile size, spawn positions, blocked spawns, and that every functional exit has a corresponding MapDefinition connection.
