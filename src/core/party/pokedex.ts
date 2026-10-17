/** A read-only registry view derived from the creatures the player owns. */
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
}

export function buildPokedexEntries(
  catalog: Readonly<Record<string, PokedexSpecies>>,
  party: readonly OwnedCreatureReference[],
  storage: readonly OwnedCreatureReference[],
): PokedexEntry[] {
  const partyCounts = countSpecies(party);
  const storageCounts = countSpecies(storage);
  return Object.values(catalog)
    .map(species => {
      const partyCount = partyCounts.get(species.speciesId) ?? 0;
      const storageCount = storageCounts.get(species.speciesId) ?? 0;
      return { ...species, partyCount, storageCount, registered: partyCount + storageCount > 0 };
    })
    .sort((first, second) => first.speciesId - second.speciesId);
}

function countSpecies(creatures: readonly OwnedCreatureReference[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const creature of creatures) counts.set(creature.speciesId, (counts.get(creature.speciesId) ?? 0) + 1);
  return counts;
}
