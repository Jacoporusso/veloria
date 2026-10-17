import type { QuestDefinition } from '../../core/quests/apply-quest-event.ts';

export const questCatalog: readonly QuestDefinition[] = Object.values(import.meta.glob<QuestDefinition>('../../../content/quests/*.quest.json', {
  eager: true,
  import: 'default',
}));
