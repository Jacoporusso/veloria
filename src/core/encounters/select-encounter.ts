export type EncounterTimeBand = 'morning' | 'day' | 'night';
export type EncounterMethod = 'tall-grass' | 'cave' | 'surf' | 'fishing' | 'special' | 'woodland-understory';

export interface EncounterEntry {
  readonly speciesId: number;
  readonly weight: number;
  readonly minLevel: number;
  readonly maxLevel: number;
}

export interface EncounterTable {
  readonly id: string;
  readonly mapId: string;
  readonly version: number;
  readonly status: 'prototype';
  readonly method: EncounterMethod;
  readonly habitatLabel?: string;
  readonly timeBands: Readonly<Record<EncounterTimeBand, readonly EncounterEntry[]>>;
}

export interface EncounterSpeciesRegistry {
  readonly [speciesKey: string]: { readonly speciesId: number } | undefined;
}

export interface SelectEncounterOptions {
  /** The persisted `GameSave.rngState`, copied into this pure operation. */
  readonly rngState: number;
  /** Device-local hour in 24-hour form; seconds and minutes do not change the band. */
  readonly localHour: number;
  readonly table: EncounterTable;
  readonly species: EncounterSpeciesRegistry;
}

export interface SelectedEncounter {
  readonly tableId: string;
  readonly band: EncounterTimeBand;
  readonly speciesId: number;
  readonly level: number;
  /** Pass this back to the save so consecutive encounters do not repeat the same draw. */
  readonly nextRngState: number;
}

interface RandomCursor { state: number }

/** Local hour ranges from the game design: morning 05–10, day 11–19, night 20–04. */
export function encounterTimeBand(localHour: number): EncounterTimeBand {
  if (!Number.isInteger(localHour) || localHour < 0 || localHour > 23) {
    throw new Error('localHour must be an integer from 0 to 23.');
  }
  if (localHour >= 5 && localHour < 11) return 'morning';
  if (localHour >= 11 && localHour < 20) return 'day';
  return 'night';
}

/**
 * Selects one eligible entry by integer weight, then rolls its inclusive level range.
 * Xorshift32 and zero-seed normalization match the battle core; no input is mutated.
 */
export function selectWildEncounter(options: SelectEncounterOptions): SelectedEncounter {
  validateTable(options.table, options.species);
  const band = encounterTimeBand(options.localHour);
  const entries = options.table.timeBands[band];
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (!Number.isSafeInteger(totalWeight) || totalWeight < 1) throw new Error(`Encounter table ${options.table.id} has invalid total weight.`);

  const cursor: RandomCursor = { state: normalizeSeed(options.rngState) };
  const weightedRoll = integerBetween(cursor, 1, totalWeight);
  let cumulativeWeight = 0;
  let selected = entries[entries.length - 1];
  for (const entry of entries) {
    cumulativeWeight += entry.weight;
    if (weightedRoll <= cumulativeWeight) {
      selected = entry;
      break;
    }
  }
  const level = integerBetween(cursor, selected.minLevel, selected.maxLevel);
  return {
    tableId: options.table.id,
    band,
    speciesId: selected.speciesId,
    level,
    nextRngState: cursor.state,
  };
}

/** Throws on malformed tables, missing species, or invalid level/weight ranges. */
export function validateTable(table: EncounterTable, species: EncounterSpeciesRegistry): void {
  if (!table.id.trim() || !table.mapId.trim() || !Number.isInteger(table.version) || table.version < 1) {
    throw new Error('Encounter table needs a stable ID, map ID, and positive integer version.');
  }
  if (table.habitatLabel !== undefined && (typeof table.habitatLabel !== 'string' || !table.habitatLabel.trim() || table.habitatLabel.length > 120)) throw new Error(`Encounter table ${table.id} has an invalid habitat label.`);
  if (table.status !== 'prototype') throw new Error(`Encounter table ${table.id} must declare prototype status until its balance is approved.`);
  if (!['tall-grass', 'cave', 'surf', 'fishing', 'special', 'woodland-understory'].includes(table.method)) {
    throw new Error(`Encounter table ${table.id} has an unsupported method.`);
  }
  for (const band of ['morning', 'day', 'night'] as const) {
    const entries = table.timeBands?.[band];
    if (!Array.isArray(entries) || entries.length === 0) throw new Error(`Encounter band ${band} must contain at least one entry.`);
    for (const entry of entries) {
      if (!Number.isInteger(entry.speciesId) || entry.speciesId < 1) throw new Error(`Encounter band ${band} contains an invalid species ID.`);
      const registered = species[String(entry.speciesId)];
      if (!registered || registered.speciesId !== entry.speciesId) throw new Error(`Encounter species ${entry.speciesId} is missing or mismatched in the species registry.`);
      if (!Number.isSafeInteger(entry.weight) || entry.weight < 1) throw new Error(`Encounter species ${entry.speciesId} needs a positive integer weight.`);
      if (!Number.isInteger(entry.minLevel) || !Number.isInteger(entry.maxLevel) || entry.minLevel < 1 || entry.maxLevel > 100 || entry.minLevel > entry.maxLevel) {
        throw new Error(`Encounter species ${entry.speciesId} has an invalid level interval.`);
      }
    }
  }
}

function normalizeSeed(seed: number): number {
  if (!Number.isSafeInteger(seed) || seed < 0) throw new Error('rngState must be a non-negative safe integer.');
  return (seed >>> 0) || 0x6d2b79f5;
}

function random(cursor: RandomCursor): number {
  let value = cursor.state >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  cursor.state = value >>> 0;
  return cursor.state / 0x1_0000_0000;
}

function integerBetween(cursor: RandomCursor, min: number, max: number): number {
  return min + Math.floor(random(cursor) * (max - min + 1));
}
