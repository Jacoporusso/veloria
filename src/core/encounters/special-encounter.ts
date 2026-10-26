export interface SpecialEncounter {
  readonly id: string;
  readonly mapId: string;
  readonly speciesId: number;
  readonly level: number;
  readonly requiredFlag: string;
  readonly capturedFlag: string;
  readonly captureEvent: string;
  readonly description: string;
  readonly unlockHint: string;
}

/** Knockout or escape never consumes a special encounter. Only capture settles it. */
export function specialEncounterAvailability(encounter: SpecialEncounter, mapId: string,
  flags: readonly string[], hasReadyCompanion: boolean): 'available' | 'wrongMap' | 'locked' | 'caught' | 'exhausted' {
  if (encounter.mapId !== mapId) return 'wrongMap';
  if (flags.includes(encounter.capturedFlag)) return 'caught';
  if (!flags.includes(encounter.requiredFlag)) return 'locked';
  if (!hasReadyCompanion) return 'exhausted';
  return 'available';
}
