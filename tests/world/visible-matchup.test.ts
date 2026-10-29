import assert from 'node:assert/strict';
import test from 'node:test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import movesData from '../../content/battle/moves.v1.json' with { type: 'json' };
import chartData from '../../content/battle/type-chart.v1.json' with { type: 'json' };
import { createBattleCreature, type BattleMoveRegistry, type SpeciesBattleRegistry } from '../../src/core/battle/create-creature.ts';
import type { TypeChart } from '../../src/core/battle/rules.ts';
import type { BattleCreature } from '../../src/core/battle/types.ts';
import { chooseVisibleMatchupReplacement } from '../../tests/playtests/helpers/visible-matchup.ts';

const species = speciesData.species as SpeciesBattleRegistry;
const moves = movesData.moves as BattleMoveRegistry;
const chart = chartData.chart as TypeChart;
const creature = (speciesId: number, level: number, moveIds: readonly string[], instanceId: string) =>
  createBattleCreature({ species, moves, speciesId, level, moveIds, instanceId });

test('Psyduck with Confusion is a visible matchup upgrade over Charmeleon into Water/Poison', () => {
  const active = creature(5, 23, ['scratch', 'ember'], 'active-charmeleon');
  const psyduck = creature(54, 22, ['confusion', 'water-pulse'], 'reserve-psyduck');
  const party = [active, psyduck];
  const targetTypes = ['water', 'poison'] as const;
  const before = structuredClone({ active, party, targetTypes });

  assert.equal(chooseVisibleMatchupReplacement(active, party, targetTypes, moves, chart), psyduck);
  assert.deepEqual({ active, party, targetTypes }, before);
});

test('fainted or PP-exhausted Gen I reserves are not selected', () => {
  const active = creature(19, 20, ['tackle'], 'active-rattata');
  const fainted = { ...creature(54, 22, ['confusion'], 'fainted-psyduck'), hp: 0 };
  const noPpBase = creature(54, 22, ['confusion'], 'empty-psyduck');
  const noPp = { ...noPpBase, moves: noPpBase.moves.map(slot => ({ ...slot, pp: 0 })) };
  const targetTypes = ['water', 'poison'] as const;

  assert.equal(chooseVisibleMatchupReplacement(active, [active, fainted], targetTypes, moves, chart), undefined);
  assert.equal(chooseVisibleMatchupReplacement(active, [active, noPp], targetTypes, moves, chart), undefined);
});

test('does not invent a reserve or switch for a marginal score difference', () => {
  const active = creature(19, 20, ['tackle'], 'active-rattata');
  const reserveBase = creature(16, 20, ['tackle'], 'reserve-pidgey');
  const reserve: BattleCreature = {
    ...reserveBase,
    stats: { ...reserveBase.stats, attack: active.stats.attack * 1.2 },
  };
  const targetTypes = ['normal'] as const;

  assert.equal(chooseVisibleMatchupReplacement(active, [], targetTypes, moves, chart), undefined);
  assert.equal(chooseVisibleMatchupReplacement(active, [active, reserve], targetTypes, moves, chart), undefined);
});

test('does not select a non-Kanto reserve even if its visible move score is higher', () => {
  const active = creature(19, 20, ['tackle'], 'active-rattata');
  const reserveBase = creature(54, 22, ['confusion'], 'outside-gen1');
  const laterSpecies: BattleCreature = { ...reserveBase, speciesId: 170 };

  assert.equal(chooseVisibleMatchupReplacement(active, [active, laterSpecies], ['water', 'poison'], moves, chart), undefined);
});

test('counts the official multi-hit move when comparing the coastal Grass companion', () => {
  const psyduck = creature(54, 23, ['confusion', 'water-pulse'], 'psyduck');
  const exeggcute = creature(102, 20, ['bullet-seed'], 'exeggcute');
  const party = [psyduck, exeggcute];
  assert.equal(chooseVisibleMatchupReplacement(psyduck, party, ['water'], moves, chart), exeggcute);
  assert.equal(chooseVisibleMatchupReplacement(exeggcute, party, ['water', 'poison'], moves, chart), psyduck);
});
