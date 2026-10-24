import type { EncounterMethod, EncounterTable, EncounterTimeBand } from '../encounters/select-encounter.ts';

export interface HabitatMap {
  readonly id: string;
  readonly displayName: string;
  readonly encounterTableIds: readonly string[];
}
export interface SpeciesHabitatArea {
  readonly tableId: string;
  readonly label: string;
  readonly minLevel: number;
  readonly maxLevel: number;
  readonly timeBands: readonly EncounterTimeBand[];
}
export interface SpeciesHabitat {
  readonly areas?: readonly SpeciesHabitatArea[];
  readonly mapId: string;
  readonly mapName: string;
  readonly method: EncounterMethod;
  readonly minLevel: number;
  readonly maxLevel: number;
  readonly timeBands: readonly EncounterTimeBand[];
}
const bands: readonly EncounterTimeBand[] = ['morning', 'day', 'night'];

/** Use only tables explicitly bound to runtime maps; never infer a habitat from an evolution. */
export function findSpeciesHabitats(speciesId: number, maps: readonly HabitatMap[], tables: Readonly<Record<string, EncounterTable>>): SpeciesHabitat[] {
  const results: SpeciesHabitat[] = [];
  for (const map of maps) {
    const methods = new Map<EncounterMethod, { minLevel: number; maxLevel: number; bands: Set<EncounterTimeBand>; areas: SpeciesHabitatArea[] }>();
    for (const tableId of new Set(map.encounterTableIds)) {
      const table = tables[tableId];
      if (!table || table.mapId !== map.id) continue;
      const matches = bands.flatMap(band => table.timeBands[band].filter(entry => entry.speciesId === speciesId && entry.weight > 0).map(entry => ({ band, entry })));
      if (!matches.length) continue;
      const minLevel = Math.min(...matches.map(match => match.entry.minLevel));
      const maxLevel = Math.max(...matches.map(match => match.entry.maxLevel));
      const timeBands = bands.filter(band => matches.some(match => match.band === band));
      const group = methods.get(table.method) ?? { minLevel, maxLevel, bands: new Set<EncounterTimeBand>(), areas: [] };
      group.minLevel = Math.min(group.minLevel, minLevel);
      group.maxLevel = Math.max(group.maxLevel, maxLevel);
      for (const band of timeBands) group.bands.add(band);
      if (table.habitatLabel) group.areas.push({ tableId, label: table.habitatLabel, minLevel, maxLevel, timeBands });
      methods.set(table.method, group);
    }
    for (const [method, group] of methods) results.push({ mapId: map.id, mapName: map.displayName, method,
      minLevel: group.minLevel, maxLevel: group.maxLevel, timeBands: bands.filter(band => group.bands.has(band)),
      ...(group.areas.length ? { areas: group.areas } : {}) });
  }
  return results.sort((a, b) => a.mapId.localeCompare(b.mapId) || a.method.localeCompare(b.method));
}
