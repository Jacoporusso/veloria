import type { BattleState } from '../../core/battle/types.ts';

/** Capturing the wild opponent is also a successful battle settlement. */
export function payDayReward(state: Pick<BattleState, 'outcome' | 'payDayBonus'>): number {
  const won = state.outcome.kind === 'captured' || state.outcome.kind === 'won' && state.outcome.winner === 'player';
  if (!won) return 0;
  const bonus = state.payDayBonus ?? 0;
  if (!Number.isSafeInteger(bonus) || bonus < 0) throw new Error('Invalid Pay Day reward.');
  return bonus;
}
