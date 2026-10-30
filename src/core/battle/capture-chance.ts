import type { CaptureItemRule } from './rules.ts';
import type { BattleCreature } from './types.ts';

/** Veloria's accessible model, not a reproduction of a main-series formula.
 * The cube root keeps sourced rarity meaningful without requiring dozens of
 * throws at a weakened, status-affected rare Pokémon. One turn consumes one roll.
 */
export function captureChance(target: Pick<BattleCreature, 'hp' | 'stats' | 'status' | 'captureRate'>, item: CaptureItemRule): number {
  const rate = target.captureRate ?? 255;
  if (!Number.isInteger(rate) || rate < 1 || rate > 255) throw new Error('Invalid species capture rate.');
  // An explicitly guaranteed capture item remains guaranteed for every species.
  if (item.baseChance >= 1) return 1;
  const missingHp = Math.max(0, Math.min(1, 1 - target.hp / target.stats.maxHp));
  const preparation = Math.max(0, Math.min(1, item.baseChance
    + (item.missingHpBonus ?? 0) * missingHp
    + (target.status ? item.statusBonus ?? 0 : 0)));
  return preparation * Math.cbrt(rate / 255);
}
