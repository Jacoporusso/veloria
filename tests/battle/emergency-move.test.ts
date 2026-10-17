import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleCommand, BattleCreature, BattleRules, MoveDefinition } from '../../src/core/battle/types.ts';

const tackle: MoveDefinition = { id: 'move_tackle', name: 'Tackle', type: 'normal', category: 'physical', power: 1, accuracy: 100, priority: 0, maxPp: 5 };
const quickAttack: MoveDefinition = { id: 'move_quick', name: 'Quick Attack', type: 'normal', category: 'physical', power: 1, accuracy: 100, priority: 1, maxPp: 5 };
const moves = { [tackle.id]: tackle, [quickAttack.id]: quickAttack };
const rules: BattleRules = {
  ...prototypeBattleRules,
  criticalChance: 0,
  minimumDamageVariance: 1,
  maximumDamageVariance: 1,
  emergencyMove: { power: 50, recoilFraction: 0.25 },
};
const struggle: BattleCommand = { kind: 'struggle' };
const useTackle: BattleCommand = { kind: 'useMove', moveSlot: 0 };

function creature(id: string, options: Partial<BattleCreature> = {}): BattleCreature {
  return {
    instanceId: id,
    speciesId: id === 'player' ? 90001 : 90002,
    name: id,
    level: 5,
    types: ['fire'],
    stats: { maxHp: 100, attack: 100, defense: 100, specialAttack: 100, specialDefense: 100, speed: 50 },
    hp: 100,
    experience: 0,
    experienceYield: 17,
    moves: [],
    ...options,
  };
}

function battle(options: Partial<Parameters<typeof createBattleState>[0]> = {}) {
  return createBattleState({
    battleId: 'emergency-move-test', battleType: 'wild', seed: 17, rules,
    playerTeam: [creature('player')], opponentTeam: [creature('opponent', { moves: [{ moveId: tackle.id, pp: 5 }] })],
    ...options,
  });
}

function turn(state: ReturnType<typeof battle>, player: BattleCommand = struggle, opponent: BattleCommand = useTackle, ruleset = rules) {
  return resolveBattleTurn(state, { player, opponent }, moves, ruleset);
}

test('Struggle is available with no moves and uses neutral no-STAB damage without PP changes', () => {
  const state = battle({
    playerTeam: [creature('player', { types: ['fire'], moves: [] })],
    opponentTeam: [creature('opponent', { types: ['ghost'], moves: [{ moveId: tackle.id, pp: 5 }] })],
  });
  const result = turn(state);
  const used = result.events.find(event => event.type === 'moveUsed' && event.side === 'player');
  const hit = result.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  assert.deepEqual(used, { type: 'moveUsed', side: 'player', creatureId: 'player', moveId: 'struggle' });
  assert.ok(hit?.type === 'damageApplied');
  // At level 5, base damage is floor((4 * 50 * 100 / 100) / 50 + 2) = 6.
  // Fire does not gain STAB and Ghost does not resist this emergency move.
  assert.equal(hit.amount, 6);
  assert.equal(hit.effectiveness, 1);
  assert.equal(result.state.player.creatures[0].moves.length, 0);
  assert.ok(!result.events.some(event => event.type === 'commandRejected' || event.type === 'moveFailed'));
  assert.ok(result.events.some(event => event.type === 'recoilApplied' && event.amount === 25));
});

test('Struggle is rejected while any known move has PP remaining', () => {
  const state = battle({ playerTeam: [creature('player', { moves: [{ moveId: tackle.id, pp: 1 }] })] });
  const result = turn(state);
  assert.deepEqual(result.state, state);
  assert.deepEqual(result.events, [{ type: 'commandRejected', side: 'player', reason: 'emergencyUnavailable' }]);
});

test('unknown move slots do not prevent emergency use, and its priority is zero', () => {
  const state = battle({
    playerTeam: [creature('player', { stats: { maxHp: 100, attack: 100, defense: 100, specialAttack: 100, specialDefense: 100, speed: 500 }, moves: [{ moveId: 'missing-content-move', pp: 3 }] })],
    opponentTeam: [creature('opponent', { moves: [{ moveId: quickAttack.id, pp: 5 }], stats: { maxHp: 100, attack: 1, defense: 100, specialAttack: 1, specialDefense: 100, speed: 1 } })],
  });
  const result = turn(state, struggle, useTackle);
  const order = result.events.find(event => event.type === 'actionOrder');
  assert.ok(order?.type === 'actionOrder');
  assert.deepEqual(order.sides, ['opponent', 'player']);
  assert.ok(result.events.some(event => event.type === 'moveUsed' && event.moveId === 'struggle'));
  assert.deepEqual(result.state.player.creatures[0].moves, [{ moveId: 'missing-content-move', pp: 3 }]);
});

test('recoil is ceil(max HP / 4), occurs after a hit even when it KOs the target, and clamps attacker HP at zero', () => {
  const state = battle({
    playerTeam: [creature('player', { hp: 100, stats: { maxHp: 101, attack: 100, defense: 100, specialAttack: 100, specialDefense: 100, speed: 100 } })],
    opponentTeam: [creature('opponent', { hp: 1, experienceYield: 17, moves: [{ moveId: tackle.id, pp: 5 }], stats: { maxHp: 100, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 } })],
  });
  const result = turn(state, struggle, useTackle);
  const hitIndex = result.events.findIndex(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  const recoilIndex = result.events.findIndex(event => event.type === 'recoilApplied' && event.side === 'player');
  assert.ok(hitIndex >= 0 && recoilIndex > hitIndex);
  assert.ok(result.events.some(event => event.type === 'creatureFainted' && event.side === 'opponent'));
  assert.deepEqual(result.events.find(event => event.type === 'recoilApplied'), {
    type: 'recoilApplied', side: 'player', creatureId: 'player', moveId: 'struggle', amount: 26,
  });
  assert.equal(result.state.player.creatures[0].hp, 74);
  assert.equal(result.state.outcome.kind, 'won');

  const clamped = battle({
    playerTeam: [creature('player', { hp: 1, stats: { maxHp: 4, attack: 100, defense: 100, specialAttack: 100, specialDefense: 100, speed: 100 } })],
    opponentTeam: [creature('opponent', { hp: 1, moves: [{ moveId: tackle.id, pp: 5 }], stats: { maxHp: 100, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 } })],
  });
  const bothFaint = turn(clamped, struggle, useTackle);
  assert.equal(bothFaint.state.player.creatures[0].hp, 0);
  assert.equal(bothFaint.state.opponent.creatures[0].hp, 0);
  assert.equal(bothFaint.state.outcome.kind, 'draw');
  assert.equal(bothFaint.state.player.creatures[0].experience, 0);
  assert.ok(!bothFaint.events.some(event => event.type === 'experienceGained' && event.creatureId === 'player'));
  assert.ok(bothFaint.events.some(event => event.type === 'recoilApplied' && event.amount === 1));
});

test('blocked Struggle during sleep does not apply recoil', () => {
  const state = battle({
    playerTeam: [creature('player', { status: { status: 'sleep', turnsRemaining: 2 } })],
    opponentTeam: [creature('opponent', { status: { status: 'sleep', turnsRemaining: 2 }, moves: [{ moveId: tackle.id, pp: 5 }] })],
  });
  const result = turn(state);
  assert.deepEqual(result.state.player.creatures[0].status, { status: 'sleep', turnsRemaining: 1 });
  assert.ok(result.events.some(event => event.type === 'statusTick' && event.side === 'player' && event.status === 'sleep' && !event.recovered));
  assert.ok(result.events.some(event => event.type === 'moveFailed' && event.side === 'player' && event.reason === 'blockedByStatus'));
  assert.ok(!result.events.some(event => event.type === 'recoilApplied' && event.side === 'player'));
  assert.equal(result.state.player.creatures[0].hp, 100);
});

test('one-turn sleep recovers without restoring the expired sleep status', () => {
  const state = battle({
    playerTeam: [creature('player', { status: { status: 'sleep', turnsRemaining: 1 }, moves: [{ moveId: tackle.id, pp: 5 }] })],
    opponentTeam: [creature('opponent', { status: { status: 'sleep', turnsRemaining: 2 }, moves: [{ moveId: tackle.id, pp: 5 }] })],
  });
  const result = turn(state, useTackle, useTackle);
  assert.equal(result.state.player.creatures[0].status, undefined);
  assert.ok(result.events.some(event => event.type === 'statusTick' && event.side === 'player' && event.status === 'sleep' && event.recovered));
  assert.ok(result.events.some(event => event.type === 'moveUsed' && event.side === 'player' && event.moveId === tackle.id));
});

test('freeze thawing removes the status and preserves the successful action', () => {
  const thawingRules: BattleRules = { ...rules, freezeThawChance: 1 };
  const state = battle({
    rules: thawingRules,
    playerTeam: [creature('player', { status: { status: 'freeze', turnsRemaining: 1 }, moves: [{ moveId: tackle.id, pp: 5 }] })],
    opponentTeam: [creature('opponent', { status: { status: 'sleep', turnsRemaining: 2 }, moves: [{ moveId: tackle.id, pp: 5 }] })],
  });
  const result = turn(state, useTackle, useTackle, thawingRules);
  assert.equal(result.state.player.creatures[0].status, undefined);
  assert.ok(result.events.some(event => event.type === 'statusTick' && event.side === 'player' && event.status === 'freeze' && event.recovered));
  assert.ok(result.events.some(event => event.type === 'moveUsed' && event.side === 'player' && event.moveId === tackle.id));
});

test('paralysis can block Struggle without recoil', () => {
  const paralyzedRules: BattleRules = { ...rules, paralysisActionChance: 1 };
  const state = battle({
    rules: paralyzedRules,
    playerTeam: [creature('player', { status: { status: 'paralysis' } })],
    opponentTeam: [creature('opponent', { status: { status: 'sleep', turnsRemaining: 2 }, moves: [{ moveId: tackle.id, pp: 5 }] })],
  });
  const result = turn(state, struggle, useTackle, paralyzedRules);
  assert.ok(result.events.some(event => event.type === 'statusTick' && event.side === 'player' && event.status === 'paralysis'));
  assert.ok(result.events.some(event => event.type === 'moveFailed' && event.side === 'player' && event.reason === 'blockedByStatus'));
  assert.ok(!result.events.some(event => event.type === 'recoilApplied' && event.side === 'player'));
  assert.equal(result.state.player.creatures[0].hp, 100);
});

test('Struggle resolution is replayable and does not mutate its input snapshot', () => {
  const state = battle({ playerTeam: [creature('player', { moves: [] })] });
  const snapshot = structuredClone(state);
  const first = turn(state);
  const replay = turn(state);
  assert.deepEqual(replay, first);
  assert.deepEqual(state, snapshot);
  assert.equal(state.player.creatures[0].hp, 100);
  assert.equal(state.player.creatures[0].moves.length, 0);
});
