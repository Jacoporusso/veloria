import type { EncounterMethod, EncounterTable, EncounterTimeBand } from '../encounters/select-encounter.ts';

export interface HabitatMap {
  readonly id: string;
  readonly displayName: string;
  readonly encounterTableIds: readonly string[];
}
export interface SpeciesHabitat {
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
    const methods = new Map<EncounterMethod, { minLevel: number; maxLevel: number; bands: Set<EncounterTimeBand> }>();
    for (const tableId of map.encounterTableIds) {
      const table = tables[tableId];
      if (!table || table.mapId !== map.id) continue;
      for (const band of bands) {
        for (const entry of table.timeBands[band]) {
          if (entry.speciesId !== speciesId || entry.weight <= 0) continue;
          const group = methods.get(table.method) ?? { minLevel: entry.minLevel, maxLevel: entry.maxLevel, bands: new Set<EncounterTimeBand>() };
          group.minLevel = Math.min(group.minLevel, entry.minLevel);
          group.maxLevel = Math.max(group.maxLevel, entry.maxLevel);
          group.bands.add(band);
          methods.set(table.method, group);
        }
      }
    }
    for (const [method, group] of methods) results.push({ mapId: map.id, mapName: map.displayName, method,
      minLevel: group.minLevel, maxLevel: group.maxLevel, timeBands: bands.filter(band => group.bands.has(band)) });
  }
  return results.sort((a, b) => a.mapId.localeCompare(b.mapId) || a.method.localeCompare(b.method));
}
