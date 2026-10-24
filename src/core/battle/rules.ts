import type { BattleBaseStats, BattleType, MajorStatus } from './types.ts';

export type TypeChart = Readonly<Partial<Record<BattleType, Partial<Record<BattleType, number>>>>>;

export interface BattleItemRule {
  readonly healHp?: number;
  readonly cures?: readonly MajorStatus[];
}

export interface CaptureItemRule {
  /** Probability when the wild creature has full HP and no major status, from 0 to 1. */
  readonly baseChance: number;
  /** Added probability scaled by the fraction of HP missing. */
  readonly missingHpBonus?: number;
  /** Added probability if the target has any major status. */
  readonly statusBonus?: number;
}

export type ExperienceCurve =
  | { readonly totalExperience: readonly number[] }
  | { readonly exponent: number; readonly multiplier: number };

export interface EvolutionTarget {
  readonly speciesId: number;
  readonly name: string;
  readonly types: readonly BattleType[];
  readonly baseStats: BattleBaseStats;
  readonly experienceYield: number;
  readonly growthCurveId?: string;
}

export interface EvolutionRule {
  readonly target: EvolutionTarget;
  readonly minimumLevel: number;
}

/** Rules which may change between releases live in one explicit, versioned object. */
export interface BattleRules {
  readonly id: string;
  readonly maxPartySize: number;
  readonly maxMoves: number;
  readonly maxLevel: number;
  readonly typeChart: TypeChart;
  readonly emergencyMove: { readonly power: number; readonly recoilFraction: number };
  readonly criticalChance: number;
  readonly criticalMultiplier: number;
  readonly minimumDamageVariance: number;
  readonly maximumDamageVariance: number;
  readonly paralysisActionChance: number;
  readonly sleepTurns: readonly [number, number];
  readonly freezeTurns: readonly [number, number];
  readonly freezeThawChance: number;
  readonly burnResidualFraction: number;
  readonly poisonResidualFraction: number;
  readonly statusImmunities: Readonly<Partial<Record<BattleType, readonly MajorStatus[]>>>;
  readonly fleeBaseChance: number;
  readonly items: Readonly<Record<string, BattleItemRule>>;
  readonly captureItems: Readonly<Record<string, CaptureItemRule>>;
  readonly experienceCurves: Readonly<Record<string, ExperienceCurve>>;
  readonly experienceRewards: { readonly levelDivisor: number; readonly trainerMultiplier: number };
  readonly levelUpMoves: Readonly<Record<number, readonly { readonly level: number; readonly moveId: string; readonly maxPp: number }[]>>;
  readonly evolutions: Readonly<Record<number, readonly EvolutionRule[]>>;
}

/**
 * Minimal prototype values for the battle simulator. The ruleset ID is persisted in each
 * battle snapshot so values can be changed deliberately and replayed against the old rules.
 * The type chart is intentionally injected as versioned content; the project docs have not
 * yet approved a canonical chart/split for the full game.
 */
export const prototypeBattleRules: BattleRules = {
  id: 'veloria-battle-prototype-v14',
  maxPartySize: 6,
  maxMoves: 4,
  maxLevel: 100,
  typeChart: {},
  emergencyMove: { power: 50, recoilFraction: 1 / 4 },
  criticalChance: 1 / 24,
  criticalMultiplier: 1.5,
  minimumDamageVariance: 0.85,
  maximumDamageVariance: 1,
  paralysisActionChance: 0.25,
  sleepTurns: [1, 3],
  freezeTurns: [1, 4],
  freezeThawChance: 0.2,
  burnResidualFraction: 1 / 16,
  poisonResidualFraction: 1 / 8,
  statusImmunities: { fire: ['burn'], ice: ['freeze'], poison: ['poison'], steel: ['poison'] },
  fleeBaseChance: 0.5,
  items: {},
  captureItems: {},
  experienceCurves: { veloria_medium_fast_v1: { exponent: 3, multiplier: 1 } },
  experienceRewards: { levelDivisor: 7, trainerMultiplier: 1.5 },
  levelUpMoves: {},
  evolutions: {},
};

/** Classic level-scaled base reward; recipient sharing and held-item bonuses are separate rules. */
export function experienceForDefeat(baseYield: number, level: number, trainer: boolean, rules: BattleRules['experienceRewards']): number {
  if (!Number.isFinite(baseYield) || baseYield < 0 || !Number.isInteger(level) || level < 1 ||
      !Number.isFinite(rules.levelDivisor) || rules.levelDivisor <= 0 ||
      !Number.isFinite(rules.trainerMultiplier) || rules.trainerMultiplier <= 0) throw new Error('Invalid experience reward parameters.');
  if (baseYield === 0) return 0;
  const base = Math.max(1, Math.floor(baseYield * level / rules.levelDivisor));
  return Math.max(1, Math.floor(base * (trainer ? rules.trainerMultiplier : 1)));
}

export function effectivenessFor(types: readonly BattleType[], moveType: BattleType, chart: TypeChart): number {
  return types.reduce((effectiveness, defenderType) =>
    effectiveness * (chart[moveType]?.[defenderType] ?? 1), 1);
}
