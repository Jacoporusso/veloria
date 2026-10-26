import data from '../../../content/encounters/special-pokemon.v1.json';
import type { SpecialEncounter } from '../../core/encounters/special-encounter.ts';

export const specialEncounterCatalog: Readonly<Record<string, SpecialEncounter>> = Object.fromEntries(
  data.encounters.map(encounter => [encounter.id, encounter]),
);
