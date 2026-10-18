import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { calculateHitDamage, estimateMoveDamage } from '../../src/core/battle/damage.ts';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { chooseOpponentCommand } from '../../src/core/battle/opponent-policy.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';

const sonic: MoveDefinition = { id: 'move_sonic_boom', name: 'Sonicboom', type: 'normal', category: 'special', power: 0, fixedDamage: 20, accuracy: 90, priority: 0, maxPp: 20 };
const wait: MoveDefinition = { id: 'wait', name: 'Wait', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20 };
const catalog = { [sonic.id]: sonic, wait };
const rules = { ...prototypeBattleRules, criticalChance: 1, typeChart: { normal: { ghost: 0, rock: 0.5, grass: 2 } } };
function creature(id: string, extra: Partial<BattleCreature> = {}): BattleCreature {
  return { instanceId: id, speciesId: 90001, name: id, level: 10, types: ['normal'], stats: { maxHp: 100, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: id === 'player' ? 100 : 10 }, hp: 100, experience: 0, experienceYield: 20, moves: [{ moveId: sonic.id, pp: 20 }, { moveId: 'wait', pp: 20 }], ...extra };
}
function battle(seed = 1, target: Partial<BattleCreature> = {}) {
  return createBattleState({ battleId: 'fixed', battleType: 'wild', seed, rules, playerTeam: [creature('player')], opponentTeam: [creature('opponent', target)] });
}
const commands = { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 1 } } as const;

test('Sonic Boom fixture follows cached official special, accuracy and PP data', () => {
  const source = JSON.parse(readFileSync(new URL('../../content/sources/pokeapi/move-sonic-boom.json', import.meta.url), 'utf8'));
  assert.equal(source.damage_class.name, sonic.category);
  assert.equal(source.accuracy, sonic.accuracy);
  assert.equal(source.pp, sonic.maxPp);
  assert.match(source.effect_entries.find((entry: { language: { name: string } }) => entry.language.name === 'en').effect, /exactly 20 damage/);
});

test('fixed damage ignores stats, stages, STAB, burn, criticals and variance, retaining only immunity', () => {
  const user = creature('player', { status: { status: 'burn' }, level: 100, statStages: { specialAttack: 6 } });
  for (const type of ['rock', 'grass', 'normal'] as const) {
    const target = creature('opponent', { types: [type], statStages: { specialDefense: -6 } });
    for (const variance of [0, 0.85, 1, 5]) {
      assert.deepEqual(calculateHitDamage(user, target, sonic, rules, { critical: true, variance }), { amount: 20, effectiveness: 1 });
    }
    assert.deepEqual(estimateMoveDamage(user, { ...target, hp: 7 }, sonic, rules), { minimum: 7, maximum: 7 });
  }
  assert.deepEqual(estimateMoveDamage(user, creature('opponent', { types: ['ghost'] }), sonic, rules), { minimum: 0, maximum: 0 });
});

test('engine replay, PP, HP clamp, KO and experience use the shared fixed damage path', () => {
  const initial = battle(1, { hp: 7 });
  const result = resolveBattleTurn(initial, commands, catalog, rules);
  assert.deepEqual(result, resolveBattleTurn(initial, commands, catalog, rules));
  assert.equal(initial.opponent.creatures[0].hp, 7);
  assert.equal(result.state.opponent.creatures[0].hp, 0);
  assert.equal(result.state.player.creatures[0].moves[0].pp, 19);
  assert.ok(result.events.some(event => event.type === 'damageApplied' && event.amount === 7 && !event.critical && event.effectiveness === 1));
  assert.ok(result.events.some(event => event.type === 'experienceGained'));
  assert.equal(result.state.outcome.kind, 'won');
});

test('immune targets take no damage and misses still spend normal PP', () => {
  const immune = resolveBattleTurn(battle(1, { types: ['ghost'] }), commands, catalog, rules);
  assert.equal(immune.state.opponent.creatures[0].hp, 100);
  assert.ok(immune.events.some(event => event.type === 'damageApplied' && event.amount === 0 && event.effectiveness === 0 && !event.critical));
  let missed = false;
  for (let seed = 10000; seed < 10100; seed++) {
    const result = resolveBattleTurn(battle(seed), commands, catalog, rules);
    if (!result.events.some(event => event.type === 'moveMissed' && event.side === 'player')) continue;
    assert.equal(result.state.player.creatures[0].moves[0].pp, 19);
    assert.equal(result.state.opponent.creatures[0].hp, 100);
    missed = true;
    break;
  }
  assert.ok(missed, 'an official 90%-accuracy move must be able to miss');
});

test('fixed damage data rejects status category and nonpositive, fractional or nonfinite values', () => {
  for (const fixedDamage of [0, -1, 1.5, Infinity, NaN]) {
    assert.throws(() => resolveBattleTurn(battle(), commands, { ...catalog, [sonic.id]: { ...sonic, fixedDamage } }, rules), /Invalid move data/);
  }
  assert.throws(() => resolveBattleTurn(battle(), commands, { ...catalog, [sonic.id]: { ...sonic, category: 'status' } }, rules), /Invalid move data/);
});

test('opponent recognizes power-zero fixed damage without treating it as stat-boostable', () => {
  const state = battle();
  const opponent = state.opponent.creatures[0];
  const options = { ...state, opponent: { ...state.opponent, creatures: [{ ...opponent, moves: [{ moveId: 'wait', pp: 20 }, { moveId: sonic.id, pp: 20 }] }] } };
  assert.deepEqual(chooseOpponentCommand(options, catalog, rules, { id: 'fixed-test', statusEveryTurns: 0, maxSetupStage: 2, damageSelection: 'best' }), { kind: 'useMove', moveSlot: 1 });
});
