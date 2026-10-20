export interface ChallengeStage {
  id: string;
  trainerId: string;
  mapId: string;
  spawnId: string;
  attemptWonFlag: string;
  firstRewardFlag: string;
  /** Optional trainer lock owned exclusively by this attempt. */
  battleOnceFlag?: string;
}

export interface ChallengeSequence {
  id: string;
  name: string;
  version: 1;
  requiredFlags: readonly string[];
  requiredBadgeIds: readonly string[];
  activeFlag: string;
  pendingBattleFlag: string;
  completedFlag: string;
  completionEvent: string;
  memberMapIds: readonly string[];
  checkpoint: { mapId: string; spawnId: string };
  servicePolicy: { healing: 'forbidden'; storage: 'forbidden'; battleItems: 'allowed' };
  stages: readonly ChallengeStage[];
}

export interface ChallengeTraveler { flags: readonly string[]; badges: readonly string[] }
export interface ChallengeSequenceState {
  status: 'inactive' | 'ready' | 'active' | 'pending' | 'awaitingCompletion' | 'completed' | 'invalid';
  wonStageIds: string[];
  nextStageId: string | null;
  missingFlags: string[];
  missingBadgeIds: string[];
}
export interface ChallengeSequenceResult {
  flags: string[];
  changed: boolean;
  accepted: boolean;
  reason: 'requirements' | 'noConsciousParty' | 'notReady' | 'wrongStage' | 'notPending' | null;
  state: ChallengeSequenceState;
  nextStageId: string | null;
  event: string | null;
  /** Award trainer money only when present; its permanent receipt is in flags. */
  rewardStageId: string | null;
  checkpoint: { mapId: string; spawnId: string } | null;
}

const id = (value: unknown): value is string => typeof value === 'string' && /^[a-z][a-z0-9]*$/.test(value);
const flag = (value: unknown): value is string => typeof value === 'string' && /^[a-z][a-z0-9_]*$/.test(value);
const reference = (value: unknown): value is string => typeof value === 'string' && /^[a-z][a-z0-9_-]*(?:\/[a-z0-9_-]+)*$/.test(value);
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const attemptFlags = (sequence: ChallengeSequence) => [sequence.activeFlag, sequence.pendingBattleFlag, ...sequence.stages.flatMap(stage => [stage.attemptWonFlag, ...(stage.battleOnceFlag ? [stage.battleOnceFlag] : [])])];

export function validateChallengeSequence(sequence: ChallengeSequence): void {
  if (!sequence || !id(sequence.id) || sequence.version !== 1 || typeof sequence.name !== 'string' || !sequence.name.trim() ||
      !Array.isArray(sequence.stages) || !sequence.stages.length || !Array.isArray(sequence.requiredFlags) ||
      !sequence.requiredFlags.every(flag) || !unique(sequence.requiredFlags) || !Array.isArray(sequence.requiredBadgeIds) ||
      !sequence.requiredBadgeIds.every(flag) || !unique(sequence.requiredBadgeIds) ||
      !Array.isArray(sequence.memberMapIds) || !sequence.memberMapIds.length || !sequence.memberMapIds.every(reference) || !unique(sequence.memberMapIds) ||
      !sequence.checkpoint || !reference(sequence.checkpoint.mapId) || !reference(sequence.checkpoint.spawnId) ||
      sequence.memberMapIds.includes(sequence.checkpoint.mapId) || !reference(sequence.completionEvent) ||
      sequence.servicePolicy?.healing !== 'forbidden' || sequence.servicePolicy?.storage !== 'forbidden' || sequence.servicePolicy?.battleItems !== 'allowed') {
    throw new Error('Invalid challenge sequence definition.');
  }
  for (const stage of sequence.stages) {
    if (!stage || !id(stage.id) || !reference(stage.trainerId) || !reference(stage.mapId) || !reference(stage.spawnId) ||
        !sequence.memberMapIds.includes(stage.mapId) || !flag(stage.attemptWonFlag) || !flag(stage.firstRewardFlag) ||
        stage.battleOnceFlag !== undefined && !flag(stage.battleOnceFlag)) throw new Error('Invalid challenge stage.');
  }
  const ownedFlags = [...attemptFlags(sequence), sequence.completedFlag, ...sequence.stages.map(stage => stage.firstRewardFlag)];
  if (!ownedFlags.every(flag) || !unique(ownedFlags) || sequence.requiredFlags.some(value => ownedFlags.includes(value)) ||
      !unique(sequence.stages.map(stage => stage.id)) || !unique(sequence.stages.map(stage => stage.trainerId))) {
    throw new Error('Duplicate challenge identity or conflicting flags.');
  }
}

export function challengeSequenceState(sequence: ChallengeSequence, traveler: ChallengeTraveler): ChallengeSequenceState {
  validateChallengeSequence(sequence);
  if (!Array.isArray(traveler.flags) || !Array.isArray(traveler.badges) || !traveler.flags.every(nonEmpty) || !traveler.badges.every(nonEmpty) ||
      !unique(traveler.flags) || !unique(traveler.badges)) throw new Error('Invalid challenge traveler flags or badges.');
  const missingFlags = sequence.requiredFlags.filter(value => !traveler.flags.includes(value));
  const missingBadgeIds = sequence.requiredBadgeIds.filter(value => !traveler.badges.includes(value));
  const won = sequence.stages.map(stage => traveler.flags.includes(stage.attemptWonFlag));
  const firstUnwon = won.indexOf(false);
  const count = firstUnwon === -1 ? won.length : firstUnwon;
  const pending = traveler.flags.includes(sequence.pendingBattleFlag), active = traveler.flags.includes(sequence.activeFlag);
  const completed = traveler.flags.includes(sequence.completedFlag);
  const incoherent = won.slice(count).some(Boolean) || pending && (!active || count === won.length) ||
    !active && won.some(Boolean) || active && (missingFlags.length > 0 || missingBadgeIds.length > 0) ||
    sequence.stages.some((stage, index) => won[index] && !traveler.flags.includes(stage.firstRewardFlag)) ||
    sequence.stages.some((stage, index) => stage.battleOnceFlag && traveler.flags.includes(stage.battleOnceFlag) !== won[index]);
  const status: ChallengeSequenceState['status'] = completed ? 'completed' : incoherent ? 'invalid' : active
    ? count === won.length ? 'awaitingCompletion' : pending ? 'pending' : 'active'
    : missingFlags.length || missingBadgeIds.length ? 'inactive' : 'ready';
  return { status, wonStageIds: sequence.stages.filter((_, index) => won[index]).map(stage => stage.id), nextStageId: ['active','pending'].includes(status) ? sequence.stages[count].id : null, missingFlags, missingBadgeIds };
}

function result(sequence: ChallengeSequence, traveler: ChallengeTraveler, flags: string[], accepted: boolean, reason: ChallengeSequenceResult['reason'] = null, extra: Partial<Pick<ChallengeSequenceResult, 'event' | 'rewardStageId' | 'checkpoint'>> = {}): ChallengeSequenceResult {
  const state = challengeSequenceState(sequence, { ...traveler, flags });
  return { flags, changed: flags.length !== traveler.flags.length || flags.some((value, index) => value !== traveler.flags[index]), accepted, reason,
    state, nextStageId: state.nextStageId, event: null, rewardStageId: null, checkpoint: null, ...extra };
}

export function startChallengeSequence(sequence: ChallengeSequence, traveler: ChallengeTraveler, hasConsciousParty: boolean): ChallengeSequenceResult {
  const state = challengeSequenceState(sequence, traveler);
  if (state.missingFlags.length || state.missingBadgeIds.length) return result(sequence, traveler, [...traveler.flags], false, 'requirements');
  if (state.status !== 'ready') return result(sequence, traveler, [...traveler.flags], false, 'notReady');
  if (!hasConsciousParty) return result(sequence, traveler, [...traveler.flags], false, 'noConsciousParty');
  return result(sequence, traveler, [...traveler.flags, sequence.activeFlag], true);
}

export function prepareChallengeBattle(sequence: ChallengeSequence, traveler: ChallengeTraveler, stageId: string): ChallengeSequenceResult {
  const state = challengeSequenceState(sequence, traveler);
  if (state.status !== 'active') return result(sequence, traveler, [...traveler.flags], false, 'notReady');
  if (state.nextStageId !== stageId) return result(sequence, traveler, [...traveler.flags], false, 'wrongStage');
  return result(sequence, traveler, [...traveler.flags, sequence.pendingBattleFlag], true);
}

/** Never rolls back party, money, inventory or permanent reward receipts. */
export function abortChallengeSequence(sequence: ChallengeSequence, traveler: ChallengeTraveler): ChallengeSequenceResult {
  const state = challengeSequenceState(sequence, traveler);
  const temporary = new Set(attemptFlags(sequence));
  const flags = traveler.flags.filter(value => !temporary.has(value));
  const hadTemporaryFlags = traveler.flags.some(value => temporary.has(value));
  const hadAttempt = state.status !== 'completed' && hadTemporaryFlags;
  return result(sequence, traveler, flags, hadTemporaryFlags, null, { checkpoint: hadAttempt ? { ...sequence.checkpoint } : null });
}

export function settleChallengeBattle(sequence: ChallengeSequence, traveler: ChallengeTraveler, stageId: string, outcome: 'won' | 'lost' | 'draw'): ChallengeSequenceResult {
  const state = challengeSequenceState(sequence, traveler);
  if (!['won','lost','draw'].includes(outcome)) throw new Error('Invalid challenge battle outcome.');
  if (state.status !== 'pending') return result(sequence, traveler, [...traveler.flags], false, 'notPending');
  if (state.nextStageId !== stageId) return result(sequence, traveler, [...traveler.flags], false, 'wrongStage');
  if (outcome !== 'won') return abortChallengeSequence(sequence, traveler);
  const stage = sequence.stages.find(candidate => candidate.id === stageId)!;
  const firstReward = !traveler.flags.includes(stage.firstRewardFlag);
  const flags = [...traveler.flags.filter(value => value !== sequence.pendingBattleFlag), stage.attemptWonFlag,
    ...(stage.battleOnceFlag ? [stage.battleOnceFlag] : []), ...(firstReward ? [stage.firstRewardFlag] : [])];
  const last = stage === sequence.stages.at(-1);
  return result(sequence, traveler, flags, true, null, { rewardStageId: firstReward ? stage.id : null, event: last ? sequence.completionEvent : null });
}

/** Resume between stages; interrupt pending, malformed or incompletely settled runs. */
export function recoverChallengeSequence(sequence: ChallengeSequence, traveler: ChallengeTraveler): ChallengeSequenceResult {
  const state = challengeSequenceState(sequence, traveler);
  if (['pending','invalid','awaitingCompletion','completed'].includes(state.status)) return abortChallengeSequence(sequence, traveler);
  return result(sequence, traveler, [...traveler.flags], true);
}

export function challengeServiceAllowed(sequence: ChallengeSequence, traveler: ChallengeTraveler, service: 'healing' | 'storage' | 'battleItems'): boolean {
  if (!['healing','storage','battleItems'].includes(service)) throw new Error('Unknown challenge service.');
  const state = challengeSequenceState(sequence, traveler);
  if (service === 'battleItems') return true;
  return !['active','pending','awaitingCompletion','invalid'].includes(state.status);
}
