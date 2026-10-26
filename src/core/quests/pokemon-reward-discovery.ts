import type { QuestDefinition } from './apply-quest-event.ts';

/** Presentation only: internal quest steps are progress, not external unlocks. */
export function pokemonRewardDiscoveryState(quest: QuestDefinition, flags: readonly string[]): 'locked' | 'available' | 'received' {
  if (flags.includes(quest.completionFlag)) return 'received';
  const internal = new Set(quest.steps.map(step => step.setFlag));
  const unlocked = quest.steps.every(step => step.requiresFlags.every(flag => internal.has(flag) || flags.includes(flag)));
  return unlocked ? 'available' : 'locked';
}
