# Adding a playable map

Playable areas are authored in Tiled as orthogonal `.tmj` files using 32 × 32 px tiles. Keep visual tile data and object data in Tiled; keep stable IDs, spawn points, and map connections in the adjacent `*.map.json` `MapDefinition`.

## Files

- Put map metadata in `content/maps/<map-id>.map.json`.
- Put its Tiled file in `public/tilemaps/<map-id>.tmj` and set `tiledAsset` to `tilemaps/<map-id>.tmj`.
- Start a new area with `python tools/scaffold_map.py` (example below). The command writes an isolated draft under `content/map-drafts/` and `public/tilemaps/_draft_<slug>.tmj`; these locations are excluded from runtime loading until the map is deliberately promoted.
- `map-registry.ts` discovers every `*.map.json` in this folder automatically. A new map does not need a scene or renderer change.
- New runtime maps use metadata `version: 2`. Declare every Tiled tileset and map-specific image in `renderAssets`. A tileset entry uses `kind: "tileset"`, a unique Phaser `key`, its public `path`, the exact Tiled `tiledName`, and its tile dimensions. An image entry uses `kind: "image"`, `key`, and public `path`; sprite atlases may add `atlas: { "columns": 2, "rows": 2 }` so frame geometry stays with the asset data. Shared keys may be repeated across maps only when the definitions match exactly.
- `battleBackgroundKey` is optional metadata for an image declared in that map's `renderAssets`; the battle scene crops it to fill the current viewport and keeps the UI over it. Maps without the field use the built-in arena backdrop. Reuse a shared key for maps with the same environment so images stay data-driven and deduplicated.
- Runtime metadata at `version: 1` remains loadable through a legacy asset mapping for the original Veloria terrain and landmark textures. Do not add v1 maps; use v2 for new content. The v1 schema remains unchanged for the stable `content/examples` contracts.
- Large terrain tilesets are edge-blended using their Tiled cell, margin and spacing metadata, then the static `ground` and `terrain_detail` layers are composed at world resolution before camera scaling. Keep those layers static; put animated grass, water and characters in their separate runtime layers. Map collision and interaction geometry remain independent of this visual pass.
- `ambientEffects` contains visual-only effects. `fireflies` uses an authored pixel area; `grass-sway` references Tiled trigger names whose `kind` is `encounter-zone`, so the effect follows the same patches without duplicating coordinates; `water-shimmer` uses an authored area covered by grid-aligned `water-*` collision objects. Effects must not change collision, encounter probability, or trigger behavior. Reduced animation quality keeps grass and water highlights static at lower intensity and draws no moving effects.
- Put non-interactive map imagery in an optional Tiled object layer named `decorations`. Use class/kind `scenery-image`, declare its image key in `renderAssets`, and set `renderDepth` when it must sit between tile layers and actors. The renderer keeps this layer out of interaction logic; the asset still belongs in `assets/ASSET_REGISTER.csv` and the offline precache.

## Tiled layers

The renderer expects `ground` and `terrain_detail` tile layers, plus these object layers:

- `collision`: rectangles that block player movement.
- `characters`: NPCs and other moving characters.
- `canopy_overhead`: trees and objects drawn above the player when appropriate.
- `interactions`: houses, signs, rocks, and landmarks.
- `triggers`: map exits, area message triggers, and quest events.

`shadows` is available as an optional visual layer. Keep object coordinates aligned to the 32 px tile grid where practical.

## Object properties

Use the Tiled custom property `kind` to select a renderer:

- `npc`: set `npcId` and `dialogueId` to stable content IDs. Dialogue text lives in `content/dialogue/`, not in the Phaser scene.
- `house`, `tree`, `sign`, `mill-wheel`, and `rock`: rendered as landmarks. Object names provide their visible labels; set `message` for the interaction text.
- `pickup`: set `itemId`, `questEvent`, `collectedFlag`, and an optional `failureMessage`. Define the `questEvent` and item reward in a versioned quest JSON; use the quest step flag for `collectedFlag` so collection remains idempotent and the pickup hides after reload. The player collects it by facing the object and pressing A.
- `hotspot`: an invisible interaction footprint over a baked room backdrop. Set `message` for reading or `serviceId` for a registered service. The background supplies the visible furniture; its collision rectangles are authored independently in `collision`. The player faces the furniture and presses A.
- Services: `pokemon_center` offers healing and storage; `rest_point` offers healing only (used by the bedroom bed). Both use the same pure party-healing service.
- `tree`: optional `sprite` selects an image key declared as an `image` in `renderAssets`; otherwise the renderer uses the legacy key `borgofonte-tree`, which must also be declared by that map. Add each image to `assets/ASSET_REGISTER.csv` and the relevant map metadata. `house` can use `houseSprite` with the same declaration and `houseFrame` for an atlas cell.
- `plant`: a decorative, non-colliding sprite instance in the `decorations` object layer. Declare its image and optional atlas grid in map `renderAssets`, then set `sprite`, `spriteFrame`, `x`, `y`, `width`, and `height` in Tiled. Collision geometry remains separately authored in `collision`.
- `sign`, `rock`, and `pickup` may select an illustrated image with Tiled `sprite` and `spriteFrame` properties. The selected image must be declared in map `renderAssets`; atlas dimensions belong to that image declaration. The renderer retains its simple vector fallback for maps without an illustrated sprite.
- `triggers`: set `kind` to `map-exit`, `message`, `quest`, or `encounter-zone`. For a map exit, set both `destinationMapId` and `destinationSpawnId`; add `requiredFlag` to gate it. For an area message, set `message`. For a quest event, set `questEvent` to a trigger declared in `content/quests/`; set optional `failureMessage` for out-of-order or locked events. Quest step order and prerequisites stay in quest JSON. Encounter zones set `encounterTableId` and an explicit `encounterChance` from 0 to 1; their table must be registered in the map metadata and encounter content. Message zones show once each time the player enters them.

Add matching `spawns` and `connections` in the MapDefinition. Spawn coordinates must be inside the Tiled map and outside collision objects; each destination spawn ID must exist in its target map. NPC `dialogueId` values must resolve in `content/dialogue/`; trainers use `trainerId` and `battleOnceFlag`, with optional `battleRequiredFlag` for a map quest prerequisite. Put shop and healing service IDs in object properties (`shopId`, `serviceId`). `resonance-plate` is a visual floor marker; its ordered behaviour remains in quest content and Tiled quest triggers. Map IDs and spawn IDs are persistent save data, so do not rename them after players have saved.

Interiors use the same map contract and loader as outdoor areas. Borgofonte's bedroom and laboratory use a declared `scenery-image` in `decorations` at depth -4 over empty tile layers. Keep a floor corridor between the doorway and furniture. Carve the exterior threshold out of building collisions, add a `map-exit` on that threshold, and place the reciprocal return spawn one tile in front of it. Spawn the visitor inside the room away from its exit trigger; entering and leaving must require deliberate movement, including after reload. No interior map IDs belong in the renderer or scene transition code.

If a doorway overlaps an area message, `map-exit` takes priority. Other overlapping triggers retain their authored order. This keeps ambient village descriptions from blocking doors.

Each map's `musicId` must resolve to a theme in `content/audio/themes.v1.json`. Themes are original procedural note patterns; adding or renaming a theme requires a content version/changelog update and must not introduce remote runtime audio.

## Create a draft

The scaffold uses a registered tileset and an existing audio theme, then emits MapDefinition v2 metadata and a Tiled JSON skeleton with the shared layer names. Project maps use 32 × 32 px tiles. For example, to start another forest area:

```sh
python tools/scaffold_map.py \
  --id veloria/r03_terrazze_muschio \
  --name "Terrazze del Muschio" \
  --biome forest \
  --tileset-key veloria-forest-ground \
  --tileset-path assets/tilesets/veloria-forest-ground-v1.png \
  --tiled-name veloria_terrain \
  --music-id ambient_forest
```

The command refuses reused IDs/paths, unregistered or missing tilesets, conflicting shared texture keys, unknown themes, and tile dimensions outside the 32 px project contract. Open the generated `_draft_*.tmj` in Tiled and author its terrain, collisions, exits, triggers, and decorations. Add the matching content references and reciprocal map connections before promotion. Then move the metadata to `content/maps/<slug>.map.json`, rename the Tiled file to `public/tilemaps/<slug>.tmj`, and ensure `tiledAsset` still matches. Register any additional media, add runtime images to offline precache, update `content/manifest.json` and `CHANGELOG.md`, then run `python tools/validate_examples.py`, the Python unit tests, and `npm run build`. A generated draft is only a starting skeleton; it is not a playable map until those checks pass.

Run `python tools/validate_examples.py` and `npm run build` after adding a map. The validator applies the published MapDefinition v1 schema to example maps and v1/v2 schemas to runtime maps, checks generated v2 metadata before writing drafts, then checks render asset files and license registration, Tiled tileset names/images/dimensions, offline precache entries, layers, spawns, collision, that quest triggers are reachable from a spawn, and that every functional exit is reachable and has a corresponding MapDefinition connection.

## Elevated rail decoration

`kind: elevated-rail` in the `decorations` layer draws a horizontal ivory/cyan guideway using the authored rectangle. It is cosmetic, with no train transport logic. Author its restricted movement footprint independently in `collision`; scenery and navigation must not infer each other. Vetracielo combines this with a registered transparent `scenery-image` station, keeping the services and interactions as separate reachable Tiled objects.
