import type { CreatureSave } from '../../persistence/save-types.ts';
import type { BattleBaseStats, BattleCreature, BattleStats, BattleType, MoveDefinition, MoveSlot } from './types.ts';

export interface SpeciesBattleDefinition {
  readonly speciesId: number;
  readonly name: string;
  readonly defaultAbilityId?: string;
  /** PokéAPI female ratio in eighths; -1 means genderless. */
  readonly genderRate?: number;
  readonly types: readonly BattleType[];
  readonly baseStats: Omit<BattleStats, 'maxHp'> & { readonly hp: number };
  readonly weightKg?: number;
  readonly experienceYield: number;
  readonly defaultMoveIds: readonly string[];
  /** Supported entries imported from the selected official version-group, never invented levels. */
  readonly officialLearnset?: readonly { readonly level: number; readonly moveId: string }[];
  readonly growthCurveId?: string;
}

export type SpeciesBattleRegistry = Readonly<Record<string, SpeciesBattleDefinition>>;
export type BattleMoveRegistry = Readonly<Record<string, MoveDefinition>>;

export interface CreatureRegistries {
  readonly species: SpeciesBattleRegistry;
  readonly moves: BattleMoveRegistry;
}

export interface CreateBattleCreatureOptions extends CreatureRegistries {
  readonly speciesId: number;
  readonly level: number;
  readonly instanceId: string;
  readonly moveIds?: readonly string[];
  readonly experience?: number;
}

/**
 * Creates a deterministic battle snapshot from versioned species/move registries.
 * This v1 prototype uses IV=0, EV=0 and neutral nature modifiers; no type chart is read here.
 */
export function createBattleCreature(options: CreateBattleCreatureOptions): BattleCreature {
  const { speciesId, level, instanceId, species: speciesRegistry, moves: moveRegistry } = options;
  if (!Number.isInteger(speciesId) || speciesId < 1) throw new Error('speciesId must be a positive integer.');
  if (!Number.isInteger(level) || level < 1 || level > 100) throw new Error('level must be an integer from 1 to 100.');
  if (!instanceId.trim()) throw new Error('instanceId must be a stable, non-empty ID.');

  const species = speciesRegistry[String(speciesId)];
  if (!species || species.speciesId !== speciesId) throw new Error(`Unknown or mismatched species ID: ${speciesId}.`);
  validateSpecies(species);
  const learned: string[] = [];
  if (species.officialLearnset) {
    for (const entry of species.officialLearnset) {
      if (entry.level <= level && !learned.includes(entry.moveId)) learned.push(entry.moveId);
    }
  }
  const moveIds = options.moveIds ?? (species.officialLearnset ? learned.slice(-4) : species.defaultMoveIds);
  if (moveIds.length < 1 || moveIds.length > 4) throw new Error('A battle creature must have from 1 to 4 moves.');
  if (new Set(moveIds).size !== moveIds.length) throw new Error('Move IDs must be unique for a creature.');

  const moves: MoveSlot[] = moveIds.map(moveId => {
    const move = moveRegistry[moveId];
    if (!move || move.id !== moveId) throw new Error(`Unknown or mismatched move ID: ${moveId}.`);
    if (!Number.isInteger(move.maxPp) || move.maxPp < 1) throw new Error(`Invalid max PP for move ${moveId}.`);
    return { moveId, pp: move.maxPp };
  });

  const stats = calculateStats(species.baseStats, level);
  return {
    instanceId,
    speciesId,
    name: species.name,
    abilityId: species.defaultAbilityId,
    gender: species.genderRate === undefined || species.genderRate < 0 ? 'genderless'
      : stableGender(instanceId, species.genderRate),
    level,
    types: [...species.types],
    baseStats: { ...species.baseStats },
    weightKg: species.weightKg,
    growthCurveId: species.growthCurveId ?? 'veloria_medium_fast_v1',
    stats,
    hp: stats.maxHp,
    experience: options.experience ?? 0,
    experienceYield: species.experienceYield,
    moves,
  };
}

function stableGender(instanceId: string, femaleRate: number): 'male' | 'female' {
  let hash = 2166136261;
  for (const character of instanceId) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  return hash % 8 < femaleRate ? 'female' : 'male';
}

/** Rehydrates saved HP/experience/move IDs, capping legacy PP at the sourced maximum. */
export function createBattleCreatureFromSave(save: CreatureSave, registries: CreatureRegistries): BattleCreature {
  if (!Number.isInteger(save.hp) || !Number.isInteger(save.maxHp) || save.maxHp < 1 || save.hp < 0 || save.hp > save.maxHp) {
    throw new Error(`Saved HP is invalid for creature ${save.instanceId}.`);
  }
  if (!Number.isInteger(save.experience) || save.experience < 0) throw new Error(`Saved experience is invalid for creature ${save.instanceId}.`);
  if (!Array.isArray(save.moves) || save.moves.some(move => !Number.isInteger(move.pp) || move.pp < 0)) {
    throw new Error(`Saved move PP is invalid for creature ${save.instanceId}.`);
  }
  const status = cloneSavedStatus(save.status, save.instanceId);

  const base = createBattleCreature({
    ...registries,
    speciesId: save.speciesId,
    level: save.level,
    instanceId: save.instanceId,
    moveIds: save.moves.map(move => move.id),
    experience: save.experience,
  });
  return {
    ...base,
    hp: save.hp,
    experience: save.experience,
    // Keep a legacy save's max HP even if it predates the current prototype stat formula.
    stats: { ...base.stats, maxHp: save.maxHp },
    moves: save.moves.map(move => ({ moveId: move.id, pp: Math.min(move.pp, registries.moves[move.id].maxPp) })),
    status,
  };
}

function cloneSavedStatus(status: CreatureSave['status'], instanceId: string): BattleCreature['status'] {
  if (status === undefined) return undefined;
  const isTimed = status.status === 'sleep' || status.status === 'freeze';
  if (!['burn', 'poison', 'paralysis', 'sleep', 'freeze'].includes(status.status) ||
      (status.turnsRemaining !== undefined && (!Number.isInteger(status.turnsRemaining) || status.turnsRemaining < 1)) ||
      (status.status === 'sleep' && status.turnsRemaining === undefined) ||
      (!isTimed && status.turnsRemaining !== undefined) ||
      (status.toxicCounter !== undefined && (status.status !== 'poison' || !Number.isInteger(status.toxicCounter) || status.toxicCounter < 1 || status.toxicCounter > 15))) {
    throw new Error(`Saved major status is invalid for creature ${instanceId}.`);
  }
  return { ...status };
}

export function calculateStats(base: BattleBaseStats, level: number): BattleStats {
  const scaled = (value: number) => Math.floor(2 * value * level / 100);
  return {
    maxHp: scaled(base.hp) + level + 10,
    attack: scaled(base.attack) + 5,
    defense: scaled(base.defense) + 5,
    specialAttack: scaled(base.specialAttack) + 5,
    specialDefense: scaled(base.specialDefense) + 5,
    speed: scaled(base.speed) + 5,
  };
}

function validateSpecies(species: SpeciesBattleDefinition): void {
  if (!species.name.trim() || species.types.length < 1 || species.types.length > 2 || !Number.isFinite(species.experienceYield) || species.experienceYield < 0) {
    throw new Error(`Species ${species.speciesId} has invalid name, types, or experience yield.`);
  }
  const values = Object.values(species.baseStats);
  if (values.some(value => !Number.isInteger(value) || value < 1)) throw new Error(`Species ${species.speciesId} has invalid base stats.`);
}
