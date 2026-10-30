import data from '../../../content/encounters/legendary-research.v1.json' with { type: 'json' };
import {
  validateLegendaryResearchDefinition,
  type LegendaryResearchDefinition,
} from '../../core/encounters/legendary-research.ts';

const researches = data.researches as LegendaryResearchDefinition[];
for (const research of researches) validateLegendaryResearchDefinition(research);

export const legendaryResearchCatalog: Readonly<Record<string, LegendaryResearchDefinition>> = Object.fromEntries(
  researches.map(research => [research.id, research]),
);

const byEncounterId: Readonly<Record<string, LegendaryResearchDefinition>> = Object.fromEntries(
  researches.map(research => [research.encounterId, research]),
);

export function legendaryResearchForEncounter(encounterId: string): LegendaryResearchDefinition | undefined {
  return byEncounterId[encounterId];
}

export function getLegendaryResearch(id: string): LegendaryResearchDefinition | undefined {
  return legendaryResearchCatalog[id];
}
