import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import movesData from '../../content/battle/moves.v1.json' with { type: 'json' };
import { applyQuestEvent as applyEvent, type QuestDefinition } from '../../src/core/quests/apply-quest-event.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';
import type { CreatureRegistries } from '../../src/core/battle/create-creature.ts';

export type { QuestDefinition };
const registries = { species: speciesData.species, moves: movesData.moves } as unknown as CreatureRegistries;

/** Real catalog dependencies for chapter tests whose rewards include companions. */
export function applyQuestEvent(save: GameSave, trigger: string, quests: readonly QuestDefinition[]) {
  return applyEvent(save, trigger, quests, registries);
}
