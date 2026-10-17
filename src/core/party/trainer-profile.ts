import type { GameSave } from '../../persistence/save-types.ts';

/** Normalize a trainer name, returning null when it is empty, too long, or contains invisible characters. */
export function normalizeTrainerName(raw: string): string | null {
  if (typeof raw !== 'string') return null;

  // Reject controls and formatting/invisible code points before whitespace normalization.
  if (/[\p{Cc}\p{Cf}\p{Cs}\p{Default_Ignorable_Code_Point}]/u.test(raw)) return null;

  const name = raw.normalize('NFC').trim().replace(/\s+/gu, ' ');
  if (!name) return null;

  // Count user-perceived characters when the runtime supports grapheme segmentation.
  const length = typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(name)].length
    : [...name].length;
  return length >= 1 && length <= 16 ? name : null;
}

/** Return an independent copy of a new save personalized for the trainer. */
export function personalizeNewGame(save: GameSave, rawName: string): GameSave {
  const name = normalizeTrainerName(rawName);
  if (name === null) throw new Error('Invalid trainer name');

  const personalized = structuredClone(save);
  personalized.player.name = name;
  if (!personalized.flags.includes('intro_started')) personalized.flags.push('intro_started');
  return personalized;
}
