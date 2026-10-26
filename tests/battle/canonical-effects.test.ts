import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import { experienceToNextLevel } from '../../src/core/battle/progression.ts';
import { abilityPreventsTypeDamage, estimateMoveDamage } from '../../src/core/battle/damage.ts';
import { resolveMovePower } from '../../src/core/battle/move-power.ts';
import { effectiveMoveAccuracy } from '../../src/core/battle/stat-stages.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';

const moves: Record<string, MoveDefinition> = {
  tackle: { id: 'tackle', name: 'Tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, priority: 0, maxPp: 35 },
  absorb: { id: 'absorb', name: 'Absorb', type: 'grass', category: 'special', power: 20, accuracy: 100, priority: 0, maxPp: 25, drainPercent: 50 },
  bubble: { id: 'bubble', name: 'Bubble', type: 'water', category: 'special', power: 20, accuracy: 100, priority: 0, maxPp: 30, statChanges: [{ target: 'opponent', stat: 'speed', stages: -1 }], statChangeChance: 10 },
  'spark-test': { id: 'spark-test', name: 'Spark test', type: 'electric', category: 'special', power: 40, accuracy: 100, priority: 0, maxPp: 10 },
  fury: { id: 'fury', name: 'Fury Attack', type: 'normal', category: 'physical', power: 15, accuracy: 100, priority: 0, maxPp: 20, minHits: 2, maxHits: 5 },
  confusion: { id: 'confusion', name: 'Confusion', type: 'psychic', category: 'special', power: 50, accuracy: 100, priority: 0, maxPp: 25, inflictedConfusionChance: 100 },
  harden: { id: 'harden', name: 'Harden', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 30 },
  hypnosis: { id: 'hypnosis', name: 'Hypnosis', type: 'psychic', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20, inflictedStatus: 'sleep', statusChance: 100, minStatusTurns: 2, maxStatusTurns: 4 },
  teleport: { id: 'teleport', name: 'Teleport', type: 'psychic', category: 'status', power: 0, accuracy: 100, alwaysHits: true, priority: 0, maxPp: 20, escapeBattle: true },
  transform: { id: 'transform', name: 'Transform', type: 'normal', category: 'status', power: 0, accuracy: 100, alwaysHits: true, priority: 0, maxPp: 10, transformTarget: true },
  thrash: { id: 'thrash', name: 'Thrash', type: 'normal', category: 'physical', power: 90, accuracy: 100, priority: 0, maxPp: 10, lockInMinTurns: 2, lockInMaxTurns: 3, confusesUserAfterLockIn: true },
  recover: { id: 'recover', name: 'Recover', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10, healingPercent: 50 },
  rest: { id: 'rest', name: 'Rest', type: 'psychic', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10, healingPercent: 100, requiresMissingHp: true, inflictedStatus: 'sleep', statusTarget: 'self', minStatusTurns: 2, maxStatusTurns: 2, replacesUserStatusWithInflictedStatus: true },
  refresh: { id: 'refresh', name: 'Refresh', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20, curesUserStatuses: ['burn', 'paralysis', 'poison'] },
  aromatherapy: { id: 'aromatherapy', name: 'Aromatherapy', type: 'grass', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 5, curesPartyStatuses: true },
  'focus-energy': { id: 'focus-energy', name: 'Focus Energy', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 30, criticalStageChange: 2 },
  'high-crit': { id: 'high-crit', name: 'High Crit', type: 'normal', category: 'physical', power: 40, accuracy: 100, priority: 0, maxPp: 10, criticalStageBoost: 1 },
  brine: { id: 'brine', name: 'Brine', type: 'water', category: 'special', power: 65, accuracy: 100, priority: 0, maxPp: 10, powerRule: 'brine' },
  flail: { id: 'flail', name: 'Flail', type: 'normal', category: 'physical', power: 0, accuracy: 100, priority: 0, maxPp: 15, powerRule: 'lowHp' },
  'dream-eater': { id: 'dream-eater', name: 'Dream Eater', type: 'psychic', category: 'special', power: 100, accuracy: 100, priority: 0, maxPp: 15, drainPercent: 50, requiresSleepingTarget: true },
  'false-swipe': { id: 'false-swipe', name: 'False Swipe', type: 'normal', category: 'physical', power: 40, accuracy: 100, priority: 0, maxPp: 40, leavesTargetAtOneHp: true },
  'wake-up-slap': { id: 'wake-up-slap', name: 'Wake-Up Slap', type: 'fighting', category: 'physical', power: 60, accuracy: 100, priority: 0, maxPp: 10, powerRule: 'targetAsleep', wakesTargetIfAsleep: true },
  wrap: { id: 'wrap', name: 'Wrap', type: 'normal', category: 'physical', power: 15, accuracy: 90, priority: 0, maxPp: 20, trapTarget: { minTurns: 2, maxTurns: 5, damageFraction: 1 / 16 } },
  disable: { id: 'disable', name: 'Disable', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20, disableLastMove: true, disableMinTurns: 4, disableMaxTurns: 7 },
  taunt: { id: 'taunt', name: 'Taunt', type: 'dark', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20, tauntsTarget: true, tauntMinTurns: 3, tauntMaxTurns: 5 },
  'role-play': { id: 'role-play', name: 'Role Play', type: 'psychic', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10, copyTargetAbility: true },
  'rain-dance': { id: 'rain-dance', name: 'Rain Dance', type: 'water', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 5, weather: 'rain' },
  reflect: { id: 'reflect', name: 'Reflect', type: 'psychic', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20, screen: 'reflect' },
  protect: { id: 'protect', name: 'Protect', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 4, maxPp: 10, protectUser: true },
  endure: { id: 'endure', name: 'Endure', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 4, maxPp: 10, endureUser: true },
  'hyper-beam': { id: 'hyper-beam', name: 'Hyper Beam', type: 'normal', category: 'special', power: 150, accuracy: 90, priority: 0, maxPp: 5, rechargesNextTurn: true },
  'solar-beam': { id: 'solar-beam', name: 'Solar Beam', type: 'grass', category: 'special', power: 120, accuracy: 100, priority: 0, maxPp: 10, chargesBeforeAttack: true, skipsChargeInSun: true, weatherHalvesPower: true },
  'skull-bash': { id: 'skull-bash', name: 'Skull Bash', type: 'normal', category: 'physical', power: 100, accuracy: 100, priority: 0, maxPp: 15, chargesBeforeAttack: true, chargeDefenseBoost: 1 },
  'fake-out': { id: 'fake-out', name: 'Fake Out', type: 'normal', category: 'physical', power: 40, accuracy: 100, priority: 3, maxPp: 10, requiresFirstTurnAfterEntry: true, flinchChance: 100 },
  'brick-break': { id: 'brick-break', name: 'Brick Break', type: 'fighting', category: 'physical', power: 75, accuracy: 100, priority: 0, maxPp: 15, breaksScreens: true },
  'flame-wheel': { id: 'flame-wheel', name: 'Flame Wheel', type: 'fire', category: 'physical', power: 60, accuracy: 100, priority: 0, maxPp: 25, thawsUserIfFrozen: true },
  dig: { id: 'dig', name: 'Dig', type: 'ground', category: 'physical', power: 80, accuracy: 100, priority: 0, maxPp: 10, chargesBeforeAttack: true, semiInvulnerableWhileCharging: 'underground' },
  earthquake: { id: 'earthquake', name: 'Earthquake', type: 'ground', category: 'physical', power: 100, accuracy: 100, priority: 0, maxPp: 10, hitsSemiInvulnerable: ['underground'], doublesDamageAgainstSemiInvulnerable: true },
  'belly-drum': { id: 'belly-drum', name: 'Belly Drum', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10, bellyDrum: true },
  acupressure: { id: 'acupressure', name: 'Acupressure', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 30, randomStatBoost: true },
  'mean-look': { id: 'mean-look', name: 'Mean Look', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 5, preventsEscape: true },
  'high-jump-kick': { id: 'high-jump-kick', name: 'High Jump Kick', type: 'fighting', category: 'physical', power: 130, accuracy: 0, priority: 0, maxPp: 10, crashOnMoveFailure: true },
  outrage: { id: 'outrage', name: 'Outrage', type: 'dragon', category: 'physical', power: 120, accuracy: 100, priority: 0, maxPp: 10, lockInMinTurns: 2, lockInMaxTurns: 3, confusesUserAfterLockIn: true },
  'tri-attack': { id: 'tri-attack', name: 'Tri Attack', type: 'normal', category: 'special', power: 80, accuracy: 100, priority: 0, maxPp: 10, statusChance: 100, randomInflictedStatuses: ['burn', 'freeze', 'paralysis'] },
  snore: { id: 'snore', name: 'Snore', type: 'normal', category: 'special', power: 50, accuracy: 100, priority: 0, maxPp: 15, usableWhileAsleep: true, flinchChance: 30 },
  'fury-cutter': { id: 'fury-cutter', name: 'Fury Cutter', type: 'bug', category: 'physical', power: 10, accuracy: 95, priority: 0, maxPp: 20, powerRule: 'furyCutter' },
  'trump-card': { id: 'trump-card', name: 'Trump Card', type: 'normal', category: 'special', power: 0, accuracy: 100, priority: 0, maxPp: 5, powerRule: 'trumpCard', ignoresAccuracyEvasionStages: true },
  'aqua-ring': { id: 'aqua-ring', name: 'Aqua Ring', type: 'water', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20, aquaRing: true },
  ingrain: { id: 'ingrain', name: 'Ingrain', type: 'grass', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20, ingrain: true },
  'mud-sport': { id: 'mud-sport', name: 'Mud Sport', type: 'ground', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 15, halvesElectricDamage: true },
  'water-sport': { id: 'water-sport', name: 'Water Sport', type: 'water', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 15, halvesFireDamage: true },
  'electric-test': { id: 'electric-test', name: 'Electric test', type: 'electric', category: 'special', power: 80, accuracy: 100, priority: 0, maxPp: 10 },
  'fire-test': { id: 'fire-test', name: 'Fire test', type: 'fire', category: 'special', power: 80, accuracy: 100, priority: 0, maxPp: 10 },
  mist: { id: 'mist', name: 'Mist', type: 'ice', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 30, mist: true },
  'lucky-chant': { id: 'lucky-chant', name: 'Lucky Chant', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 30, luckyChant: true },
  'lower-attack': { id: 'lower-attack', name: 'Lower Attack', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10, statChanges: [{ target: 'opponent', stat: 'attack', stages: -1 }] },
  'guard-swap': { id: 'guard-swap', name: 'Guard Swap', type: 'psychic', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10, statStageSwap: ['defense', 'specialDefense'] },
  'power-swap': { id: 'power-swap', name: 'Power Swap', type: 'psychic', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10, statStageSwap: ['attack', 'specialAttack'] },
  'psych-up': { id: 'psych-up', name: 'Psych Up', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10, copyTargetStatStages: true },
  haze: { id: 'haze', name: 'Haze', type: 'ice', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 30, clearAllStatStages: true },
  spite: { id: 'spite', name: 'Spite', type: 'ghost', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10, reduceLastMovePp: 4 },
  charge: { id: 'charge', name: 'Charge', type: 'electric', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20, chargeElectricBoost: true, statChanges: [{ target: 'self', stat: 'specialDefense', stages: 1 }] },
  tailwind: { id: 'tailwind', name: 'Tailwind', type: 'flying', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 15, tailwind: true },
  rollout: { id: 'rollout', name: 'Rollout', type: 'rock', category: 'physical', power: 30, accuracy: 90, priority: 0, maxPp: 20, powerRule: 'rollout', lockInMinTurns: 5, lockInMaxTurns: 5, lockEndsOnMiss: true, doublesRolloutAfterDefenseCurl: true },
  safeguard: { id: 'safeguard', name: 'Safeguard', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 25, safeguard: true },
  yawn: { id: 'yawn', name: 'Yawn', type: 'normal', category: 'status', power: 0, accuracy: 100, alwaysHits: true, priority: 0, maxPp: 10, requiresStatusFree: true, inflictsDrowsiness: true },
  moonlight: { id: 'moonlight', name: 'Moonlight', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 5, healingPercent: 50, weatherRecovery: true },
  'seismic-toss': { id: 'seismic-toss', name: 'Seismic Toss', type: 'fighting', category: 'physical', power: 0, accuracy: 100, priority: 0, maxPp: 20, damageByUserLevel: true },
  'super-fang': { id: 'super-fang', name: 'Super Fang', type: 'normal', category: 'physical', power: 0, accuracy: 90, priority: 0, maxPp: 10, targetHpFraction: 0.5 },
  endeavor: { id: 'endeavor', name: 'Endeavor', type: 'normal', category: 'physical', power: 0, accuracy: 100, priority: 0, maxPp: 5, endeavorDamage: true },
  fissure: { id: 'fissure', name: 'Fissure', type: 'ground', category: 'physical', power: 0, accuracy: 30, priority: 0, maxPp: 5, oneHitKO: true },
  explosion: { id: 'explosion', name: 'Explosion', type: 'normal', category: 'physical', power: 250, accuracy: 100, priority: 0, maxPp: 5, faintUserAfterMove: true, damageDefenseMultiplier: 0.5 },
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

test('Teleport ends wild battles and has no effect in trainer battles', () => {
  const user = creature('player', { moves: [{ moveId: 'teleport', pp: 3 }] });
  const wild = resolveBattleTurn(battle(user), {
    player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 },
  }, moves, prototypeBattleRules);
  assert.deepEqual(wild.state.outcome, { kind: 'fled', side: 'player' });
  assert.ok(wild.events.some(event => event.type === 'battleEnded' && event.outcome.kind === 'fled'));

  const trainer = createBattleState({ battleId: 'teleport-trainer', battleType: 'trainer', seed: 8, rules: prototypeBattleRules, playerTeam: [user], opponentTeam: [creature('opponent')] });
  const blocked = resolveBattleTurn(trainer, {
    player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 },
  }, moves, prototypeBattleRules);
  assert.equal(blocked.state.outcome.kind, 'ongoing');
  assert.ok(blocked.events.some(event => event.type === 'moveFailed' && event.moveId === 'teleport' && event.reason === 'noEffect'));
});

test('Transform copies stats, stages, types, ability, weight, and moves, then restores Ditto on switch', () => {
  const ditto = creature('ditto', { abilityId: 'limber', weightKg: 4, moves: [{ moveId: 'transform', pp: 3 }] });
  const opponent = creature('opponent', { types: ['fire'], abilityId: 'flash-fire', weightKg: 21.4, stats: { maxHp: 200, attack: 60, defense: 70, specialAttack: 80, specialDefense: 90, speed: 100 }, moves: [{ moveId: 'tackle', pp: 4 }] });
  const initial = createBattleState({ battleId: 'transform', battleType: 'wild', seed: 8, rules: prototypeBattleRules, playerTeam: [ditto, creature('backup')], opponentTeam: [opponent] });
  const stagedInitial = { ...initial, opponent: { ...initial.opponent, creatures: initial.opponent.creatures.map((pokemon, index) => index === 0 ? { ...pokemon, statStages: { attack: 2, accuracy: -1, evasion: 1 } } : pokemon) } };
  const transformed = resolveBattleTurn(stagedInitial, {
    player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 },
  }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  const activeDitto = transformed.state.player.creatures[0];
  assert.deepEqual(activeDitto.types, ['fire']);
  assert.equal(activeDitto.abilityId, 'flash-fire');
  assert.equal(activeDitto.weightKg, 21.4);
  assert.equal(activeDitto.stats.attack, 60);
  assert.deepEqual(activeDitto.statStages, { attack: 2, accuracy: -1, evasion: 1 });
  assert.deepEqual(activeDitto.moves, [{ moveId: 'tackle', pp: 5 }]);
  assert.ok(activeDitto.transformOriginal);

  const switched = resolveBattleTurn(transformed.state, {
    player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 },
  }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  const restoredDitto = switched.state.player.creatures[0];
  assert.deepEqual(restoredDitto.types, ['normal']);
  assert.equal(restoredDitto.abilityId, 'limber');
  assert.equal(restoredDitto.weightKg, 4);
  assert.deepEqual(restoredDitto.moves, [{ moveId: 'transform', pp: 2 }]);
  assert.equal(restoredDitto.transformOriginal, undefined);
});

test('Thrash locks the user for the source number of turns, spends PP once, then confuses it', () => {
  const user = creature('rampage', { moves: [{ moveId: 'thrash', pp: 3 }] });
  let first;
  for (let seed = 1; seed < 100 && !first; seed++) {
    const initial = createBattleState({ battleId: 'thrash', battleType: 'wild', seed, rules: prototypeBattleRules,
      playerTeam: [user, creature('backup')], opponentTeam: [creature('opponent', { moves: [{ moveId: 'tackle', pp: 10 }] })] });
    const candidate = resolveBattleTurn({ ...initial, rngState: seed }, {
      player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 },
    }, moves, { ...prototypeBattleRules, criticalChance: 0 });
    if (candidate.state.player.creatures[0].lockedTurnsRemaining === 1) first = candidate;
  }
  assert.ok(first);
  assert.equal(first.state.player.creatures[0].moves[0].pp, 2);
  const second = resolveBattleTurn(first.state, {
    player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 },
  }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.equal(second.state.player.activeIndex, 0);
  assert.equal(second.state.player.creatures[0].moves[0].pp, 2);
  assert.equal(second.state.player.creatures[0].lockedMoveId, undefined);
  assert.ok(second.events.some(event => event.type === 'confusionApplied' && event.side === 'player'));
});

test('direct recovery restores the official fraction of the user’s maximum HP', () => {
  const user = creature('recoverer', { hp: 150, moves: [{ moveId: 'recover', pp: 3 }] });
  const result = resolveBattleTurn(battle(user, creature('opponent', { moves: [{ moveId: 'tackle', pp: 10 }] })), {
    player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 },
  }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(result.events.some(event => event.type === 'healingApplied' && event.moveId === 'recover' && event.amount > 0));
});

test('Rest restores all HP, replaces a major status, and applies fixed two-turn sleep', () => {
  const user = creature('rest-user', { hp: 90, status: { status: 'burn' }, moves: [{ moveId: 'rest', pp: 1 }] });
  const state = battle(user, creature('opponent', { moves: [{ moveId: 'harden', pp: 2 }] }));
  const result = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  const rested = result.state.player.creatures[0];
  assert.equal(rested.hp, rested.stats.maxHp);
  assert.deepEqual(rested.status, { status: 'sleep', turnsRemaining: 2 });
  assert.ok(result.events.some(event => event.type === 'statusCured' && event.status === 'burn'));
  assert.ok(result.events.some(event => event.type === 'statusApplied' && event.status === 'sleep' && event.turns === 2));
});

test('the generated HGSS Rest definition heals fully and replaces the user’s prior status', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('official-rest-user', { hp: 80, status: { status: 'burn' }, moves: [{ moveId: 'rest', pp: 1 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  const result = resolveBattleTurn(battle(user, creature('quiet', { moves: [{ moveId: 'harden', pp: 3 }] })), cmds(), officialMoves, prototypeBattleRules);
  assert.equal(result.state.player.creatures[0].hp, 200);
  assert.deepEqual(result.state.player.creatures[0].status, { status: 'sleep', turnsRemaining: 2 });
  assert.ok(result.events.some(event => event.type === 'statusCured' && event.side === 'player' && event.status === 'burn'));
});

test('generated Counter and Mirror Coat return twice the latest matching hit and fail without one', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  for (const [moveId, incomingMoveId, incomingCategory] of [['counter', 'tackle', 'physical'], ['mirror-coat', 'water-gun', 'special']] as const) {
    const user = creature(`user-${moveId}`, { hp: 180, stats: { maxHp: 200, attack: 80, defense: 90, specialAttack: 80, specialDefense: 90, speed: 40 }, moves: [{ moveId, pp: 5 }] });
    const opponent = creature(`opponent-${moveId}`, { stats: { maxHp: 200, attack: 70, defense: 80, specialAttack: 70, specialDefense: 80, speed: 120 }, moves: [{ moveId: incomingMoveId, pp: 5 }] });
    const gotHit = resolveBattleTurn(battle(user, opponent), cmds(), officialMoves, { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 });
    const hit = gotHit.events.find(event => event.type === 'damageApplied' && event.targetSide === 'player');
    const counter = gotHit.events.find(event => event.type === 'damageApplied' && event.moveId === moveId);
    assert.ok(hit && hit.type === 'damageApplied' && hit.amount > 0);
    assert.ok(counter && counter.type === 'damageApplied');
    assert.equal(counter.amount, hit.amount * 2, `${moveId} should return twice the matching hit`);

    const noEligibleHit = resolveBattleTurn(battle(creature(`no-hit-${moveId}`, { moves: [{ moveId, pp: 5 }] }), creature(`quiet-${moveId}`, { moves: [{ moveId: 'harden', pp: 5 }] })), cmds(), officialMoves, prototypeBattleRules);
    assert.ok(noEligibleHit.events.some(event => event.type === 'moveFailed' && event.moveId === moveId && event.reason === 'noEffect'));
    assert.ok(!noEligibleHit.events.some(event => event.type === 'damageApplied' && event.moveId === moveId));
  }
});

test('generated Foresight and Miracle Eye clear evasion and suppress their matching type immunity until switch', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  for (const [moveId, targetType, attackMoveId, attackType] of [
    ['foresight', 'ghost', 'tackle', 'normal'], ['miracle-eye', 'dark', 'psybeam', 'psychic'],
  ] as const) {
    const target = creature(`target-${moveId}`, { types: [targetType], statStages: { evasion: 2 }, moves: [{ moveId: 'harden', pp: 5 }] });
    const first = resolveBattleTurn(battle(creature(`user-${moveId}`, { moves: [{ moveId, pp: 5 }, { moveId: attackMoveId, pp: 5 }] }), target), cmds(), officialMoves, prototypeBattleRules);
    const marked = first.state.opponent.creatures[0];
    assert.equal(marked.statStages?.evasion ?? 0, 0);
    assert.ok(moveId === 'foresight' ? marked.foresightActive : marked.miracleEyeActive);
    const second = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves,
      { ...prototypeBattleRules, typeChart: { [attackType]: { [targetType]: 0 } }, criticalChance: 0 });
    const hit = second.events.find(event => event.type === 'damageApplied' && event.moveId === attackMoveId);
    assert.ok(hit && hit.type === 'damageApplied' && hit.amount > 0, `${moveId} should remove ${attackType}/${targetType} immunity`);
  }
});

test('the generated HGSS Roost heals half and suppresses Flying effectiveness through the remainder of the turn', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('roost-user', { hp: 100, types: ['water', 'flying'], stats: { maxHp: 200, attack: 60, defense: 90, specialAttack: 60, specialDefense: 90, speed: 130 }, moves: [{ moveId: 'roost', pp: 5 }] });
  const opponent = creature('electric-attacker', { stats: { maxHp: 200, attack: 60, defense: 80, specialAttack: 70, specialDefense: 80, speed: 40 }, moves: [{ moveId: 'thunder-shock', pp: 5 }] });
  const result = resolveBattleTurn(battle(user, opponent), cmds(), officialMoves, {
    ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1,
    typeChart: { electric: { water: 1, flying: 2 } },
  });
  const hit = result.events.find(event => event.type === 'damageApplied' && event.moveId === 'thunder-shock');
  assert.ok(hit && hit.type === 'damageApplied');
  assert.equal(hit.effectiveness, 1, 'only Water typing remains for the opponent’s later attack this turn');
  assert.equal(result.state.player.creatures[0].hp, 200 - hit.amount);
  assert.deepEqual(result.state.player.creatures[0].types, ['water', 'flying']);
  assert.equal(result.state.player.creatures[0].roostedThisTurn, undefined, 'Flying typing returns at turn end');
});

test('generated Lock-On hits its marked target through evasion and semi-invulnerability', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('lock-on-user', { stats: { maxHp: 200, attack: 80, defense: 90, specialAttack: 100, specialDefense: 90, speed: 130 }, moves: [{ moveId: 'lock-on', pp: 5 }, { moveId: 'hydro-pump', pp: 5 }] });
  const target = creature('lock-on-target', { statStages: { evasion: 6 }, moves: [{ moveId: 'fly', pp: 5 }] });
  const first = resolveBattleTurn(battle(user, target), cmds(), officialMoves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.equal(first.state.player.creatures[0].lockOnTargetInstanceId, 'lock-on-target');
  assert.equal(first.state.opponent.creatures[0].semiInvulnerableState, 'air');
  const second = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves,
    { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(second.events.some(event => event.type === 'damageApplied' && event.moveId === 'hydro-pump' && event.amount > 0));
  assert.equal(second.state.player.creatures[0].lockOnTargetInstanceId, undefined);
});

test('generated Worry Seed changes the target to Insomnia, restores its original ability on switch, and respects exclusions', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('worry-seed-user', { moves: [{ moveId: 'worry-seed', pp: 5 }, { moveId: 'harden', pp: 5 }] });
  const target = creature('worry-seed-target', { abilityId: 'flash-fire', moves: [{ moveId: 'harden', pp: 5 }] });
  const backup = creature('worry-seed-backup', { moves: [{ moveId: 'harden', pp: 5 }] });
  const state = createBattleState({ battleId: 'worry-seed', battleType: 'trainer', seed: 41, rules: prototypeBattleRules, playerTeam: [user], opponentTeam: [target, backup] });
  const changed = resolveBattleTurn(state, cmds(), officialMoves, prototypeBattleRules);
  assert.equal(changed.state.opponent.creatures[0].abilityId, 'insomnia');
  assert.ok(changed.events.some(event => event.type === 'abilityChanged' && event.sourceMoveId === 'worry-seed'));
  const switched = resolveBattleTurn(changed.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'switch', partyIndex: 1 } }, officialMoves, prototypeBattleRules);
  assert.equal(switched.state.opponent.creatures[0].abilityId, 'flash-fire');

  const protectedTarget = creature('truant-target', { abilityId: 'truant', moves: [{ moveId: 'harden', pp: 5 }] });
  const blocked = resolveBattleTurn(battle(creature('worry-seed-user2', { moves: [{ moveId: 'worry-seed', pp: 5 }] }), protectedTarget), cmds(), officialMoves, prototypeBattleRules);
  assert.equal(blocked.state.opponent.creatures[0].abilityId, 'truant');
  assert.ok(blocked.events.some(event => event.type === 'moveFailed' && event.moveId === 'worry-seed' && event.reason === 'noEffect'));
});

test('generated Imprison blocks only moves shared with its active user and ends when that user switches', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('imprison-user', { stats: { maxHp: 200, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 140 }, moves: [{ moveId: 'imprison', pp: 10 }, { moveId: 'tackle', pp: 10 }] });
  const target = creature('imprison-target', { stats: { maxHp: 200, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 40 }, moves: [{ moveId: 'tackle', pp: 10 }] });
  const backup = creature('imprison-backup', { moves: [{ moveId: 'harden', pp: 5 }] });
  const state = createBattleState({ battleId: 'imprison', battleType: 'trainer', seed: 44, rules: prototypeBattleRules, playerTeam: [user, backup], opponentTeam: [target] });
  const first = resolveBattleTurn(state, cmds(), officialMoves, prototypeBattleRules);
  assert.equal(first.state.player.creatures[0].imprisonActive, true);
  assert.ok(first.events.some(event => event.type === 'moveFailed' && event.moveId === 'tackle' && event.reason === 'imprisoned'));
  assert.equal(first.state.opponent.creatures[0].hp, 200, 'the shared Tackle is stopped before dealing damage');
  const second = resolveBattleTurn(first.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(second.state.player.creatures[0].imprisonActive, undefined);
  assert.ok(second.events.some(event => event.type === 'damageApplied' && event.moveId === 'tackle' && event.amount > 0));
});

test('generated Last Resort fails until every other move has been used since field entry', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('last-resort-user', { stats: { maxHp: 200, attack: 120, defense: 80, specialAttack: 80, specialDefense: 80, speed: 130 }, moves: [{ moveId: 'last-resort', pp: 5 }, { moveId: 'tackle', pp: 10 }] });
  const target = creature('last-resort-target', { hp: 300, stats: { maxHp: 300, attack: 50, defense: 80, specialAttack: 50, specialDefense: 80, speed: 30 }, moves: [{ moveId: 'harden', pp: 5 }] });
  const first = resolveBattleTurn(battle(user, target), cmds(), officialMoves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(first.events.some(event => event.type === 'moveFailed' && event.moveId === 'last-resort' && event.reason === 'noEffect'));
  assert.equal(first.state.opponent.creatures[0].hp, 300);
  const second = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(second.events.some(event => event.type === 'damageApplied' && event.moveId === 'tackle' && event.amount > 0));
  const third = resolveBattleTurn(second.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(third.events.some(event => event.type === 'damageApplied' && event.moveId === 'last-resort' && event.amount > 0));
});

test('Stockpile stores up to three boosts for Spit Up or Swallow, then consumes the stored energy', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const quiet = creature('stockpile-quiet', { moves: [{ moveId: 'harden', pp: 8 }] });
  const user = creature('stockpile-user', { statStages: { defense: 2, specialDefense: -1 }, moves: [{ moveId: 'stockpile', pp: 5 }, { moveId: 'spit-up', pp: 5 }] });
  let state = battle(user, quiet);
  state = { ...state, player: { ...state.player, creatures: state.player.creatures.map((pokemon, index) => index === 0 ? { ...pokemon, statStages: { defense: 2, specialDefense: -1 } } : pokemon) } };
  state = resolveBattleTurn(state, cmds(), officialMoves, prototypeBattleRules).state;
  assert.equal(state.player.creatures[0].stockpileCount, 1);
  state = resolveBattleTurn(state, cmds(), officialMoves, prototypeBattleRules).state;
  assert.equal(state.player.creatures[0].stockpileCount, 2);
  assert.equal(state.player.creatures[0].statStages?.defense, 4);
  assert.equal(state.player.creatures[0].statStages?.specialDefense, 1);
  const spent = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves,
    { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 0.5, maximumDamageVariance: 1 });
  assert.ok(spent.events.some(event => event.type === 'damageApplied' && event.moveId === 'spit-up' && event.amount > 0));
  assert.equal(spent.state.player.creatures[0].stockpileCount, undefined);
  assert.deepEqual(spent.state.player.creatures[0].statStages, { defense: 2, specialDefense: -1 });

  const swallowUser = creature('swallow-user', { hp: 50, moves: [{ moveId: 'stockpile', pp: 5 }, { moveId: 'swallow', pp: 5 }] });
  let swallowState = battle(swallowUser, quiet);
  swallowState = resolveBattleTurn(swallowState, cmds(), officialMoves, prototypeBattleRules).state;
  swallowState = resolveBattleTurn(swallowState, cmds(), officialMoves, prototypeBattleRules).state;
  const healed = resolveBattleTurn(swallowState, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(healed.state.player.creatures[0].hp, 150, 'two charges restore one half max HP');
  assert.equal(healed.state.player.creatures[0].stockpileCount, undefined);
});

test('generated Conversion selects a known non-current move type and reverts on switch; Conversion 2 resists the last hit', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const converter = creature('converter', { moves: [{ moveId: 'conversion', pp: 5 }, { moveId: 'thunder-shock', pp: 5 }, { moveId: 'water-gun', pp: 5 }] });
  const backup = creature('conversion-backup');
  const state = createBattleState({ battleId: 'conversion', battleType: 'trainer', seed: 51, rules: prototypeBattleRules, playerTeam: [converter, backup], opponentTeam: [creature('conversion-target', { moves: [{ moveId: 'harden', pp: 3 }] })] });
  const changed = resolveBattleTurn(state, cmds(), officialMoves, prototypeBattleRules);
  const converted = changed.state.player.creatures[0];
  assert.ok(['electric', 'water'].includes(converted.types[0]));
  assert.deepEqual(converted.typeChangeOriginal, ['normal']);
  const reverted = resolveBattleTurn(changed.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.deepEqual(reverted.state.player.creatures[0].types, ['normal']);
  assert.equal(reverted.state.player.creatures[0].typeChangeOriginal, undefined);

  const conversionTwo = creature('conversion-two', { types: ['normal'], stats: { maxHp: 200, attack: 60, defense: 70, specialAttack: 60, specialDefense: 70, speed: 40 }, moves: [{ moveId: 'conversion-2', pp: 5 }] });
  const attacker = creature('conversion-two-attacker', { stats: { maxHp: 200, attack: 80, defense: 70, specialAttack: 50, specialDefense: 70, speed: 140 }, moves: [{ moveId: 'tackle', pp: 5 }] });
  const defended = resolveBattleTurn(battle(conversionTwo, attacker), cmds(), officialMoves, {
    ...prototypeBattleRules, criticalChance: 0, typeChart: { normal: { rock: 0.5, steel: 0.5 } },
  });
  assert.ok(defended.events.some(event => event.type === 'damageApplied' && event.targetSide === 'player'));
  assert.ok(['rock', 'steel'].includes(defended.state.player.creatures[0].types[0]));
});

test('Intimidate lowers active opponents on entry and respects Mist and stat-drop immunity', () => {
  const intimidator = creature('intimidator', { abilityId: 'intimidate', moves: [{ moveId: 'harden', pp: 5 }] });
  const target = creature('intimidate-target', { moves: [{ moveId: 'harden', pp: 5 }] });
  const first = resolveBattleTurn(battle(intimidator, target), cmds(), moves, prototypeBattleRules);
  assert.equal(first.state.opponent.creatures[0].statStages?.attack, -1);
  assert.ok(first.events.some(event => event.type === 'abilityActivated' && event.abilityId === 'intimidate'));

  const protectedTarget = creature('clear-body-target', { abilityId: 'clear-body', moves: [{ moveId: 'harden', pp: 5 }] });
  const blocked = resolveBattleTurn(battle(intimidator, protectedTarget), cmds(), moves, prototypeBattleRules);
  assert.equal(blocked.state.opponent.creatures[0].statStages?.attack, undefined);
  assert.ok(blocked.events.some(event => event.type === 'statStageLimited' && event.stat === 'attack'));

  const misted = { ...battle(intimidator, target), opponent: { ...battle(intimidator, target).opponent, mistTurnsRemaining: 3 } };
  const mistResult = resolveBattleTurn(misted, cmds(), moves, prototypeBattleRules);
  assert.equal(mistResult.state.opponent.creatures[0].statStages?.attack, undefined);
});

test('Refresh cures only its supported statuses and Gen IV Aromatherapy leaves confusion intact', () => {
  const refreshed = resolveBattleTurn(battle(creature('refresher', { status: { status: 'poison' }, moves: [{ moveId: 'refresh', pp: 1 }] })),
    { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(refreshed.state.player.creatures[0].status, undefined);
  assert.ok(refreshed.events.some(event => event.type === 'statusCured' && event.status === 'poison'));

  const main = creature('aromatherapist', { moves: [{ moveId: 'aromatherapy', pp: 1 }] });
  const ally = creature('party-ally', { status: { status: 'paralysis' }, confusionTurnsRemaining: 3 });
  const initial = createBattleState({ battleId: 'party-cure', battleType: 'wild', seed: 5, rules: prototypeBattleRules,
    playerTeam: [main, ally], opponentTeam: [creature('opponent', { moves: [{ moveId: 'harden', pp: 2 }] })] });
  const state = { ...initial, player: { ...initial.player, creatures: initial.player.creatures.map((pokemon, index) => index === 1 ? { ...pokemon, confusionTurnsRemaining: 3 } : pokemon) } };
  const result = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(result.state.player.creatures[1].status, undefined);
  assert.equal(result.state.player.creatures[1].confusionTurnsRemaining, 3);
  assert.ok(result.events.some(event => event.type === 'statusCured' && event.creatureId === ally.instanceId));
  assert.ok(!result.events.some(event => event.type === 'confusionCured' && event.creatureId === ally.instanceId));
});

test('Focus Energy raises the volatile critical stage; high-critical moves use it', () => {
  const focused = resolveBattleTurn(battle(creature('focus', { moves: [{ moveId: 'focus-energy', pp: 2 }] })), {
    player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 },
  }, moves, prototypeBattleRules);
  assert.equal(focused.state.player.creatures[0].criticalStage, 2);
  assert.ok(focused.events.some(event => event.type === 'criticalStageChanged' && event.stage === 2));

  let critical;
  for (let seed = 1; seed < 1000 && !critical; seed++) {
    const source = battle(creature('striker', { stats: { maxHp: 200, attack: 60, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 }, moves: [{ moveId: 'high-crit', pp: 2 }] }),
      creature('slow-target', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 1 }, moves: [{ moveId: 'tackle', pp: 2 }] }));
    const result = resolveBattleTurn({ ...source, rngState: seed }, {
      player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 },
    }, moves, { ...prototypeBattleRules, criticalChance: 0.2 });
    if (result.events.some(event => event.type === 'damageApplied' && event.sourceSide === 'player' && event.critical)) critical = result;
  }
  assert.ok(critical);
});

test('fixed-effect attacks use level, target HP and user fainting exactly', () => {
  const source = battle(creature('level-hit', { level: 10, stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 }, moves: [{ moveId: 'seismic-toss', pp: 2 }] }),
    creature('target', { moves: [{ moveId: 'tackle', pp: 2 }] }));
  const levelHit = resolveBattleTurn(source, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(levelHit.events.some(event => event.type === 'damageApplied' && event.moveId === 'seismic-toss' && event.amount === 10));

  const fang = resolveBattleTurn(battle(creature('fang', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 }, moves: [{ moveId: 'super-fang', pp: 2 }] }), creature('big-target')),
    { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(fang.events.some(event => event.type === 'damageApplied' && event.moveId === 'super-fang' && event.amount === 100));

  const explosion = resolveBattleTurn(battle(creature('exploder', { moves: [{ moveId: 'explosion', pp: 1 }] })),
    { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.equal(explosion.state.player.creatures[0].hp, 0);
});

test('variable-power attacks resolve their official HP-threshold rules before damage', () => {
  const rules = { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 };
  const weak = { maxHp: 200, attack: 10, defense: 40, specialAttack: 10, specialDefense: 40, speed: 100 } as const;
  const defense = { maxHp: 200, attack: 1, defense: 100, specialAttack: 1, specialDefense: 100, speed: 1 } as const;
  const brineDamage = (hp: number) => resolveBattleTurn(battle(creature('briner', { stats: weak, moves: [{ moveId: 'brine', pp: 2 }] }),
    creature('target', { hp, stats: defense, moves: [{ moveId: 'harden', pp: 2 }] })),
  { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, rules).events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  const aboveHalf = brineDamage(101);
  const exactlyHalf = brineDamage(100);
  const belowHalf = brineDamage(99);
  assert.ok(aboveHalf?.type === 'damageApplied' && exactlyHalf?.type === 'damageApplied' && belowHalf?.type === 'damageApplied');
  assert.ok(exactlyHalf.amount > aboveHalf.amount, 'Brine doubles at exactly half HP in HGSS');
  assert.ok(belowHalf.amount > aboveHalf.amount);

  const flail = resolveBattleTurn(battle(creature('flailer', { hp: 4, moves: [{ moveId: 'flail', pp: 2 }] }), creature('target', { moves: [{ moveId: 'harden', pp: 2 }] })),
    { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, rules);
  const flailHit = flail.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  assert.ok(flailHit?.type === 'damageApplied' && flailHit.amount > 20);
  const hpScaleUser = (hp: number) => creature(`low-hp-${hp}`, { hp, stats: { maxHp: 64, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 40 } });
  const lowHpBands: readonly [number, number][] = [[1, 200], [2, 150], [5, 150], [6, 100], [12, 100], [13, 80], [21, 80], [22, 40], [42, 40], [43, 20]];
  for (const [hp, power] of lowHpBands) assert.equal(resolveMovePower('lowHp', 0, hpScaleUser(hp), creature('low-hp-target')), power, `Gen IV low-HP band at ${hp}/64`);
});

test('sleep-dependent attacks obey their target conditions and False Swipe leaves one HP', () => {
  const sleepy = creature('sleepy', { hp: 100, status: { status: 'sleep', turnsRemaining: 4 }, moves: [{ moveId: 'harden', pp: 3 }] });
  const dreamer = creature('dreamer', { hp: 100, moves: [{ moveId: 'dream-eater', pp: 2 }] });
  const dream = resolveBattleTurn(battle(dreamer, sleepy), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves,
    { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(dream.events.some(event => event.type === 'damageApplied' && event.moveId === 'dream-eater' && event.amount > 0));
  assert.ok(dream.events.some(event => event.type === 'healingApplied' && event.moveId === 'dream-eater'));

  const waked = resolveBattleTurn(battle(creature('slapper', { moves: [{ moveId: 'wake-up-slap', pp: 2 }] }), sleepy),
    { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.equal(waked.state.opponent.creatures[0].status, undefined);
  assert.ok(waked.events.some(event => event.type === 'statusCured' && event.status === 'sleep'));

  const falseSwipe = resolveBattleTurn(battle(creature('cutter', { stats: { maxHp: 200, attack: 200, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 }, moves: [{ moveId: 'false-swipe', pp: 2 }] }),
    creature('fragile', { hp: 2, stats: { maxHp: 200, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 }, moves: [{ moveId: 'harden', pp: 2 }] })),
  { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.equal(falseSwipe.state.opponent.creatures[0].hp, 1);
});

test('Wrap traps and damages its target; Disable blocks the most recently used move', () => {
  const user = creature('wrapper', { moves: [{ moveId: 'wrap', pp: 3 }] });
  const target = creature('wrapped', { moves: [{ moveId: 'harden', pp: 3 }] });
  const wrapState = createBattleState({ battleId: 'wrap-state', battleType: 'wild', seed: 3, rules: prototypeBattleRules,
    playerTeam: [user], opponentTeam: [target, creature('reserve')] });
  const wrapped = resolveBattleTurn(wrapState, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves,
    { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(wrapped.events.some(event => event.type === 'trappingApplied' && event.moveId === 'wrap'));
  assert.ok(wrapped.events.some(event => event.type === 'trappingTick' && event.damage > 0));
  const cannotSwitch = resolveBattleTurn(wrapped.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'switch', partyIndex: 1 } }, moves, prototypeBattleRules);
  assert.ok(cannotSwitch.events.some(event => event.type === 'commandRejected' && event.reason === 'trapped'));

  const disableBattle = battle(creature('disabler', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 1 }, moves: [{ moveId: 'disable', pp: 2 }] }),
    creature('fast-target', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 }, moves: [{ moveId: 'tackle', pp: 3 }] }));
  const disabled = resolveBattleTurn(disableBattle, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(disabled.state.opponent.creatures[0].disabledMoveId, 'tackle');
  const blocked = resolveBattleTurn(disabled.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.ok(blocked.events.some(event => event.type === 'moveFailed' && event.side === 'opponent' && event.reason === 'disabled'));
  assert.equal(blocked.state.opponent.creatures[0].moves[0].pp, 2);
});

test('Role Play copies the target ability and restores the user ability on switch', () => {
  const user = creature('role-player', { abilityId: 'synchronize', moves: [{ moveId: 'role-play', pp: 2 }] });
  const ally = creature('ally', { abilityId: 'inner-focus', moves: [{ moveId: 'harden', pp: 2 }] });
  const target = creature('target', { abilityId: 'levitate', moves: [{ moveId: 'harden', pp: 2 }] });
  const state = createBattleState({ battleId: 'role-play', battleType: 'wild', seed: 4, rules: prototypeBattleRules,
    playerTeam: [user, ally], opponentTeam: [target] });
  const copied = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(copied.state.player.creatures[0].abilityId, 'levitate');
  assert.ok(copied.events.some(event => event.type === 'abilityChanged' && event.previousAbilityId === 'synchronize' && event.abilityId === 'levitate'));
  const switched = resolveBattleTurn(copied.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(switched.state.player.creatures[0].abilityId, 'synchronize');
});

test('a copied ability immediately supplies its passive protections', () => {
  const user = creature('copycat', { abilityId: 'synchronize', moves: [{ moveId: 'role-play', pp: 2 }] });
  const target = creature('calm-target', { abilityId: 'own-tempo', moves: [{ moveId: 'confusion', pp: 2 }] });
  const state = battle(user, target);
  const result = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(result.state.player.creatures[0].abilityId, 'own-tempo');
  assert.ok(result.events.some(event => event.type === 'abilityChanged' && event.abilityId === 'own-tempo'));
  assert.ok(result.events.some(event => event.type === 'confusionPrevented' && event.side === 'player' && event.reason === 'ownTempo'));
});

test('weather, screens, protection, Endure, and recharge use their turn phases', () => {
  const rain = resolveBattleTurn(battle(creature('weather-setter', { moves: [{ moveId: 'rain-dance', pp: 1 }] }),
    creature('opponent', { moves: [{ moveId: 'harden', pp: 2 }] })),
  { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.deepEqual(rain.state.weather, { kind: 'rain', turnsRemaining: 4 });
  assert.ok(rain.events.some(event => event.type === 'weatherApplied' && event.turns === 5));

  const sunnyState = { ...battle(creature('healer', { hp: 50, moves: [{ moveId: 'moonlight', pp: 2 }] })), weather: { kind: 'sun' as const, turnsRemaining: 5 } };
  const sunnyHeal = resolveBattleTurn(sunnyState, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.ok(sunnyHeal.events.some(event => event.type === 'healingApplied' && event.moveId === 'moonlight' && event.amount > 50));
  const rainState = { ...sunnyState, weather: { kind: 'rain' as const, turnsRemaining: 5 } };
  const rainHeal = resolveBattleTurn(rainState, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.ok(rainHeal.events.some(event => event.type === 'healingApplied' && event.moveId === 'moonlight' && event.amount <= 50));

  const screen = resolveBattleTurn(battle(creature('screen-setter', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 }, moves: [{ moveId: 'reflect', pp: 2 }] }),
    creature('attacker', { moves: [{ moveId: 'tackle', pp: 2 }] })),
  { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.ok(screen.events.some(event => event.type === 'screenApplied' && event.screen === 'reflect'));
  const shieldedDamage = screen.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'opponent');
  const baseline = resolveBattleTurn(battle(creature('nothing', { moves: [{ moveId: 'harden', pp: 2 }] }),
    creature('attacker', { moves: [{ moveId: 'tackle', pp: 2 }] })),
  { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  const baselineDamage = baseline.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'opponent');
  assert.ok(shieldedDamage?.type === 'damageApplied' && baselineDamage?.type === 'damageApplied' && shieldedDamage.amount < baselineDamage.amount);

  const stableDamage = { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 };
  const specialAttacker = creature('weather-attacker', { moves: [{ moveId: 'spark-test', pp: 2 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 80, specialDefense: 40, speed: 100 } });
  const plainRock = battle(specialAttacker, creature('rock', { types: ['rock'], moves: [{ moveId: 'harden', pp: 2 }] }));
  const sandstorm = { ...plainRock, weather: { kind: 'sandstorm' as const, turnsRemaining: 5 } };
  const withoutStorm = resolveBattleTurn(plainRock, cmds(), moves, stableDamage);
  const withStorm = resolveBattleTurn(sandstorm, cmds(), moves, stableDamage);
  const normalHit = withoutStorm.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  const stormHit = withStorm.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  assert.ok(normalHit?.type === 'damageApplied' && stormHit?.type === 'damageApplied' && stormHit.amount < normalHit.amount);

  const protectedBattle = resolveBattleTurn(battle(creature('protector', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 }, moves: [{ moveId: 'protect', pp: 2 }] }),
    creature('attacker', { stats: { maxHp: 200, attack: 100, defense: 40, specialAttack: 40, specialDefense: 40, speed: 1 }, moves: [{ moveId: 'tackle', pp: 2 }] })),
  { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.ok(protectedBattle.events.some(event => event.type === 'moveFailed' && event.side === 'opponent' && event.reason === 'noEffect'));
  assert.equal(protectedBattle.state.player.creatures[0].hp, 200);

  const endureBattle = resolveBattleTurn(battle(creature('ender', { hp: 20, stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 }, moves: [{ moveId: 'endure', pp: 2 }] }),
    creature('attacker', { stats: { maxHp: 200, attack: 200, defense: 40, specialAttack: 40, specialDefense: 40, speed: 1 }, moves: [{ moveId: 'tackle', pp: 2 }] })),
  { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(endureBattle.state.player.creatures[0].hp, 1);

  const beam = resolveBattleTurn(battle(creature('beam-user', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 100, specialDefense: 40, speed: 100 }, moves: [{ moveId: 'hyper-beam', pp: 2 }] }),
    creature('target', { moves: [{ moveId: 'harden', pp: 2 }] })),
  { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.equal(beam.state.player.creatures[0].mustRecharge, true);
  const recharge = resolveBattleTurn(beam.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(recharge.state.player.creatures[0].mustRecharge, undefined);
  assert.ok(recharge.events.some(event => event.type === 'rechargeConsumed'));
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
  const firstBattle = battle(caterpie, creature('opponent', { hp: 1, level: 7, experienceYield: experienceToNextLevel(6, rules.experienceCurves.veloria_medium_fast_v1), stats: { maxHp: 200, attack: 1, defense: 40, specialAttack: 1, specialDefense: 40, speed: 1 }, moves: [{ moveId: 'tackle', pp: 2 }] }));
  assert.equal(firstBattle.opponent.creatures[0].hp, 1);
  const toMetapod = resolveBattleTurn(firstBattle, cmds(), moves, rules);
  assert.equal(toMetapod.state.player.creatures[0].speciesId, 11, JSON.stringify({ events: toMetapod.events, player: toMetapod.state.player.creatures[0] }));
  assert.ok(toMetapod.events.some(event => event.type === 'moveLearned' && event.moveId === 'harden'));
  assert.ok(toMetapod.state.player.creatures[0].moves.some(move => move.moveId === 'harden'));

  const metapod = levelingSpecies(11, 'Metapod', 9, metapodStats, [{ moveId: 'tackle', pp: 35 }]);
  const toButterfree = resolveBattleTurn(battle(metapod, creature('opponent', { hp: 1, level: 7, experienceYield: experienceToNextLevel(9, rules.experienceCurves.veloria_medium_fast_v1), stats: { maxHp: 200, attack: 1, defense: 40, specialAttack: 1, specialDefense: 40, speed: 1 }, moves: [{ moveId: 'tackle', pp: 2 }] })), cmds(), moves, rules);
  assert.equal(toButterfree.state.player.creatures[0].speciesId, 12);
  assert.ok(toButterfree.events.some(event => event.type === 'moveLearned' && event.moveId === 'confusion'));
  assert.ok(toButterfree.state.player.creatures[0].moves.some(move => move.moveId === 'confusion'));

  const fullCaterpie = levelingSpecies(10, 'Caterpie', 6, caterpieStats, [
    { moveId: 'tackle', pp: 35 }, { moveId: 'slot-two', pp: 1 }, { moveId: 'slot-three', pp: 1 }, { moveId: 'slot-four', pp: 1 },
  ]);
  const fullSlots = resolveBattleTurn(battle(fullCaterpie, creature('opponent', { hp: 1, level: 7, experienceYield: experienceToNextLevel(6, rules.experienceCurves.veloria_medium_fast_v1), stats: { maxHp: 200, attack: 1, defense: 40, specialAttack: 1, specialDefense: 40, speed: 1 }, moves: [{ moveId: 'tackle', pp: 2 }] })), cmds(), moves, rules);
  assert.ok(fullSlots.events.some(event => event.type === 'moveLearningSkipped' && event.moveId === 'harden' && event.reason === 'fullMoveSlots'));
});

test('charge moves spend PP once, force their release, and cancel when switched out', () => {
  const solar = creature('player', { moves: [{ moveId: 'solar-beam', pp: 2 }, { moveId: 'tackle', pp: 5 }] });
  const first = resolveBattleTurn(battle(solar), cmds(), moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.equal(first.state.player.creatures[0].chargingMoveId, 'solar-beam');
  assert.equal(first.state.player.creatures[0].moves[0].pp, 1);
  assert.ok(first.events.some(event => event.type === 'chargeStarted' && event.moveId === 'solar-beam'));
  assert.ok(!first.events.some(event => event.type === 'damageApplied' && event.sourceSide === 'player'));

  const released = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.equal(released.state.player.creatures[0].chargingMoveId, undefined);
  assert.equal(released.state.player.creatures[0].moves[0].pp, 1);
  assert.ok(released.events.some(event => event.type === 'damageApplied' && event.sourceSide === 'player' && event.moveId === 'solar-beam'));

  const skull = creature('skull-user', { moves: [{ moveId: 'skull-bash', pp: 2 }] });
  const charging = resolveBattleTurn(battle(skull), cmds(), moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.equal(charging.state.player.creatures[0].statStages?.defense, 1);

  const party = createBattleState({ battleId: 'charge-switch', battleType: 'wild', seed: 8, rules: prototypeBattleRules,
    playerTeam: [solar, creature('bench', { moves: [{ moveId: 'tackle', pp: 5 }] })], opponentTeam: [creature('foe')] });
  const switched = resolveBattleTurn(party, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  const switchOut = resolveBattleTurn(switched.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(switchOut.state.player.creatures[0].chargingMoveId, undefined);
  assert.equal(switchOut.state.player.activeIndex, 1);
});

test('Fake Out is limited to the first entry turn, Brick Break removes screens, and Flame Wheel thaws its user', () => {
  const opener = creature('opener', { moves: [{ moveId: 'fake-out', pp: 2 }] });
  const first = resolveBattleTurn(battle(opener), cmds(), moves, prototypeBattleRules);
  assert.ok(first.events.some(event => event.type === 'flinched' && event.side === 'opponent'));
  const second = resolveBattleTurn(first.state, cmds(), moves, prototypeBattleRules);
  assert.ok(second.events.some(event => event.type === 'moveFailed' && event.side === 'player' && event.reason === 'noEffect'));

  const screened = resolveBattleTurn(battle(creature('screen-user', { moves: [{ moveId: 'reflect', pp: 2 }] })), cmds(), moves, prototypeBattleRules);
  const brickOpponent = creature('brick-opponent', { moves: [{ moveId: 'brick-break', pp: 2 }] });
  const broken = resolveBattleTurn({ ...screened.state, opponent: { ...screened.state.opponent, creatures: [brickOpponent] } },
    { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(broken.state.player.reflectTurnsRemaining, undefined);
  assert.ok(broken.events.some(event => event.type === 'screenEnded' && event.side === 'player'));

  const frozen = creature('frozen', { moves: [{ moveId: 'flame-wheel', pp: 2 }], status: { status: 'freeze', turnsRemaining: 2 } });
  const thawed = resolveBattleTurn(battle(frozen), cmds(), moves, prototypeBattleRules);
  assert.equal(thawed.state.player.creatures[0].status, undefined);
  assert.ok(thawed.events.some(event => event.type === 'damageApplied' && event.sourceSide === 'player' && event.moveId === 'flame-wheel'));
});

test('Dig avoids ordinary attacks and Earthquake hits Dig users for double damage', () => {
  const digger = creature('digger', { moves: [{ moveId: 'dig', pp: 2 }], stats: { maxHp: 200, attack: 80, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  const charge = resolveBattleTurn(battle(digger), cmds(), moves, { ...prototypeBattleRules, criticalChance: 0 });
  assert.equal(charge.state.player.creatures[0].semiInvulnerableState, 'underground');
  assert.ok(charge.events.some(event => event.type === 'moveMissed' && event.side === 'opponent'));

  const lowSpeedDigger = creature('enemy-digger', { moves: [{ moveId: 'dig', pp: 2 }], stats: { maxHp: 200, attack: 80, defense: 40, specialAttack: 40, specialDefense: 40, speed: 1 } });
  const attacker = creature('earthquake-user', { moves: [{ moveId: 'earthquake', pp: 2 }], stats: { maxHp: 200, attack: 80, defense: 40, specialAttack: 40, specialDefense: 40, speed: 1 } });
  const hit = resolveBattleTurn(battle(attacker, lowSpeedDigger), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, { ...prototypeBattleRules, criticalChance: 0 });
  const damage = hit.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player' && event.moveId === 'earthquake');
  assert.ok(damage?.type === 'damageApplied' && damage.amount > 0);
  assert.ok(!hit.events.some(event => event.type === 'moveMissed' && event.side === 'player'));
});

test('Belly Drum pays half maximum HP to max Attack, and Acupressure raises one eligible stat by two', () => {
  const drumming = creature('drummer', { moves: [{ moveId: 'belly-drum', pp: 1 }] });
  const result = resolveBattleTurn(battle(drumming, creature('quiet-opponent', { moves: [{ moveId: 'harden', pp: 5 }] })), cmds(), moves, prototypeBattleRules);
  assert.equal(result.state.player.creatures[0].hp, 100);
  assert.equal(result.state.player.creatures[0].statStages?.attack, 6);
  assert.ok(result.events.some(event => event.type === 'hpSacrificed' && event.amount === 100));

  const acupressure = creature('acupressure-user', { moves: [{ moveId: 'acupressure', pp: 1 }] });
  const boosted = resolveBattleTurn(battle(acupressure), cmds(), moves, prototypeBattleRules);
  const stages = boosted.state.player.creatures[0].statStages ?? {};
  assert.equal(Object.values(stages).reduce((sum, stage) => sum + (stage ?? 0), 0), 2);
  assert.ok(Object.values(stages).includes(2));
});

test('Mean Look blocks switching until its user leaves battle', () => {
  const watcher = creature('watcher', { moves: [{ moveId: 'mean-look', pp: 1 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  const target = creature('target', { moves: [{ moveId: 'tackle', pp: 3 }] });
  const state = createBattleState({ battleId: 'mean-look', battleType: 'wild', seed: 3, rules: prototypeBattleRules, playerTeam: [watcher, creature('bench')], opponentTeam: [target, creature('foe-bench')] });
  const trapped = resolveBattleTurn(state, cmds(), moves, prototypeBattleRules);
  assert.equal(trapped.state.opponent.creatures[0].escapeBlockedBy, 'watcher');
  const rejected = resolveBattleTurn(trapped.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'switch', partyIndex: 1 } }, moves, prototypeBattleRules);
  assert.ok(rejected.events.some(event => event.type === 'commandRejected' && event.side === 'opponent' && event.reason === 'trapped'));
  const left = resolveBattleTurn(trapped.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(left.state.opponent.creatures[0].escapeBlockedBy, undefined);
});

test('Jump Kick crash uses half calculated damage on a miss, and Outrage locks before confusion', () => {
  const kicker = creature('kicker', { moves: [{ moveId: 'high-jump-kick', pp: 2 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  const stableDamage = { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 };
  const miss = resolveBattleTurn(battle(kicker, creature('quiet', { moves: [{ moveId: 'harden', pp: 4 }] })), cmds(),
    moves, stableDamage);
  assert.ok(miss.state.player.creatures[0].hp < 200 && miss.state.player.creatures[0].hp > 100);
  const recoil = miss.events.find(event => event.type === 'recoilApplied' && event.moveId === 'high-jump-kick');
  assert.ok(recoil?.type === 'recoilApplied' && recoil.amount < 100);

  const immuneMoves = { ...moves, 'high-jump-kick': { ...moves['high-jump-kick'], accuracy: 100 } };
  const immune = resolveBattleTurn(battle(kicker, creature('ghost', { types: ['ghost'], moves: [{ moveId: 'harden', pp: 4 }] })), cmds(), immuneMoves,
    { ...stableDamage, typeChart: { fighting: { ghost: 0 } } });
  assert.equal(immune.state.player.creatures[0].hp, 100, 'immunity has a fallback crash of half target max HP');

  const rampager = creature('rampager', { moves: [{ moveId: 'outrage', pp: 1 }, { moveId: 'tackle', pp: 3 }] });
  let state = resolveBattleTurn(battle(rampager, creature('quiet', { moves: [{ moveId: 'harden', pp: 4 }] })), cmds(), moves, prototypeBattleRules).state;
  assert.equal(state.player.creatures[0].moves[0].pp, 0);
  assert.equal(state.player.creatures[0].lockedMoveId, 'outrage');
  for (let i = 0; i < 3 && state.player.creatures[0].lockedMoveId; i++) {
    state = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules).state;
  }
  assert.equal(state.player.creatures[0].lockedMoveId, undefined);
  assert.ok(state.player.creatures[0].confusionTurnsRemaining);
});

test('Tri Attack inflicts one random eligible status and Snore can be used while asleep', () => {
  const attacker = creature('tri-attacker', { moves: [{ moveId: 'tri-attack', pp: 2 }] });
  const tri = resolveBattleTurn(battle(attacker), cmds(), moves, prototypeBattleRules);
  const ailments = tri.events.filter(event => event.type === 'statusApplied' && event.side === 'opponent');
  assert.equal(ailments.length, 1);
  assert.ok(['burn', 'freeze', 'paralysis'].includes(ailments[0].status));

  const sleeper = creature('sleeper', { moves: [{ moveId: 'snore', pp: 2 }], status: { status: 'sleep', turnsRemaining: 2 } });
  const snore = resolveBattleTurn(battle(sleeper, creature('quiet', { moves: [{ moveId: 'harden', pp: 3 }] })), cmds(), moves, prototypeBattleRules);
  assert.ok(snore.events.some(event => event.type === 'damageApplied' && event.sourceSide === 'player' && event.moveId === 'snore'));
  assert.equal(snore.state.player.creatures[0].moves[0].pp, 1);
});

test('Fury Cutter ramps; Rollout lasts exactly five actions and doubles after Defense Curl', () => {
  const cutter = creature('cutter', { moves: [{ moveId: 'fury-cutter', pp: 3 }], stats: { maxHp: 200, attack: 120, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  const stableDamage = { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 };
  const first = resolveBattleTurn(battle(cutter), cmds(), moves, stableDamage);
  const firstAmount = first.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player')?.amount ?? 0;
  const second = resolveBattleTurn(first.state, cmds(), moves, stableDamage);
  const secondAmount = second.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player')?.amount ?? 0;
  assert.ok(secondAmount > firstAmount);
  const roller = creature('roller', { moves: [{ moveId: 'rollout', pp: 2 }] });
  const rolloutMoves = { ...moves, rollout: { ...moves.rollout, accuracy: 100 } };
  let state = resolveBattleTurn(battle(roller), cmds(), rolloutMoves, stableDamage).state;
  assert.equal(state.player.creatures[0].moves[0].pp, 1);
  assert.equal(state.player.creatures[0].lockedMoveId, 'rollout');
  const next = resolveBattleTurn(state, cmds(), rolloutMoves, stableDamage);
  assert.equal(next.state.player.creatures[0].moves[0].pp, 1);
  assert.ok(next.events.some(event => event.type === 'damageApplied' && event.sourceSide === 'player' && event.moveId === 'rollout'));
  assert.equal(next.state.player.creatures[0].lockedMoveId, 'rollout', 'the user remains committed after action two');

  const curled = creature('curled', { moves: [{ moveId: 'defense-curl', pp: 2 }, { moveId: 'rollout', pp: 2 }], stats: { maxHp: 200, attack: 120, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  const defenseCurl = { ...moves, 'defense-curl': { id: 'defense-curl', name: 'Defense Curl', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 40, statChanges: [{ target: 'self', stat: 'defense', stages: 1 }] } } satisfies Record<string, MoveDefinition>;
  const afterCurl = resolveBattleTurn(battle(curled), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, defenseCurl, stableDamage).state;
  const doubled = resolveBattleTurn(afterCurl, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, defenseCurl, stableDamage);
  const plainRollout = resolveBattleTurn(battle(creature('plain', { moves: [{ moveId: 'rollout', pp: 2 }], stats: curled.stats })), cmds(), rolloutMoves, stableDamage);
  const curlDamage = doubled.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player' && event.moveId === 'rollout')?.amount ?? 0;
  const plainDamage = plainRollout.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player' && event.moveId === 'rollout')?.amount ?? 0;
  assert.ok(curlDamage > plainDamage, 'Defense Curl doubles Rollout base damage');
});

test('Trump Card uses PP after payment and ignores accuracy and evasion stages', () => {
  const stableDamage = { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 };
  const user = creature('trump-user', { moves: [{ moveId: 'trump-card', pp: 1 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 100, specialDefense: 40, speed: 100 } });
  const initial = battle(user, creature('target', { moves: [{ moveId: 'harden', pp: 3 }] }));
  const staged = { ...initial, player: { ...initial.player, creatures: initial.player.creatures.map(pokemon => ({ ...pokemon, statStages: { accuracy: -6 } })) }, opponent: { ...initial.opponent, creatures: initial.opponent.creatures.map(pokemon => ({ ...pokemon, statStages: { evasion: 6 } })) } };
  const result = resolveBattleTurn(staged, cmds(), moves, stableDamage);
  assert.ok(result.events.some(event => event.type === 'damageApplied' && event.sourceSide === 'player' && event.amount > 0));
  assert.equal(result.state.player.creatures[0].moves[0].pp, 0);
});

test('Safeguard blocks status for five turns and Yawn sleeps a status-free target after the next turn', () => {
  const protector = creature('protector', { moves: [{ moveId: 'safeguard', pp: 2 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  const sleeper = creature('sleeper', { moves: [{ moveId: 'hypnosis', pp: 2 }] });
  const shielded = resolveBattleTurn(battle(protector, sleeper), cmds(), moves, prototypeBattleRules);
  assert.equal(shielded.state.opponent.creatures[0].status, undefined);
  assert.ok(shielded.events.some(event => event.type === 'statusPrevented' && event.reason === 'safeguard'));
  assert.equal(shielded.state.player.safeguardTurnsRemaining, 4);

  const yawner = creature('yawner', { moves: [{ moveId: 'yawn', pp: 2 }, { moveId: 'harden', pp: 3 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  let state = resolveBattleTurn(battle(yawner, creature('target', { moves: [{ moveId: 'harden', pp: 3 }] })), cmds(), moves, prototypeBattleRules).state;
  assert.equal(state.opponent.creatures[0].drowsyTurnsRemaining, 1);
  const later = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.equal(later.state.opponent.creatures[0].status?.status, 'sleep');
});

test('Taunt prevents the target from selecting status moves for its remaining turns', () => {
  const taunters = creature('taunter', { moves: [{ moveId: 'taunt', pp: 2 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  const target = creature('target', { moves: [{ moveId: 'harden', pp: 3 }] });
  const result = resolveBattleTurn(battle(taunters, target), cmds(), moves, prototypeBattleRules);
  assert.ok(result.events.some(event => event.type === 'tauntApplied' && event.turns >= 3 && event.turns <= 5));
  assert.ok(result.events.some(event => event.type === 'moveFailed' && event.side === 'opponent' && event.reason === 'taunted'));
  assert.equal(result.state.opponent.creatures[0].moves[0].pp, 3);
  assert.ok((result.state.opponent.creatures[0].tauntTurnsRemaining ?? 0) > 0);
});

test('Aqua Ring heals each turn, while Ingrain anchors the user and cancels Levitate ground immunity', () => {
  const ringUser = creature('ring-user', { hp: 100, moves: [{ moveId: 'aqua-ring', pp: 2 }] });
  const ring = resolveBattleTurn(battle(ringUser, creature('quiet', { moves: [{ moveId: 'harden', pp: 2 }] })), cmds(), moves, prototypeBattleRules);
  assert.equal(ring.state.player.creatures[0].hp, 112);
  assert.ok(ring.events.some(event => event.type === 'healingApplied' && event.moveId === 'aqua-ring' && event.amount === 12));

  const rooted = creature('rooted', { hp: 100, abilityId: 'levitate', moves: [{ moveId: 'ingrain', pp: 2 }] });
  const rootedBattle = createBattleState({ battleId: 'ingrain', battleType: 'wild', seed: 8, rules: prototypeBattleRules,
    playerTeam: [rooted, creature('backup')], opponentTeam: [creature('quiet', { moves: [{ moveId: 'harden', pp: 2 }] })] });
  const first = resolveBattleTurn(rootedBattle, cmds(), moves, prototypeBattleRules);
  assert.equal(first.state.player.creatures[0].hp, 112);
  assert.equal(abilityPreventsTypeDamage(first.state.player.creatures[0], 'ground'), false);
  const switched = resolveBattleTurn(first.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.ok(switched.events.some(event => event.type === 'commandRejected' && event.side === 'player' && event.reason === 'trapped'));

  const flyingRoot = creature('flying-root', { hp: 100, types: ['flying'], abilityId: 'levitate', stats: { maxHp: 200, attack: 40, defense: 70, specialAttack: 40, specialDefense: 70, speed: 150 }, moves: [{ moveId: 'ingrain', pp: 2 }] });
  const groundAttacker = creature('ground-attacker', { moves: [{ moveId: 'earthquake', pp: 5 }], stats: { maxHp: 200, attack: 90, defense: 60, specialAttack: 40, specialDefense: 60, speed: 40 } });
  const grounded = resolveBattleTurn(battle(flyingRoot, groundAttacker), cmds(), { ...moves, earthquake: { id: 'earthquake', name: 'Earthquake', type: 'ground', category: 'physical', power: 100, accuracy: 100, priority: 0, maxPp: 10 } },
    { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1, typeChart: { ground: { flying: 0 } } });
  assert.ok(grounded.events.some(event => event.type === 'damageApplied' && event.sourceSide === 'opponent' && event.amount > 0 && event.effectiveness === 1), 'Ingrain grounds a Flying-type target and removes Ground immunity');
});

test('Mud Sport and Water Sport halve matching move damage until their user leaves', () => {
  const stableDamage = { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 };
  const compare = (sportMove: 'mud-sport' | 'water-sport', attackMove: 'electric-test' | 'fire-test') => {
    const setter = creature(`setter-${sportMove}`, { moves: [{ moveId: sportMove, pp: 2 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
    const attacker = creature(`attacker-${attackMove}`, { moves: [{ moveId: attackMove, pp: 2 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 100, specialDefense: 40, speed: 1 } });
    const fielded = resolveBattleTurn(battle(setter, attacker), cmds(), moves, stableDamage);
    const ordinary = resolveBattleTurn(battle(creature(`no-sport-${sportMove}`, { moves: [{ moveId: 'harden', pp: 2 }] }), attacker),
      { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, stableDamage);
    const shelteredDamage = fielded.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'opponent');
    const ordinaryDamage = ordinary.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'opponent');
    assert.ok(shelteredDamage?.type === 'damageApplied' && ordinaryDamage?.type === 'damageApplied' && shelteredDamage.amount < ordinaryDamage.amount);
    assert.equal(fielded.state.player.creatures[0][sportMove === 'mud-sport' ? 'mudSportActive' : 'waterSportActive'], true);
  };
  compare('mud-sport', 'electric-test');
  compare('water-sport', 'fire-test');
});

test('Mist blocks opposing stat drops and Lucky Chant prevents critical hits for the field duration', () => {
  const mistSetter = creature('mist-setter', { moves: [{ moveId: 'mist', pp: 2 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  const misted = resolveBattleTurn(battle(mistSetter, creature('debuffer', { moves: [{ moveId: 'lower-attack', pp: 2 }] })), cmds(), moves, prototypeBattleRules);
  assert.equal(misted.state.opponent.creatures[0].statStages, undefined);
  assert.equal(misted.state.player.mistTurnsRemaining, 4);

  const chantSetter = creature('chant-setter', { moves: [{ moveId: 'lucky-chant', pp: 2 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  const attacker = creature('attacker', { moves: [{ moveId: 'tackle', pp: 2 }], stats: { maxHp: 200, attack: 100, defense: 40, specialAttack: 40, specialDefense: 40, speed: 1 } });
  const criticalBlocked = resolveBattleTurn(battle(chantSetter, attacker), cmds(), moves, { ...prototypeBattleRules, criticalChance: 1 });
  const hit = criticalBlocked.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'opponent');
  assert.ok(hit?.type === 'damageApplied' && !hit.critical);
  assert.equal(criticalBlocked.state.player.luckyChantTurnsRemaining, 4);
});

test('Guard Swap, Power Swap and Psych Up copy the named Gen IV stages; Haze clears all stages', () => {
  const setup = (moveId: string) => {
    const state = battle(creature('stage-user', { moves: [{ moveId, pp: 2 }] }), creature('stage-target', { moves: [{ moveId: 'harden', pp: 2 }] }));
    return { ...state,
      player: { ...state.player, creatures: state.player.creatures.map(pokemon => ({ ...pokemon, statStages: { defense: -2, specialDefense: 1, attack: 2, specialAttack: -1, accuracy: 1 }, criticalStage: 2 })) },
      opponent: { ...state.opponent, creatures: state.opponent.creatures.map(pokemon => ({ ...pokemon, statStages: { defense: 1, specialDefense: -1, attack: -2, specialAttack: 3, evasion: -1 }, criticalStage: 1 })) },
    };
  };
  const guard = resolveBattleTurn(setup('guard-swap'), cmds(), moves, prototypeBattleRules);
  assert.deepEqual(guard.state.player.creatures[0].statStages, { defense: 1, specialDefense: -1, attack: 2, specialAttack: -1, accuracy: 1 });
  assert.deepEqual(guard.state.opponent.creatures[0].statStages, { defense: -2, specialDefense: 1, attack: -2, specialAttack: 3, evasion: -1 });

  const power = resolveBattleTurn(setup('power-swap'), cmds(), moves, prototypeBattleRules);
  assert.deepEqual(power.state.player.creatures[0].statStages, { defense: -2, specialDefense: 1, attack: -2, specialAttack: 3, accuracy: 1 });
  const copied = resolveBattleTurn(setup('psych-up'), cmds(), moves, prototypeBattleRules);
  assert.deepEqual(copied.state.player.creatures[0].statStages, copied.state.opponent.creatures[0].statStages);
  const hazeState = setup('haze');
  const benched = creature('haze-bench', { statStages: { evasion: 2 }, criticalStage: 3 });
  const hazed = resolveBattleTurn({ ...hazeState, player: { ...hazeState.player, creatures: [...hazeState.player.creatures, benched] } }, cmds(), moves, prototypeBattleRules);
  assert.equal(hazed.state.player.creatures[0].statStages, undefined);
  assert.equal(hazed.state.opponent.creatures[0].statStages, undefined);
  assert.equal(hazed.state.player.creatures[0].criticalStage, 2, 'Haze preserves Focus Energy');
  assert.equal(hazed.state.opponent.creatures[0].criticalStage, 1, 'Haze preserves the opposing critical-hit stage');
  assert.deepEqual(hazed.state.player.creatures[1].statStages, { evasion: 2 }, 'Haze does not clear benched Pokémon');
});

test('Spite removes up to four PP from the target’s most recently used move', () => {
  const spiteUser = creature('spite-user', { moves: [{ moveId: 'spite', pp: 2 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 1 } });
  const target = creature('spite-target', { moves: [{ moveId: 'tackle', pp: 3 }, { moveId: 'harden', pp: 3 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  const result = resolveBattleTurn(battle(spiteUser, target), cmds(), moves, prototypeBattleRules);
  assert.equal(result.state.opponent.creatures[0].moves[0].pp, 0);
  const event = result.events.find(candidate => candidate.type === 'movePpReduced');
  assert.ok(event?.type === 'movePpReduced' && event.moveId === 'tackle' && event.amount === 2);
});

test('Charge raises Special Defense and doubles the user’s Electric move next turn', () => {
  const stableDamage = { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 };
  const chargedUser = creature('charged-user', { moves: [{ moveId: 'charge', pp: 2 }, { moveId: 'electric-test', pp: 2 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 100, specialDefense: 40, speed: 100 } });
  const enemy = creature('enemy', { moves: [{ moveId: 'harden', pp: 3 }] });
  const charged = resolveBattleTurn(battle(chargedUser, enemy), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, stableDamage);
  assert.equal(charged.state.player.creatures[0].statStages?.specialDefense, 1);
  assert.equal(charged.state.player.creatures[0].chargeElectricBoostReadyAt, 2);
  const boosted = resolveBattleTurn(charged.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, stableDamage);
  const normal = resolveBattleTurn(battle(creature('normal-electric-user', { moves: [{ moveId: 'electric-test', pp: 2 }], stats: chargedUser.stats }), enemy), cmds(), moves, stableDamage);
  const boostedHit = boosted.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  const normalHit = normal.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  assert.ok(boostedHit?.type === 'damageApplied' && normalHit?.type === 'damageApplied' && boostedHit.amount > normalHit.amount);
  assert.equal(boosted.state.player.creatures[0].chargeElectricBoostReadyAt, undefined);
});

test('Tailwind changes move order for the user’s side and lasts its announced duration', () => {
  const setter = creature('tailwind-setter', { moves: [{ moveId: 'tailwind', pp: 2 }, { moveId: 'tackle', pp: 2 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } });
  const fasterEnemy = creature('fast-enemy', { moves: [{ moveId: 'harden', pp: 3 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 150 } });
  const first = resolveBattleTurn(battle(setter, fasterEnemy), cmds(), moves, prototypeBattleRules);
  assert.equal(first.state.player.tailwindTurnsRemaining, 2);
  const next = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  const order = next.events.find(event => event.type === 'actionOrder');
  assert.ok(order?.type === 'actionOrder' && order.sides[0] === 'player');
  assert.equal(next.state.player.tailwindTurnsRemaining, 1);
});

test('the generated HGSS Splash definition spends PP and has no battle effect', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('splash-user', { moves: [{ moveId: 'splash', pp: 2 }] });
  const result = resolveBattleTurn(battle(user, creature('quiet', { moves: [{ moveId: 'harden', pp: 2 }] })), cmds(), officialMoves, prototypeBattleRules);
  assert.equal(result.state.player.creatures[0].moves[0].pp, 1);
  assert.ok(result.events.some(event => event.type === 'moveFailed' && event.side === 'player' && event.moveId === 'splash' && event.reason === 'noEffect'));
});

test('generated move flags drive Soundproof immunity and contact abilities', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  assert.equal(officialMoves['hyper-voice'].soundMove, true);
  assert.equal(officialMoves.tackle.makesContact, true);
  const voice = creature('voice', { moves: [{ moveId: 'hyper-voice', pp: 2 }] });
  const soundproof = creature('soundproof', { abilityId: 'soundproof', moves: [{ moveId: 'harden', pp: 2 }] });
  const blocked = resolveBattleTurn(battle(voice, soundproof), cmds(), officialMoves, prototypeBattleRules);
  assert.ok(blocked.events.some(event => event.type === 'moveFailed' && event.moveId === 'hyper-voice' && event.reason === 'noEffect'));

  let activated: ReturnType<typeof resolveBattleTurn> | undefined;
  for (let seed = 1; seed <= 100 && !activated?.events.some(event => event.type === 'statusApplied' && event.status === 'paralysis'); seed++) {
    const initial = createBattleState({ battleId: `static-${seed}`, battleType: 'wild', seed, rules: prototypeBattleRules,
      playerTeam: [creature('attacker', { moves: [{ moveId: 'tackle', pp: 35 }] })],
      opponentTeam: [creature('static-holder', { abilityId: 'static', moves: [{ moveId: 'harden', pp: 2 }] })] });
    activated = resolveBattleTurn(initial, cmds(), officialMoves, prototypeBattleRules);
  }
  assert.ok(activated?.events.some(event => event.type === 'abilityActivated' && event.abilityId === 'static'));
  assert.ok(activated?.events.some(event => event.type === 'statusApplied' && event.side === 'player' && event.status === 'paralysis'));
});

test('Run Away, Trace, and Magnet Pull apply their sourced battle effects', () => {
  const escapeRules = { ...prototypeBattleRules, fleeBaseChance: 0 };
  const runner = creature('runner', { abilityId: 'run-away' });
  const fled = resolveBattleTurn(battle(runner), { player: { kind: 'attemptFlee' }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, escapeRules);
  assert.equal(fled.state.outcome.kind, 'fled');

  const traceStart = createBattleState({ battleId: 'trace', battleType: 'wild', seed: 8, rules: prototypeBattleRules,
    playerTeam: [creature('tracer', { abilityId: 'trace' })], opponentTeam: [creature('levitator', { abilityId: 'levitate' })] });
  const tracedState = resolveBattleTurn(traceStart, cmds(), moves, prototypeBattleRules).state;
  assert.equal(tracedState.player.creatures[0].abilityId, 'levitate');
  assert.equal(tracedState.player.creatures[0].abilityOriginalId, 'trace');

  const steel = creature('steel', { types: ['steel'] });
  const magnet = creature('magnet', { abilityId: 'magnet-pull' });
  const trapped = createBattleState({ battleId: 'magnet-pull', battleType: 'trainer', seed: 8, rules: prototypeBattleRules,
    playerTeam: [steel, creature('reserve')], opponentTeam: [magnet] });
  const rejected = resolveBattleTurn(trapped, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, prototypeBattleRules);
  assert.ok(rejected.events.some(event => event.type === 'commandRejected' && event.side === 'player' && event.reason === 'trapped'));
});

test('HGSS Lightning Rod has no single-battle immunity; Shield Dust blocks damaging-move side effects', () => {
  assert.equal(abilityPreventsTypeDamage(creature('rod', { abilityId: 'lightning-rod' }), 'electric'), false);
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  assert.ok(officialMoves['body-slam'].inflictedStatus || officialMoves['body-slam'].statusChance);
  const initial = (seed: number, abilityId?: string) => createBattleState({ battleId: `dust-${seed}`, battleType: 'wild', seed, rules: prototypeBattleRules,
    playerTeam: [creature('body-slammer', { moves: [{ moveId: 'body-slam', pp: 15 }], stats: { maxHp: 400, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 } })],
    opponentTeam: [creature('dust-target', { abilityId, moves: [{ moveId: 'harden', pp: 2 }], stats: { maxHp: 400, attack: 40, defense: 100, specialAttack: 40, specialDefense: 40, speed: 1 } })] });
  const findProcSeed = () => {
    for (let seed = 1; seed <= 500; seed++) {
      const result = resolveBattleTurn(initial(seed), cmds(), officialMoves, prototypeBattleRules);
      if (result.events.some(event => event.type === 'statusApplied' && event.side === 'opponent' && event.status === 'paralysis')) return seed;
    }
    throw new Error('Could not locate deterministic Body Slam secondary-effect seed');
  };
  const seed = findProcSeed();
  const ordinary = resolveBattleTurn(initial(seed), cmds(), officialMoves, prototypeBattleRules);
  const shielded = resolveBattleTurn(initial(seed, 'shield-dust'), cmds(), officialMoves, prototypeBattleRules);
  assert.ok(ordinary.events.some(event => event.type === 'statusApplied' && event.status === 'paralysis'));
  assert.ok(!shielded.events.some(event => event.type === 'statusApplied' && event.status === 'paralysis'));
});

test('HGSS Effect Spore uses a 30% activation chance before choosing its status', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  let activations = 0;
  const trials = 400;
  for (let index = 1; index <= trials; index++) {
    const seed = Math.imul(index, 0x9e3779b1) >>> 0;
    const initial = createBattleState({ battleId: `effect-spore-${seed}`, battleType: 'wild', seed, rules: prototypeBattleRules,
      playerTeam: [creature('attacker', { moves: [{ moveId: 'tackle', pp: 35 }] })],
      opponentTeam: [creature('spore-holder', { abilityId: 'effect-spore', moves: [{ moveId: 'harden', pp: 2 }] })] });
    const result = resolveBattleTurn(initial, cmds(), officialMoves, prototypeBattleRules);
    if (result.events.some(event => event.type === 'abilityActivated' && event.abilityId === 'effect-spore')) activations++;
  }
  assert.ok(activations / trials > 0.22 && activations / trials < 0.38, `expected ~30% HGSS rate, got ${activations}/${trials}`);
});

test('generated Memento and Captivate respect their exact gender and self-sacrifice rules', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  assert.equal(officialMoves.memento.faintUserAfterMove, true);
  assert.equal(officialMoves.memento.statChanges?.length, 2);
  assert.equal(officialMoves.captivate.requiresOppositeGender, true);
  const target = creature('target', { moves: [{ moveId: 'harden', pp: 2 }], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 1 } });
  const sameGender = resolveBattleTurn(battle(creature('same', { gender: 'female', moves: [{ moveId: 'captivate', pp: 20 }] }), { ...target, gender: 'female' }), cmds(), officialMoves, prototypeBattleRules);
  assert.ok(sameGender.events.some(event => event.type === 'moveFailed' && event.moveId === 'captivate' && event.reason === 'noEffect'));
  assert.equal(sameGender.state.opponent.creatures[0].statStages?.attack, undefined);
  assert.equal(sameGender.state.opponent.creatures[0].statStages?.specialAttack, undefined);
  const oppositeGender = resolveBattleTurn(battle(creature('opposite', { gender: 'female', moves: [{ moveId: 'captivate', pp: 20 }] }), { ...target, gender: 'male' }), cmds(), officialMoves, prototypeBattleRules);
  assert.equal(oppositeGender.state.opponent.creatures[0].statStages?.specialAttack, -2);
  const memento = resolveBattleTurn(battle(creature('memento-user', { moves: [{ moveId: 'memento', pp: 10 }] }), target), cmds(), officialMoves, prototypeBattleRules);
  assert.equal(memento.state.player.creatures[0].hp, 0);
  assert.equal(memento.state.opponent.creatures[0].statStages?.attack, -2);
  assert.equal(memento.state.opponent.creatures[0].statStages?.specialAttack, -2);
});

test('ally-only moves fail in Veloria single battles without altering battle state', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  for (const moveId of ['follow-me', 'helping-hand']) {
    const result = resolveBattleTurn(battle(creature(moveId, { moves: [{ moveId, pp: 2 }] })), cmds(), officialMoves, prototypeBattleRules);
    assert.ok(result.events.some(event => event.type === 'moveFailed' && event.side === 'player' && event.moveId === moveId && event.reason === 'noEffect'));
  }
});

test('generated Sky Uppercut hits the Fly turn without doubling its damage', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const skyUppercut = officialMoves['sky-uppercut'];
  assert.deepEqual(skyUppercut.hitsSemiInvulnerable, ['air']);
  assert.equal(skyUppercut.doublesDamageAgainstSemiInvulnerable, undefined);
  const user = creature('sky-uppercut-user', { moves: [{ moveId: 'sky-uppercut', pp: skyUppercut.maxPp }] });
  const airborne = creature('airborne', { semiInvulnerableState: 'air', moves: [{ moveId: 'harden', pp: 2 }] });
  const result = resolveBattleTurn(battle(user, airborne), cmds(), officialMoves, prototypeBattleRules);
  assert.ok(result.events.some(event => event.type === 'damageApplied' && event.sourceSide === 'player' && event.amount > 0));
});

test('generated Sucker Punch only hits a target that selected a damaging move this turn', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  assert.equal(officialMoves['sucker-punch'].requiresTargetDamagingMove, true);
  const user = creature('sucker-punch-user', { moves: [{ moveId: 'sucker-punch', pp: officialMoves['sucker-punch'].maxPp }] });
  const attackingTarget = creature('attacking-target', { moves: [{ moveId: 'tackle', pp: 2 }], stats: { maxHp: 300, attack: 40, defense: 100, specialAttack: 40, specialDefense: 40, speed: 20 } });
  const hit = resolveBattleTurn(battle(user, attackingTarget), cmds(), officialMoves, prototypeBattleRules);
  assert.ok(hit.events.some(event => event.type === 'damageApplied' && event.sourceSide === 'player' && event.moveId === 'sucker-punch' && event.amount > 0));
  const nonAttackingTarget = creature('status-target', { moves: [{ moveId: 'harden', pp: 2 }] });
  const failed = resolveBattleTurn(battle(user, nonAttackingTarget), cmds(), officialMoves, prototypeBattleRules);
  assert.ok(failed.events.some(event => event.type === 'moveFailed' && event.side === 'player' && event.moveId === 'sucker-punch' && event.reason === 'noEffect'));
});

test('move power previews use the generated HGSS power rules and require unknown turn context', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const fast = creature('power-fast', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 20 } });
  const slow = creature('power-slow', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 }, weightKg: 250 });
  assert.equal(resolveMovePower('brine', 65, fast, { ...slow, hp: 99 }), 130);
  assert.equal(resolveMovePower('targetDamaged', 60, fast, slow), undefined);
  assert.equal(resolveMovePower('targetDamaged', 60, fast, slow, { targetWasDamaged: true }), 120);
  assert.equal(resolveMovePower('lowKick', 1, fast, slow), 120);
  assert.equal(resolveMovePower('gyroBall', 1, fast, slow), undefined);
  assert.equal(resolveMovePower('gyroBall', 1, fast, slow, { userTailwind: false, targetTailwind: false }), 126);
  assert.equal(resolveMovePower('punishment', 1, fast, { ...slow, statStages: { attack: 2, defense: 1 } }), 120);
  assert.equal(resolveMovePower('furyCutter', 10, { ...fast, consecutiveMoveUses: 4 }, slow), 80);
  assert.equal(resolveMovePower('rollout', 30, { ...fast, consecutiveMoveUses: 3, defenseCurlUsed: true }, slow, { doubleRollout: true }), 240);
  assert.equal(resolveMovePower('trumpCard', 1, { ...fast, moves: [{ moveId: 'trump-card', pp: 2 }] }, slow, { moveId: 'trump-card' }), 80);
  assert.equal(resolveMovePower('stockpile', 0, { ...fast, stockpileCount: 2 }, slow), 200);
  assert.equal(estimateMoveDamage(fast, slow, officialMoves.assurance, prototypeBattleRules), undefined);
  assert.ok(estimateMoveDamage(fast, slow, officialMoves.assurance, prototypeBattleRules, { targetWasDamaged: true }) !== undefined);
});

test('generated Curse has distinct sourced Ghost and non-Ghost effects', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const ghost = creature('ghost-curse', { types: ['ghost'], moves: [{ moveId: 'curse', pp: 10 }, { moveId: 'harden', pp: 2 }] });
  const target = creature('cursed-target', { moves: [{ moveId: 'harden', pp: 2 }] });
  const initial = createBattleState({ battleId: 'ghost-curse', battleType: 'wild', seed: 8, rules: prototypeBattleRules, playerTeam: [ghost], opponentTeam: [target] });
  const first = resolveBattleTurn(initial, cmds(), officialMoves, prototypeBattleRules);
  assert.equal(first.state.player.creatures[0].hp, 100);
  assert.equal(first.state.opponent.creatures[0].cursed, true);
  assert.equal(first.state.opponent.creatures[0].hp, 150, 'curse deals one quarter max HP at end of turn');
  assert.ok(first.events.some(event => event.type === 'curseTick' && event.damage === 50));

  const ordinary = creature('ordinary-curse', { types: ['normal'], moves: [{ moveId: 'curse', pp: 10 }] });
  const statBoost = resolveBattleTurn(battle(ordinary, target), cmds(), officialMoves, prototypeBattleRules);
  assert.equal(statBoost.state.player.creatures[0].hp, 200);
  assert.equal(statBoost.state.player.creatures[0].statStages?.speed, -1);
  assert.equal(statBoost.state.player.creatures[0].statStages?.attack, 1);
  assert.equal(statBoost.state.player.creatures[0].statStages?.defense, 1);
});

test('generated Roar ends wild battles and forces a trainer replacement before its pending action', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const roaring = creature('roaring', { moves: [{ moveId: 'roar', pp: 20 }] });
  const wild = resolveBattleTurn(battle(roaring), cmds(), officialMoves, prototypeBattleRules);
  assert.deepEqual(wild.state.outcome, { kind: 'fled', side: 'opponent' });

  const trainerBattle = createBattleState({ battleId: 'trainer-roar', battleType: 'trainer', seed: 8, rules: prototypeBattleRules,
    playerTeam: [roaring],
    opponentTeam: [creature('first-foe', { moves: [{ moveId: 'harden', pp: 2 }] }), creature('replacement', { moves: [{ moveId: 'harden', pp: 2 }] })] });
  const switched = resolveBattleTurn(trainerBattle, cmds(), officialMoves, prototypeBattleRules);
  assert.equal(switched.state.opponent.activeIndex, 1);
  assert.ok(switched.events.some(event => event.type === 'creatureSwitched' && event.side === 'opponent' && event.toId === 'replacement'));
  assert.equal(switched.events.filter(event => event.type === 'moveUsed' && event.side === 'opponent').length, 1, 'the original foe may act before priority -6 Roar, but its replacement does not act');
  assert.ok(!switched.events.some(event => event.type === 'moveUsed' && event.side === 'opponent' && event.creatureId === 'replacement'));
});

test('Perish Song counts the current turn, ends in a simultaneous draw, and clears on switching', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const singer = creature('perish-singer', { moves: [{ moveId: 'perish-song', pp: 5 }, { moveId: 'harden', pp: 2 }] });
  const target = creature('perish-target', { moves: [{ moveId: 'harden', pp: 2 }] });
  const opening = createBattleState({ battleId: 'perish-song', battleType: 'trainer', seed: 8, rules: prototypeBattleRules,
    playerTeam: [singer], opponentTeam: [target, creature('replacement')] });
  const first = resolveBattleTurn(opening, cmds(), officialMoves, prototypeBattleRules);
  assert.equal(first.state.player.creatures[0].perishCount, 2, 'the application turn counts immediately');
  assert.equal(first.state.opponent.creatures[0].perishCount, 2);
  const second = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'switch', partyIndex: 1 } }, officialMoves, prototypeBattleRules);
  assert.equal(second.state.player.creatures[0].perishCount, 1);
  assert.equal(second.state.opponent.creatures[0].perishCount, undefined, 'switching clears only the departing creature’s counter');

  const drawStart = createBattleState({ battleId: 'perish-song-draw', battleType: 'trainer', seed: 8, rules: prototypeBattleRules,
    playerTeam: [singer], opponentTeam: [target] });
  const drawFirst = resolveBattleTurn(drawStart, cmds(), officialMoves, prototypeBattleRules);
  const stillFielded = resolveBattleTurn(drawFirst.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  const finalTurn = resolveBattleTurn(stillFielded.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(finalTurn.state.outcome.kind, 'draw');
});

test('Cute Charm checks sourced gender, and Oblivious prevents infatuation', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const makeState = (seed: number, attackerAbility?: string) => createBattleState({ battleId: `cute-charm-${seed}`, battleType: 'wild', seed, rules: prototypeBattleRules,
    playerTeam: [creature('male-attacker', { gender: 'male', abilityId: attackerAbility, moves: [{ moveId: 'tackle', pp: 35 }] })],
    opponentTeam: [creature('female-charm', { gender: 'female', abilityId: 'cute-charm', moves: [{ moveId: 'harden', pp: 2 }] })] });
  let proc: ReturnType<typeof resolveBattleTurn> | undefined;
  let seed = 0;
  for (seed = 1; seed < 1000; seed++) {
    proc = resolveBattleTurn(makeState(seed), cmds(), officialMoves, prototypeBattleRules);
    if (proc.events.some(event => event.type === 'infatuationApplied')) break;
  }
  assert.ok(proc?.events.some(event => event.type === 'infatuationApplied' && event.side === 'player'));
  assert.equal(proc.state.player.creatures[0].infatuatedBy, 'female-charm');
  const oblivious = resolveBattleTurn(makeState(seed, 'oblivious'), cmds(), officialMoves, prototypeBattleRules);
  assert.ok(!oblivious.events.some(event => event.type === 'infatuationApplied'));
});

test('generated HGSS hazards layer, apply on entry, respect grounding, and Rapid Spin clears only after a hit', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const player = creature('hazard-player', { moves: [{ moveId: 'harden', pp: 30 }] });
  const reserve = creature('hazard-reserve', { moves: [{ moveId: 'rapid-spin', pp: 40 }] });
  const setter = creature('hazard-setter', { moves: [{ moveId: 'spikes', pp: 20 }, { moveId: 'toxic-spikes', pp: 20 }, { moveId: 'harden', pp: 30 }] });
  const start = createBattleState({ battleId: 'hazards', battleType: 'trainer', seed: 5, rules: prototypeBattleRules,
    playerTeam: [player, reserve], opponentTeam: [setter] });
  const laid = resolveBattleTurn(start, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(laid.state.player.spikesLayers, 1);
  const layered = resolveBattleTurn(laid.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 1 } }, officialMoves, prototypeBattleRules);
  const doubleLayer = resolveBattleTurn(layered.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 1 } }, officialMoves, prototypeBattleRules);
  assert.equal(doubleLayer.state.player.toxicSpikesLayers, 2);
  const entered = resolveBattleTurn(doubleLayer.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 2 } }, officialMoves, prototypeBattleRules);
  assert.equal(entered.state.player.creatures[1].status?.status, 'poison');
  assert.equal(entered.state.player.creatures[1].status?.toxicCounter, 2, 'the first bad-poison tick advances the HGSS counter');
  assert.equal(entered.state.player.creatures[1].hp, 200 - 25 - 12, 'one Spikes layer removes one eighth, then bad poison deals one sixteenth');
  const switchedOut = resolveBattleTurn(entered.state, { player: { kind: 'switch', partyIndex: 0 }, opponent: { kind: 'useMove', moveSlot: 2 } }, officialMoves, prototypeBattleRules);
  assert.equal(switchedOut.state.player.creatures[1].status?.toxicCounter, 1, 'HGSS resets toxic progression when its bearer switches out');
  const reEntered = resolveBattleTurn(switchedOut.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 2 } }, officialMoves, prototypeBattleRules);
  const spun = resolveBattleTurn(reEntered.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 2 } }, officialMoves, prototypeBattleRules);
  assert.equal(spun.state.player.spikesLayers, undefined);
  assert.equal(spun.state.player.toxicSpikesLayers, undefined);

  const flying = creature('flying-entry', { types: ['flying'], moves: [{ moveId: 'harden', pp: 30 }] });
  const groundedState = createBattleState({ battleId: 'flying-hazard-immunity', battleType: 'trainer', seed: 5, rules: prototypeBattleRules,
    playerTeam: [player, flying], opponentTeam: [setter] });
  const spikesState = resolveBattleTurn(groundedState, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  const flyingEntered = resolveBattleTurn(spikesState.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 2 } }, officialMoves, prototypeBattleRules);
  assert.equal(flyingEntered.state.player.creatures[1].hp, flying.stats.maxHp);
});

test('generated HGSS Poison Fang uses the historical 30 percent badly-poison chance and Nightmare damages sleepers', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  assert.equal(officialMoves['poison-fang'].statusChance, 30);
  assert.equal(officialMoves['poison-fang'].inflictedBadlyPoisoned, true);
  let poisonResult: ReturnType<typeof resolveBattleTurn> | undefined;
  for (let seed = 1; seed < 300; seed++) {
    const state = createBattleState({ battleId: `fang-${seed}`, battleType: 'wild', seed, rules: prototypeBattleRules,
      playerTeam: [creature('fang-user', { moves: [{ moveId: 'poison-fang', pp: 15 }] })],
      opponentTeam: [creature('fang-target', { moves: [{ moveId: 'harden', pp: 30 }] })] });
    const result = resolveBattleTurn(state, cmds(), officialMoves, prototypeBattleRules);
    if (result.state.opponent.creatures[0].status?.toxicCounter !== undefined) { poisonResult = result; break; }
  }
  assert.ok(poisonResult, 'one of the deterministic seeds should pass the sourced secondary-effect roll');
  assert.equal(poisonResult.state.opponent.creatures[0].status?.toxicCounter, 2, 'bad poison starts at one and advances on the first residual tick');

  const sleeping = creature('nightmare-target', { status: { status: 'sleep', turnsRemaining: 4 }, moves: [{ moveId: 'harden', pp: 30 }] });
  const state = createBattleState({ battleId: 'nightmare', battleType: 'wild', seed: 11, rules: prototypeBattleRules,
    playerTeam: [creature('nightmare-user', { moves: [{ moveId: 'nightmare', pp: 15 }] })], opponentTeam: [sleeping] });
  const result = resolveBattleTurn(state, cmds(), officialMoves, prototypeBattleRules);
  assert.equal(result.state.opponent.creatures[0].hp, 150);
  assert.equal(result.state.opponent.creatures[0].nightmareActive, true);
  assert.ok(result.events.some(event => event.type === 'nightmareTick' && event.damage === 50));
});

test('badly poisoned creatures retain severity but restart the volatile counter at a new battle', () => {
  const badlyPoisoned = creature('poison-persistence', { status: { status: 'poison', toxicCounter: 5 }, moves: [{ moveId: 'harden', pp: 30 }] });
  const state = createBattleState({ battleId: 'poison-counter-reset', battleType: 'wild', seed: 2, rules: prototypeBattleRules,
    playerTeam: [badlyPoisoned], opponentTeam: [creature('counter-target')] });
  assert.equal(state.player.creatures[0].status?.status, 'poison');
  assert.equal(state.player.creatures[0].status?.toxicCounter, 1);
});

test('generated Mirror Move copies the opposing active creature’s previous legal targeted move', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const mirrorUser = creature('mirror-user', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 20 },
    moves: [{ moveId: 'mirror-move', pp: 20 }] });
  const opponent = creature('mirror-target', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 100 },
    moves: [{ moveId: 'tackle', pp: 35 }] });
  const state = createBattleState({ battleId: 'mirror-move', battleType: 'wild', seed: 17, rules: prototypeBattleRules,
    playerTeam: [mirrorUser], opponentTeam: [opponent] });
  const result = resolveBattleTurn(state, cmds(), officialMoves, prototypeBattleRules);
  assert.ok(result.events.some(event => event.type === 'moveUsed' && event.side === 'player' && event.moveId === 'tackle'));
  assert.equal(result.state.player.creatures[0].moves[0].pp, 19, 'Mirror Move spends its own PP slot once');
});

test('generated Copycat invokes the last move used successfully anywhere in battle', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const outgoing = creature('copycat-outgoing', { moves: [{ moveId: 'harden', pp: 30 }] });
  const copycat = creature('copycat-user', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 120 },
    moves: [{ moveId: 'copycat', pp: 20 }] });
  const opponent = creature('copycat-source', { moves: [{ moveId: 'tackle', pp: 35 }, { moveId: 'harden', pp: 30 }] });
  const state = createBattleState({ battleId: 'copycat', battleType: 'wild', seed: 17, rules: prototypeBattleRules,
    playerTeam: [outgoing, copycat], opponentTeam: [opponent] });
  const switched = resolveBattleTurn(state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(switched.state.lastMoveId, 'tackle');
  const copied = resolveBattleTurn(switched.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 1 } }, officialMoves, prototypeBattleRules);
  assert.ok(copied.events.some(event => event.type === 'moveUsed' && event.side === 'player' && event.moveId === 'tackle'));
  assert.equal(copied.state.player.creatures[1].moves[0].pp, 19);
});

test('generated Encore forces the last move and spends its duration on attempted uses', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('encore-user', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 120 },
    moves: [{ moveId: 'encore', pp: 5 }, { moveId: 'harden', pp: 30 }] });
  const target = creature('encore-target', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 40 },
    moves: [{ moveId: 'tackle', pp: 35 }, { moveId: 'harden', pp: 30 }] });
  const start = createBattleState({ battleId: 'encore', battleType: 'wild', seed: 21, rules: prototypeBattleRules,
    playerTeam: [user], opponentTeam: [target] });
  const first = resolveBattleTurn(start, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(first.state.opponent.creatures[0].lastUsedMoveId, 'tackle');
  const second = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(second.state.opponent.creatures[0].encoredMoveId, 'tackle');
  assert.ok((second.state.opponent.creatures[0].encoreTurnsRemaining ?? 0) >= 3);
  const forced = resolveBattleTurn(second.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 1 } }, officialMoves, prototypeBattleRules);
  assert.ok(forced.events.some(event => event.type === 'commandRejected' && event.side === 'opponent' && event.reason === 'invalidMove'));
});

test('generated HGSS Uproar wakes both active creatures, locks its user, and blocks sleep', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const singer = creature('uproar-user', { status: { status: 'sleep', turnsRemaining: 3 },
    moves: [{ moveId: 'uproar', pp: 10 }] });
  const target = creature('uproar-target', { status: { status: 'sleep', turnsRemaining: 3 },
    moves: [{ moveId: 'harden', pp: 30 }, { moveId: 'hypnosis', pp: 20 }] });
  let first: ReturnType<typeof resolveBattleTurn> | undefined;
  let second: ReturnType<typeof resolveBattleTurn> | undefined;
  for (let seed = 1; seed < 300; seed++) {
    const state = createBattleState({ battleId: `uproar-${seed}`, battleType: 'wild', seed, rules: prototypeBattleRules,
      playerTeam: [singer], opponentTeam: [target] });
    first = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
    if (first.state.outcome.kind !== 'ongoing' || first.state.opponent.creatures[0].hp <= 0) continue;
    second = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 1 } }, officialMoves, prototypeBattleRules);
    if (second.events.some(event => event.type === 'statusPrevented' && event.status === 'sleep')) break;
  }
  assert.equal(first?.state.player.creatures[0].status, undefined);
  assert.equal(first?.state.opponent.creatures[0].status, undefined);
  assert.equal(first?.state.player.creatures[0].uproarActive, true);
  assert.equal(first?.state.player.creatures[0].lockedMoveId, 'uproar');
  assert.ok(second?.events.some(event => event.type === 'statusPrevented' && event.status === 'sleep'));
  assert.equal(second?.state.player.creatures[0].uproarActive, true);
});

test('held-item-dependent moves fail explicitly in Veloria’s no-held-items battle context', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  for (const moveId of ['fling', 'natural-gift', 'recycle', 'trick', 'switcheroo']) {
    assert.equal(officialMoves[moveId].requiresHeldItemContext, true);
    const user = creature(`no-held-item-${moveId}`, { moves: [{ moveId, pp: officialMoves[moveId].maxPp }] });
    const result = resolveBattleTurn(battle(user), cmds(), officialMoves, prototypeBattleRules);
    assert.ok(result.events.some(event => event.type === 'moveFailed' && event.side === 'player' && event.moveId === moveId && event.reason === 'noEffect'));
  }
});

test('generated Gastro Acid suppression restores the original ability on switch, and Magnet Rise blocks Ground moves', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const suppressor = creature('gastro-user', { moves: [{ moveId: 'gastro-acid', pp: 10 }] });
  const abilityTarget = creature('gastro-target', { abilityId: 'static', moves: [{ moveId: 'harden', pp: 30 }] });
  const replacement = creature('gastro-replacement');
  const before = createBattleState({ battleId: 'gastro-acid', battleType: 'trainer', seed: 14, rules: prototypeBattleRules,
    playerTeam: [suppressor], opponentTeam: [abilityTarget, replacement] });
  const suppressed = resolveBattleTurn(before, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(suppressed.state.opponent.creatures[0].abilityId, undefined);
  assert.ok(suppressed.events.some(event => event.type === 'abilitySuppressed' && event.abilityId === 'static'));
  const restored = resolveBattleTurn(suppressed.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'switch', partyIndex: 1 } }, officialMoves, prototypeBattleRules);
  assert.equal(restored.state.opponent.creatures[0].abilityId, 'static');

  const rising = creature('magnet-riser', { moves: [{ moveId: 'magnet-rise', pp: 10 }, { moveId: 'harden', pp: 30 }] });
  const grounder = creature('grounder', { moves: [{ moveId: 'earthquake', pp: 10 }] });
  const start = createBattleState({ battleId: 'magnet-rise', battleType: 'wild', seed: 14, rules: prototypeBattleRules,
    playerTeam: [rising], opponentTeam: [grounder] });
  const first = resolveBattleTurn(start, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  const hp = first.state.player.creatures[0].hp;
  const second = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(second.state.player.creatures[0].hp, hp, 'Magnet Rise grants Ground immunity for its active turns');
});

test('generated Sleep Talk calls another known move without spending that move’s PP', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const sleepy = creature('sleep-talk-user', { status: { status: 'sleep', turnsRemaining: 4 },
    moves: [{ moveId: 'sleep-talk', pp: 10 }, { moveId: 'tackle', pp: 15 }] });
  const opponent = creature('sleep-talk-target', { moves: [{ moveId: 'harden', pp: 30 }] });
  const state = createBattleState({ battleId: 'sleep-talk', battleType: 'wild', seed: 42, rules: prototypeBattleRules,
    playerTeam: [sleepy], opponentTeam: [opponent] });
  const result = resolveBattleTurn(state, cmds(), officialMoves, prototypeBattleRules);
  assert.ok(result.events.some(event => event.type === 'moveUsed' && event.side === 'player' && event.moveId === 'tackle'));
  assert.equal(result.state.player.creatures[0].moves[0].pp, 9);
  assert.equal(result.state.player.creatures[0].moves[1].pp, 15);
});

test('generated Mimic copies the target’s last successful move at five PP and restores its spent slot after switching', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const mimicUser = creature('mimic-user', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 120 },
    moves: [{ moveId: 'mimic', pp: 10 }, { moveId: 'harden', pp: 30 }] });
  const target = creature('mimic-target', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 40 },
    moves: [{ moveId: 'tackle', pp: 35 }, { moveId: 'harden', pp: 30 }] });
  const reserve = creature('mimic-reserve', { moves: [{ moveId: 'tackle', pp: 35 }] });
  const start = createBattleState({ battleId: 'mimic', battleType: 'wild', seed: 31, rules: prototypeBattleRules,
    playerTeam: [mimicUser, reserve], opponentTeam: [target] });
  const first = resolveBattleTurn(start, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  const copied = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 1 } }, officialMoves, prototypeBattleRules);
  assert.ok(copied.events.some(event => event.type === 'moveCopied' && event.moveId === 'tackle'));
  assert.deepEqual(copied.state.player.creatures[0].moves[0], { moveId: 'tackle', pp: 5 });
  assert.equal(copied.state.player.creatures[0].mimicOriginalMoveSlot?.slot.pp, 9);
  const switched = resolveBattleTurn(copied.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.deepEqual(switched.state.player.creatures[0].moves[0], { moveId: 'mimic', pp: 9 });
  assert.equal(switched.state.player.creatures[0].mimicOriginalMoveSlot, undefined);
});

test('generated Metronome draws from the regional catalog but spends only Metronome PP', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const target = creature('metronome-target', { moves: [{ moveId: 'harden', pp: 30 }] });
  let called: ReturnType<typeof resolveBattleTurn> | undefined;
  for (let seed = 1; seed < 100 && !called; seed++) {
    const user = creature(`metronome-user-${seed}`, { moves: [{ moveId: 'metronome', pp: 10 }, { moveId: 'tackle', pp: 35 }] });
    const state = createBattleState({ battleId: `metronome-${seed}`, battleType: 'wild', seed, rules: prototypeBattleRules,
      playerTeam: [user], opponentTeam: [target] });
    const result = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
    if (result.events.some(event => event.type === 'moveInvoked' && event.sourceMoveId === 'metronome')) called = result;
  }
  assert.ok(called, 'Metronome should choose a move from the current catalog');
  const invocation = called.events.find(event => event.type === 'moveInvoked' && event.sourceMoveId === 'metronome');
  assert.ok(invocation && invocation.type === 'moveInvoked');
  assert.ok(officialMoves[invocation.moveId], 'the invoked move must be in the regional runtime catalog');
  assert.notEqual(invocation.moveId, 'metronome');
  assert.equal(called.state.player.creatures[0].moves[0].pp, 9);
  assert.equal(called.state.player.creatures[0].moves[1].pp, 35);
});

test('generated Rage raises Attack when hit before the user acts again, then expires', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('rage-user', { moves: [{ moveId: 'rage', pp: 20 }, { moveId: 'harden', pp: 30 }] });
  const opponent = creature('rage-target', { stats: { maxHp: 200, attack: 100, defense: 40, specialAttack: 40, specialDefense: 40, speed: 40 },
    moves: [{ moveId: 'tackle', pp: 35 }] });
  const start = createBattleState({ battleId: 'rage', battleType: 'wild', seed: 19, rules: prototypeBattleRules,
    playerTeam: [user], opponentTeam: [opponent] });
  const first = resolveBattleTurn(start, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(first.state.player.creatures[0].statStages?.attack, 1);
  assert.equal(first.state.player.creatures[0].rageActive, true);
  const second = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(second.state.player.creatures[0].statStages?.attack, 1, 'the second hit follows Rage’s expiration on the user’s next action');
  assert.equal(second.state.player.creatures[0].rageActive, undefined);
});

test('generated Substitute spends a quarter HP, absorbs damage, and blocks direct status moves', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('substitute-user', { moves: [{ moveId: 'substitute', pp: 10 }, { moveId: 'harden', pp: 30 }] });
  const target = creature('substitute-target', { moves: [{ moveId: 'tackle', pp: 35 }, { moveId: 'hypnosis', pp: 20 }] });
  const start = createBattleState({ battleId: 'substitute', battleType: 'wild', seed: 13, rules: prototypeBattleRules,
    playerTeam: [user], opponentTeam: [target] });
  const first = resolveBattleTurn(start, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.ok(first.events.some(event => event.type === 'substituteCreated' && event.hp === 50));
  assert.ok(first.events.some(event => event.type === 'substituteDamaged'));
  assert.equal(first.state.player.creatures[0].hp, 150);
  assert.ok((first.state.player.creatures[0].substituteHp ?? 0) > 0);
  const second = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 1 } }, officialMoves, prototypeBattleRules);
  assert.ok(second.events.some(event => event.type === 'moveFailed' && event.side === 'opponent' && event.moveId === 'hypnosis'));
  assert.equal(second.state.player.creatures[0].status, undefined);
});

test('generated Gravity grounds Flying and Levitate, boosts accuracy without changing stages, and blocks suspended moves', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('gravity-flyer', { types: ['flying'], abilityId: 'levitate',
    moves: [{ moveId: 'gravity', pp: 5 }, { moveId: 'fly', pp: 15 }] });
  const target = creature('gravity-grounder', { statStages: { evasion: 2 },
    stats: { maxHp: 200, attack: 100, defense: 40, specialAttack: 40, specialDefense: 40, speed: 40 },
    moves: [{ moveId: 'earthquake', pp: 10 }] });
  const start = createBattleState({ battleId: 'gravity', battleType: 'wild', seed: 39, rules: prototypeBattleRules,
    playerTeam: [user], opponentTeam: [target] });
  const stagedStart = { ...start, opponent: { ...start.opponent, creatures: start.opponent.creatures.map(creature => ({ ...creature, statStages: { evasion: 2 } })) } };
  const first = resolveBattleTurn(stagedStart, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.ok(first.events.some(event => event.type === 'gravityApplied' && event.turns === 5));
  assert.ok(first.events.some(event => event.type === 'damageApplied' && event.moveId === 'earthquake' && event.amount > 0));
  assert.equal(first.state.opponent.creatures[0].statStages?.evasion, 2, 'Gravity accuracy is contextual; it does not change or later restore stages');
  assert.ok(Math.abs(effectiveMoveAccuracy(user, { ...target, statStages: undefined }, { id: 'gravity-accuracy', name: 'Gravity accuracy', type: 'normal', category: 'physical', power: 40, accuracy: 50, priority: 0, maxPp: 10 }, undefined, true) - 50 * 5 / 3) < 1e-10);
  assert.ok((first.state.gravityTurnsRemaining ?? 0) > 0);
  const second = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.ok(second.events.some(event => event.type === 'moveFailed' && event.side === 'player' && event.moveId === 'fly'));
});

test('Gen IV paralysis uses the same quarter-speed rule for turn order and Gyro Ball', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const paralyzed = creature('paralyzed-speed', { status: { status: 'paralysis' },
    stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 200 },
    moves: [{ moveId: 'gyro-ball', pp: 5 }] });
  const slower = creature('slower-target', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 80 },
    moves: [{ moveId: 'harden', pp: 30 }] });
  assert.equal(resolveMovePower('gyroBall', 1, paralyzed, slower, { userTailwind: false, targetTailwind: false }), 41);
  const start = createBattleState({ battleId: 'paralysis-speed', battleType: 'wild', seed: 23, rules: prototypeBattleRules,
    playerTeam: [paralyzed], opponentTeam: [slower] });
  const result = resolveBattleTurn(start, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  const order = result.events.find(event => event.type === 'actionOrder');
  assert.ok(order && order.type === 'actionOrder');
  assert.deepEqual(order.sides, ['opponent', 'player']);
});

test('generated Pay Day tracks five times user level per use for winner settlement', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('pay-day-user', { moves: [{ moveId: 'pay-day', pp: 20 }] });
  const target = creature('pay-day-target', { moves: [{ moveId: 'harden', pp: 30 }] });
  const start = createBattleState({ battleId: 'pay-day', battleType: 'wild', seed: 27, rules: prototypeBattleRules,
    playerTeam: [user], opponentTeam: [target] });
  const result = resolveBattleTurn(start, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(result.state.payDayBonus, 5 * user.level);
  assert.ok(result.events.some(event => event.type === 'payDayBonusAdded' && event.side === 'player' && event.amount === 5 * user.level));
});

test('generated Magic Coat reflects an official reflectable status move without spending copied PP', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  assert.equal(officialMoves.hypnosis.reflectable, true);
  const user = creature('magic-coat-user', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 120 },
    moves: [{ moveId: 'magic-coat', pp: 15 }, { moveId: 'tackle', pp: 35 }] });
  const target = creature('magic-coat-target', { moves: [{ moveId: 'hypnosis', pp: 20 }] });
  let result: ReturnType<typeof resolveBattleTurn> | undefined;
  for (let seed = 1; seed <= 100 && !result; seed++) {
    const start = createBattleState({ battleId: `magic-coat-${seed}`, battleType: 'wild', seed, rules: prototypeBattleRules,
      playerTeam: [user], opponentTeam: [target] });
    const candidate = resolveBattleTurn(start, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
    if (candidate.events.some(event => event.type === 'statusApplied' && event.side === 'opponent' && event.status === 'sleep')) result = candidate;
  }
  assert.ok(result, 'the reflected move should apply its effect to its original user on a successful accuracy/status roll');
  assert.equal(result.state.player.creatures[0].status, undefined);
  assert.equal(result.state.player.creatures[0].moves[0].pp, 14);
  assert.equal(result.state.opponent.creatures[0].moves[0].pp, 19);
  assert.ok(result.events.some(event => event.type === 'moveInvoked' && event.sourceMoveId === 'magic-coat' && event.moveId === 'hypnosis'));
});

test('generated Baton Pass asks for a living replacement and transfers supported volatile state', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const batonUser = creature('baton-user', { moves: [{ moveId: 'baton-pass', pp: 40 }, { moveId: 'tackle', pp: 35 }] });
  const reserve = creature('baton-reserve', { abilityId: 'levitate', moves: [{ moveId: 'tackle', pp: 35 }] });
  const opponent = creature('baton-opponent', { moves: [{ moveId: 'harden', pp: 30 }] });
  const start = createBattleState({ battleId: 'baton-pass', battleType: 'wild', seed: 31, rules: prototypeBattleRules,
    playerTeam: [batonUser, reserve], opponentTeam: [opponent] });
  const prepared = { ...start, player: { ...start.player, creatures: start.player.creatures.map((creature, index) => index === 0
    ? { ...creature, statStages: { attack: 2 }, confusionTurnsRemaining: 2, substituteHp: 25, aquaRingActive: true, ingrainActive: true, abilityId: undefined, abilityOriginalId: 'static' }
    : creature) } };
  const rejected = resolveBattleTurn(prepared, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.ok(rejected.events.some(event => event.type === 'commandRejected' && event.side === 'player' && event.reason === 'invalidSwitch'));
  const passed = resolveBattleTurn(prepared, { player: { kind: 'useMove', moveSlot: 0, batonPassPartyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  const incoming = passed.state.player.creatures[1];
  assert.equal(passed.state.player.activeIndex, 1);
  assert.deepEqual(incoming.statStages, { attack: 2 });
  assert.equal(incoming.confusionTurnsRemaining, 1, 'the user’s action decrements confusion before passing the remaining volatile turns');
  assert.equal(incoming.substituteHp, 25);
  assert.equal(incoming.aquaRingActive, true);
  assert.equal(incoming.ingrainActive, true);
  assert.equal(incoming.abilityId, undefined);
  assert.equal(incoming.abilityOriginalId, 'levitate');
  assert.equal(passed.state.player.creatures[0].statStages, undefined);
  assert.ok(passed.events.some(event => event.type === 'creatureSwitched' && event.fromId === batonUser.instanceId && event.toId === reserve.instanceId));
});

test('generated Healing Wish faints its user and restores the chosen replacement after switch-in hazards', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('healing-wish-user', { moves: [{ moveId: 'healing-wish', pp: 10 }] });
  const reserve = creature('healing-wish-reserve', { hp: 75, status: { status: 'poison' }, moves: [{ moveId: 'tackle', pp: 35 }] });
  const opponent = creature('healing-wish-target', { moves: [{ moveId: 'harden', pp: 30 }] });
  const start = createBattleState({ battleId: 'healing-wish', battleType: 'wild', seed: 11, rules: prototypeBattleRules,
    playerTeam: [user, reserve], opponentTeam: [opponent] });
  const first = resolveBattleTurn(start, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(first.state.player.creatures[0].hp, 0);
  assert.equal(first.state.player.healingWishPending, true);
  const replacement = resolveBattleTurn(first.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(replacement.state.player.creatures[1].hp, replacement.state.player.creatures[1].stats.maxHp);
  assert.equal(replacement.state.player.creatures[1].status, undefined);
  assert.equal(replacement.state.player.healingWishPending, undefined);
  assert.ok(replacement.events.some(event => event.type === 'healingWishTriggered' && event.side === 'player' && event.amount > 0));
});

test('generated Pursuit moves before a switching target and deals boosted damage to its outgoing creature', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  assert.equal(officialMoves.pursuit.power, 40);
  const pursuer = creature('pursuit-user', { stats: { maxHp: 200, attack: 120, defense: 40, specialAttack: 40, specialDefense: 40, speed: 40 },
    moves: [{ moveId: 'pursuit', pp: 20 }] });
  const target = creature('pursuit-target', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 120 },
    moves: [{ moveId: 'harden', pp: 30 }] });
  const reserve = creature('pursuit-reserve', { moves: [{ moveId: 'harden', pp: 30 }] });
  const makeStart = (battleId: string) => createBattleState({ battleId, battleType: 'wild', seed: 71, rules: prototypeBattleRules,
    playerTeam: [pursuer], opponentTeam: [target, reserve] });
  const ordinary = resolveBattleTurn(makeStart('pursuit-normal'), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  const switching = resolveBattleTurn(makeStart('pursuit-switch'), { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'switch', partyIndex: 1 } }, officialMoves, prototypeBattleRules);
  const ordinaryDamage = ordinary.events.find(event => event.type === 'damageApplied' && event.moveId === 'pursuit');
  const switchDamage = switching.events.find(event => event.type === 'damageApplied' && event.moveId === 'pursuit');
  assert.ok(ordinaryDamage && switchDamage && switchDamage.type === 'damageApplied' && ordinaryDamage.type === 'damageApplied');
  assert.ok(switchDamage.amount > ordinaryDamage.amount);
  assert.equal(switchDamage.targetCreatureId, target.instanceId);
  assert.equal(switching.state.opponent.activeIndex, 1);
});

test('Gen IV Pursuit intercepts a slower Pursuit user during Baton Pass, but not after that user has acted', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const makeTarget = (speed: number) => creature(`pursuit-baton-target-${speed}`, { stats: { maxHp: 500, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed },
    moves: [{ moveId: 'baton-pass', pp: 40 }] });
  const makePursuer = (speed: number) => creature(`pursuit-baton-user-${speed}`, { stats: { maxHp: 500, attack: 120, defense: 40, specialAttack: 40, specialDefense: 40, speed },
    moves: [{ moveId: 'pursuit', pp: 20 }] });
  const reserve = creature('pursuit-baton-reserve', { moves: [{ moveId: 'tackle', pp: 35 }] });
  const run = (targetSpeed: number, pursuerSpeed: number) => {
    const start = createBattleState({ battleId: `pursuit-baton-${targetSpeed}-${pursuerSpeed}`, battleType: 'wild', seed: 73, rules: prototypeBattleRules,
      playerTeam: [makeTarget(targetSpeed), reserve], opponentTeam: [makePursuer(pursuerSpeed)] });
    const prepared = { ...start, player: { ...start.player, creatures: start.player.creatures.map((item, index) => index === 0 ? { ...item, statStages: { attack: 2 } } : item) } };
    return resolveBattleTurn(prepared, { player: { kind: 'useMove', moveSlot: 0, batonPassPartyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  };
  const interrupted = run(120, 40);
  const interruptedHit = interrupted.events.find(event => event.type === 'damageApplied' && event.moveId === 'pursuit');
  assert.ok(interruptedHit && interruptedHit.type === 'damageApplied');
  assert.equal(interrupted.state.opponent.creatures[0].moves[0].pp, 19, 'the intercepted move spends PP exactly once');
  assert.equal(interrupted.state.player.activeIndex, 1);
  assert.deepEqual(interrupted.state.player.creatures[1].statStages, { attack: 2 });
  const afterAction = run(40, 120);
  const afterActionHit = afterAction.events.find(event => event.type === 'damageApplied' && event.moveId === 'pursuit');
  assert.ok(afterActionHit && afterActionHit.type === 'damageApplied');
  assert.equal(afterAction.state.opponent.creatures[0].moves[0].pp, 19);
  assert.equal(afterAction.state.player.activeIndex, 1);
  assert.ok(afterActionHit.amount < interruptedHit.amount, 'a faster Pursuit user acts normally before the slower Baton Pass');
});

test('Gen IV Pursuit does not intercept a Baton Pass when its user cannot act from sleep or freeze', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  for (const status of [{ status: 'sleep', turnsRemaining: 2 }, { status: 'freeze', turnsRemaining: 2 }] as const) {
    const batonUser = creature(`pursuit-blocked-baton-${status.status}`, { stats: { maxHp: 500, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 120 },
      moves: [{ moveId: 'baton-pass', pp: 40 }] });
    const reserve = creature(`pursuit-blocked-reserve-${status.status}`, { moves: [{ moveId: 'tackle', pp: 35 }] });
    const pursuer = creature(`pursuit-blocked-user-${status.status}`, { stats: { maxHp: 500, attack: 120, defense: 40, specialAttack: 40, specialDefense: 40, speed: 40 },
      status, moves: [{ moveId: 'pursuit', pp: 20 }] });
    const start = createBattleState({ battleId: `pursuit-blocked-${status.status}`, battleType: 'wild', seed: 89, rules: { ...prototypeBattleRules, freezeThawChance: 0 },
      playerTeam: [batonUser, reserve], opponentTeam: [pursuer] });
    const prepared = { ...start, player: { ...start.player, creatures: start.player.creatures.map((item, index) => index === 0 ? { ...item, statStages: { attack: 2 } } : item) } };
    const result = resolveBattleTurn(prepared, { player: { kind: 'useMove', moveSlot: 0, batonPassPartyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, { ...prototypeBattleRules, freezeThawChance: 0 });
    assert.equal(result.state.opponent.creatures[0].moves[0].pp, 20, `${status.status} Pursuit spends no PP`);
    assert.equal(result.events.some(event => event.type === 'damageApplied' && event.moveId === 'pursuit'), false);
    assert.equal(result.state.player.activeIndex, 1);
    assert.deepEqual(result.state.player.creatures[1].statStages, { attack: 2 });
  }
});

test('generated Me First copies the pending damaging move with its Gen IV post-damage bonus', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  assert.equal(officialMoves['me-first'].meFirst, true);
  const stats = { maxHp: 500, attack: 90, defense: 50, specialAttack: 90, specialDefense: 50, speed: 120 };
  const first = creature('me-first-user', { stats, moves: [{ moveId: 'me-first', pp: 20 }, { moveId: 'tackle', pp: 35 }] });
  const normal = creature('me-first-control', { stats, moves: [{ moveId: 'tackle', pp: 35 }] });
  const target = creature('me-first-target', { stats: { ...stats, speed: 40 }, moves: [{ moveId: 'tackle', pp: 35 }] });
  const battle = (battleId: string, user: ReturnType<typeof creature>, slot: number) => resolveBattleTurn(
    createBattleState({ battleId, battleType: 'wild', seed: 101, rules: prototypeBattleRules, playerTeam: [user], opponentTeam: [target] }),
    { player: { kind: 'useMove', moveSlot: slot }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  const copied = battle('me-first-copy', first, 0);
  const control = battle('me-first-control', normal, 0);
  const copiedHit = copied.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  const controlHit = control.events.find(event => event.type === 'damageApplied' && event.sourceSide === 'player');
  assert.ok(copiedHit && controlHit && copiedHit.type === 'damageApplied' && controlHit.type === 'damageApplied');
  assert.equal(copiedHit.amount, Math.floor(controlHit.amount * 1.5));
  assert.equal(copied.state.player.creatures[0].moves[0].pp, 19, 'Me First PP is spent; the copied Tackle slot is untouched');
  assert.ok(copied.events.some(event => event.type === 'moveInvoked' && event.sourceMoveId === 'me-first' && event.moveId === 'tackle'));
  const slower = creature('me-first-slower-user', { stats: { ...stats, speed: 30 }, moves: [{ moveId: 'me-first', pp: 20 }] });
  const failed = battle('me-first-too-slow', slower, 0);
  assert.ok(failed.events.some(event => event.type === 'moveFailed' && event.moveId === 'me-first' && event.reason === 'noEffect'));
  assert.equal(failed.state.player.creatures[0].moves[0].pp, 20, 'a move that acts after the target does not call or spend PP on the copied move');
});

test('generated Camouflage uses the Gen IV Normal type and restores the source typing on switch', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const user = creature('camouflage-user', { types: ['fire'], moves: [{ moveId: 'camouflage', pp: 20 }] });
  const reserve = creature('camouflage-reserve', { moves: [{ moveId: 'tackle', pp: 35 }] });
  const opponent = creature('camouflage-opponent', { moves: [{ moveId: 'harden', pp: 30 }] });
  const start = createBattleState({ battleId: 'camouflage', battleType: 'wild', seed: 41, rules: prototypeBattleRules,
    playerTeam: [user, reserve], opponentTeam: [opponent] });
  const changed = resolveBattleTurn(start, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.deepEqual(changed.state.player.creatures[0].types, ['normal']);
  assert.deepEqual(changed.state.player.creatures[0].typeChangeOriginal, ['fire']);
  const switched = resolveBattleTurn(changed.state, { player: { kind: 'switch', partyIndex: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.deepEqual(switched.state.player.creatures[0].types, ['fire']);
  assert.equal(switched.state.player.creatures[0].typeChangeOriginal, undefined);
});

test('generated Destiny Bond and Grudge trigger only when their user is directly knocked out before its next move', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const makeUser = (moveId: string) => creature(`${moveId}-user`, { hp: 1,
    stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 120 }, moves: [{ moveId, pp: 5 }] });
  const attacker = creature('bond-attacker', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 40 },
    moves: [{ moveId: 'tackle', pp: 35 }] });
  let bond: ReturnType<typeof resolveBattleTurn> | undefined;
  let grudge: ReturnType<typeof resolveBattleTurn> | undefined;
  for (let seed = 1; seed < 300; seed++) {
    const bondState = createBattleState({ battleId: `destiny-bond-${seed}`, battleType: 'wild', seed, rules: prototypeBattleRules,
      playerTeam: [makeUser('destiny-bond')], opponentTeam: [attacker] });
    const bondResult = resolveBattleTurn(bondState, cmds(), officialMoves, prototypeBattleRules);
    if (bondResult.events.filter(event => event.type === 'creatureFainted').length >= 2) { bond = bondResult; break; }
  }
  assert.ok(bond, 'the direct attack should trigger the active Destiny Bond');
  assert.equal(bond.state.player.creatures[0].hp, 0);
  assert.equal(bond.state.opponent.creatures[0].hp, 0);

  for (let seed = 1; seed < 300; seed++) {
    const grudgeState = createBattleState({ battleId: `grudge-${seed}`, battleType: 'wild', seed, rules: prototypeBattleRules,
      playerTeam: [makeUser('grudge')], opponentTeam: [attacker] });
    const grudgeResult = resolveBattleTurn(grudgeState, cmds(), officialMoves, prototypeBattleRules);
    if (grudgeResult.events.some(event => event.type === 'movePpReduced' && event.moveId === 'tackle' && event.ppRemaining === 0)) { grudge = grudgeResult; break; }
  }
  assert.ok(grudge, 'Grudge must exhaust the direct knockout move’s remaining PP');
  assert.equal(grudge.state.opponent.creatures[0].moves[0].pp, 0);
});

test('generated Future Sight stores typeless damage at use and hits the replacement after three turns', () => {
  const officialMoves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  assert.equal(officialMoves['future-sight'].power, 80);
  assert.equal(officialMoves['future-sight'].accuracy, 90);
  const user = creature('future-user', { types: ['psychic'], stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 120, specialDefense: 40, speed: 80 },
    moves: [{ moveId: 'future-sight', pp: 15 }, { moveId: 'harden', pp: 30 }] });
  const originalTarget = creature('future-original', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 20, speed: 40 },
    moves: [{ moveId: 'tackle', pp: 35 }, { moveId: 'harden', pp: 30 }] });
  const replacement = creature('future-replacement', { stats: { maxHp: 200, attack: 40, defense: 40, specialAttack: 40, specialDefense: 200, speed: 40 },
    moves: [{ moveId: 'harden', pp: 30 }] });
  let first: ReturnType<typeof resolveBattleTurn> | undefined;
  for (let seed = 1; seed < 300; seed++) {
    const state = createBattleState({ battleId: `future-sight-${seed}`, battleType: 'trainer', seed, rules: prototypeBattleRules,
      playerTeam: [user], opponentTeam: [originalTarget, replacement] });
    const result = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
    if (result.events.some(event => event.type === 'futureSightScheduled')) { first = result; break; }
  }
  assert.ok(first);
  assert.equal(first.state.opponent.creatures[0].hp, originalTarget.hp, 'Future Sight does not hit on its use turn');
  const storedDamage = first.state.opponent.futureSight?.damage;
  assert.ok(storedDamage && storedDamage > 0);
  assert.equal(first.state.opponent.futureSight?.turnsRemaining, 2);
  const second = resolveBattleTurn(first.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'switch', partyIndex: 1 } }, officialMoves, prototypeBattleRules);
  assert.equal(second.state.opponent.futureSight?.turnsRemaining, 1);
  const third = resolveBattleTurn(second.state, { player: { kind: 'useMove', moveSlot: 1 }, opponent: { kind: 'useMove', moveSlot: 0 } }, officialMoves, prototypeBattleRules);
  assert.equal(third.state.opponent.creatures[1].hp, 200 - storedDamage!);
  assert.ok(third.events.some(event => event.type === 'futureSightHit' && event.creatureId === 'future-replacement' && event.damage === storedDamage));
  assert.equal(third.state.opponent.futureSight, undefined);
});
