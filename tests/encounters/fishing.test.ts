import assert from 'node:assert/strict';
import test from 'node:test';
import { castFishingLine } from '../../src/core/encounters/fishing.ts';
import type { FishingSpot } from '../../src/core/encounters/fishing.ts';
import type { EncounterSpeciesRegistry, EncounterTable } from '../../src/core/encounters/select-encounter.ts';

const species: EncounterSpeciesRegistry = { '25': { speciesId: 25 }, '26': { speciesId: 26 } };
const table: EncounterTable = {
  id: 'portolume/dock-fishing', mapId: 'portolume', version: 1, status: 'prototype', method: 'fishing',
  timeBands: {
    morning: [{ speciesId: 25, weight: 1, minLevel: 2, maxLevel: 2 }],
    day: [{ speciesId: 25, weight: 1, minLevel: 3, maxLevel: 3 }],
    night: [{ speciesId: 26, weight: 1, minLevel: 4, maxLevel: 4 }],
  },
};
const spot: FishingSpot = {
  id: 'portolume/dock', mapId: 'portolume', encounterTableId: table.id,
  requiredItemId: 'item/fishing-rod', requiredFlags: ['met/fisher'], biteChance: 1,
};
const options = (overrides: Partial<Parameters<typeof castFishingLine>[0]> = {}) => ({
  spot, mapId: 'portolume', inventory: { 'item/fishing-rod': 1 }, flags: ['met/fisher'],
  hasReadyCreature: true, rngState: 123456, localHour: 12, table, species, ...overrides,
});

test('casts deterministically and resumes from serialized RNG state', () => {
  const first = castFishingLine(options());
  assert.equal(first.kind, 'encounter');
  if (first.kind !== 'encounter') return;
  const resumed = castFishingLine(options({ rngState: JSON.parse(JSON.stringify(first.nextRngState)) as number }));
  assert.deepEqual(resumed, castFishingLine(options({ rngState: first.nextRngState })));
});

test('zero and one bite chances consume exactly the encounter check draw', () => {
  assert.deepEqual(castFishingLine(options({ spot: { ...spot, biteChance: 0 } })), { kind: 'no-bite', nextRngState: 3044438244 });
  const always = castFishingLine(options({ spot: { ...spot, biteChance: 1 } }));
  assert.equal(always.kind, 'encounter');
  if (always.kind === 'encounter') assert.equal(always.encounter.speciesId, 25);
  const zeroSeed = castFishingLine(options({ rngState: 0, spot: { ...spot, biteChance: 0 } }));
  assert.deepEqual(zeroSeed, { kind: 'no-bite', nextRngState: 1085196063 });
});

test('encounter selection uses the documented exact time-band edges', () => {
  const cases: [number, string, number][] = [[4, 'night', 26], [5, 'morning', 25], [10, 'morning', 25], [11, 'day', 25], [19, 'day', 25], [20, 'night', 26], [0, 'night', 26]];
  for (const [localHour, band, speciesId] of cases) {
    const result = castFishingLine(options({ localHour }));
    assert.equal(result.kind, 'encounter');
    if (result.kind === 'encounter') {
      assert.equal(result.encounter.band, band);
      assert.equal(result.encounter.speciesId, speciesId);
    }
  }
});

test('denied casts preserve RNG for wrong map, missing gear, missing flag, and no ready creature', () => {
  const cases = [
    [options({ mapId: 'elsewhere' }), 'wrong-map'],
    [options({ inventory: {} }), 'missing-equipment'],
    [options({ flags: [] }), 'locked'],
    [options({ hasReadyCreature: false }), 'exhausted'],
  ] as const;
  for (const [input, reason] of cases) assert.deepEqual(castFishingLine(input), { kind: 'blocked', reason, nextRngState: input.rngState });
});

test('rejects malformed spot data and tables with the wrong identity or method', () => {
  assert.throws(() => castFishingLine(options({ spot: { ...spot, id: ' ' } })), /non-empty IDs/);
  assert.throws(() => castFishingLine(options({ spot: { ...spot, requiredFlags: [''] } })), /requiredFlags/);
  for (const biteChance of [-0.1, 1.1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => castFishingLine(options({ spot: { ...spot, biteChance } })), /biteChance/);
  }
  assert.throws(() => castFishingLine(options({ table: { ...table, id: 'other' } })), /identity or map/);
  assert.throws(() => castFishingLine(options({ table: { ...table, mapId: 'elsewhere' } })), /identity or map/);
  assert.throws(() => castFishingLine(options({ table: { ...table, method: 'surf' } })), /fishing method/);
});

test('does not mutate any nested input', () => {
  const input = options();
  const before = structuredClone(input);
  Object.freeze(input.spot.requiredFlags);
  Object.freeze(input.spot);
  Object.freeze(input.inventory);
  Object.freeze(input.flags);
  Object.freeze(input.table.timeBands.morning[0]);
  Object.freeze(input.table.timeBands.day[0]);
  Object.freeze(input.table.timeBands.night[0]);
  Object.freeze(input.table.timeBands.morning);
  Object.freeze(input.table.timeBands.day);
  Object.freeze(input.table.timeBands.night);
  Object.freeze(input.table.timeBands);
  Object.freeze(input.table);
  Object.freeze(input.species['25']);
  Object.freeze(input.species['26']);
  Object.freeze(input.species);
  castFishingLine(input);
  assert.deepEqual(input, before);
});
