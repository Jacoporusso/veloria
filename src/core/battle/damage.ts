import { effectivenessFor, type BattleRules } from './rules.ts';
import { effectiveStat } from './stat-stages.ts';
import { resolveMovePower, type MovePowerContext } from './move-power.ts';
import type { BattleCreature, BattleWeather, MoveDefinition } from './types.ts';

export function abilityPreventsTypeDamage(target: BattleCreature, moveType: MoveDefinition['type'], gravityActive = false): boolean {
  return (((target.abilityId === 'levitate' || (target.magnetRiseTurnsRemaining ?? 0) > 0) && !gravityActive) && moveType === 'ground' && !target.ingrainActive) ||
    (target.abilityId === 'flash-fire' && moveType === 'fire') ||
    (target.abilityId === 'volt-absorb' && moveType === 'electric') ||
    (target.abilityId === 'water-absorb' && moveType === 'water');
}

export function abilityPreventsMove(target: BattleCreature, move: MoveDefinition, gravityActive = false): boolean {
  return abilityPreventsTypeDamage(target, move.type, gravityActive) || (target.abilityId === 'soundproof' && move.soundMove === true);
}

export function battleEffectiveness(target: BattleCreature, move: MoveDefinition, rules: BattleRules, gravityActive = false): number {
  if (move.typelessDamage) return 1;
  if (abilityPreventsMove(target, move, gravityActive)) return 0;
  const roostedTypes = target.roostedThisTurn ? target.types.filter(type => type !== 'flying') : target.types;
  const effectiveTypes = target.roostedThisTurn && target.types.length === 1 && target.types[0] === 'flying' ? ['normal' as const] : roostedTypes;
  const exposedTypes = effectiveTypes.filter(type => !(target.ingrainActive && move.type === 'ground' && type === 'flying') &&
    !(gravityActive && move.type === 'ground' && type === 'flying') &&
    !(target.foresightActive && type === 'ghost' && ['normal', 'fighting'].includes(move.type)) &&
    !(target.miracleEyeActive && type === 'dark' && move.type === 'psychic'));
  const chart = effectivenessFor(exposedTypes, move.type, rules.typeChart);
  return target.abilityId === 'thick-fat' && (move.type === 'fire' || move.type === 'ice') ? chart * 0.5 : chart;
}

/** Shared by resolved hits and previews; callers supply variance, never a PRNG. */
export function calculateHitDamage(user: BattleCreature, target: BattleCreature, move: MoveDefinition, rules: BattleRules,
  options: { readonly critical: boolean; readonly variance: number; readonly emergency?: boolean; readonly weather?: BattleWeather; readonly screenMultiplier?: number; readonly fieldPowerMultiplier?: number; readonly gravityActive?: boolean }) {
  if (move.fixedDamage !== undefined || move.damageByUserLevel || move.targetHpFraction !== undefined || move.endeavorDamage || move.oneHitKO) {
    const immune = battleEffectiveness(target, move, rules, options.gravityActive) === 0;
    const fixed = move.fixedDamage ?? (move.damageByUserLevel ? user.level
      : move.targetHpFraction !== undefined ? Math.max(1, Math.floor(target.hp * move.targetHpFraction))
        : move.endeavorDamage ? Math.max(0, target.hp - user.hp)
          : move.oneHitKO ? target.hp : 0);
    return { amount: immune ? 0 : fixed, effectiveness: immune ? 0 : 1 };
  }
  const physical = move.category === 'physical';
  const guts = physical && user.abilityId === 'guts' && user.status !== undefined;
  const burnFactor = physical && user.status?.status === 'burn' && !guts ? 0.5 : 1;
  const abilityPower = (user.flashFireActive && move.type === 'fire' ? 1.5 : 1) *
    ((user.hp * 3 <= user.stats.maxHp) && ((user.abilityId === 'blaze' && move.type === 'fire') || (user.abilityId === 'overgrow' && move.type === 'grass') || (user.abilityId === 'torrent' && move.type === 'water') || (user.abilityId === 'swarm' && move.type === 'bug')) ? 1.5 : 1);
  const attack = Math.max(1, Math.floor(effectiveStat(user, physical ? 'attack' : 'specialAttack') * burnFactor * (guts ? 1.5 : 1)));
  const rockSandstormBonus = !physical && options.weather === 'sandstorm' && target.types.includes('rock') ? 1.5 : 1;
  const defense = Math.max(1, Math.floor(effectiveStat(target, physical ? 'defense' : 'specialDefense') * rockSandstormBonus * (move.damageDefenseMultiplier ?? 1)));
  const effectiveness = options.emergency ? 1 : battleEffectiveness(target, move, rules, options.gravityActive);
  const stab = !options.emergency && !move.typelessDamage && user.types.includes(move.type) ? 1.5 : 1;
  const base = Math.floor((((2 * user.level / 5 + 2) * move.power * attack / defense) / 50) + 2);
  const weatherModifier = (options.weather === 'rain' && move.type === 'water') || (options.weather === 'sun' && move.type === 'fire') ? 1.5
    : (options.weather === 'rain' && move.type === 'fire') || (options.weather === 'sun' && move.type === 'water') ||
      (move.weatherHalvesPower && options.weather !== undefined && options.weather !== 'sun') ? 0.5 : 1;
  const screenMultiplier = options.critical ? 1 : (options.screenMultiplier ?? 1);
  const amount = effectiveness === 0 ? 0 : Math.max(1, Math.floor(base * abilityPower * weatherModifier * (options.fieldPowerMultiplier ?? 1) * screenMultiplier * (options.critical ? rules.criticalMultiplier : 1) * effectiveness * stab * options.variance));
  return { amount, effectiveness };
}

/** Damage on a successful hit, excluding criticals and secondary effects. */
export function estimateMoveDamage(user: BattleCreature, target: BattleCreature, move: MoveDefinition, rules: BattleRules,
  context: MovePowerContext & { readonly screenMultiplier?: number; readonly fieldPowerMultiplier?: number; readonly gravityActive?: boolean } = {}) {
  const dynamicPower = move.powerRule ? resolveMovePower(move.powerRule, move.power, user, target, { ...context, doubleRollout: context.doubleRollout ?? move.doublesRolloutAfterDefenseCurl, moveId: context.moveId ?? move.id }) : undefined;
  if (move.powerRule && dynamicPower === undefined) return undefined;
  if (move.powerRule === 'lowKick' && target.weightKg === undefined) return undefined;
  const power = move.powerRule ? dynamicPower! : move.stockpileConsumes ? (user.stockpileCount ?? 0) * 100 : move.power;
  if (move.category === 'status' || (power <= 0 && move.fixedDamage === undefined && !move.damageByUserLevel && move.targetHpFraction === undefined && !move.endeavorDamage && !move.oneHitKO)) return undefined;
  const damageMove = power === move.power ? move : { ...move, power };
  const varianceMin = move.ignoresDamageVariance ? 1 : rules.minimumDamageVariance;
  const varianceMax = move.ignoresDamageVariance ? 1 : rules.maximumDamageVariance;
  const minimum = calculateHitDamage(user, target, damageMove, rules, { ...context, critical: false, variance: varianceMin }).amount;
  const maximum = calculateHitDamage(user, target, damageMove, rules, { ...context, critical: false, variance: varianceMax }).amount;
  return { minimum: Math.min(target.hp, minimum * (move.minHits ?? 1)), maximum: Math.min(target.hp, maximum * (move.maxHits ?? 1)) };
}
