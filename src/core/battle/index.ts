export { createBattleState, normalizeSeed, resolveBattleTurn } from './engine.ts';
export { createBattleCreature, createBattleCreatureFromSave } from './create-creature.ts';
export type {
  BattleMoveRegistry, CreateBattleCreatureOptions, CreatureRegistries, SpeciesBattleDefinition,
  SpeciesBattleRegistry,
} from './create-creature.ts';
export { effectivenessFor, prototypeBattleRules } from './rules.ts';
export type { BattleItemRule, BattleRules, CaptureItemRule, EvolutionRule, EvolutionTarget, ExperienceCurve, TypeChart } from './rules.ts';
export { experienceToNextLevel } from './progression.ts';
export { replaceLearnedMove } from './move-learning.ts';
export type {
  BattleCommand, BattleCreature, BattleEvent, BattleOutcome, BattleSide, BattleState,
  BattleStat, StatStages, BattleStats, BattleTransition, MajorStatus, MoveCategory, MoveDefinition, MoveSlot,
  StatusEffect,
} from './types.ts';

export { chooseOpponentCommand } from './opponent-policy.ts';
export type { OpponentPolicy } from './opponent-policy.ts';

export { EMERGENCY_MOVE_ID, EMERGENCY_MOVE_NAME, hasUsableBattleMove } from './emergency-move.ts';
