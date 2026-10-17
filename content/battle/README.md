# Battle content

Species, moves, items, trainer teams and progression values live in versioned JSON. IDs are stable and the runtime registry is built by `src/game/battle/catalog.ts`.

`progression.v1.json` contains the currently active, **provisional** growth curves. The battle core interprets `exponent` and `multiplier` as the difference between consecutive cubic total-XP thresholds; `experience` in a creature save is the carry toward its next level. Every species must name a registered `growthCurveId`. New curves should be introduced under a new ID and playtested against the first-act encounter and leader targets before the prototype is replaced.

The active catalog currently has no evolution rules (`evolutions` is intentionally empty). The battle core supports versioned level-triggered transformations, but the production catalog must stay empty until the target has reviewed original battle art and all species data needed by the runtime. The roster currently contains imported names/data without reviewed creature art, so it is not yet a supported target. Do not activate an evolution solely from external source data. A future content pack should add `fromSpeciesId`, `toSpeciesId`, `minimumLevel` and `assetId` entries under `evolutions` in `progression.v1.json`; validation must resolve the source, target and registered art before enabling them.
