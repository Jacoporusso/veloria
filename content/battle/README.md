# Battle content

Species, moves, items, trainer teams and progression values live in versioned JSON. IDs are stable and the runtime registry is built by `src/game/battle/catalog.ts`.

`progression.v2.json` contains official per-species XP tables: `totalExperience[level - 1]` is the total at that level. The core uses the difference between consecutive totals; saved `experience` remains the carry toward the next level. All 79 species name a canonical `growthCurveId` imported from `pokemon-species.growth_rate`. Four cached growth-rate resources provide all thresholds from 1 through 100. `tools/import_pokeapi_growth.py --check` reproduces tables, mappings and source checksums offline. Formula curves exist only for explicit synthetic rules and tests, not in the runtime content registry. Defeat reward coefficients remain a separate prototype rule. Prototype save compatibility is not guaranteed; no legacy curves or migration layer are provided.

The active catalog enables level evolutions in `progression.v2.json` and item evolutions in `item-evolutions.v1.json`. Each enabled target has runtime parameters, a supported HGSS learnset and registered artwork. Informational entries in `evolution-reference.v1.json` do not enable a branch by themselves: friendship, trade and other unsupported conditions remain reference data. New branches must resolve source, target, official condition and registered art, then pass progression, persistence and presentation checks before publication.


`MoveDefinition.recoilPercent` is damage-based ordinary recoil (currently Take Down only). Gen-IV rounding is floor with a minimum of 1 after actual damage; misses and immunity produce no recoil. KO resolution precedes XP to prevent a fainted user from evolving. Importing other negative-drain moves is intentionally rejected until their own semantics are implemented. The emergency move retains its separate max-HP prototype rule. Ruleset13; move catalog11 has79 supported official moves.
