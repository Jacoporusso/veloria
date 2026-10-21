# Battle content

Species, moves, items, trainer teams and progression values live in versioned JSON. IDs are stable and the runtime registry is built by `src/game/battle/catalog.ts`.

`progression.v1.json` contains the currently active, **provisional** growth curves. The battle core interprets `exponent` and `multiplier` as the difference between consecutive cubic total-XP thresholds; `experience` in a creature save is the carry toward its next level. Every species must name a registered `growthCurveId`. New curves should be introduced under a new ID and playtested against the first-act encounter and leader targets before the prototype is replaced.

The active catalog enables level evolutions in `progression.v1.json` and item evolutions in `item-evolutions.v1.json`. Each enabled target has runtime parameters, a supported HGSS learnset and registered artwork. Informational entries in `evolution-reference.v1.json` do not enable a branch by themselves: friendship, trade and other unsupported conditions remain reference data. New branches must resolve source, target, official condition and registered art, then pass progression, persistence and presentation checks before publication.
