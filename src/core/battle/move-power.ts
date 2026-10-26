import { effectiveStat } from './stat-stages.ts';
import type { BattleCreature, BattleWeather, MovePowerRule } from './types.ts';

export interface MovePowerContext {
  readonly targetWasDamaged?: boolean;
  readonly userWasDamaged?: boolean;
  readonly targetAlreadyActed?: boolean;
  readonly doubleRollout?: boolean;
  readonly moveId?: string;
  readonly userTailwind?: boolean;
  readonly targetTailwind?: boolean;
  readonly weather?: BattleWeather;
}

/** Resolves source-defined dynamic base power. Returns undefined when the requested forecast context is unknown. */
export function resolveMovePower(
  rule: MovePowerRule,
  basePower: number,
  user: BattleCreature,
  target: BattleCreature,
  context: MovePowerContext = {},
): number | undefined {
  switch (rule) {
    case 'brine': return target.hp * 2 <= target.stats.maxHp ? 2 * basePower : basePower;
    case 'targetDamaged': return context.targetWasDamaged === undefined ? undefined : context.targetWasDamaged ? 2 * basePower : basePower;
    case 'userDamaged': return context.userWasDamaged === undefined ? undefined : context.userWasDamaged ? 2 * basePower : basePower;
    case 'targetActed': return context.targetAlreadyActed === undefined ? undefined : context.targetAlreadyActed ? 2 * basePower : basePower;
    case 'targetAsleep': return target.status?.status === 'sleep' ? 2 * basePower : basePower;
    case 'lowHp': {
      const ratio = Math.floor(user.hp * 64 / user.stats.maxHp);
      return ratio < 2 ? 200 : ratio < 6 ? 150 : ratio < 13 ? 100 : ratio < 22 ? 80 : ratio < 43 ? 40 : 20;
    }
    case 'gyroBall': {
      if (context.userTailwind === undefined || context.targetTailwind === undefined) return undefined;
      return Math.min(150, Math.floor(25 * effectiveSpeed(target, context.targetTailwind, context.weather) / effectiveSpeed(user, context.userTailwind, context.weather)) + 1);
    }
    case 'wringOut': return Math.max(1, Math.floor(120 * target.hp / target.stats.maxHp) + 1);
    case 'lowKick': {
      const weight = target.weightKg ?? 0;
      return weight < 10 ? 20 : weight < 25 ? 40 : weight < 50 ? 60 : weight < 100 ? 80 : weight < 200 ? 100 : 120;
    }
    case 'punishment': {
      const positiveStages = Object.values(target.statStages ?? {}).reduce((sum, stage) => sum + Math.max(0, stage ?? 0), 0);
      return Math.min(200, 60 + 20 * positiveStages);
    }
    case 'furyCutter': return basePower * 2 ** Math.min(4, Math.max(0, (user.consecutiveMoveUses ?? 1) - 1));
    case 'rollout': return basePower * 2 ** Math.min(4, Math.max(0, (user.consecutiveMoveUses ?? 1) - 1)) * ((context.doubleRollout ?? false) && user.defenseCurlUsed ? 2 : 1);
    case 'trumpCard': {
      const current = user.moves.find(slot => slot.moveId === context.moveId)?.pp;
      if (current === undefined) return undefined;
      const remainingPp = Math.max(0, current - 1);
      return remainingPp >= 4 ? 40 : remainingPp === 3 ? 50 : remainingPp === 2 ? 60 : remainingPp === 1 ? 80 : 200;
    }
    case 'stockpile': return (user.stockpileCount ?? 0) * 100;
  }
}

function effectiveSpeed(creature: BattleCreature, tailwind: boolean, weather?: BattleWeather): number {
  const speed = creature.status?.status === 'paralysis' ? Math.floor(effectiveStat(creature, 'speed') / 4) : effectiveStat(creature, 'speed');
  const weatherBoost = (weather === 'sun' && creature.abilityId === 'chlorophyll') || (weather === 'rain' && creature.abilityId === 'swift-swim');
  return Math.max(1, Math.floor(speed * (tailwind ? 2 : 1) * (weatherBoost ? 2 : 1)));
}
