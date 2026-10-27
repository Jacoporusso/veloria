import type { QuestDefinition } from './apply-quest-event.ts';

export type QuestMapPoint = { mapId: string; objectName: string; x: number; y: number; source: string };

/** Pick an actionable unfinished step, using authored physical event sources only. */
export function questMapTarget(quest: QuestDefinition, flags: readonly string[],
  events: Readonly<Record<string, readonly QuestMapPoint[]>>, currentMapId?: string, desiredFlag?: string): (QuestMapPoint & { stepFlag: string }) | undefined {
  const known = new Set(flags);
  if (known.has(quest.completionFlag)) return undefined;
  for (const step of quest.steps) {
    if (desiredFlag && step.setFlag !== desiredFlag) continue;
    if (known.has(step.setFlag) || !step.requiresFlags.every(flag => known.has(flag))) continue;
    const candidates = events[step.trigger];
    if (candidates?.length) return { ...(candidates.find(point => point.mapId === currentMapId) ?? candidates[0]), stepFlag: step.setFlag };
  }
  return undefined;
}
