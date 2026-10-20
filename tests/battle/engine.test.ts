import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';

const tackle: MoveDefinition = { id: 'move_tackle', name: 'Bump', type: 'normal', category: 'physical', power: 40, accuracy: 100, priority: 0, maxPp: 10 };
const swift: MoveDefinition = { id: 'move_swift', name: 'Quick Arc', type: 'electric', category: 'special', power: 45, accuracy: 100, priority: 1, maxPp: 10 };
const poisonMist: MoveDefinition = { id: 'move_poison_mist', name: 'Murk', type: 'poison', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 5, inflictedStatus: 'poison', statusChance: 100 };
const moves = { [tackle.id]: tackle, [swift.id]: swift, [poisonMist.id]: poisonMist };

function creature(id: string, options: Partial<BattleCreature> = {}): BattleCreature {
  return {
    instanceId: id,
    speciesId: id === 'player-01' ? 90001 : 90002,
    name: id,
    level: 5,
    types: ['normal'],
    stats: { maxHp: 100, attack: 30, defense: 30, specialAttack: 30, specialDefense: 30, speed: 30 },
    hp: 100,
    experience: 0,
    experienceYield: 17,
    moves: [{ moveId: tackle.id, pp: 10 }],
    ...options,
  };
}

function battle(overrides: Partial<Parameters<typeof createBattleState>[0]> = {}) {
  return createBattleState({
    battleId: 'test_battle_001', battleType: 'wild', seed: 12, rules: prototypeBattleRules,
    playerTeam: [creature('player-01')], opponentTeam: [creature('opponent-01')], ...overrides,
  });
}

const actions = { player: { kind: 'useMove', moveSlot: 0 } as const, opponent: { kind: 'useMove', moveSlot: 0 } as const };

test('same seeded commands produce a byte-for-byte equivalent transition', () => {
  const first = resolveBattleTurn(battle(), actions, moves, prototypeBattleRules);
  const replay = resolveBattleTurn(battle(), actions, moves, prototypeBattleRules);
  assert.deepEqual(replay, first);
});

test('move priority precedes speed and PP is spent exactly once', () => {
  const state = battle({ playerTeam: [creature('player-01', { stats: { maxHp: 100, attack: 30, defense: 30, specialAttack: 30, specialDefense: 30, speed: 1 }, moves: [{ moveId: swift.id, pp: 1 }] })] });
  const result = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: actions.opponent }, moves, prototypeBattleRules);
  assert.deepEqual(result.events.find(event => event.type === 'actionOrder')?.sides, ['player', 'opponent']);
  assert.equal(result.state.player.creatures[0].moves[0].pp, 0);
  const spent = resolveBattleTurn(result.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: actions.opponent }, moves, prototypeBattleRules);
  assert.equal(spent.state.player.creatures[0].moves[0].pp, 0);
  assert.ok(spent.events.some(event => event.type === 'moveFailed' && event.reason === 'noPp'));
});

test('type chart multiplies effectiveness across dual types and respects immunity', () => {
  const rules = { ...prototypeBattleRules, criticalChance: 0, typeChart: { electric: { water: 2, flying: 2, ground: 0 } } };
  const target = creature('opponent-01', { types: ['water', 'flying'], stats: { maxHp: 100, attack: 1, defense: 20, specialAttack: 1, specialDefense: 20, speed: 1 } });
  const source = creature('player-01', { moves: [{ moveId: swift.id, pp: 2 }] });
  const effective = resolveBattleTurn(battle({ rules, playerTeam: [source], opponentTeam: [target] }), { player: { kind: 'useMove', moveSlot: 0 }, opponent: actions.opponent }, moves, rules);
  const damage = effective.events.find(event => event.type === 'damageApplied');
  assert.equal(damage?.type === 'damageApplied' ? damage.effectiveness : -1, 4);

  const immuneTarget = creature('opponent-01', { types: ['ground'], stats: { maxHp: 100, attack: 1, defense: 20, specialAttack: 1, specialDefense: 20, speed: 1 } });
  const immune = resolveBattleTurn(battle({ rules, playerTeam: [source], opponentTeam: [immuneTarget] }), { player: { kind: 'useMove', moveSlot: 0 }, opponent: actions.opponent }, moves, rules);
  const immuneHit = immune.events.find(event => event.type === 'damageApplied');
  assert.equal(immuneHit?.type === 'damageApplied' ? immuneHit.amount : -1, 0);
});

test('status application is logged; poison residual damage is bounded and can KO', () => {
  const rules = { ...prototypeBattleRules, criticalChance: 0, poisonResidualFraction: 1 / 8 };
  const source = creature('player-01', { moves: [{ moveId: poisonMist.id, pp: 2 }] });
  const target = creature('opponent-01', { hp: 1, stats: { maxHp: 8, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 } });
  const result = resolveBattleTurn(battle({ rules, playerTeam: [source], opponentTeam: [target] }), { player: { kind: 'useMove', moveSlot: 0 }, opponent: actions.opponent }, moves, rules);
  assert.ok(result.events.some(event => event.type === 'statusApplied' && event.status === 'poison'));
  assert.equal(result.state.opponent.creatures[0].hp, 0);
  assert.equal(result.state.outcome.kind, 'won');
  assert.equal(result.state.player.creatures[0].experience, 12);
  assert.ok(result.events.some(event => event.type === 'battleEnded'));
});

test('prototype growth curve carries XP between levels and recalculates stats without fully healing', () => {
  const player = creature('player-01', {
    stats: { maxHp: 19, attack: 9, defense: 9, specialAttack: 9, specialDefense: 9, speed: 90 },
    baseStats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 },
    growthCurveId: 'veloria_medium_fast_v1', hp: 14,
  });
  const opponent = creature('opponent-01', { hp: 1, level: 7, experienceYield: 100 });
  const state = battle({ playerTeam: [player], opponentTeam: [opponent] });
  const result = resolveBattleTurn(state, actions, moves, prototypeBattleRules);
  const leveled = result.state.player.creatures[0];
  assert.equal(leveled.level, 6);
  assert.equal(leveled.experience, 9);
  assert.equal(leveled.stats.maxHp, 21);
  assert.ok(leveled.hp > 0 && leveled.hp < leveled.stats.maxHp);
  assert.ok(result.events.some(event => event.type === 'levelUp' && event.previousLevel === 5 && event.level === 6));
});

test('one XP reward may cross several thresholds while preserving overflow', () => {
  const player = creature('player-01', { growthCurveId: 'veloria_medium_fast_v1', baseStats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 } });
  const opponent = creature('opponent-01', { hp: 1, level: 7, experienceYield: 300 });
  const result = resolveBattleTurn(battle({ playerTeam: [player], opponentTeam: [opponent] }), actions, moves, prototypeBattleRules);
  assert.equal(result.state.player.creatures[0].level, 7);
  assert.equal(result.state.player.creatures[0].experience, 82);
  assert.equal(result.events.filter(event => event.type === 'levelUp').length, 2);
});

test('level evolution replaces species data after XP while preserving the creature instance and battle state', () => {
  const rules = {
    ...prototypeBattleRules,
    evolutions: {
      90001: [{ minimumLevel: 6, target: { speciesId: 90003, name: 'Canopy Pod', types: ['grass'] as const, baseStats: { hp: 52, attack: 55, defense: 61, specialAttack: 48, specialDefense: 57, speed: 39 }, experienceYield: 29, growthCurveId: 'veloria_medium_fast_v1' } }],
      90003: [{ minimumLevel: 7, target: { speciesId: 90004, name: 'Glimmerwing', types: ['bug', 'flying'] as const, baseStats: { hp: 66, attack: 69, defense: 63, specialAttack: 72, specialDefense: 66, speed: 83 }, experienceYield: 55, growthCurveId: 'veloria_medium_fast_v1' } }],
    },
  };
  const player = creature('player-01', {
    growthCurveId: 'veloria_medium_fast_v1',
    baseStats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 },
    hp: 12,
    status: { status: 'poison' },
  });
  const opponent = creature('opponent-01', { hp: 1, level: 7, experienceYield: 218 });
  const result = resolveBattleTurn(battle({ rules, playerTeam: [player], opponentTeam: [opponent] }), actions, moves, rules);
  const evolved = result.state.player.creatures[0];
  assert.deepEqual(result.events.filter(event => event.type === 'creatureEvolved').map(event => event.type === 'creatureEvolved' ? [event.fromSpeciesId, event.toSpeciesId] : []), [[90001, 90003], [90003, 90004]]);
  assert.equal(evolved.instanceId, player.instanceId);
  assert.equal(evolved.speciesId, 90004);
  assert.equal(evolved.name, 'Glimmerwing');
  assert.equal(evolved.level, 7);
  assert.equal(evolved.experience, 0);
  assert.equal(evolved.moves[0].moveId, player.moves[0].moveId);
  assert.equal(evolved.moves[0].pp, player.moves[0].pp - 1);
  assert.deepEqual(evolved.status, player.status);
  assert.ok(evolved.hp > 0 && evolved.hp <= evolved.stats.maxHp);
});

test('invalid switch rejects without changing state', () => {
  const state = battle();
  const result = resolveBattleTurn(state, { player: { kind: 'switch', partyIndex: 5 }, opponent: actions.opponent }, moves, prototypeBattleRules);
  assert.equal(result.state, state);
  assert.ok(result.events.some(event => event.type === 'commandRejected' && event.reason === 'invalidSwitch'));
});

test('wild capture success records the stable instance ID and adds the creature to the party', () => {
  const rules = { ...prototypeBattleRules, captureItems: { item_capture_net: { baseChance: 1 } } };
  const state = battle({ rules });
  const result = resolveBattleTurn(state, {
    player: { kind: 'attemptCapture', itemId: 'item_capture_net', captureInstanceId: 'capture-instance-001' },
    opponent: actions.opponent,
  }, moves, rules);

  assert.deepEqual(result.state.outcome, { kind: 'captured', creatureId: 'capture-instance-001', destination: 'party' });
  assert.equal(result.state.player.creatures.length, 2);
  assert.equal(result.state.player.creatures[1].instanceId, 'capture-instance-001');
  assert.ok(result.events.some(event => event.type === 'creatureCaptured' && event.creatureId === 'capture-instance-001'));
  assert.ok(result.events.some(event => event.type === 'battleEnded' && event.outcome.kind === 'captured'));
  assert.ok(!result.events.some(event => event.type === 'moveUsed' && event.side === 'opponent'));
});

test('wild capture failure is logged deterministically without adding or duplicating a creature', () => {
  const rules = { ...prototypeBattleRules, captureItems: { item_capture_net: { baseChance: 0 } } };
  const state = battle({ rules });
  const command = { kind: 'attemptCapture', itemId: 'item_capture_net', captureInstanceId: 'capture-instance-002' } as const;
  const first = resolveBattleTurn(state, { player: command, opponent: actions.opponent }, moves, rules);
  const replay = resolveBattleTurn(state, { player: command, opponent: actions.opponent }, moves, rules);

  assert.deepEqual(replay, first);
  assert.equal(first.state.outcome.kind, 'ongoing');
  assert.equal(first.state.player.creatures.length, 1);
  assert.equal(first.state.playerStorage.length, 0);
  assert.ok(first.events.some(event => event.type === 'captureFailed' && event.roll >= event.chance));
  assert.ok(!first.events.some(event => event.type === 'creatureCaptured'));
});

test('capture attempt is rejected in trainer battles without changing state', () => {
  const rules = { ...prototypeBattleRules, captureItems: { item_capture_net: { baseChance: 1 } } };
  const state = battle({ rules, battleType: 'trainer' });
  const result = resolveBattleTurn(state, {
    player: { kind: 'attemptCapture', itemId: 'item_capture_net', captureInstanceId: 'capture-instance-003' },
    opponent: actions.opponent,
  }, moves, rules);

  assert.equal(result.state, state);
  assert.deepEqual(result.events, [{ type: 'commandRejected', side: 'player', reason: 'captureForbidden' }]);
  assert.equal(result.state.player.creatures.length, 1);
});

test('successful capture goes to storage when the party is full', () => {
  const rules = { ...prototypeBattleRules, captureItems: { item_capture_net: { baseChance: 1 } } };
  const fullParty = Array.from({ length: rules.maxPartySize }, (_, index) => creature(`party-${index + 1}`));
  const result = resolveBattleTurn(battle({ rules, playerTeam: fullParty }), {
    player: { kind: 'attemptCapture', itemId: 'item_capture_net', captureInstanceId: 'capture-instance-004' },
    opponent: actions.opponent,
  }, moves, rules);

  assert.equal(result.state.player.creatures.length, rules.maxPartySize);
  assert.equal(result.state.playerStorage.length, 1);
  assert.equal(result.state.playerStorage[0].instanceId, 'capture-instance-004');
  assert.deepEqual(result.state.outcome, { kind: 'captured', creatureId: 'capture-instance-004', destination: 'storage' });
});

test('capture chance comes from the active ruleset and reflects missing HP and status', () => {
  const rules = {
    ...prototypeBattleRules,
    captureItems: { item_capture_net: { baseChance: 0.1, missingHpBonus: 0.2, statusBonus: 0.3 } },
  };
  const target = creature('opponent-01', { hp: 50, status: { status: 'poison' } });
  const result = resolveBattleTurn(battle({ rules, opponentTeam: [target] }), {
    player: { kind: 'attemptCapture', itemId: 'item_capture_net', captureInstanceId: 'capture-instance-005' },
    opponent: actions.opponent,
  }, moves, rules);

  const attempt = result.events.find(event => event.type === 'captureAttempted');
  assert.equal(attempt?.type === 'captureAttempted' ? attempt.chance : -1, 0.5);
});

test('default battle rules block Gen IV type-based status immunities, including dual types', () => {
  for (const [types, status] of [[['grass', 'poison'], 'poison'], [['steel'], 'poison'], [['fire'], 'burn'], [['ice'], 'freeze']] as const) {
    const pulse: MoveDefinition = { ...poisonMist, inflictedStatus: status };
    const source = creature('player-01', { moves: [{ moveId: pulse.id, pp: 5 }] });
    const target = creature('opponent-01', { types });
    const state = createBattleState({ battleId: 'type-status-immunity', battleType: 'wild', seed: 8, rules: prototypeBattleRules, playerTeam: [source], opponentTeam: [target] });
    const result = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, { ...moves, [pulse.id]: pulse }, prototypeBattleRules);
    assert.equal(result.state.opponent.creatures[0].status, undefined);
    assert.ok(result.events.some(event => event.type === 'statusPrevented' && event.reason === 'immune' && event.status === status));
  }
});

test('Gen IV does not give Electric paralysis immunity or Grass powder immunity', () => {
  for (const [types, status] of [[['electric'], 'paralysis'], [['grass'], 'sleep']] as const) {
    const pulse: MoveDefinition = { ...poisonMist, inflictedStatus: status };
    const state = createBattleState({ battleId: 'historical-status-rules', battleType: 'wild', seed: 8, rules: prototypeBattleRules,
      playerTeam: [creature('player-01', { moves: [{ moveId: pulse.id, pp: 5 }] })], opponentTeam: [creature('opponent-01', { types })] });
    const result = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, { ...moves, [pulse.id]: pulse }, prototypeBattleRules);
    assert.ok(result.events.some(event => event.type === 'statusApplied' && event.side === 'opponent' && event.status === status));
  }
});

test('forced replacement is free: no attack, PP expenditure, residual damage, RNG or turn advance', () => {
  const initial = createBattleState({ battleId: 'forced-player-switch', battleType: 'trainer', seed: 8, rules: prototypeBattleRules,
    playerTeam: [creature('player-01'), creature('player-02', { status: { status: 'poison' } })], opponentTeam: [creature('opponent-01')] });
  const state = { ...initial, turn: 4, player: { ...initial.player, creatures: [{ ...initial.player.creatures[0], hp: 0 }, initial.player.creatures[1]] } };
  const before = structuredClone(state);
  const result = resolveBattleTurn(state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 99 } }, moves, prototypeBattleRules);
  assert.equal(result.state.turn, 4);
  assert.equal(result.state.rngState, state.rngState);
  assert.equal(result.state.player.activeIndex, 1);
  assert.equal(result.state.player.creatures[1].hp, 100);
  assert.deepEqual(result.state.opponent, state.opponent);
  assert.deepEqual(result.events.map(event => event.type), ['creatureSwitched']);
  assert.deepEqual(state, before);
  const invalid = resolveBattleTurn(state, { player: { kind: 'switch', partyIndex: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(invalid.events[0].type, 'commandRejected');
  assert.deepEqual(invalid.state, state);
});

test('simultaneous forced replacements resolve together without consuming a turn', () => {
  const initial = createBattleState({ battleId: 'forced-both-switch', battleType: 'trainer', seed: 8, rules: prototypeBattleRules,
    playerTeam: [creature('player-01'), creature('player-02')], opponentTeam: [creature('opponent-01'), creature('opponent-02')] });
  const state = { ...initial, player: { ...initial.player, creatures: [{ ...initial.player.creatures[0], hp: 0 }, initial.player.creatures[1]] },
    opponent: { ...initial.opponent, creatures: [{ ...initial.opponent.creatures[0], hp: 0 }, initial.opponent.creatures[1]] } };
  const result = resolveBattleTurn(state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'switch', partyIndex: 1 } }, moves, prototypeBattleRules);
  assert.equal(result.state.turn, state.turn);
  assert.equal(result.state.rngState, state.rngState);
  assert.equal(result.state.player.activeIndex, 1);
  assert.equal(result.state.opponent.activeIndex, 1);
  assert.deepEqual(result.events.map(event => event.type), ['creatureSwitched', 'creatureSwitched']);
});

test('voluntary switching still spends the turn and permits the opponent attack', () => {
  const state = createBattleState({ battleId: 'voluntary-switch', battleType: 'trainer', seed: 8, rules: prototypeBattleRules,
    playerTeam: [creature('player-01'), creature('player-02')], opponentTeam: [creature('opponent-01')] });
  const result = resolveBattleTurn(state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(result.state.turn, state.turn + 1);
  assert.ok(result.state.player.creatures[1].hp < 100);
  assert.equal(result.state.opponent.creatures[0].moves[0].pp, 9);
});
