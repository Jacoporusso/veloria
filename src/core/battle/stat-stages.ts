import type { BattleCreature, BattleStat, BattleWeather, DerivedBattleStat, MoveDefinition } from './types.ts';

export const BATTLE_STATS: readonly BattleStat[] = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'accuracy', 'evasion'];
export const MIN_STAT_STAGE = -6;
export const MAX_STAT_STAGE = 6;

/** Prototype-v2 stages modify derived battle values, leaving species stats intact. */
export function effectiveStat(creature: BattleCreature, stat: DerivedBattleStat): number {
  const stage = creature.statStages?.[stat] ?? 0;
  const multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
  return Math.max(1, Math.floor(creature.stats[stat] * multiplier));
}

/** Gen IV applies accuracy and evasion stages separately, each bounded to -6..6. */
export function effectiveMoveAccuracy(user: BattleCreature, target: BattleCreature, move: MoveDefinition, weather?: BattleWeather, gravityActive = false): number {
  if (move.alwaysHits) return 100;
  const gravityMultiplier = gravityActive ? 5 / 3 : 1;
  const sandVeil = weather === 'sandstorm' && target.abilityId === 'sand-veil' ? 0.8 : 1;
  if (move.ignoresAccuracyEvasionStages) return Math.min(100, move.accuracy * gravityMultiplier * (user.abilityId === 'compound-eyes' ? 1.3 : 1) * sandVeil);
  const multiplier = (stage: number) => {
    const bounded = Math.max(MIN_STAT_STAGE, Math.min(MAX_STAT_STAGE, stage));
    return bounded >= 0 ? (3 + bounded) / 3 : 3 / (3 - bounded);
  };
  return Math.min(100, move.accuracy * gravityMultiplier * (user.abilityId === 'compound-eyes' ? 1.3 : 1) * multiplier(user.statStages?.accuracy ?? 0) / multiplier(target.statStages?.evasion ?? 0) * sandVeil);
}
