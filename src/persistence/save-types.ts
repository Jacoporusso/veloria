import type { TrainerAppearance } from '../core/party/trainer-appearance.ts';

export type CreatureMoveSave = { id: string; pp: number };
export type PersistentMajorStatus = 'burn' | 'poison' | 'paralysis' | 'sleep' | 'freeze';
export type CreatureStatusSave = {
  status: PersistentMajorStatus;
  /** Active duration for timed major statuses. Sleep requires this value; freeze may be indefinite. */
  turnsRemaining?: number;
};

type CreatureSaveFields = {
  instanceId: string;
  speciesId: number;
  level: number;
  experience: number;
  hp: number;
  maxHp: number;
  moves: CreatureMoveSave[];
};

/** Current v2 creature record. The optional status preserves compatibility with older v2 saves. */
export type CreatureSave = CreatureSaveFields & { status?: CreatureStatusSave };
type CreatureSaveV1 = CreatureSaveFields;

export type StoredCreatureSave = {
  instanceId: string;
  speciesId: number;
  [metadata: string]: unknown;
};

export type GameSaveV1 = {
  schemaVersion: 1;
  contentVersion: string;
  saveId: string;
  savedAt: string;
  player: { name: string; mapId: string; spawnPointId: string; money: number; x?: number; y?: number };
  party: CreatureSaveV1[];
  storage: StoredCreatureSave[];
  flags: string[];
  badges: string[];
  inventory: Record<string, number>;
  rngState: number;
};

/** The current in-memory and persisted representation. Older versions are migrated on read. */
export type GameSave = Omit<GameSaveV1, 'schemaVersion' | 'player' | 'party'> & {
  schemaVersion: 2;
  saveRevision: number;
  player: GameSaveV1['player'] & { x: number; y: number; appearance?: TrainerAppearance };
  party: CreatureSave[];
};

export type AnyGameSave = GameSaveV1 | GameSave;
export const CURRENT_SAVE_SCHEMA_VERSION = 2 as const;
