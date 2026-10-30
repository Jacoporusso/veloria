import assert from 'node:assert/strict';
import test from 'node:test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import movesData from '../../content/battle/moves.v1.json' with { type: 'json' };
import { captureChance } from '../../src/core/battle/capture-chance.ts';
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleMoveRegistry, SpeciesBattleRegistry } from '../../src/core/battle/create-creature.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';

const species = speciesData.species as SpeciesBattleRegistry;
const moveCatalog = movesData.moves as BattleMoveRegistry;
const weakMove: MoveDefinition = { id: 'capture-test-tap', name: 'Tap', type: 'normal', category: 'physical', power: 1, accuracy: 100, priority: 0, maxPp: 10 };
const moves = { ...moveCatalog, [weakMove.id]: weakMove };
const move = (moveId = weakMove.id) => [{ moveId, pp: moves[moveId].maxPp }];
function creature(id: string, speciesId: number, captureRate: number | undefined, options: Partial<BattleCreature> = {}): BattleCreature {
  return {
    instanceId: id, speciesId, name: id, level: 5, types: ['normal'],
    stats: { maxHp: 100, attack: 20, defense: 20, specialAttack: 20, specialDefense: 20, speed: 20 },
    hp: 100, experience: 0, experienceYield: 10, moves: move(), captureRate, ...options,
  };
}
function rules(captureItem: { baseChance: number; missingHpBonus?: number; statusBonus?: number }) {
  return { ...prototypeBattleRules, captureItems: { test_ball: captureItem } };
}

test('every Gen I species snapshot carries its sourced capture rate', () => {
  const entries = Object.values(species).filter(entry => entry.speciesId >= 1 && entry.speciesId <= 151);
  assert.equal(entries.length, 151);
  for (const entry of entries) {
    const snapshot = createBattleCreature({ species, moves: moveCatalog, speciesId: entry.speciesId, level: 5, instanceId: `capture-rate-${entry.speciesId}` });
    assert.equal(snapshot.captureRate, entry.captureRate, `${entry.name} capture rate snapshot`);
  }
});

test('rarity, HP loss, status, and stronger balls move the modeled chance monotonically', () => {
  const ball = { baseChance: 0.35, missingHpBonus: 0.4, statusBonus: 0.15 };
  const healthy = creature('common', 16, 255);
  const rare = creature('rare', 144, 3);
  assert.ok(captureChance(healthy, ball) > captureChance(rare, ball));
  const wounded = { ...healthy, hp: 15 };
  const statused = { ...wounded, status: { status: 'paralysis' as const } };
  assert.ok(captureChance(wounded, ball) > captureChance(healthy, ball));
  assert.ok(captureChance(statused, ball) > captureChance(wounded, ball));
  assert.ok(captureChance(statused, { ...ball, baseChance: 0.55 }) > captureChance(statused, ball));
  assert.equal(captureChance(statused, { baseChance: 1 }), 1);
  assert.ok(captureChance({ ...statused, captureRate: 3 }, { baseChance: 0.8, missingHpBonus: 0.4, statusBonus: 0.2 }) < 1,
    'a summed preparation value clamped to one is still scaled by species rarity');
});

test('a low-capture-rate rare target remains catchable without becoming guaranteed', () => {
  const target = creature('legendary', 144, 3, { hp: 1, status: { status: 'sleep', turnsRemaining: 2 } });
  const chance = captureChance(target, { baseChance: 0.3, missingHpBonus: 0.5, statusBonus: 0.2 });
  assert.ok(chance > 0.2 && chance < 0.24, `expected approximately 0.22, got ${chance}`);
});

test('capture chance rejects invalid sourced rates', () => {
  for (const captureRate of [0, -1, 256, 1.5, Number.NaN]) {
    assert.throws(() => captureChance(creature('invalid-rate', 1, captureRate), { baseChance: 0.5 }), /Invalid species capture rate/);
  }
});

test('previewing capture chance is deterministic and consumes no battle RNG', () => {
  const ruleSet = rules({ baseChance: 0.4, missingHpBonus: 0.2 });
  const player = creature('preview-player', 1, 45);
  const target = creature('preview-target', 144, 3, { hp: 25 });
  const state = createBattleState({ battleId: 'capture-preview', battleType: 'wild', seed: 44, rules: ruleSet, playerTeam: [player], opponentTeam: [target] });
  const before = state.rngState;
  const expected = captureChance(state.opponent.creatures[state.opponent.activeIndex], ruleSet.captureItems.test_ball);
  assert.equal(captureChance(state.opponent.creatures[state.opponent.activeIndex], ruleSet.captureItems.test_ball), expected);
  assert.equal(state.rngState, before);
  const command = { player: { kind: 'attemptCapture', itemId: 'test_ball', captureInstanceId: 'preview-captured' } as const, opponent: { kind: 'useMove', moveSlot: 0 } as const };
  const actual = resolveBattleTurn(state, command, moves, ruleSet);
  const replay = resolveBattleTurn(state, command, moves, ruleSet);
  assert.deepEqual(replay, actual);
  assert.equal((actual.events.find(event => event.type === 'captureAttempted') as Extract<typeof actual.events[number], {type:'captureAttempted'}>).chance, expected);
});

test('captureAttempted reports the same helper chance on failure and success', () => {
  for (const [baseChance, expectedOutcome] of [[0, 'failed'], [1, 'captured']] as const) {
    const ruleSet = rules({ baseChance });
    const player = creature(`capture-player-${baseChance}`, 1, 45);
    const target = creature(`capture-target-${baseChance}`, 144, 3, { hp: 1 });
    const state = createBattleState({ battleId: `capture-${baseChance}`, battleType: 'wild', seed: 73, rules: ruleSet, playerTeam: [player], opponentTeam: [target] });
    const expectedChance = captureChance(target, ruleSet.captureItems.test_ball);
    const transition = resolveBattleTurn(state, {
      player: { kind: 'attemptCapture', itemId: 'test_ball', captureInstanceId: `captured-${baseChance}` },
      opponent: { kind: 'useMove', moveSlot: 0 },
    }, moves, ruleSet);
    const attempt = transition.events.find(event => event.type === 'captureAttempted');
    assert.ok(attempt && attempt.type === 'captureAttempted');
    assert.equal(attempt.chance, expectedChance);
    assert.equal(transition.events.some(event => event.type === 'creatureCaptured'), expectedOutcome === 'captured');
    assert.equal(transition.events.some(event => event.type === 'captureFailed'), expectedOutcome === 'failed');
  }
});

test('Ditto keeps its sourced capture rate through Transform', () => {
  const dittoDef = species['132'];
  const player = createBattleCreature({ species, moves: moveCatalog, speciesId: 1, level: 5, instanceId: 'transform-target' });
  const ditto = createBattleCreature({ species, moves: moveCatalog, speciesId: 132, level: 5, instanceId: 'wild-ditto', moveIds: ['transform'] });
  const ruleSet = rules({ baseChance: 0.5 });
  const state = createBattleState({ battleId: 'ditto-capture-rate', battleType: 'wild', seed: 23, rules: ruleSet, playerTeam: [player], opponentTeam: [ditto] });
  const transformed = resolveBattleTurn(state, {
    player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 },
  }, moves, ruleSet).state;
  const wildDitto = transformed.opponent.creatures[transformed.opponent.activeIndex];
  assert.equal(wildDitto.captureRate, dittoDef.captureRate);
  assert.equal(wildDitto.captureRate, 35);
  assert.notEqual(wildDitto.captureRate, player.captureRate);
  assert.equal(captureChance(wildDitto, ruleSet.captureItems.test_ball), captureChance({ ...wildDitto, captureRate: dittoDef.captureRate }, ruleSet.captureItems.test_ball));
});
