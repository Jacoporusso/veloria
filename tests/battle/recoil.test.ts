import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };

const takeDown = moveData.moves['take-down'] as MoveDefinition;
const wait: MoveDefinition = { id: 'wait', name: 'Attesa', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10 };
const rules = { ...prototypeBattleRules, typeChart: { normal: { ghost: 0 } }, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 };
const actions = { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } } as const;
function creature(id: string, changes: Partial<BattleCreature> = {}): BattleCreature {
  return { instanceId: id, speciesId: 999, name: id, types: ['fire'], level: 10, hp: 100,
    stats: { maxHp: 100, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: id === 'player' ? 100 : 1 },
    experience: 0, experienceYield: 100, moves: [{ moveId: id === 'player' ? takeDown.id : wait.id, pp: 10 }], ...changes };
}
function run(player = creature('player'), opponent = creature('opponent'), move: MoveDefinition = { ...takeDown, alwaysHits: true }) {
  const state = createBattleState({ battleId: 'recoil', battleType: 'wild', seed: 17, rules, playerTeam: [player], opponentTeam: [opponent] });
  return resolveBattleTurn(state, actions, { [move.id]: move, [wait.id]: wait }, rules);
}

test('ordinary recoil uses actual damage, occurs after a hit and consumes one PP', () => {
  const result = run();
  const hit = result.events.find(e => e.type === 'damageApplied');
  assert.ok(hit?.type === 'damageApplied' && hit.amount > 0);
  const recoil = result.events.find(e => e.type === 'recoilApplied');
  assert.ok(recoil?.type === 'recoilApplied');
  assert.equal(recoil.amount, Math.max(1, Math.floor(hit.amount / 4)));
  assert.equal(result.state.player.creatures[0].hp, 100 - recoil.amount);
  assert.equal(result.state.player.creatures[0].moves[0].pp, 9);
  assert.ok(result.events.indexOf(recoil) > result.events.indexOf(hit));
});

test('overkill is capped before HGSS recoil rounding and recoil precedes XP', () => {
  const result = run(creature('player'), creature('opponent', { hp: 7 }));
  assert.equal(result.events.find(e => e.type === 'damageApplied')?.amount, 7);
  const recoil = result.events.find(e => e.type === 'recoilApplied');
  assert.ok(recoil?.type === 'recoilApplied');
  assert.equal(recoil.amount, 1, 'floor(7 / 4), not the theoretical damage or nearest integer');
  assert.ok(result.events.findIndex(e => e.type === 'experienceGained') > result.events.indexOf(recoil));
  assert.equal(result.state.player.creatures[0].hp, 99);
});

test('a one-HP hit still inflicts one recoil HP and a double KO grants no XP', () => {
  const result = run(creature('player', { hp: 1 }), creature('opponent', { hp: 1 }));
  assert.equal(result.state.player.creatures[0].hp, 0);
  assert.equal(result.state.opponent.creatures[0].hp, 0);
  assert.equal(result.state.outcome.kind, 'draw');
  assert.equal(result.state.player.creatures[0].experience, 0);
  assert.equal(result.events.filter(e => e.type === 'creatureFainted').length, 2);
  assert.ok(!result.events.some(e => e.type === 'experienceGained' || e.type === 'levelUp' || e.type === 'creatureEvolved'));
});

test('a recoil KO cancels the attacker action sequence without letting the opponent hit a fainted target', () => {
  const result = run(creature('player', { hp: 1 }));
  assert.equal(result.state.player.creatures[0].hp, 0);
  assert.ok(result.state.opponent.creatures[0].hp > 0);
  assert.equal(result.events.filter(e => e.type === 'moveUsed' && e.side === 'opponent').length, 0);
});

test('a miss or type immunity causes no ordinary recoil', () => {
  for (const result of [run(undefined, undefined, { ...takeDown, accuracy: 0 }), run(undefined, creature('opponent', { types: ['ghost'] }))]) {
    assert.equal(result.state.player.creatures[0].hp, 100);
    assert.ok(!result.events.some(e => e.type === 'recoilApplied'));
    assert.equal(result.state.player.creatures[0].moves[0].pp, 9);
  }
});

test('recoil cannot occur while sleep prevents the move and does not consume PP', () => {
  const result = run(creature('player', { status: { status: 'sleep', turnsRemaining: 2 } }));
  assert.equal(result.state.player.creatures[0].hp, 100);
  assert.equal(result.state.player.creatures[0].moves[0].pp, 10);
  assert.ok(!result.events.some(e => e.type === 'recoilApplied'));
});

test('opponent recoil is attributed to the opponent and clamps HP', () => {
  const result = run(creature('player', { moves: [{ moveId: wait.id, pp: 10 }] }),
    creature('opponent', { hp: 1, moves: [{ moveId: takeDown.id, pp: 10 }] }));
  assert.equal(result.state.opponent.creatures[0].hp, 0);
  const recoil = result.events.find(e => e.type === 'recoilApplied');
  assert.ok(recoil?.type === 'recoilApplied' && recoil.side === 'opponent' && recoil.amount === 1);
  assert.ok(result.state.player.creatures[0].experience > 0, 'a surviving player receives XP when the opponent faints from recoil');
  assert.equal(result.events.filter(e => e.type === 'experienceGained').length, 1);
});

test('invalid recoil definitions fail closed', () => {
  for (const recoilPercent of [0, -1, 101, 25.5, NaN, Infinity]) {
    assert.throws(() => run(undefined, undefined, { ...takeDown, recoilPercent }), /Invalid move data/);
  }
  assert.throws(() => run(undefined, undefined, { ...takeDown, category: 'status' }), /Invalid move data/);
  assert.throws(() => run(undefined, undefined, { ...takeDown, drainPercent: 50 }), /Invalid move data/);
});
