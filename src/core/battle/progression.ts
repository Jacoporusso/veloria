import type { ExperienceCurve } from './rules.ts';

/** XP needed for the next level. Imported tables are indexed by level minus one. */
export function experienceToNextLevel(level: number, curve: ExperienceCurve): number {
  if (!Number.isInteger(level) || level < 1 || !curve) throw new Error('Invalid level or experience curve.');
  if ('totalExperience' in curve) {
    const current = curve.totalExperience[level - 1], next = curve.totalExperience[level];
    if (!Number.isSafeInteger(current) || current < 0 || !Number.isSafeInteger(next) || next <= current) {
      throw new Error('Invalid level or experience curve.');
    }
    return next - current;
  }
  // Formula curves remain available for explicit synthetic rules and tests.
  if (!Number.isFinite(curve.exponent) || curve.exponent <= 0 ||
      !Number.isFinite(curve.multiplier) || curve.multiplier <= 0) {
    throw new Error('Invalid level or experience curve.');
  }
  return Math.max(1, Math.floor((level + 1) ** curve.exponent * curve.multiplier) - Math.floor(level ** curve.exponent * curve.multiplier));
}
