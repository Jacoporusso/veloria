import { rollEncounterCheck } from './roll-encounter-check.ts';
import { selectWildEncounter, validateTable } from './select-encounter.ts';
import type { EncounterSpeciesRegistry, EncounterTable, SelectedEncounter } from './select-encounter.ts';

export interface FishingSpot {
  readonly id: string;
  readonly mapId: string;
  readonly encounterTableId: string;
  readonly requiredItemId: string;
  readonly requiredFlags?: readonly string[];
  readonly biteChance: number;
}

export interface CastFishingLineOptions {
  readonly spot: FishingSpot;
  readonly mapId: string;
  readonly inventory: Readonly<Record<string, number>>;
  readonly flags: readonly string[];
  readonly hasReadyCreature: boolean;
  readonly rngState: number;
  readonly localHour: number;
  readonly table: EncounterTable;
  readonly species: EncounterSpeciesRegistry;
}

export type FishingResult =
  | { readonly kind: 'blocked'; readonly reason: 'wrong-map' | 'missing-equipment' | 'locked' | 'exhausted'; readonly nextRngState: number }
  | { readonly kind: 'no-bite'; readonly nextRngState: number }
  | { readonly kind: 'encounter'; readonly encounter: SelectedEncounter; readonly nextRngState: number };

/** Resolves a fishing action without mutating save data or consuming equipment. */
export function castFishingLine(options: CastFishingLineOptions): FishingResult {
  const { spot, table, species } = options;
  if (![spot.id, spot.mapId, spot.encounterTableId, spot.requiredItemId].every((value) => typeof value === 'string' && value.trim().length > 0)) {
    throw new Error('Fishing spot needs non-empty IDs for its spot, map, encounter table, and required item.');
  }
  if (!Number.isFinite(spot.biteChance) || spot.biteChance < 0 || spot.biteChance > 1) {
    throw new Error('Fishing spot biteChance must be a finite number from 0 to 1.');
  }
  if (spot.requiredFlags !== undefined && (!Array.isArray(spot.requiredFlags) ||
      spot.requiredFlags.some(flag => typeof flag !== 'string' || !flag.trim()))) {
    throw new Error('Fishing spot requiredFlags must contain non-empty flags.');
  }
  if (table.id !== spot.encounterTableId || table.mapId !== spot.mapId) {
    throw new Error('Fishing spot encounter table identity or map does not match the configured table.');
  }
  if (table.method !== 'fishing') throw new Error(`Encounter table ${table.id} must use the fishing method.`);
  validateTable(table, species);

  const blocked = (reason: Extract<FishingResult, { kind: 'blocked' }>['reason']): FishingResult => ({
    kind: 'blocked', reason, nextRngState: options.rngState,
  });
  if (options.mapId !== spot.mapId) return blocked('wrong-map');
  if (!(options.inventory[spot.requiredItemId] > 0)) return blocked('missing-equipment');
  if (spot.requiredFlags?.some((flag) => !options.flags.includes(flag))) return blocked('locked');
  if (!options.hasReadyCreature) return blocked('exhausted');

  const check = rollEncounterCheck(options.rngState, spot.biteChance);
  if (!check.encounter) return { kind: 'no-bite', nextRngState: check.nextRngState };
  const encounter = selectWildEncounter({ rngState: check.nextRngState, localHour: options.localHour, table, species });
  return { kind: 'encounter', encounter, nextRngState: encounter.nextRngState };
}
