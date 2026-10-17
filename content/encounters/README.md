# Encounter tables

Each `*.encounter.json` is a versioned content file discovered by `src/game/battle/catalog.ts`. Keep stable `id` and `mapId` values, include a non-empty `morning`, `day`, and `night` pool, and reference species already present in `content/battle/species.v1.json`.

Encounter tables must declare `status: "prototype"` until encounter rates, levels, and weights have been playtested and approved. The `method` describes the authored encounter surface: use `tall-grass` for route grass and `woodland-understory` for forest floor zones. `encounterChance` belongs to each Tiled `encounter-zone`, not the table, so map areas can share content while using different rates.

Register each table ID in the matching `content/maps/*.map.json` `encounterTableIds`, then reference the same ID from its Tiled trigger. Run `python tools/validate_examples.py` and `npm test` after edits.
