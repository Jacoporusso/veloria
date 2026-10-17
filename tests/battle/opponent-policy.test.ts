import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattleState } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import { chooseOpponentCommand, type OpponentPolicy } from '../../src/core/battle/opponent-policy.ts';
import type { BattleCreature, BattleState, MoveDefinition } from '../../src/core/battle/types.ts';

const tackle: MoveDefinition = { id: 'move_tackle', name: 'Tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, priority: 0, maxPp: 10 };
const scratch: MoveDefinition = { id: 'move_scratch', name: 'Scratch', type: 'normal', category: 'physical', power: 35, accuracy: 100, priority: 0, maxPp: 10 };
const ember: MoveDefinition = { id: 'move_ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, priority: 0, maxPp: 10 };
const thunder: MoveDefinition = { id: 'move_thunder', name: 'Thunder', type: 'electric', category: 'special', power: 120, accuracy: 100, priority: 0, maxPp: 10 };
const weakSureHit: MoveDefinition = { id: 'move_weak', name: 'Weak', type: 'normal', category: 'physical', power: 20, accuracy: 100, priority: 0, maxPp: 10 };
const accurateStrong: MoveDefinition = { id: 'move_strong', name: 'Strong', type: 'normal', category: 'physical', power: 70, accuracy: 90, priority: 0, maxPp: 10 };
const lowerAttack: MoveDefinition = {
  id: 'move_lower_attack', name: 'Lower Attack', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10,
  statChanges: [{ target: 'opponent', stat: 'attack', stages: -1 }],
};
const raiseDefense: MoveDefinition = {
  id: 'move_raise_defense', name: 'Raise Defense', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10,
  statChanges: [{ target: 'self', stat: 'defense', stages: 1 }],
};
const poison: MoveDefinition = { id: 'move_poison', name: 'Poison', type: 'poison', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10, inflictedStatus: 'poison', statusChance: 100 };
const moves = Object.fromEntries([tackle, scratch, ember, thunder, weakSureHit, accurateStrong, lowerAttack, raiseDefense, poison].map(move => [move.id, move]));
const policy: OpponentPolicy = { id: 'test', statusEveryTurns: 1, maxSetupStage: 2, damageSelection: 'best' };
const steadyRules = { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 };

function creature(id: string, options: Partial<BattleCreature> = {}): BattleCreature {
  return {
    instanceId: id,
    speciesId: id === 'player-1' ? 90001 : 90002,
    name: id,
    level: 20,
    types: ['normal'],
    stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 80 },
    hp: 500,
    experience: 0,
    experienceYield: 0,
    moves: [{ moveId: tackle.id, pp: 10 }],
    ...options,
  };
}

function battle(options: Partial<Parameters<typeof createBattleState>[0]> = {}): BattleState {
  return createBattleState({
    battleId: 'opponent_policy_test', battleType: 'trainer', seed: 1234, rules: steadyRules,
    playerTeam: [creature('player-1')], opponentTeam: [creature('opponent-1')], ...options,
  });
}

function choose(state: BattleState, moveset = moves, selectedPolicy = policy, rules = steadyRules) {
  return chooseOpponentCommand(state, moveset, rules, selectedPolicy);
}

test('ranks useful damaging moves, skips type immunity, and skips an exhausted best move', () => {
  const rules = { ...steadyRules, typeChart: { electric: { ground: 0 } } };
  const enemy = creature('opponent-1', {
    moves: [{ moveId: thunder.id, pp: 10 }, { moveId: ember.id, pp: 10 }],
  });
  const groundPlayer = creature('player-1', { types: ['ground'] });
  const state = battle({ rules, opponentTeam: [enemy], playerTeam: [groundPlayer] });
  assert.deepEqual(choose(state, moves, { ...policy, statusEveryTurns: 0 }, rules), { kind: 'useMove', moveSlot: 1 });

  const ppState = battle({
    opponentTeam: [creature('opponent-1', { moves: [{ moveId: accurateStrong.id, pp: 0 }, { moveId: weakSureHit.id, pp: 10 }] })],
  });
  assert.deepEqual(choose(ppState, moves, { ...policy, statusEveryTurns: 0 }), { kind: 'useMove', moveSlot: 1 });
});

test('damage ranking includes effective attack and defense, STAB, and accuracy', () => {
  const defender = creature('player-1', { types: ['normal'], stats: { maxHp: 500, attack: 80, defense: 5, specialAttack: 80, specialDefense: 500, speed: 80 } });
  const attacker = creature('opponent-1', {
    types: ['fire'],
    stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 80 },
    moves: [{ moveId: tackle.id, pp: 10 }, { moveId: ember.id, pp: 10 }],
  });
  const state = battle({ playerTeam: [defender], opponentTeam: [attacker] });
  // Strong physical damage against the low Defense outweighs the Fire STAB on Ember.
  assert.deepEqual(choose(state, moves, { ...policy, statusEveryTurns: 0 }), { kind: 'useMove', moveSlot: 0 });

  const accurateState = battle({
    playerTeam: [creature('player-1', { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 80 } })],
    opponentTeam: [creature('opponent-1', { moves: [{ moveId: weakSureHit.id, pp: 10 }, { moveId: accurateStrong.id, pp: 10 }] })],
  });
  assert.deepEqual(choose(accurateState, moves, { ...policy, statusEveryTurns: 0 }), { kind: 'useMove', moveSlot: 1 });
});

test('uses useful status on cadence, respects setup cap, and prefers damage when status is not useful', () => {
  const physicalPlayer = creature('player-1', { moves: [{ moveId: tackle.id, pp: 10 }] });
  const debuffer = creature('opponent-1', { moves: [{ moveId: lowerAttack.id, pp: 10 }, { moveId: tackle.id, pp: 10 }] });
  const firstTurn = battle({ playerTeam: [physicalPlayer], opponentTeam: [debuffer] });
  const cadencePolicy = { ...policy, statusEveryTurns: 2 };
  assert.deepEqual(choose(firstTurn, moves, cadencePolicy), { kind: 'useMove', moveSlot: 0 });

  const laterTurn = { ...firstTurn, turn: 1 };
  assert.deepEqual(choose(laterTurn, moves, cadencePolicy), { kind: 'useMove', moveSlot: 1 });

  const specialOnlyPlayer = creature('player-1', { moves: [{ moveId: ember.id, pp: 10 }] });
  const laterSpecialTurn = battle({ playerTeam: [specialOnlyPlayer], opponentTeam: [debuffer] });
  assert.deepEqual(choose({ ...laterSpecialTurn, turn: 1 }), { kind: 'useMove', moveSlot: 1 });

  const setupUser = creature('opponent-1', { moves: [{ moveId: raiseDefense.id, pp: 10 }, { moveId: tackle.id, pp: 10 }] });
  const setupState = battle({
    playerTeam: [physicalPlayer], opponentTeam: [setupUser],
  });
  const cappedState: BattleState = {
    ...setupState,
    turn: 1,
    opponent: { ...setupState.opponent, creatures: [{ ...setupState.opponent.creatures[0], statStages: { defense: 2 } }] },
  };
  assert.deepEqual(choose(cappedState), { kind: 'useMove', moveSlot: 1 });
});

test('chooses useful inflicted status and uses damage if the target is already statused', () => {
  const statusUser = creature('opponent-1', { moves: [{ moveId: poison.id, pp: 10 }, { moveId: tackle.id, pp: 10 }] });
  const state = battle({ opponentTeam: [statusUser] });
  assert.deepEqual(choose({ ...state, turn: 1 }), { kind: 'useMove', moveSlot: 0 });
  const statusedTarget: BattleState = {
    ...state,
    turn: 1,
    player: { ...state.player, creatures: [{ ...state.player.creatures[0], status: { status: 'poison' } }] },
  };
  assert.deepEqual(choose(statusedTarget), { kind: 'useMove', moveSlot: 1 });
});

test('switches from a fainted or no-PP active creature when an ally is available', () => {
  const active = creature('opponent-active', { hp: 0 });
  const reserve = creature('opponent-reserve');
  const base = battle({ opponentTeam: [active, reserve] });
  const faintedState: BattleState = { ...base, opponent: { creatures: base.opponent.creatures, activeIndex: 0 } };
  assert.deepEqual(choose(faintedState), { kind: 'switch', partyIndex: 1 });

  const noPpState = battle({ opponentTeam: [creature('opponent-active', { moves: [{ moveId: tackle.id, pp: 0 }] }), reserve] });
  assert.deepEqual(choose(noPpState), { kind: 'switch', partyIndex: 1 });

  const noReserve = battle({ opponentTeam: [creature('opponent-active')] });
  const faintedAlone: BattleState = {
    ...noReserve,
    opponent: { creatures: [{ ...noReserve.opponent.creatures[0], hp: 0 }], activeIndex: 0 },
  };
  assert.deepEqual(choose(faintedAlone), { kind: 'useMove', moveSlot: 0 });
});

test('wild battles cycle among available damaging moves and replay selection without mutating state or RNG', () => {
  const wildRules = { ...steadyRules, typeChart: { electric: { ground: 0 } } };
  const wildState = battle({
    battleType: 'wild', rules: wildRules,
    playerTeam: [creature('player-1', { types: ['ground'] })],
    opponentTeam: [creature('opponent-1', { moves: [
      { moveId: thunder.id, pp: 10 }, { moveId: tackle.id, pp: 10 }, { moveId: scratch.id, pp: 10 },
    ] })],
  });
  const cycling = { ...policy, statusEveryTurns: 0, damageSelection: 'cycle' as const };
  const before = structuredClone(wildState);
  const first = choose(wildState, moves, cycling, wildRules);
  assert.deepEqual(first, { kind: 'useMove', moveSlot: 1 });
  assert.deepEqual(choose(wildState, moves, cycling, wildRules), first);
  assert.deepEqual(choose({ ...wildState, turn: 1 }, moves, cycling, wildRules), { kind: 'useMove', moveSlot: 2 });
  assert.deepEqual(wildState, before);
  assert.equal(wildState.rngState, before.rngState);
});


test('exhausted opponents use an emergency move rather than cycling between exhausted reserves', () => {
  const spent = { moves: [{ moveId: tackle.id, pp: 0 }] };
  const state = battle({ opponentTeam: [creature('opponent-1', spent), creature('opponent-2', spent)] });
  assert.deepEqual(choose(state), { kind: 'struggle' });
  assert.deepEqual(choose({ ...state, opponent: { ...state.opponent, activeIndex: 1 } }), { kind: 'struggle' });
});
