import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { findSpeciesHabitats } from '../../src/core/party/habitats.ts';
import type { EncounterTable } from '../../src/core/encounters/select-encounter.ts';

const entry = (minLevel: number, maxLevel: number, weight = 10) => ({ speciesId: 170, minLevel, maxLevel, weight });
const table = (id: string, method: EncounterTable['method'], timeBands: EncounterTable['timeBands']): EncounterTable =>
  ({ id, mapId: 'veloria/coast', version: 1, status: 'prototype', method, timeBands });
test('groups real bindings by map and method, preserving periods and level ranges without mutating sources', () => {
  const tables = {
    a: table('a', 'fishing', { morning: [entry(20, 21)], day: [entry(22, 23)], night: [] }),
    b: table('b', 'fishing', { morning: [], day: [], night: [entry(24, 25)] }),
    c: table('c', 'tall-grass', { morning: [], day: [entry(15, 16)], night: [entry(90, 99, 0)] }),
    unused: table('unused', 'surf', { morning: [entry(80, 90)], day: [], night: [] }),
  };
  const before = structuredClone(tables);
  const result = findSpeciesHabitats(170, [{ id: 'veloria/coast', displayName: 'Costa', encounterTableIds: ['a', 'b', 'c'] }], tables);
  assert.deepEqual(result, [
    { mapId: 'veloria/coast', mapName: 'Costa', method: 'fishing', minLevel: 20, maxLevel: 25, timeBands: ['morning', 'day', 'night'] },
    { mapId: 'veloria/coast', mapName: 'Costa', method: 'tall-grass', minLevel: 15, maxLevel: 16, timeBands: ['day'] },
  ]);
  assert.deepEqual(tables, before);
  assert.deepEqual(findSpeciesHabitats(171, [{ id: 'veloria/coast', displayName: 'Costa', encounterTableIds: ['a'] }], tables), []);
  assert.deepEqual(findSpeciesHabitats(170, [{ id: 'veloria/elsewhere', displayName: 'Altrove', encounterTableIds: ['a', 'missing'] }], tables), []);
});

test('registered coast fishing and conduit grass report exact authored Chinchou and Wooper levels', () => {
  const read = (file: string) => JSON.parse(readFileSync(new URL(`../../content/${file}`, import.meta.url), 'utf8'));
  const maps = [read('maps/r08_costa_turbine.map.json'), read('maps/r07_condotto_risonante.map.json')];
  const tables = Object.fromEntries(['r08_shore_fishing', 'r07_conduit_patch'].map(name => {
    const data = read(`encounters/${name}.encounter.json`); return [data.id, data];
  }));
  assert.deepEqual(findSpeciesHabitats(170, maps, tables).map(({ mapId, method, minLevel, maxLevel }) => ({ mapId, method, minLevel, maxLevel })),
    [{ mapId: 'veloria/r08_costa_turbine', method: 'fishing', minLevel: 20, maxLevel: 23 }]);
  assert.deepEqual(findSpeciesHabitats(194, maps, tables).map(({ mapId, method, minLevel, maxLevel }) => ({ mapId, method, minLevel, maxLevel })),
    [{ mapId: 'veloria/r07_condotto_risonante', method: 'tall-grass', minLevel: 18, maxLevel: 21 }]);
});

test('named microhabitats retain their own hours and levels when a map summary spans both', () => {
  const a = { ...table('a', 'fishing', { morning: [entry(10, 12)], day: [], night: [] }), habitatLabel: 'Riva nord' };
  const b = { ...table('b', 'fishing', { morning: [], day: [], night: [entry(20, 22)] }), habitatLabel: 'Laguna sud' };
  const result = findSpeciesHabitats(170, [{ id: 'veloria/coast', displayName: 'Costa', encounterTableIds: ['a', 'b', 'a'] }], { a, b });
  assert.deepEqual(result[0].areas, [
    { tableId: 'a', label: 'Riva nord', minLevel: 10, maxLevel: 12, timeBands: ['morning'] },
    { tableId: 'b', label: 'Laguna sud', minLevel: 20, maxLevel: 22, timeBands: ['night'] },
  ]);
  assert.deepEqual(result[0].timeBands, ['morning', 'night']);
  assert.equal(result[0].minLevel, 10);
  assert.equal(result[0].maxLevel, 22);
});
