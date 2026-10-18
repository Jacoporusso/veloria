import { effectiveMoveAccuracy } from '../../src/core/battle/stat-stages.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleCreature, BattleState, MoveDefinition } from '../../src/core/battle/types.ts';

const contentMoves = (moveData as { moves: Record<string, MoveDefinition> }).moves;
const growl = contentMoves.growl;
const tailwhip = contentMoves['tail-whip'];
const defensecurl = contentMoves['defense-curl'];
const calmMind: MoveDefinition = {
  id: 'move_calm_mind', name: 'Calm Mind', type: 'psychic', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 8,
  statChanges: [
    { target: 'self', stat: 'specialAttack', stages: 1 },
    { target: 'self', stat: 'specialDefense', stages: 1 },
  ],
};
const raiseAttack: MoveDefinition = { id: 'move_raise_attack', name: 'Raise Attack', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 8, statChanges: [{ target: 'self', stat: 'attack', stages: 2 }] };
const raiseSpeed: MoveDefinition = { id: 'move_raise_speed', name: 'Raise Speed', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 8, statChanges: [{ target: 'self', stat: 'speed', stages: 4 }] };
const tackle: MoveDefinition = { id: 'move_tackle', name: 'Tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, priority: 0, maxPp: 12 };
const special: MoveDefinition = { id: 'move_special', name: 'Arc', type: 'electric', category: 'special', power: 40, accuracy: 100, priority: 0, maxPp: 12 };
const noop: MoveDefinition = { id: 'move_noop', name: 'Wait', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20 };
const moves = Object.fromEntries([growl, tailwhip, defensecurl, calmMind, raiseAttack, raiseSpeed, tackle, special, noop].map(move => [move.id, move]));
const exactRules = { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 };

function creature(id: string, move: MoveDefinition = noop, options: Partial<BattleCreature> = {}): BattleCreature {
  return {
    instanceId: id,
    speciesId: id.startsWith('player') ? 90001 : 90002,
    name: id,
    level: 20,
    types: ['normal'],
    stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 80 },
    hp: 500,
    experience: 0,
    experienceYield: 0,
    moves: [{ moveId: move.id, pp: move.maxPp }],
    ...options,
  };
}

function battle(options: Partial<Parameters<typeof createBattleState>[0]> = {}): BattleState {
  return createBattleState({
    battleId: 'stat_stages_test', battleType: 'wild', seed: 321, rules: exactRules,
    playerTeam: [creature('player-1')], opponentTeam: [creature('opponent-1')], ...options,
  });
}

function stages(state: BattleState, side: 'player' | 'opponent', index = 0) {
  return state[side].creatures[index].statStages ?? {};
}

function stage(creatureValue: BattleCreature, stat: keyof NonNullable<BattleCreature['statStages']>): number {
  return creatureValue.statStages?.[stat] ?? 0;
}

function damage(state: BattleState, commands: Parameters<typeof resolveBattleTurn>[1]) {
  const result = resolveBattleTurn(state, commands, moves, exactRules);
  const event = result.events.find(item => item.type === 'damageApplied');
  assert.ok(event?.type === 'damageApplied');
  return { result, amount: event.amount };
}

test('createBattleState resets supplied stat stages for a fresh battle', () => {
  const stagedPlayer = creature('player-1', noop, { statStages: { attack: 3, defense: -2, specialAttack: 1, specialDefense: -1, speed: 2 } });
  const stagedOpponent = creature('opponent-1', noop, { statStages: { attack: -4 } });
  const state = battle({ playerTeam: [stagedPlayer], opponentTeam: [stagedOpponent] });
  for (const stat of ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const) {
    assert.equal(stage(state.player.creatures[0], stat), 0);
    assert.equal(stage(state.opponent.creatures[0], stat), 0);
  }
  assert.deepEqual(stagedPlayer.statStages, { attack: 3, defense: -2, specialAttack: 1, specialDefense: -1, speed: 2 });
});

test('positive and negative stages use the bounded 3/2 and 2/3 multipliers', () => {
  const base = battle({ playerTeam: [creature('player-1', tackle, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 120 } })], opponentTeam: [creature('opponent-1', noop, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 10 } })] });
  const commands = { player: { kind: 'useMove', moveSlot: 0 } as const, opponent: { kind: 'useMove', moveSlot: 0 } as const };
  const boosted: BattleState = { ...base, player: { ...base.player, creatures: [{ ...base.player.creatures[0], statStages: { attack: 1 } }] } };
  const lowered: BattleState = { ...base, player: { ...base.player, creatures: [{ ...base.player.creatures[0], statStages: { attack: -1 } }] } };
  assert.equal(damage(base, commands).amount, 15);
  assert.equal(damage(boosted, commands).amount, 21);
  assert.equal(damage(lowered, commands).amount, 10);
});

test('Growl lowers physical damage and Tail Whip lowers incoming physical defense', () => {
  const fast = { speed: 120 };
  const slow = { speed: 10 };
  const baselineAttack = damage(battle({
    playerTeam: [creature('player-1', noop, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: fast.speed } })],
    opponentTeam: [creature('opponent-1', tackle, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: slow.speed } })],
  }), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } });
  const growledAttack = damage(battle({
    playerTeam: [creature('player-1', growl, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: fast.speed } })],
    opponentTeam: [creature('opponent-1', tackle, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: slow.speed } })],
  }), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } });
  assert.ok(growledAttack.amount < baselineAttack.amount);
  assert.equal(stages(growledAttack.result.state, 'opponent').attack, -1);
  assert.equal(growledAttack.result.state.player.creatures[0].moves[0].pp, growl.maxPp - 1);

  const baselineDefense = damage(battle({ playerTeam: [creature('player-1', tackle, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: fast.speed } })], opponentTeam: [creature('opponent-1', noop, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: slow.speed } })] }), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } });
  const tailwhipState = battle({ playerTeam: [creature('player-1', tailwhip, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: fast.speed }, moves: [{ moveId: tailwhip.id, pp: tailwhip.maxPp }, { moveId: tackle.id, pp: tackle.maxPp }] })], opponentTeam: [creature('opponent-1', noop, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: slow.speed } })] });
  const tailwhippedDefense = resolveBattleTurn(tailwhipState, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, exactRules);
  const afterTailWhip = resolveBattleTurn(tailwhippedDefense.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, exactRules);
  const hitAfterTailWhip = afterTailWhip.events.find(item => item.type === 'damageApplied');
  assert.ok(hitAfterTailWhip?.type === 'damageApplied');
  assert.ok(hitAfterTailWhip.amount > baselineDefense.amount);
  assert.equal(stages(afterTailWhip.state, 'opponent').defense, -1);
});

test('Defense Curl strengthens physical defense while special stages do not affect physical damage', () => {
  const player = creature('player-1', defensecurl, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 120 } });
  const enemy = creature('opponent-1', tackle, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 10 } });
  const curled = damage(battle({ playerTeam: [player], opponentTeam: [enemy] }), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } });
  const baseline = damage(battle({ playerTeam: [creature('player-1', noop, { stats: player.stats })], opponentTeam: [creature('opponent-1', tackle, { stats: enemy.stats })] }), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } });
  assert.ok(curled.amount < baseline.amount);
  assert.equal(stages(curled.result.state, 'player').defense, 1);
  assert.equal(curled.result.state.player.creatures[0].moves[0].pp, defensecurl.maxPp - 1);

  const baselineSpecial = damage(battle({ playerTeam: [creature('player-1', special, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 120 } })], opponentTeam: [creature('opponent-1', noop, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 10 } })] }), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } });
  const physicalDebuff = resolveBattleTurn(battle({ playerTeam: [creature('player-1', tailwhip, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 120 }, moves: [{ moveId: tailwhip.id, pp: tailwhip.maxPp }, { moveId: special.id, pp: special.maxPp }] })], opponentTeam: [creature('opponent-1', noop, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 10 } })] }), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, exactRules);
  const specialAfterPhysicalDebuff = resolveBattleTurn(physicalDebuff.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, exactRules);
  const specialDamageAfterPhysicalDebuff = specialAfterPhysicalDebuff.events.find(item => item.type === 'damageApplied');
  assert.ok(specialDamageAfterPhysicalDebuff?.type === 'damageApplied');
  assert.equal(specialDamageAfterPhysicalDebuff.amount, baselineSpecial.amount);
});

test('stat stage limits emit events and still spend PP on a successful capped move', () => {
  let state = battle({ playerTeam: [creature('player-1', growl)], opponentTeam: [creature('opponent-1')] });
  for (let turn = 0; turn < 6; turn++) {
    const result = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
    state = result.state;
  }
  assert.equal(stages(state, 'opponent').attack, -6);
  const limited = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.ok(limited.events.some(event => event.type === 'statStageLimited' && event.side === 'opponent' && event.stat === 'attack' && event.stage === -6));
  assert.equal(limited.state.player.creatures[0].moves[0].pp, growl.maxPp - 7);
});

test('positive stat stages cap at +6 and repeated capped moves spend PP', () => {
  let state = battle({ playerTeam: [creature('player-1', raiseAttack)] });
  for (let turn = 0; turn < 3; turn++) {
    state = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, exactRules).state;
  }
  assert.equal(stage(state.player.creatures[0], 'attack'), 6);
  const capped = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, exactRules);
  assert.ok(capped.events.some(event => event.type === 'statStageLimited' && event.side === 'player' && event.stat === 'attack' && event.stage === 6));
  assert.equal(capped.state.player.creatures[0].moves[0].pp, raiseAttack.maxPp - 4);
});

test('a missed or out-of-PP stat move does not change stages', () => {
  const inaccurate: MoveDefinition = { ...raiseAttack, id: 'move_miss', accuracy: 0 };
  const catalog = { ...moves, [inaccurate.id]: inaccurate };
  const missedState = battle({ playerTeam: [creature('player-1', inaccurate)] });
  const missed = resolveBattleTurn(missedState, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, catalog, exactRules);
  assert.equal(stage(missed.state.player.creatures[0], 'attack'), 0);
  assert.ok(missed.events.some(event => event.type === 'moveMissed' && event.moveId === inaccurate.id));

  const exhausted = battle({ playerTeam: [creature('player-1', raiseAttack, { moves: [{ moveId: raiseAttack.id, pp: 0 }] })] });
  const noPp = resolveBattleTurn(exhausted, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, exactRules);
  assert.equal(stage(noPp.state.player.creatures[0], 'attack'), 0);
  assert.ok(noPp.events.some(event => event.type === 'moveFailed' && event.reason === 'noPp'));
});

test('a speed boost changes action order on the next turn', () => {
  let state = battle({ playerTeam: [creature('player-1', raiseSpeed, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 30 }, moves: [{ moveId: raiseSpeed.id, pp: raiseSpeed.maxPp }, { moveId: tackle.id, pp: tackle.maxPp }] })], opponentTeam: [creature('opponent-1', tackle, { stats: { maxHp: 500, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 80 } })] });
  const first = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, exactRules);
  assert.deepEqual(first.events.find(event => event.type === 'actionOrder')?.type === 'actionOrder' ? first.events.find(event => event.type === 'actionOrder')?.sides : [], ['opponent', 'player']);
  state = first.state;
  const second = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, exactRules);
  const order = second.events.find(event => event.type === 'actionOrder');
  assert.ok(order?.type === 'actionOrder');
  assert.deepEqual(order.sides, ['player', 'opponent']);
});

test('stat changes replay deterministically and never mutate their input snapshot', () => {
  const state = battle({ playerTeam: [creature('player-1', calmMind)] });
  const before = structuredClone(state);
  const commands = { player: { kind: 'useMove', moveSlot: 0 } as const, opponent: { kind: 'useMove', moveSlot: 0 } as const };
  const first = resolveBattleTurn(state, commands, moves, prototypeBattleRules);
  const replay = resolveBattleTurn(state, commands, moves, prototypeBattleRules);
  assert.deepEqual(first, replay);
  assert.deepEqual(state, before);
  assert.deepEqual(stages(first.state, 'player'), { specialAttack: 1, specialDefense: 1 });
  assert.equal(first.events.filter(event => event.type === 'statStageChanged').length, 2);
});

test('switching clears temporary stages from both the departing and returning creatures', () => {
  let state = battle({ playerTeam: [creature('player-1', defensecurl), creature('player-2', defensecurl)] });
  state = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules).state;
  assert.equal(stage(state.player.creatures[0], 'defense'), 1);
  state = resolveBattleTurn(state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules).state;
  assert.equal(stage(state.player.creatures[0], 'defense'), 0);
  assert.equal(stage(state.player.creatures[1], 'defense'), 0);
  state = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules).state;
  assert.equal(stage(state.player.creatures[1], 'defense'), 1);
  const switchedBack = resolveBattleTurn(state, { player: { kind: 'switch', partyIndex: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(stage(switchedBack.state.player.creatures[0], 'defense'), 0);
  assert.equal(stage(switchedBack.state.player.creatures[1], 'defense'), 0);
  assert.ok(switchedBack.events.some(event => event.type === 'creatureSwitched'));
});

test('capturing a stat-staged creature adds it with zeroed stages', () => {
  const rules = { ...prototypeBattleRules, captureItems: { item_capture_net: { baseChance: 1 } } };
  const initial = battle({ rules, playerTeam: [creature('player-1', growl)], opponentTeam: [creature('opponent-1')] });
  const weakened = resolveBattleTurn(initial, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, rules).state;
  assert.equal(stages(weakened, 'opponent').attack, -1);
  const captured = resolveBattleTurn(weakened, {
    player: { kind: 'attemptCapture', itemId: 'item_capture_net', captureInstanceId: 'captured-1' },
    opponent: { kind: 'useMove', moveSlot: 0 },
  }, moves, rules);
  const newMember = captured.state.player.creatures[1];
  assert.equal(newMember.instanceId, 'captured-1');
  assert.equal(newMember.statStages, undefined);
});

test('Gen IV accuracy and evasion use separate stage multipliers, with guaranteed moves bypassing both', () => {
  const user = creature('player-1', tackle, { statStages: { accuracy: -6 } });
  const target = creature('opponent-1', noop, { statStages: { evasion: 6 } });
  assert.ok(Math.abs(effectiveMoveAccuracy(user, target, tackle) - 100 / 9) < 1e-10);
  assert.equal(effectiveMoveAccuracy({ ...user, statStages: { accuracy: -1 } }, { ...target, statStages: undefined }, tackle), 75);
  assert.equal(effectiveMoveAccuracy({ ...user, statStages: { accuracy: 6 } }, target, tackle), 100);
  assert.equal(effectiveMoveAccuracy(user, target, { ...tackle, alwaysHits: true }), 100);
});

test('sourced Sand Attack changes accuracy, spends PP and resets on switching', () => {
  const sand = contentMoves['sand-attack'];
  const catalog = { ...moves, [sand.id]: sand };
  const state = battle({ playerTeam: [creature('player-1', sand)], opponentTeam: [creature('opponent-1'), creature('opponent-2')] });
  const first = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, catalog, exactRules);
  assert.equal(first.state.opponent.creatures[0].statStages?.accuracy, -1);
  assert.equal(first.state.player.creatures[0].moves[0].pp, sand.maxPp - 1);
  assert.ok(first.events.some(event => event.type === 'statStageChanged' && event.stat === 'accuracy' && event.change === -1));
  const switched = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'switch', partyIndex: 1 } }, catalog, exactRules);
  assert.equal(switched.state.opponent.creatures[0].statStages, undefined);
  assert.equal(switched.state.opponent.creatures[1].statStages?.accuracy, -1);
  assert.equal(state.opponent.creatures[0].statStages, undefined);
});

test('accuracy reductions cause deterministic misses in actual turn resolution', () => {
  let misses = 0;
  for (let seed = 1; seed <= 32; seed++) {
    const initial = battle({ seed, playerTeam: [creature('player-1', tackle)] });
    const state = { ...initial, player: { ...initial.player, creatures: [{ ...initial.player.creatures[0], statStages: { accuracy: -6 } }] } };
    const commands = { player: { kind: 'useMove', moveSlot: 0 } as const, opponent: { kind: 'useMove', moveSlot: 0 } as const };
    const result = resolveBattleTurn(state, commands, moves, exactRules);
    assert.deepEqual(resolveBattleTurn(state, commands, moves, exactRules), result);
    if (result.events.some(event => event.type === 'moveMissed' && event.side === 'player')) misses++;
    const normal = resolveBattleTurn(initial, commands, moves, exactRules);
    assert.equal(normal.events.some(event => event.type === 'moveMissed' && event.side === 'player'), false);
  }
  assert.ok(misses > 0 && misses < 32);
});

test('sourced Sweet Scent uses the historical one-stage evasion decrease', () => {
  assert.deepEqual(contentMoves['sweet-scent'].statChanges, [{ target: 'opponent', stat: 'evasion', stages: -1 }]);
});
