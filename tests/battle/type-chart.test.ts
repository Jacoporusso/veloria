import assert from 'node:assert/strict';
import test from 'node:test';
import typeChartData from '../../content/battle/type-chart.v1.json' with { type: 'json' };
import { BATTLE_TYPES } from '../../src/core/battle/types.ts';
import { effectivenessFor } from '../../src/core/battle/rules.ts';
import type { TypeChart } from '../../src/core/battle/rules.ts';

const chart = typeChartData.chart as TypeChart;

test('Gen II chart contains a complete 17 by 17 matrix with supported efficacy factors', () => {
  assert.equal(typeChartData.version, 1);
  assert.equal(typeChartData.id, 'veloria-type-chart-gen2-v1');
  assert.equal(typeChartData.generation, 2);
  assert.deepEqual(typeChartData.types, BATTLE_TYPES);
  assert.deepEqual(Object.keys(chart), [...BATTLE_TYPES]);

  for (const attackingType of BATTLE_TYPES) {
    const row = chart[attackingType];
    assert.ok(row, `missing attacking row ${attackingType}`);
    assert.deepEqual(Object.keys(row), [...BATTLE_TYPES], `incomplete defending row ${attackingType}`);
    for (const defendingType of BATTLE_TYPES) {
      assert.ok([0, 0.5, 1, 2].includes(row[defendingType]!), `${attackingType} -> ${defendingType} has invalid efficacy`);
    }
  }
});

test('Gen II Steel resistance corrections use generation 5 historical values', () => {
  assert.equal(chart.ghost?.steel, 0.5);
  assert.equal(chart.dark?.steel, 0.5);
  assert.equal(chart.ghost?.psychic, 2);
  assert.equal(chart.dark?.psychic, 2);
});

test('dual type effectiveness multiplies both entries, including quarter damage', () => {
  assert.equal(effectivenessFor(['rock', 'steel'], 'fighting', chart), 4);
  assert.equal(effectivenessFor(['dark', 'psychic'], 'bug', chart), 4);
  assert.equal(effectivenessFor(['fire', 'water'], 'fire', chart), 0.25);
  assert.equal(effectivenessFor(['fire', 'flying'], 'grass', chart), 0.25);
});

test('type immunities remain zero against dual types', () => {
  assert.equal(effectivenessFor(['ground', 'flying'], 'electric', chart), 0);
  assert.equal(effectivenessFor(['ghost', 'rock'], 'normal', chart), 0);
  assert.equal(effectivenessFor(['ghost', 'steel'], 'fighting', chart), 0);
  assert.equal(effectivenessFor(['dark', 'psychic'], 'psychic', chart), 0);
});

test('chart records primary-source URLs and pinned source hashes', () => {
  assert.match(typeChartData.source.urls.efficacy, /raw\.githubusercontent\.com\/PokeAPI\/pokeapi\/master\/data\/v2\/csv\/type_efficacy\.csv$/);
  assert.match(typeChartData.source.urls.historicalEfficacy, /type_efficacy_past\.csv$/);
  assert.match(typeChartData.source.urls.types, /\/types\.csv$/);
  for (const digest of Object.values(typeChartData.source.sha256)) assert.match(digest, /^[a-f0-9]{64}$/);
});
