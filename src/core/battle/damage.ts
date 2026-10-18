import { effectivenessFor, type BattleRules } from './rules.ts';
import { effectiveStat } from './stat-stages.ts';
import type { BattleCreature, MoveDefinition } from './types.ts';

/** Shared by resolved hits and previews; callers supply variance, never a PRNG. */
export function calculateHitDamage(user: BattleCreature, target: BattleCreature, move: MoveDefinition, rules: BattleRules,
  options: { readonly critical: boolean; readonly variance: number; readonly emergency?: boolean }) {
  if (move.fixedDamage !== undefined) {
    const immune = effectivenessFor(target.types, move.type, rules.typeChart) === 0;
    return { amount: immune ? 0 : move.fixedDamage, effectiveness: immune ? 0 : 1 };
  }
  const physical = move.category === 'physical';
  const burnFactor = physical && user.status?.status === 'burn' ? 0.5 : 1;
  const attack = Math.max(1, Math.floor(effectiveStat(user, physical ? 'attack' : 'specialAttack') * burnFactor));
  const defense = effectiveStat(target, physical ? 'defense' : 'specialDefense');
  const effectiveness = options.emergency ? 1 : effectivenessFor(target.types, move.type, rules.typeChart);
  const stab = !options.emergency && user.types.includes(move.type) ? 1.5 : 1;
  const base = Math.floor((((2 * user.level / 5 + 2) * move.power * attack / defense) / 50) + 2);
  const amount = effectiveness === 0 ? 0 : Math.max(1, Math.floor(base * (options.critical ? rules.criticalMultiplier : 1) * effectiveness * stab * options.variance));
  return { amount, effectiveness };
}

/** Damage on a successful hit, excluding criticals and secondary effects. */
export function estimateMoveDamage(user: BattleCreature, target: BattleCreature, move: MoveDefinition, rules: BattleRules) {
  if (move.category === 'status' || (move.power <= 0 && move.fixedDamage === undefined)) return undefined;
  const minimum = calculateHitDamage(user, target, move, rules, { critical: false, variance: rules.minimumDamageVariance }).amount;
  const maximum = calculateHitDamage(user, target, move, rules, { critical: false, variance: rules.maximumDamageVariance }).amount;
  return { minimum: Math.min(target.hp, minimum * (move.minHits ?? 1)), maximum: Math.min(target.hp, maximum * (move.maxHits ?? 1)) };
}
