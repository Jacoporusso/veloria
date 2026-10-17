export interface EncounterCheckResult {
  readonly encounter: boolean;
  /** Persist this value as the next GameSave.rngState. */
  readonly nextRngState: number;
}

/** Makes one deterministic encounter roll using the save's xorshift32 state. */
export function rollEncounterCheck(rngState: number, chance: number): EncounterCheckResult {
  if (!Number.isSafeInteger(rngState) || rngState < 0) {
    throw new Error('rngState must be a non-negative safe integer.');
  }
  if (!Number.isFinite(chance) || chance < 0 || chance > 1) {
    throw new Error('chance must be a finite number from 0 to 1.');
  }

  let state = (rngState >>> 0) || 0x6d2b79f5;
  let value = state;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  state = value >>> 0;
  const roll = state / 0x1_0000_0000;

  return { encounter: roll < chance, nextRngState: state };
}
