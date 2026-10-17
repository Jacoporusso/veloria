import type { BattleCreature, BattleStat } from './types.ts';

export const BATTLE_STATS: readonly BattleStat[] = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
export const MIN_STAT_STAGE = -6;
export const MAX_STAT_STAGE = 6;

/** Prototype-v2 stages modify derived battle values, leaving species stats intact. */
export function effectiveStat(creature: BattleCreature, stat: BattleStat): number {
  const stage = creature.statStages?.[stat] ?? 0;
  const multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
  return Math.max(1, Math.floor(creature.stats[stat] * multiplier));
}
