import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import { experienceToNextLevel } from '../../src/core/battle/progression.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';

const moves: Record<string, MoveDefinition> = {
  tackle: { id: 'tackle', name: 'Tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, priority: 0, maxPp: 35 },
  absorb: { id: 'absorb', name: 'Absorb', type: 'grass', category: 'special', power: 20, accuracy: 100, priority: 0, maxPp: 25, drainPercent: 50 },
  bubble: { id: 'bubble', name: 'Bubble', type: 'water', category: 'special', power: 20, accuracy: 100, priority: 0, maxPp: 30, statChanges: [{ target: 'opponent', stat: 'speed', stages: -1 }], statChangeChance: 10 },
  fury: { id: 'fury', name: 'Fury Attack', type: 'normal', category: 'physical', power: 15, accuracy: 100, priority: 0, maxPp: 20, minHits: 2, maxHits: 5 },
  confusion: { id: 'confusion', name: 'Confusion', type: 'psychic', category: 'special', power: 50, accuracy: 100, priority: 0, maxPp: 25, inflictedConfusionChance: 100 },
  harden: { id: 'harden', name: 'Harden', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 30 },
  hypnosis: { id: 'hypnosis', name: 'Hypnosis', type: 'psychic', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20, inflictedStatus: 'sleep', statusChance: 100, minStatusTurns: 2, maxStatusTurns: 4 },
};

function creature(id: string, options: Partial<BattleCreature> = {}): BattleCreature {
  return { instanceId: id, speciesId: 999, name: id, level: 10, types: ['normal'], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 40 }, hp: 200, experience: 0, experienceYield: 1, moves: [{ moveId: 'absorb', pp: 10 }], ...options };
}
function battle(player: BattleCreature, opponent = creature('opponent')) {
  return createBattleState({ battleId: 'canonical-effects', battleType: 'wild', seed: 8, rules: prototypeBattleRules, playerTeam: [player], opponentTeam: [opponent] });
}
function cmds() { return { player: { kind: 'useMove', moveSlot: 0 } as const, opponent: { kind: 'useMove', moveSlot: 0 } as const }; }

const caterpieStats = { hp: 45, attack: 30, defense: 35, specialAttack: 20, specialDefense: 20, speed: 45 } as const;
const metapodStats = { hp: 50, attack: 20, defense: 55, specialAttack: 25, specialDefense: 25, speed: 30 } as const;
const butterfreeStats = { hp: 60, attack: 45, defense: 50, specialAttack: 90, specialDefense: 80, speed: 70 } as const;

function evolutionRules() {
  return {
    ...prototypeBattleRules,
    levelUpMoves: {
      11: [{ level: 1, moveId: 'harden', maxPp: 30 }, { level: 7, moveId: 'harden', maxPp: 30 }],
      12: [{ level: 1, moveId: 'confusion', maxPp: 25 }, { level: 10, moveId: 'confusion', maxPp: 25 }],
    },
    evolutions: {
      10: [{ minimumLevel: 7, target: { speciesId: 11, name: 'Metapod', types: ['bug'] as const, baseStats: metapodStats, experienceYield: 72 } }],
      11: [{ minimumLevel: 10, target: { speciesId: 12, name: 'Butterfree', types: ['bug', 'flying'] as const, baseStats: butterfreeStats, experienceYield: 160 } }],
    },
  };
}

function levelingSpecies(speciesId: number, name: string, level: number, baseStats: typeof caterpieStats, moves: BattleCreature['moves']): BattleCreature {
  const currentStats = {
    maxHp: Math.floor((2 * baseStats.hp * level) / 100) + level + 10,
    attack: Math.floor((2 * baseStats.attack * level) / 100) + 5,
    defense: Math.floor((2 * baseStats.defense * level) / 100) + 5,
    specialAttack: Math.floor((2 * baseStats.specialAttack * level) / 100) + 5,
    specialDefense: Math.floor((2 * baseStats.specialDefense * level) / 100) + 5,
    speed: Math.floor((2 * baseStats.speed * level) / 100) + 5,
  };
  return creature('leveling-player', { speciesId, name, level, baseStats, growthCurveId: 'veloria_medium_fast_v1', stats: currentStats, hp: currentStats.maxHp, moves });
}

test('draining attacks heal half actual damage, capped by missing HP', () => {
  const source = creature('player', { hp: 100, moves: [{ moveId: 'absorb', pp: 1 }] });
  const result = resolveBattleTurn(battle(source), cmds(), moves, { ...prototypeBattleRules, criticalChance: 0 });
  const damage = result.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  const healed = result.events.find(event => event.type === 'healingApplied');
  assert.ok(damage?.type === 'damageApplied' && healed?.type === 'healingApplied');
  assert.equal(healed.amount, Math.floor(damage.amount / 2));
  assert.ok(result.state.player.creatures[0].hp <= 100 + healed.amount);
});

test('draining attacks heal at least one HP after dealing nonzero damage', () => {
  const source = creature('player', { hp: 100, moves: [{ moveId: 'absorb', pp: 1 }] });
  const target = creature('opponent', { hp: 1, moves: [{ moveId: 'tackle', pp: 2 }] });
  const catalog = { ...moves, absorb: { ...moves.absorb, power: 1 } };
  const result = resolveBattleTurn(battle(source, target), cmds(), catalog, { ...prototypeBattleRules, criticalChance: 0 });
  const heal = result.events.find(event => event.type === 'healingApplied');
  assert.ok(heal?.type === 'healingApplied');
  assert.equal(heal.amount, 1);
});

test('stat change chance zero prevents the effect after the move hits', () => {
  const source = creature('player', { moves: [{ moveId: 'bubble', pp: 2 }] });
  const target = creature('opponent', { moves: [{ moveId: 'tackle', pp: 2 }] });
  const result = resolveBattleTurn(battle(source, target), cmds(), { ...moves, bubble: { ...moves.bubble, statChangeChance: 0 } }, { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(!result.events.some(event => event.type === 'statStageChanged' && event.side === 'opponent' && event.stat === 'speed'));
});

test('multi-hit attacks emit one independently resolved damage event per hit', () => {
  const source = creature('player', { moves: [{ moveId: 'fury', pp: 2 }] });
  const result = resolveBattleTurn(battle(source), cmds(), moves, { ...prototypeBattleRules, criticalChance: 0 });
  const hits = result.events.filter(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  assert.ok(hits.length >= 2 && hits.length <= 5);
});

test('confusion is volatile, and a self-hit blocks move use and PP expenditure', () => {
  const source = creature('player', { moves: [{ moveId: 'confusion', pp: 2 }] });
  const first = resolveBattleTurn(battle(source), cmds(), moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(first.events.some(event => event.type === 'confusionApplied'));
  const confusedOpponent = first.state.opponent.creatures[0];
  assert.ok((confusedOpponent.confusionTurnsRemaining ?? 0) > 0);
  // Find a deterministic seed whose opponent action rolls a self-hit.
  let selfHit;
  for (let seed = 1; seed < 100 && !selfHit; seed++) {
    const state = { ...first.state, rngState: seed };
    const next = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, { ...prototypeBattleRules, criticalChance: 0 });
    if (next.events.some(event => event.type === 'confusionSelfHit' && event.side === 'opponent')) selfHit = next;
  }
  assert.ok(selfHit);
  assert.equal(selfHit.state.opponent.creatures[0].moves[0].pp, first.state.opponent.creatures[0].moves[0].pp);
  const playerWithBackup = createBattleState({ battleId: 'switch-confusion', battleType: 'wild', seed: 8, rules: prototypeBattleRules, playerTeam: [creature('player', { moves: [{ moveId: 'confusion', pp: 2 }] }), creature('backup')], opponentTeam: [creature('opponent', { moves: [{ moveId: 'confusion', pp: 2 }] })] });
  const applied = resolveBattleTurn(playerWithBackup, cmds(), moves, { ...prototypeBattleRules, criticalChance: 0 });
  const switched = resolveBattleTurn(applied.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(switched.state.player.creatures[0].confusionTurnsRemaining, undefined);
});

test('confusion ending on this action does not self-hit', () => {
  const player = creature('player', { confusionTurnsRemaining: 1 });
  const target = creature('opponent', { moves: [{ moveId: 'tackle', pp: 2 }] });
  const initial = battle(player, target);
  const confused = { ...initial, player: { ...initial.player, creatures: [{ ...initial.player.creatures[0], confusionTurnsRemaining: 1 }] } };
  const result = resolveBattleTurn(confused, cmds(), moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(result.events.some(event => event.type === 'confusionTick' && event.turnsRemaining === 0));
  assert.ok(!result.events.some(event => event.type === 'confusionSelfHit' && event.side === 'player'));
  assert.equal(result.state.player.creatures[0].moves[0].pp, 9);
  assert.equal(result.state.player.creatures[0].confusionTurnsRemaining, undefined);
});

test('type immunity prevents damaging move secondary effects', () => {
  const source = creature('player', { moves: [{ moveId: 'confusion', pp: 1 }] });
  const target = creature('opponent', { moves: [{ moveId: 'tackle', pp: 2 }] });
  const rules = { ...prototypeBattleRules, criticalChance: 0, typeChart: { psychic: { normal: 0 } } };
  const result = resolveBattleTurn(battle(source, target), cmds(), moves, rules);
  assert.ok(result.events.some(event => event.type === 'damageApplied' && event.sourceSide === 'player' && event.amount === 0));
  assert.ok(!result.events.some(event => event.type === 'confusionApplied' && event.side === 'opponent'));
});

test('move-provided sleep duration overrides the ruleset and blocks at least one action', () => {
  const source = creature('player', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 }, moves: [{ moveId: 'hypnosis', pp: 1 }] });
  const target = creature('opponent', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 1 }, moves: [{ moveId: 'tackle', pp: 2 }] });
  const result = resolveBattleTurn(battle(source, target), cmds(), moves, prototypeBattleRules);
  const status = result.events.find(event => event.type === 'statusApplied' && event.side === 'opponent');
  assert.ok(status?.type === 'statusApplied' && status.turns !== undefined && status.turns >= 2 && status.turns <= 4);
  assert.ok(result.events.some(event => event.type === 'moveFailed' && event.side === 'opponent' && event.reason === 'blockedByStatus'));
});

test('evolution teaches target species moves eligible at the current level', () => {
  const rules = evolutionRules();
  const caterpie = levelingSpecies(10, 'Caterpie', 6, caterpieStats, [{ moveId: 'tackle', pp: 35 }]);
  const firstBattle = battle(caterpie, creature('opponent', { hp: 1, experienceYield: experienceToNextLevel(6, rules.experienceCurves.veloria_medium_fast_v1), stats: { maxHp: 200, attack: 1, defense: 40, specialAttack: 1, specialDefense: 40, speed: 1 }, moves: [{ moveId: 'tackle', pp: 2 }] }));
  assert.equal(firstBattle.opponent.creatures[0].hp, 1);
  const toMetapod = resolveBattleTurn(firstBattle, cmds(), moves, rules);
  assert.equal(toMetapod.state.player.creatures[0].speciesId, 11, JSON.stringify({ events: toMetapod.events, player: toMetapod.state.player.creatures[0] }));
  assert.ok(toMetapod.events.some(event => event.type === 'moveLearned' && event.moveId === 'harden'));
  assert.ok(toMetapod.state.player.creatures[0].moves.some(move => move.moveId === 'harden'));

  const metapod = levelingSpecies(11, 'Metapod', 9, metapodStats, [{ moveId: 'tackle', pp: 35 }]);
  const toButterfree = resolveBattleTurn(battle(metapod, creature('opponent', { hp: 1, experienceYield: experienceToNextLevel(9, rules.experienceCurves.veloria_medium_fast_v1), stats: { maxHp: 200, attack: 1, defense: 40, specialAttack: 1, specialDefense: 40, speed: 1 }, moves: [{ moveId: 'tackle', pp: 2 }] })), cmds(), moves, rules);
  assert.equal(toButterfree.state.player.creatures[0].speciesId, 12);
  assert.ok(toButterfree.events.some(event => event.type === 'moveLearned' && event.moveId === 'confusion'));
  assert.ok(toButterfree.state.player.creatures[0].moves.some(move => move.moveId === 'confusion'));

  const fullCaterpie = levelingSpecies(10, 'Caterpie', 6, caterpieStats, [
    { moveId: 'tackle', pp: 35 }, { moveId: 'slot-two', pp: 1 }, { moveId: 'slot-three', pp: 1 }, { moveId: 'slot-four', pp: 1 },
  ]);
  const fullSlots = resolveBattleTurn(battle(fullCaterpie, creature('opponent', { hp: 1, experienceYield: experienceToNextLevel(6, rules.experienceCurves.veloria_medium_fast_v1), stats: { maxHp: 200, attack: 1, defense: 40, specialAttack: 1, specialDefense: 40, speed: 1 }, moves: [{ moveId: 'tackle', pp: 2 }] })), cmds(), moves, rules);
  assert.ok(fullSlots.events.some(event => event.type === 'moveLearningSkipped' && event.moveId === 'harden' && event.reason === 'fullMoveSlots'));
});
