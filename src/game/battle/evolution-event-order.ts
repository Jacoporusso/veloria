import type { BattleEvent } from '../../core/battle/types.ts';

/** Keep mechanics intact; show a creature's learning only after its final transformation. */
export function evolutionPresentationEvents(events: readonly BattleEvent[]): readonly BattleEvent[] {
  const lastEvolution = new Map<string, number>();
  const key = (event: { side: string; creatureId: string }) => `${event.side}:${event.creatureId}`;
  events.forEach((event, index) => { if (event.type === 'creatureEvolved') lastEvolution.set(key(event), index); });
  if (!lastEvolution.size) return events;
  const learning = new Map<string, BattleEvent[]>();
  for (const event of events) {
    if ((event.type === 'moveLearned' || event.type === 'moveLearningSkipped') && lastEvolution.has(key(event))) {
      const id = key(event);
      learning.set(id, [...(learning.get(id) ?? []), event]);
    }
  }
  return events.flatMap((event, index) => {
    if ((event.type === 'moveLearned' || event.type === 'moveLearningSkipped') && learning.has(key(event))) return [];
    return event.type === 'creatureEvolved' && lastEvolution.get(key(event)) === index
      ? [event, ...(learning.get(key(event)) ?? [])] : [event];
  });
}
