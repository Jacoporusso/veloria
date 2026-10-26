import assert from 'node:assert/strict';
import test from 'node:test';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';
import { describeMoveMatchup } from '../../src/game/battle/move-matchup.ts';

const move: MoveDefinition = { id: 'water', name: 'Water', type: 'water', category: 'special', power: 40, accuracy: 100, priority: 0, maxPp: 20 };
const target = (types: BattleCreature['types'], extra: Partial<BattleCreature> = {}): BattleCreature => ({ instanceId: 'target', speciesId: 1, name: 'Target', level: 10, types, stats: { maxHp: 30, attack: 20, defense: 20, specialAttack: 20, specialDefense: 20, speed: 20 }, hp: 30, experience: 0, experienceYield: 1, moves: [], ...extra });
const rules = { ...prototypeBattleRules, typeChart: { water: { fire: 2, rock: 2, grass: 0.5, dragon: 0.5 }, normal: { ghost: 0 }, electric: { ground: 0 } } };

test('matchup combines both defending types and explains each factor', () => {
  const double = describeMoveMatchup(move, target(['fire', 'rock']), rules);
  assert.equal(double.multiplier, 4); assert.match(double.label, /Super efficace ×4/); assert.equal(double.explanation.length, 2);
  assert.equal(describeMoveMatchup(move, target(['grass', 'dragon']), rules).multiplier, 0.25);
  assert.equal(describeMoveMatchup(move, target(['fire', 'grass']), rules).multiplier, 1);
  assert.equal(describeMoveMatchup(move, target(['grass']), rules).multiplier, 0.5);
  assert.equal(describeMoveMatchup(move, target(['fire']), rules).multiplier, 2);
});

test('fixed damage ignores weaknesses and resistances while retaining immunities', () => {
  const fixed = { ...move, fixedDamage: 40 };
  assert.equal(describeMoveMatchup(fixed, target(['fire', 'rock']), rules).multiplier, 1);
  assert.match(describeMoveMatchup(fixed, target(['grass']), rules).label, /40 HP fissi/);
  assert.equal(describeMoveMatchup({ ...fixed, type: 'normal' }, target(['ghost']), rules).multiplier, 0);
});

test('support is never presented as super effective and observes engine status rules', () => {
  assert.equal(describeMoveMatchup({ ...move, category: 'status' }, target(['fire', 'rock']), rules).multiplier, undefined);
  assert.equal(describeMoveMatchup({ ...move, category: 'status', type: 'electric', inflictedStatus: 'paralysis', statusAffectedByTypeImmunity: true }, target(['ground']), rules).blocked, true);
  assert.equal(describeMoveMatchup({ ...move, category: 'status', inflictedStatus: 'poison' }, target(['steel']), rules).blocked, true);
  assert.equal(describeMoveMatchup({ ...move, category: 'status', inflictedStatus: 'sleep' }, target(['normal'], { status: { status: 'burn' } }), rules).blocked, true);
  assert.equal(describeMoveMatchup({ ...move, category: 'status', leechSeedFraction: 1 / 8 }, target(['grass']), rules).blocked, true);
  assert.equal(describeMoveMatchup({ ...move, category: 'status', leechSeedFraction: 1 / 8 }, target(['normal'], { leechSeed: { sourceSide: 'player', fraction: 1 / 8, moveId: 'seed' } }), rules).blocked, true);
});

test('matchup observes active grounding, abilities and typeless delayed attacks', () => {
  const ground = { ...move, type: 'ground' as const };
  assert.equal(describeMoveMatchup(ground, target(['normal'], { abilityId: 'levitate' }), rules).blocked, true);
  assert.equal(describeMoveMatchup(ground, target(['normal'], { abilityId: 'levitate', ingrainActive: true }), rules).blocked, false);
  const sound = { ...move, soundMove: true };
  assert.equal(describeMoveMatchup(sound, target(['normal'], { abilityId: 'soundproof' }), rules).blocked, true);
  assert.equal(describeMoveMatchup({ ...sound, category: 'status' }, target(['normal'], { abilityId: 'soundproof' }), rules).blocked, true);
  assert.equal(describeMoveMatchup({ ...move, type: 'normal', typelessDamage: true, futureSight: true }, target(['ghost']), rules).multiplier, 1);
});
