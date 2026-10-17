import type { ExperienceCurve } from './rules.ts';

/** XP needed to advance one level under the explicitly provisional growth curve. */
export function experienceToNextLevel(level: number, curve: ExperienceCurve): number {
  if (!Number.isInteger(level) || level < 1 || !Number.isFinite(curve.exponent) || curve.exponent <= 0 ||
      !Number.isFinite(curve.multiplier) || curve.multiplier <= 0) {
    throw new Error('Invalid level or experience curve.');
  }
  return Math.max(1, Math.floor((level + 1) ** curve.exponent * curve.multiplier) - Math.floor(level ** curve.exponent * curve.multiplier));
}
