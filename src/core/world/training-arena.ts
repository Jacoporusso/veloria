import type { BattleMoveRegistry, SpeciesBattleRegistry } from '../battle/create-creature.ts';
import type { MoveDefinition } from '../battle/types.ts';
import evolutionReference from '../../../content/battle/evolution-reference.v1.json' with { type: 'json' };

export interface TrainingTier {
  readonly level: number;
  readonly rewardMoney: number;
  readonly teamSize: 3;
}

export const TRAINING_TIERS: readonly TrainingTier[] = [
  { level: 30, rewardMoney: 500, teamSize: 3 },
  { level: 40, rewardMoney: 800, teamSize: 3 },
  { level: 50, rewardMoney: 1200, teamSize: 3 },
  { level: 60, rewardMoney: 1800, teamSize: 3 },
  { level: 70, rewardMoney: 2500, teamSize: 3 },
  { level: 80, rewardMoney: 3200, teamSize: 3 },
];

const TRAINING_SPECIES_POOL = [
  3, 6, 9, 12, 15, 18, 24, 26, 28, 31, 34, 45, 55, 59, 62, 65, 68, 76,
  94, 97, 103, 112, 121, 123, 127, 130, 131, 134, 135, 136, 142, 143, 149,
] as const;
const EXCLUDED_SPECIES = new Set([144, 145, 146, 150, 151]);
type EvolutionEntry = { targetSpeciesId?: number; minimumLevel?: number | null };
type EvolutionReference = { species: Record<string, { evolutions?: EvolutionEntry[] }> };
const INCOMING_EVOLUTIONS = buildIncomingEvolutions(evolutionReference as EvolutionReference);
const MINIMUM_LEVEL_MEMO = new Map<number, number>();
const PENDING_PREFIX = 'training_attempt_pending_';
const PAID_PREFIX = 'training_attempt_paid_';
const MAX_PAID_RECEIPTS = 64;

export interface TrainingTrainer {
  readonly id: string;
  readonly name: string;
  readonly aiProfileId: string;
  readonly battleOnceFlag: string;
  readonly defeatQuestEvent: string;
  readonly rewardMoney: number;
  readonly victoryMessage: string;
  readonly victoryFeedback?: string;
  readonly team: Array<{ speciesId: number; level: number; moveIds: string[] }>;
}

export interface CreateTrainingTrainerArgs {
  readonly level: number;
  readonly rngState: number;
  readonly attemptId: string;
  readonly species: SpeciesBattleRegistry;
  readonly moves: BattleMoveRegistry;
}

export function createTrainingTrainer(args: CreateTrainingTrainerArgs): { trainer: TrainingTrainer; nextRngState: number } {
  validateAttemptId(args.attemptId);
  if (!TRAINING_TIERS.some(tier => tier.level === args.level)) throw new Error('level must match an available training tier.');
  if (!Number.isInteger(args.rngState) || args.rngState < 0 || args.rngState > 0xffffffff) {
    throw new Error('rngState must be an unsigned 32-bit integer.');
  }

  let rng = args.rngState >>> 0;
  const next = (max: number): number => {
    rng ^= rng << 13;
    rng ^= rng >>> 17;
    rng ^= rng << 5;
    rng >>>= 0;
    return max > 0 ? rng % max : 0;
  };
  if (rng === 0) rng = 0x6d2b79f5;

  const candidates = TRAINING_SPECIES_POOL
    .filter(id => !EXCLUDED_SPECIES.has(id))
    .filter(id => getTrainingSpeciesMinimumLevel(id) <= args.level)
    .filter(id => {
      const definition = args.species[String(id)];
      return definition?.speciesId === id && Array.isArray(definition.officialLearnset) &&
        definition.officialLearnset.some(entry => entry.level <= args.level && isSupportedMove(entry.moveId, args.moves));
    });
  if (candidates.length < 3) throw new Error('The supported training species pool must contain at least three eligible species.');
  shuffle(candidates, next);
  const team = candidates.slice(0, 3).map(speciesId => ({
    speciesId,
    level: args.level,
    moveIds: selectLegalMoves(args.species[String(speciesId)]!, args.moves, args.level, next),
  }));

  return {
    trainer: {
      id: `training_arena_${args.attemptId}`,
      name: 'Allenatore dell’Arena',
      aiProfileId: 'gym_final',
      battleOnceFlag: `${PENDING_PREFIX}${args.attemptId}`,
      defeatQuestEvent: '',
      rewardMoney: rewardForLevel(args.level),
      victoryMessage: 'Ottima sfida! Ecco la ricompensa.',
      team,
    },
    nextRngState: rng,
  };
}

export function beginTrainingAttempt(flags: readonly string[], attemptId: string): string[] {
  validateAttemptId(attemptId);
  if (flags.includes(`${PAID_PREFIX}${attemptId}`)) throw new Error('This training attempt was already paid.');
  if (flags.some(flag => flag.startsWith(PENDING_PREFIX))) throw new Error('A training attempt is already pending.');
  return [...flags.filter(flag => !isTrainingReceipt(flag)), `${PENDING_PREFIX}${attemptId}`];
}

export function recoverTrainingAttempts(flags: readonly string[]): string[] {
  return flags.filter(flag => !flag.startsWith(PENDING_PREFIX));
}

export function settleTrainingAttempt(args: {
  readonly flags: readonly string[];
  readonly money: number;
  readonly attemptId: string;
  readonly rewardMoney: number;
  readonly outcome: 'won' | 'lost' | 'draw';
}): { accepted: boolean; flags: string[]; money: number; earnedMoney: number } {
  validateAttemptId(args.attemptId);
  validateSafeNonNegative(args.money, 'money');
  validateSafeNonNegative(args.rewardMoney, 'rewardMoney');
  if (!['won', 'lost', 'draw'].includes(args.outcome)) throw new Error('outcome must be won, lost, or draw.');
  const pending = `${PENDING_PREFIX}${args.attemptId}`;
  if (!args.flags.includes(pending)) return { accepted: false, flags: [...args.flags], money: args.money, earnedMoney: 0 };
  const flags = args.flags.filter(flag => flag !== pending);
  if (args.outcome !== 'won') return { accepted: true, flags, money: args.money, earnedMoney: 0 };

  const nextMoney = args.money + args.rewardMoney;
  if (!Number.isSafeInteger(nextMoney)) throw new Error('Training reward would exceed the safe integer money limit.');
  const paid = [...flags.filter(flag => flag.startsWith(PAID_PREFIX)), `${PAID_PREFIX}${args.attemptId}`];
  const boundedPaid = paid.slice(-MAX_PAID_RECEIPTS);
  const nextFlags = [...flags.filter(flag => !flag.startsWith(PAID_PREFIX)), ...boundedPaid];
  return { accepted: true, flags: nextFlags, money: nextMoney, earnedMoney: args.rewardMoney };
}

function selectLegalMoves(
  species: NonNullable<SpeciesBattleRegistry[string]>,
  moves: BattleMoveRegistry,
  level: number,
  next: (max: number) => number,
): string[] {
  const learned = [...new Set((species.officialLearnset ?? [])
    .filter(entry => entry.level <= level && isSupportedMove(entry.moveId, moves))
    .map(entry => entry.moveId))];
  const damaging = learned.filter(id => isDamaging(moves[id]!));
  if (!learned.length) throw new Error(`Species ${species.speciesId} has no supported moves at level ${level}.`);
  shuffle(learned, next);
  const chosen = learned.slice(0, 4);
  if (damaging.length && !chosen.some(id => isDamaging(moves[id]!))) chosen[chosen.length - 1] = damaging[next(damaging.length)]!;
  return [...new Set(chosen)];
}

function isSupportedMove(id: string, moves: BattleMoveRegistry): boolean {
  const move = moves[id];
  return !!move && move.id === id;
}

function isDamaging(move: MoveDefinition): boolean {
  return move.category !== 'status' && move.power > 0;
}

function shuffle<T>(items: T[], next: (max: number) => number): void {
  for (let index = items.length - 1; index > 0; index--) {
    const swap = next(index + 1);
    [items[index], items[swap]] = [items[swap]!, items[index]!];
  }
}

function rewardForLevel(level: number): number {
  return TRAINING_TIERS.find(tier => tier.level === level)?.rewardMoney ?? 0;
}

/** Earliest obtainable level using the local evolution reference; item/trade edges inherit the parent's minimum. */
export function getTrainingSpeciesMinimumLevel(speciesId: number): number {
  return resolveMinimumLevel(speciesId, new Set());
}

function resolveMinimumLevel(speciesId: number, ancestry: Set<number>): number {
  const cached = MINIMUM_LEVEL_MEMO.get(speciesId);
  if (cached !== undefined) return cached;
  if (ancestry.has(speciesId)) return Number.POSITIVE_INFINITY;
  const parents = INCOMING_EVOLUTIONS.get(speciesId) ?? [];
  if (!parents.length) {
    MINIMUM_LEVEL_MEMO.set(speciesId, 1);
    return 1;
  }
  const nextAncestry = new Set(ancestry);
  nextAncestry.add(speciesId);
  let minimum = Number.POSITIVE_INFINITY;
  for (const edge of parents) {
    const parentLevel = resolveMinimumLevel(edge.parentSpeciesId, nextAncestry);
    if (!Number.isFinite(parentLevel)) continue;
    const edgeLevel = Number.isInteger(edge.minimumLevel) && edge.minimumLevel! > 0 ? edge.minimumLevel! : 1;
    minimum = Math.min(minimum, Math.max(parentLevel, edgeLevel));
  }
  if (!Number.isFinite(minimum)) minimum = 1;
  MINIMUM_LEVEL_MEMO.set(speciesId, minimum);
  return minimum;
}

function buildIncomingEvolutions(reference: EvolutionReference): Map<number, Array<{ parentSpeciesId: number; minimumLevel: number | null }>> {
  const incoming = new Map<number, Array<{ parentSpeciesId: number; minimumLevel: number | null }>>();
  for (const [parentKey, definition] of Object.entries(reference.species ?? {})) {
    const parentSpeciesId = Number(parentKey);
    if (!Number.isInteger(parentSpeciesId) || parentSpeciesId < 1 || !Array.isArray(definition?.evolutions)) continue;
    for (const edge of definition.evolutions) {
      const targetSpeciesId = edge?.targetSpeciesId;
      if (!Number.isInteger(targetSpeciesId) || targetSpeciesId! < 1) continue;
      const minimumLevel = Number.isInteger(edge.minimumLevel) && edge.minimumLevel! > 0 ? edge.minimumLevel! : null;
      const parents = incoming.get(targetSpeciesId!) ?? [];
      parents.push({ parentSpeciesId, minimumLevel });
      incoming.set(targetSpeciesId!, parents);
    }
  }
  return incoming;
}

function validateAttemptId(attemptId: string): void {
  if (typeof attemptId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(attemptId)) {
    throw new Error('attemptId must contain only letters, numbers, underscores, or hyphens.');
  }
}

function validateSafeNonNegative(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${field} must be a non-negative safe integer.`);
}

function isTrainingReceipt(flag: string): boolean {
  return flag.startsWith(PENDING_PREFIX) || flag.startsWith(PAID_PREFIX);
}
