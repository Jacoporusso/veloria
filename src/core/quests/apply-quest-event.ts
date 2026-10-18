import type { GameSave } from '../../persistence/save-store';

export type QuestStep = {
  trigger: string;
  setFlag: string;
  requiresFlags: readonly string[];
  addBadge?: string;
  /** Applied once with this step, independently from the final quest reward. */
  grantItems?: Readonly<Record<string, number>>;
  /** All quantities must already be owned; delivery and progress are atomic. */
  consumeItems?: Readonly<Record<string, number>>;
};
export type QuestDefinition = {
  id: string;
  steps: readonly QuestStep[];
  completionFlag: string;
  reward?: { money?: number; items?: Record<string, number> };
};

export type QuestEventResult = { save: GameSave; progressed: boolean; completedQuestIds: string[] };

export function applyQuestEvent(save: GameSave, trigger: string, quests: readonly QuestDefinition[]): QuestEventResult {
  let nextSave = save;
  let progressed = false;
  const completedQuestIds: string[] = [];

  for (const quest of quests) {
    for (const step of quest.steps) {
      if (step.trigger !== trigger || nextSave.flags.includes(step.setFlag)) continue;
      if (!step.requiresFlags.every(flag => nextSave.flags.includes(flag))) continue;
      if (Object.entries(step.consumeItems ?? {}).some(([itemId, quantity]) => (nextSave.inventory[itemId] ?? 0) < quantity)) continue;

      const wasComplete = nextSave.flags.includes(quest.completionFlag);
      nextSave = { ...nextSave, flags: [...nextSave.flags, step.setFlag] };
      if (step.grantItems || step.consumeItems) {
        const inventory = { ...nextSave.inventory };
        for (const [itemId, quantity] of Object.entries(step.consumeItems ?? {})) {
          inventory[itemId] -= quantity;
          if (inventory[itemId] === 0) delete inventory[itemId];
        }
        nextSave = { ...nextSave, inventory: addItems(inventory, step.grantItems ?? {}) };
      }
      if (step.addBadge && !nextSave.badges.includes(step.addBadge)) {
        nextSave = { ...nextSave, badges: [...nextSave.badges, step.addBadge] };
      }
      progressed = true;

      if (!wasComplete && nextSave.flags.includes(quest.completionFlag)) {
        const reward = quest.reward;
        nextSave = {
          ...nextSave,
          player: { ...nextSave.player, money: nextSave.player.money + (reward?.money ?? 0) },
          inventory: addItems(nextSave.inventory, reward?.items ?? {}),
        };
        completedQuestIds.push(quest.id);
      }
    }
  }

  return { save: nextSave, progressed, completedQuestIds };
}

function addItems(inventory: Record<string, number>, rewards: Readonly<Record<string, number>>): Record<string, number> {
  return Object.entries(rewards).reduce((next, [itemId, quantity]) => {
    next[itemId] = (next[itemId] ?? 0) + quantity;
    return next;
  }, { ...inventory });
}
