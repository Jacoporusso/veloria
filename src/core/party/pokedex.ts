/** Registry derived from actual sightings and owned creatures. */
export interface PokedexSpecies {
  readonly speciesId: number;
  readonly name: string;
}

export interface OwnedCreatureReference {
  readonly speciesId: number;
}

export interface PokedexEntry extends PokedexSpecies {
  readonly partyCount: number;
  readonly storageCount: number;
  readonly registered: boolean;
  readonly seen: boolean;
}

export function buildPokedexEntries(
  catalog: Readonly<Record<string, PokedexSpecies>>,
  party: readonly OwnedCreatureReference[],
  storage: readonly OwnedCreatureReference[],
  seenSpecies: readonly number[] = [],
): PokedexEntry[] {
  const partyCounts = countSpecies(party);
  const storageCounts = countSpecies(storage);
  return Object.values(catalog)
    .map(species => {
      const partyCount = partyCounts.get(species.speciesId) ?? 0;
      const storageCount = storageCounts.get(species.speciesId) ?? 0;
      const registered = partyCount + storageCount > 0;
      return { ...species, partyCount, storageCount, registered, seen: registered || seenSpecies.includes(species.speciesId) };
    })
    .sort((first, second) => first.speciesId - second.speciesId);
}

export function seenSpeciesFromFlags(flags: readonly string[]): number[] {
  return flags.filter(flag => /^pokedex_seen_[1-9]\d*$/.test(flag)).map(flag => Number(flag.slice('pokedex_seen_'.length)));
}

export function recordSpeciesSeen(flags: readonly string[], speciesId: number): string[] {
  const flag = `pokedex_seen_${speciesId}`;
  return flags.includes(flag) ? [...flags] : [...flags, flag];
}

function countSpecies(creatures: readonly OwnedCreatureReference[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const creature of creatures) counts.set(creature.speciesId, (counts.get(creature.speciesId) ?? 0) + 1);
  return counts;
}
