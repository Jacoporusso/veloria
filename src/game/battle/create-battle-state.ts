import type { CreatureSave, GameSave, StoredCreatureSave } from '../../persistence/save-types.ts';
import { createBattleState } from '../../core/battle/engine.ts';
import { createBattleCreature, createBattleCreatureFromSave, type CreatureRegistries } from '../../core/battle/create-creature.ts';
import type { BattleCreature, BattleState } from '../../core/battle/types.ts';
import type { BattleRules } from '../../core/battle/rules.ts';

export type TrainerBattleDefinition = {
  id: string;
  name: string;
  battleOnceFlag: string;
  defeatQuestEvent: string;
  rewardMoney: number;
  victoryMessage: string;
  team: Array<{ speciesId: number; level: number; moveIds: string[] }>;
};

export function createTrainerBattle(args: {
  save: GameSave;
  trainer: TrainerBattleDefinition;
  registries: CreatureRegistries;
  rules: BattleRules;
  battleId: string;
}): BattleState {
  const playerTeam = args.save.party.map(creature => createBattleCreatureFromSave(creature, args.registries));
  if (!playerTeam.length) throw new Error('A trainer battle requires at least one creature in the party.');
  const opponentTeam = args.trainer.team.map((member, index) => createBattleCreature({
    ...args.registries,
    speciesId: member.speciesId,
    level: member.level,
    instanceId: `${args.trainer.id}:${index + 1}`,
    moveIds: member.moveIds,
  }));
  return createBattleState({
    battleId: args.battleId,
    battleType: 'trainer',
    seed: args.save.rngState,
    rules: args.rules,
    playerTeam,
    opponentTeam,
    playerStorage: args.save.storage.map(item => createStoredCreature(item, args.registries)),
  });
}

export function createWildBattle(args: {
  save: GameSave;
  speciesId: number;
  level: number;
  registries: CreatureRegistries;
  rules: BattleRules;
  battleId: string;
}): BattleState {
  const playerTeam = args.save.party.map(creature => createBattleCreatureFromSave(creature, args.registries));
  if (!playerTeam.length) throw new Error('A wild battle requires at least one creature in the party.');
  const opponent = createBattleCreature({
    ...args.registries,
    speciesId: args.speciesId,
    level: args.level,
    instanceId: args.battleId + ':wild',
  });
  return createBattleState({
    battleId: args.battleId,
    battleType: 'wild',
    seed: args.save.rngState,
    rules: args.rules,
    playerTeam,
    opponentTeam: [opponent],
    playerStorage: args.save.storage.map(item => createStoredCreature(item, args.registries)),
  });
}

function createStoredCreature(item: StoredCreatureSave, registries: CreatureRegistries): BattleCreature {
  const level = Number.isInteger(item.level) && (item.level as number) > 0 ? item.level as number : 5;
  const base = createBattleCreature({ ...registries, speciesId: item.speciesId, level, instanceId: item.instanceId });
  const rawMoves = item.moves;
  const status = parseStoredStatus(item.status);
  if (!Array.isArray(rawMoves)) return { ...base, status };
  const moves = rawMoves.flatMap(raw => {
    if (!raw || typeof raw !== 'object') return [];
    const record = raw as Record<string, unknown>;
    const id = typeof record.id === 'string' ? record.id : typeof record.moveId === 'string' ? record.moveId : undefined;
    if (!id || !registries.moves[id]) return [];
    const pp = Number.isInteger(record.pp) && (record.pp as number) >= 0 ? record.pp as number : registries.moves[id].maxPp;
    return [{ moveId: id, pp }];
  });
  const maxHp = Number.isInteger(item.maxHp) && (item.maxHp as number) > 0 ? item.maxHp as number : base.stats.maxHp;
  return {
    ...base,
    stats: { ...base.stats, maxHp },
    hp: Number.isInteger(item.hp) && (item.hp as number) >= 0 ? Math.min(item.hp as number, maxHp) : base.hp,
    experience: Number.isInteger(item.experience) && (item.experience as number) >= 0 ? item.experience as number : base.experience,
    moves: moves.slice(0, 4),
    status,
  };
}

function parseStoredStatus(value: unknown): BattleCreature['status'] {
  if (!value || typeof value !== 'object') return undefined;
  const status = value as { status?: unknown; turnsRemaining?: unknown };
  if (!['burn', 'poison', 'paralysis', 'sleep', 'freeze'].includes(String(status.status))) return undefined;
  if (status.turnsRemaining !== undefined && (!Number.isInteger(status.turnsRemaining) || (status.turnsRemaining as number) < 1)) return undefined;
  if (status.status === 'sleep' && status.turnsRemaining === undefined) return undefined;
  if (!['sleep', 'freeze'].includes(String(status.status)) && status.turnsRemaining !== undefined) return undefined;
  return { status: status.status as NonNullable<BattleCreature['status']>['status'], turnsRemaining: status.turnsRemaining as number | undefined };
}

export function mergeBattlePlayerState(save: GameSave, battle: BattleState): GameSave {
  const toSaved = (creature: BattleCreature): CreatureSave => {
    const saved: CreatureSave = {
      instanceId: creature.instanceId,
      speciesId: creature.speciesId,
      level: creature.level,
      experience: creature.experience,
      hp: creature.hp,
      maxHp: creature.stats.maxHp,
      moves: creature.moves.map(move => ({ id: move.moveId, pp: move.pp })),
    };
    if (creature.status) saved.status = { ...creature.status };
    return saved;
  };
  const storageIds = new Set(save.storage.map(creature => creature.instanceId));
  const nextStorage = battle.playerStorage.map(toSaved).filter(creature => !storageIds.has(creature.instanceId));
  return {
    ...save,
    party: battle.player.creatures.map(toSaved),
    storage: [...save.storage, ...nextStorage],
    rngState: battle.rngState,
  };
}
