import assert from 'node:assert/strict';
import test from 'node:test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import movesData from '../../content/battle/moves.v1.json' with { type: 'json' };
import chartData from '../../content/battle/type-chart.v1.json' with { type: 'json' };
import { createBattleCreature, type SpeciesBattleRegistry, type BattleMoveRegistry } from '../../src/core/battle/create-creature.ts';
import { calculateHitDamage, estimateMoveDamage } from '../../src/core/battle/damage.ts';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules, type TypeChart } from '../../src/core/battle/rules.ts';

const species = speciesData.species as SpeciesBattleRegistry;
const moves = movesData.moves as BattleMoveRegistry;
const rules = { ...prototypeBattleRules, typeChart: chartData.chart as TypeChart };
const creature = (id: number, level: number) => createBattleCreature({ species, moves, speciesId: id, level, instanceId: `test-${id}` });

test('damage preview explains why Bubble can beat higher-power Tackle after Defense Curl', () => {
  const user = creature(7, 8);
  const target = { ...creature(19, 7), statStages: { defense: 1 } };
  const before = structuredClone({ user, target });
  assert.deepEqual(estimateMoveDamage(user, target, moves.bubble, rules), { minimum: 6, maximum: 7 });
  assert.deepEqual(estimateMoveDamage(user, target, moves.tackle, rules), { minimum: 4, maximum: 5 });
  assert.deepEqual({ user, target }, before);
});

test('forecast and resolved noncritical damage share the exact calculation', () => {
  const exact = { ...rules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 };
  const user = { ...creature(7, 8), moves: [{ moveId: 'bubble', pp: 30 }] };
  const target = creature(19, 7);
  const initial = createBattleState({ battleId: 'forecast-hit', battleType: 'wild', seed: 8, rules: exact, playerTeam: [user], opponentTeam: [target] });
  const state = { ...initial, opponent: { ...initial.opponent, creatures: [{ ...target, statStages: { defense: 1 } }] } };
  const forecast = estimateMoveDamage(user, state.opponent.creatures[0], moves.bubble, exact);
  const result = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, exact);
  const hit = result.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  assert.ok(hit?.type === 'damageApplied');
  assert.equal(hit.amount, forecast?.minimum);
  assert.equal(hit.amount, forecast?.maximum);
});

test('forecast respects immunity, multihit bounds, remaining HP and support moves', () => {
  const user = creature(25, 8);
  const target = creature(74, 8);
  assert.deepEqual(estimateMoveDamage(user, target, moves['thunder-shock'], rules), { minimum: 0, maximum: 0 });
  assert.equal(estimateMoveDamage(user, target, moves.growl, rules), undefined);
  const minimum = calculateHitDamage(user, target, moves['fury-attack'], rules, { critical: false, variance: rules.minimumDamageVariance }).amount;
  const maximum = calculateHitDamage(user, target, moves['fury-attack'], rules, { critical: false, variance: rules.maximumDamageVariance }).amount;
  assert.deepEqual(estimateMoveDamage(user, target, moves['fury-attack'], rules), { minimum: Math.min(target.hp, minimum * 2), maximum: Math.min(target.hp, maximum * 5) });
  assert.deepEqual(estimateMoveDamage(user, { ...target, hp: 1 }, moves['fury-attack'], rules), { minimum: 1, maximum: 1 });
});
