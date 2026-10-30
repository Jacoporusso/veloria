import index from '../../../content/journey/atlas-quest-targets.v1.json';
import { questMapTarget, type QuestMapPoint } from '../../core/quests/quest-map-target.ts';
import type { QuestDefinition } from '../../core/quests/apply-quest-event.ts';
import { getMap } from '../maps/map-registry.ts';
import { legendaryResearchCatalog } from '../maps/legendary-research-registry.ts';
import { legendaryResearchState } from '../../core/encounters/legendary-research.ts';

export function describeQuestMapTarget(quest: QuestDefinition & { displayName?: string }, flags: readonly string[], currentMapId?: string, desiredFlag?: string) {
  const research = Object.values(legendaryResearchCatalog).find(item => item.questId === quest.id);
  const captureResearch = Object.values(legendaryResearchCatalog).find(item => item.capturedFlag === quest.completionFlag);
  if (captureResearch && !flags.includes(captureResearch.revealedFlag) && !flags.includes(captureResearch.capturedFlag)) return undefined;
  if (research) {
    const state = legendaryResearchState(research, flags);
    if (state.status !== 'revealed') {
      if (state.status !== 'ready') return undefined;
      const next = quest.steps.find(step => !flags.includes(step.setFlag) && step.requiresFlags.every(flag => flags.includes(flag)));
      if (!next || next.trigger !== research.puzzle.event || (desiredFlag && next.setFlag !== desiredFlag)) return undefined;
      const events = index.events as unknown as Readonly<Record<string, readonly QuestMapPoint[]>>;
      const candidates = events[research.puzzle.event] ?? [];
      const puzzle = candidates.find((point: QuestMapPoint) => point.mapId === research.puzzle.mapId);
      if (!puzzle) return undefined;
      return {
        ...puzzle,
        id: `${research.id}#puzzle`,
        stepFlag: next.setFlag,
        name: quest.displayName ?? quest.id,
        location: getMap(puzzle.mapId).metadata.displayName,
      };
    }
  }
  const point = questMapTarget(quest, flags, index.events, currentMapId, desiredFlag);
  return point ? { ...point, id: `${quest.id}#${point.stepFlag}`, name: quest.displayName ?? quest.id, location: getMap(point.mapId).metadata.displayName } : undefined;
}
