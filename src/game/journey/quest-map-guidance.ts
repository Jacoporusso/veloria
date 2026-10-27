import index from '../../../content/journey/atlas-quest-targets.v1.json';
import { questMapTarget } from '../../core/quests/quest-map-target.ts';
import type { QuestDefinition } from '../../core/quests/apply-quest-event.ts';
import { getMap } from '../maps/map-registry.ts';

export function describeQuestMapTarget(quest: QuestDefinition & { displayName?: string }, flags: readonly string[], currentMapId?: string, desiredFlag?: string) {
  const point = questMapTarget(quest, flags, index.events, currentMapId, desiredFlag);
  return point ? { ...point, id: `${quest.id}#${point.stepFlag}`, name: quest.displayName ?? quest.id, location: getMap(point.mapId).metadata.displayName } : undefined;
}
