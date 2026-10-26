import data from '../../../content/journey/pokemon-rewards.v1.json';
import type { QuestDefinition } from '../../core/quests/apply-quest-event.ts';
import { pokemonRewardDiscoveryState } from '../../core/quests/pokemon-reward-discovery.ts';
import { getMap } from '../maps/map-registry.ts';
import { questCatalog } from '../quests/catalog.ts';
import { battleSpecies } from '../battle/catalog.ts';

const guides = Object.fromEntries(data.guides.map(guide => [guide.questId, guide]));

export function describePokemonReward(quest: QuestDefinition, flags: readonly string[]) {
  const guide = guides[quest.id];
  if (!guide) return undefined;
  const state = pokemonRewardDiscoveryState(quest, flags);
  const name = (quest.reward?.pokemon ?? []).map(gift => battleSpecies[gift.speciesId].name).join(', ');
  const status = state === 'received' ? 'Ricevuto ✓' : state === 'locked' ? 'Da sbloccare'
    : quest.steps.length === 1 ? 'Da ricevere' : 'Da completare';
  return { guide, name, state, status, location: getMap(guide.mapId).metadata.displayName };
}

export function pokemonRewardsAt(mapIds: readonly string[], flags: readonly string[]) {
  return questCatalog.flatMap(quest => {
    const reward = describePokemonReward(quest, flags);
    return reward && mapIds.includes(reward.guide.mapId) ? [reward] : [];
  });
}
