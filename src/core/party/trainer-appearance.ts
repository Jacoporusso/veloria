import type { GameSave } from '../../persistence/save-types.ts';

export const TRAINER_APPEARANCE_OPTIONS = {
  preset: ['boy', 'girl'],
  skin: ['light', 'medium', 'deep'],
  hairStyle: ['short', 'curly', 'long'],
  hairColor: ['brown', 'black', 'blond'],
  eyes: ['brown', 'blue', 'green'],
  beard: ['none', 'short'],
  outfit: ['teal', 'lavender', 'coral'],
  backpack: ['coral', 'mint', 'navy'],
} as const;

type Option<K extends keyof typeof TRAINER_APPEARANCE_OPTIONS> = (typeof TRAINER_APPEARANCE_OPTIONS)[K][number];

export type TrainerAppearance = {
  preset: Option<'preset'>;
  skin: Option<'skin'>;
  hairStyle: Option<'hairStyle'>;
  hairColor: Option<'hairColor'>;
  eyes: Option<'eyes'>;
  beard: Option<'beard'>;
  outfit: Option<'outfit'>;
  backpack: Option<'backpack'>;
};

export const DEFAULT_TRAINER_APPEARANCE: Readonly<TrainerAppearance> = Object.freeze({
  preset: 'boy',
  skin: 'light',
  hairStyle: 'short',
  hairColor: 'brown',
  eyes: 'brown',
  beard: 'none',
  outfit: 'teal',
  backpack: 'coral',
});

const APPEARANCE_KEYS = Object.keys(TRAINER_APPEARANCE_OPTIONS) as (keyof TrainerAppearance)[];

/** Type guard for the closed, stable-ID appearance catalog. */
export function validateTrainerAppearance(value: unknown): value is TrainerAppearance {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== APPEARANCE_KEYS.length || Object.keys(record).some(key => !APPEARANCE_KEYS.includes(key as keyof TrainerAppearance))) return false;
  return APPEARANCE_KEYS.every(key => (TRAINER_APPEARANCE_OPTIONS[key] as readonly unknown[]).includes(record[key]));
}

/** Return an independent appearance; saves predating the wizard receive a deterministic default. */
export function readTrainerAppearance(value: unknown): TrainerAppearance | null {
  if (value === undefined) return { ...DEFAULT_TRAINER_APPEARANCE };
  return validateTrainerAppearance(value) ? { ...value } : null;
}

/** Return a cloned save with a validated appearance, preserving every other progress field. */
export function customizeTrainerAppearance(save: GameSave, appearance: unknown): GameSave {
  const normalized = readTrainerAppearance(appearance);
  if (normalized === null) throw new Error('Invalid trainer appearance');

  const customized = structuredClone(save);
  customized.player.appearance = normalized;
  return customized;
}
