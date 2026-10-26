import assert from 'node:assert/strict';
import test from 'node:test';
import encounterData from '../../content/encounters/r01_tall_grass.encounter.json' with { type: 'json' };
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import { encounterTimeBand, selectWildEncounter, validateTable } from '../../src/core/encounters/select-encounter.ts';
import type { EncounterSpeciesRegistry, EncounterTable } from '../../src/core/encounters/select-encounter.ts';

const table = encounterData as EncounterTable;
const species = speciesData.species as EncounterSpeciesRegistry;

test('uses the documented local-time band edges, including midnight wraparound', () => {
  const cases: [number, string][] = [
    [0, 'night'], [4, 'night'], [5, 'morning'], [10, 'morning'],
    [11, 'day'], [19, 'day'], [20, 'night'], [23, 'night'],
  ];
  for (const [hour, expected] of cases) assert.equal(encounterTimeBand(hour), expected, `hour ${hour}`);
  assert.throws(() => encounterTimeBand(-1), /0 to 23/);
  assert.throws(() => encounterTimeBand(24), /0 to 23/);
  assert.throws(() => encounterTimeBand(10.5), /0 to 23/);
});

test('same save RNG state and local hour select exactly the same weighted encounter', () => {
  const options = { table, species, localHour: 22, rngState: 0x1234abcd };
  const first = selectWildEncounter(options);
  const second = selectWildEncounter(options);
  assert.deepEqual(first, second);
  assert.equal(first.band, 'night');
  assert.ok([10, 16, 19, 13, 21, 29, 32].includes(first.speciesId));
  assert.ok(first.level >= 2 && first.level <= 5);
  assert.notEqual(first.nextRngState, options.rngState);
  assert.equal(options.rngState, 0x1234abcd, 'selection must not mutate the persisted seed');
});

test('weighted selection resolves each encountered species and rolls its inclusive level range', () => {
  const twoEntries: EncounterTable = {
    id: 'test/weighted', mapId: 'test/map', version: 1, status: 'prototype', method: 'special',
    timeBands: {
      morning: [{ speciesId: 16, weight: 1, minLevel: 1, maxLevel: 1 }, { speciesId: 19, weight: 3, minLevel: 4, maxLevel: 4 }],
      day: [{ speciesId: 16, weight: 1, minLevel: 1, maxLevel: 1 }],
      night: [{ speciesId: 19, weight: 1, minLevel: 4, maxLevel: 4 }],
    },
  };
  const highRollSeed = 0x40000000;
  const selected = selectWildEncounter({ table: twoEntries, species, localHour: 5, rngState: highRollSeed });
  assert.equal(selected.speciesId, 19);
  assert.equal(selected.level, 4);
  assert.equal(selected.band, 'morning');
});

test('rejects unresolved species and malformed intervals in any time band', () => {
  const missingSpecies: EncounterTable = {
    ...table,
    timeBands: { ...table.timeBands, night: [{ speciesId: 999, weight: 1, minLevel: 1, maxLevel: 1 }] },
  };
  assert.throws(() => validateTable(missingSpecies, species), /species 999.*species registry/);
  const invalidRange: EncounterTable = {
    ...table,
    timeBands: { ...table.timeBands, night: [{ speciesId: 21, weight: 1, minLevel: 6, maxLevel: 3 }] },
  };
  assert.throws(() => selectWildEncounter({ table: invalidRange, species, localHour: 21, rngState: 1 }), /invalid level interval/);
});
