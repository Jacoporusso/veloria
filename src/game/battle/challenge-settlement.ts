import { recoverChallengeSequence, settleChallengeBattle, type ChallengeSequence } from '../../core/world/challenge-sequence.ts';
import { applyQuestEvent, type QuestDefinition } from '../../core/quests/apply-quest-event.ts';
import type { GameSave } from '../../persistence/save-types.ts';
import type { CreatureRegistries } from '../../core/battle/create-creature.ts';

/** Caller first merges battle HP/XP/PP and consumed items. Return one atomic save snapshot. */
export function settleChallengeSave(save: GameSave, sequence: ChallengeSequence, stageId: string, outcome: 'won' | 'lost' | 'draw', trainerReward: number, quests: readonly QuestDefinition[], companionRegistries?: CreatureRegistries) {
  if (!Number.isSafeInteger(trainerReward) || trainerReward < 0) throw new Error('Invalid challenge trainer reward.');
  const result = settleChallengeBattle(sequence, save, stageId, outcome);
  if (!result.accepted) return { save, result, earnedMoney: 0, completedQuestIds: [] as string[], newCompletion: false };
  let next = { ...save, flags: result.flags, player: { ...save.player, money: save.player.money + (result.rewardStageId ? trainerReward : 0) } };
  let completedQuestIds: string[] = [];
  if (result.event) {
    const completion = applyQuestEvent(next, result.event, quests, companionRegistries);
    if (!completion.save.flags.includes(sequence.completedFlag)) throw new Error('Challenge completion quest did not accept its final victory.');
    next = completion.save;
    completedQuestIds = completion.completedQuestIds;
    next = { ...next, flags: recoverChallengeSequence(sequence, next).flags };
  }
  return { save: next, result, earnedMoney: next.player.money - save.player.money, completedQuestIds,
    newCompletion: !save.flags.includes(sequence.completedFlag) && next.flags.includes(sequence.completedFlag) };
}
