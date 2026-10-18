import { chooseOpponentCommand } from '../../src/core/battle/opponent-policy.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import movesData from '../../content/battle/moves.v1.json' with { type: 'json' };
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleCreature, BattleState, MoveDefinition } from '../../src/core/battle/types.ts';

const moves = movesData.moves as Record<string, MoveDefinition>;
const commands = { player: { kind: 'useMove', moveSlot: 0 } as const, opponent: { kind: 'useMove', moveSlot: 0 } as const };
function creature(id: string, player: boolean, overrides: Partial<BattleCreature> = {}): BattleCreature {
  return { instanceId: id, speciesId: player ? 1 : 19, name: id, level: 7, types: player ? ['grass', 'poison'] : ['normal'],
    stats: { maxHp: 80, attack: 20, defense: 20, specialAttack: 20, specialDefense: 20, speed: player ? 30 : 20 },
    hp: player ? 50 : 80, experience: 0, experienceYield: 0,
    moves: player ? [{ moveId: 'leech-seed', pp: 10 }, { moveId: 'harden', pp: 30 }] : [{ moveId: 'harden', pp: 30 }], ...overrides };
}
function battle(target: Partial<BattleCreature> = {}, source: Partial<BattleCreature> = {}, reserves = false): BattleState {
  return createBattleState({ battleId: 'leech-seed', battleType: 'wild', seed: 8, rules: prototypeBattleRules,
    playerTeam: [creature('source', true, source), ...(reserves ? [creature('source-reserve', true, { hp: 40 })] : [])],
    opponentTeam: [creature('target', false, target), ...(reserves ? [creature('target-reserve', false)] : [])] });
}
function turn(state: BattleState, selected = commands) { return resolveBattleTurn(state, selected, moves, prototypeBattleRules); }

test('sourced Leech Seed drains one eighth each turn and never mutates its input', () => {
  assert.deepEqual([moves['leech-seed'].accuracy, moves['leech-seed'].maxPp, moves['leech-seed'].leechSeedFraction], [90, 10, 1 / 8]);
  const state = battle();
  const before = structuredClone(state);
  const first = turn(state);
  assert.equal(first.state.opponent.creatures[0].hp, 70);
  assert.equal(first.state.player.creatures[0].hp, 60);
  assert.equal(first.state.player.creatures[0].moves[0].pp, 9);
  assert.equal(first.events.filter(event => event.type === 'leechSeedApplied').length, 1);
  assert.deepEqual(state, before);
  assert.deepEqual(turn(state), first);
  const next = turn(first.state, { ...commands, player: { kind: 'useMove', moveSlot: 1 } });
  assert.equal(next.state.opponent.creatures[0].hp, 60);
  assert.equal(next.state.player.creatures[0].hp, 70);
});

test('Grass targets are immune and repeated seeding does not stack', () => {
  const immune = turn(battle({ types: ['grass'] }));
  assert.ok(immune.events.some(event => event.type === 'leechSeedPrevented' && event.reason === 'immune'));
  assert.equal(immune.state.opponent.creatures[0].leechSeed, undefined);
  assert.equal(immune.state.opponent.creatures[0].hp, 80);
  const first = turn(battle());
  const again = turn(first.state);
  assert.ok(again.events.some(event => event.type === 'leechSeedPrevented' && event.reason === 'alreadySeeded'));
  assert.equal(again.events.filter(event => event.type === 'leechSeedTick').length, 1);
  assert.equal(again.state.opponent.creatures[0].hp, 60);
});

test('changing the seeded target clears the effect without transferring it to the reserve', () => {
  const seeded = turn(battle({}, {}, true)).state;
  const changed = resolveBattleTurn(seeded, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'switch', partyIndex: 1 } }, moves, prototypeBattleRules);
  assert.equal(changed.state.opponent.creatures[0].leechSeed, undefined);
  assert.equal(changed.state.opponent.creatures[1].leechSeed, undefined);
  assert.equal(changed.events.some(event => event.type === 'leechSeedTick'), false);
});

test('changing the user preserves the seed and heals the new active ally', () => {
  const seeded = turn(battle({}, {}, true)).state;
  const changed = resolveBattleTurn(seeded, { ...commands, player: { kind: 'switch', partyIndex: 1 } }, moves, prototypeBattleRules);
  assert.equal(changed.state.player.creatures[0].hp, 60);
  assert.equal(changed.state.player.creatures[1].hp, 50);
  assert.equal(changed.state.opponent.creatures[0].hp, 60);
});

test('drain respects remaining HP, caps healing and awards residual KO once', () => {
  const result = turn(battle({ hp: 3, experienceYield: 12 }, { hp: 79 }));
  assert.equal(result.state.player.creatures[0].hp, 80);
  assert.equal(result.state.opponent.creatures[0].hp, 0);
  assert.equal(result.state.player.creatures[0].experience, 12);
  assert.equal(result.events.filter(event => event.type === 'creatureFainted').length, 1);
  assert.equal(result.events.filter(event => event.type === 'experienceGained').length, 1);
  assert.ok(result.events.some(event => event.type === 'leechSeedTick' && event.damage === 3));
  assert.ok(result.events.some(event => event.type === 'healingApplied' && event.amount === 1));
  assert.deepEqual(result.state.outcome, { kind: 'won', winner: 'player', reason: 'allFainted' });
});

test('captured creatures and fresh battles do not retain Leech Seed', () => {
  const rules = { ...prototypeBattleRules, captureItems: { ball: { baseChance: 1 } } };
  const seeded = turn(battle()).state;
  const captured = resolveBattleTurn(seeded, { ...commands, player: { kind: 'attemptCapture', itemId: 'ball', captureInstanceId: 'caught' } }, moves, rules);
  assert.equal(captured.state.player.creatures[1].leechSeed, undefined);
  const fresh = createBattleState({ battleId: 'fresh', battleType: 'wild', seed: 1, rules,
    playerTeam: seeded.player.creatures, opponentTeam: seeded.opponent.creatures });
  assert.equal(fresh.opponent.creatures[0].leechSeed, undefined);
});

test('AI seeds a suitable target once and then chooses damage', () => {
  const initial = battle({}, { types: ['normal'] });
  const state = { ...initial, opponent: { ...initial.opponent, creatures: [creature('opponent', true, { moves: [{ moveId: 'leech-seed', pp: 10 }, { moveId: 'tackle', pp: 35 }] })] } };
  const policy = { id: 'test', statusEveryTurns: 1, maxSetupStage: 1, damageSelection: 'best' as const };
  assert.deepEqual(chooseOpponentCommand(state, moves, prototypeBattleRules, policy), { kind: 'useMove', moveSlot: 0 });
  const seeded = { ...state, player: { ...state.player, creatures: [{ ...state.player.creatures[0], leechSeed: { sourceSide: 'opponent' as const, fraction: 1 / 8, moveId: 'leech-seed' } }] } };
  assert.deepEqual(chooseOpponentCommand(seeded, moves, prototypeBattleRules, policy), { kind: 'useMove', moveSlot: 1 });
  const grass = { ...state, player: { ...state.player, creatures: [creature('grass-target', true)] } };
  assert.deepEqual(chooseOpponentCommand(grass, moves, prototypeBattleRules, policy), { kind: 'useMove', moveSlot: 1 });
});
