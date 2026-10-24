import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { calculateStats } from '../../src/core/battle/create-creature.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';

const base = { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: 50 };
const strike: MoveDefinition = { id: 'strike', name: 'Strike', type: 'normal', category: 'physical', power: 100, accuracy: 100, alwaysHits: true, priority: 1, maxPp: 20 };
const wait: MoveDefinition = { ...strike, id: 'wait', name: 'Wait', power: 0, category: 'status', priority: 0 };
const moves = { strike, wait };
const rules = { ...prototypeBattleRules, fleeBaseChance: 1, evolutions: { 1: [{ minimumLevel: 6, target: { speciesId: 2, name: 'New form', types: ['normal'] as const, baseStats: { ...base, hp: 60 }, experienceYield: 10 } }] }, levelUpMoves: { 2: [{ level: 6, moveId: 'wait', maxPp: 20 }] } };
function creature(id: string, overrides: Partial<BattleCreature> = {}): BattleCreature {
  return { instanceId: id, speciesId: 1, name: id, level: 5, baseStats: base, growthCurveId: 'veloria_medium_fast_v1', stats: calculateStats(base, 5), hp: calculateStats(base, 5).maxHp, experience: 90, experienceYield: 7, types: ['normal'], moves: [{ moveId: 'strike', pp: 20 }], ...overrides };
}
function battle() { return createBattleState({ battleId: 'deferred', battleType: 'wild', seed: 1, rules, playerTeam: [creature('hero')], opponentTeam: [creature('first', { hp: 1, level: 7, moves: [{ moveId: 'wait', pp: 20 }] }), creature('second', { hp: 1, moves: [{ moveId: 'wait', pp: 20 }] })] }); }
const attack = { player: { kind: 'useMove', moveSlot: 0 } as const, opponent: { kind: 'useMove', moveSlot: 0 } as const };
function afterFirst() { return resolveBattleTurn(battle(), attack, moves, rules); }
function replaceOpponent(state: ReturnType<typeof battle>) { return resolveBattleTurn(state, { player: attack.player, opponent: { kind: 'switch', partyIndex: 1 } }, moves, rules).state; }

test('a level gain evolves the creature before the next opponent acts', () => {
  const initial = battle(); const first = resolveBattleTurn(initial, attack, moves, rules);
  assert.equal(initial.player.creatures[0].level, 5);
  assert.equal(first.state.player.creatures[0].level, 6);
  assert.equal(first.state.player.creatures[0].speciesId, 2);
  assert.deepEqual(first.state.pendingLevelEvolutions, []);
  assert.ok(first.events.some(event => event.type === 'creatureEvolved'));
  assert.ok(first.events.findIndex(event => event.type === 'levelUp') < first.events.findIndex(event => event.type === 'creatureEvolved'));
  const replaced = replaceOpponent(first.state);
  const result = resolveBattleTurn(replaced, attack, moves, rules);
  assert.equal(result.state.outcome.kind, 'won');
  assert.equal(result.state.player.creatures[0].speciesId, 2);
  assert.equal(result.state.player.creatures[0].moves[0].pp, 18);
  assert.ok(result.state.player.creatures[0].moves.some(slot => slot.moveId === 'wait'));
  assert.deepEqual(result.state.pendingLevelEvolutions, []);
  assert.deepEqual(resolveBattleTurn(result.state, attack, moves, rules), { state: result.state, events: [] });
});

test('fleeing after an evolution keeps the evolved form', () => {
  const state = replaceOpponent(afterFirst().state);
  assert.equal(state.player.creatures[0].speciesId, 2);
  const result = resolveBattleTurn(state, { player: { kind: 'attemptFlee' }, opponent: attack.opponent }, moves, rules);
  assert.equal(result.state.outcome.kind, 'fled');
  assert.equal(result.state.player.creatures[0].level, 6);
  assert.equal(result.state.player.creatures[0].speciesId, 2);
  assert.deepEqual(result.state.pendingLevelEvolutions, []);
});

test('an already eligible XP recipient recovers evolution without another level gain', () => {
  const state = createBattleState({ battleId: 'no-level', battleType: 'wild', seed: 1, rules, playerTeam: [creature('hero', { level: 10, experience: 0 })], opponentTeam: [creature('target', { hp: 1, experienceYield: 1 })] });
  const result = resolveBattleTurn(state, attack, moves, rules);
  assert.equal(result.state.outcome.kind, 'won');
  assert.equal(result.state.player.creatures[0].speciesId, 2);
  assert.equal(result.state.player.creatures[0].level, 10);
  assert.ok(result.events.some(event => event.type === 'creatureEvolved'));
  assert.ok(!result.events.some(event => event.type === 'levelUp'));
  assert.ok(!result.state.player.creatures[0].moves.some(slot => slot.moveId === 'wait'), 'older new-form moves are not granted retroactively');
});

test('a fainted level recipient does not evolve when another party member wins', () => {
  const first = afterFirst().state;
  const state = { ...first, player: { creatures: [{ ...first.player.creatures[0], speciesId: 1, hp: 0 }, creature('finisher', { speciesId: 3, level: 10, experience: 0 })], activeIndex: 0 }, pendingLevelEvolutions: [{ creatureId: 'hero', previousLevel: 5 }] };
  const replaced = resolveBattleTurn(state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'switch', partyIndex: 1 } }, moves, rules);
  const result = resolveBattleTurn(replaced.state, attack, moves, rules);
  assert.equal(result.state.outcome.kind, 'won');
  assert.equal(result.state.player.creatures[0].speciesId, 1);
  assert.equal(result.state.player.creatures[0].hp, 0);
  assert.deepEqual(result.state.pendingLevelEvolutions, []);
  const healed = { ...result.state.player.creatures[0], hp: result.state.player.creatures[0].stats.maxHp };
  const retry = createBattleState({ battleId: 'healed-recovery', battleType: 'wild', seed: 1, rules, playerTeam: [healed], opponentTeam: [creature('target', { hp: 1, experienceYield: 1 })] });
  const recovered = resolveBattleTurn(retry, attack, moves, rules);
  assert.equal(recovered.state.player.creatures[0].speciesId, 2);
  assert.equal(recovered.state.player.creatures[0].level, 6);
  assert.ok(!recovered.events.some(event => event.type === 'levelUp'));
});

test('eligible reserves without XP are not evolved by another companion victory', () => {
  const state = createBattleState({ battleId: 'reserve', battleType: 'wild', seed: 1, rules,
    playerTeam: [creature('hero', { speciesId: 3, level: 10, experience: 0 }), creature('reserve', { level: 10, experience: 0 })],
    opponentTeam: [creature('target', { hp: 1, experienceYield: 1 })] });
  const result = resolveBattleTurn(state, attack, moves, rules);
  assert.equal(result.state.player.creatures[1].speciesId, 1);
  assert.ok(!result.events.some(event => event.type === 'creatureEvolved'));
});

test('an eligible creature receiving no XP cannot trigger recovery', () => {
  const state = createBattleState({ battleId: 'no-xp', battleType: 'wild', seed: 1, rules,
    playerTeam: [creature('hero', { level: 10, experience: 0 })],
    opponentTeam: [creature('target', { hp: 1, experienceYield: 0 })] });
  const result = resolveBattleTurn(state, attack, moves, rules);
  assert.equal(result.state.player.creatures[0].speciesId, 1);
  assert.ok(!result.events.some(event => event.type === 'creatureEvolved'));
});

test('a later defeat does not revert an evolution earned earlier in the fight', () => {
  const state = replaceOpponent(afterFirst().state);
  assert.equal(state.player.creatures[0].speciesId, 2);
  const losing = { ...state, player: { ...state.player, creatures: [{ ...state.player.creatures[0], hp: 1, moves: [{ moveId: 'wait', pp: 20 }] }] }, opponent: { ...state.opponent, creatures: state.opponent.creatures.map((entry, index) => index === 1 ? { ...entry, moves: [{ moveId: 'strike', pp: 20 }] } : entry) } };
  const result = resolveBattleTurn(losing, attack, moves, rules);
  assert.deepEqual(result.state.outcome, { kind: 'won', winner: 'opponent', reason: 'allFainted' });
  assert.equal(result.state.player.creatures[0].level, 6);
  assert.equal(result.state.player.creatures[0].speciesId, 2);
  assert.deepEqual(result.state.pendingLevelEvolutions, []);
});
