import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { customizeTrainerAppearance, DEFAULT_TRAINER_APPEARANCE, readTrainerAppearance, validateTrainerAppearance } from '../../src/core/party/trainer-appearance.ts';
import { validateSave } from '../../src/persistence/save-validation.ts';
import { personalizeNewGame } from '../../src/core/party/trainer-profile.ts';
import { trainerSourcePath } from '../../src/game/rendering/illustrated-trainer.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

function checkpoint(): GameSave {
  const backup = JSON.parse(readFileSync(new URL('../../docs/playtests/2026-10-24-natural-dunes-recovery-backup-charmander.json', import.meta.url), 'utf8'));
  return backup.save ?? backup.payload ?? backup;
}

test('advanced real checkpoint stays valid without an appearance, and editing preserves every progress field', () => {
  const original = checkpoint();
  assert.equal(validateSave(original).valid, true);
  const before = structuredClone(original);
  const appearance = { ...DEFAULT_TRAINER_APPEARANCE, preset: 'girl' as const, hairStyle: 'curly' as const, skin: 'deep' as const };
  const changed = customizeTrainerAppearance(original, appearance);
  assert.equal(validateSave(changed).valid, true);
  assert.deepEqual(JSON.parse(JSON.stringify(changed)).player.appearance, appearance);
  delete changed.player.appearance;
  assert.deepEqual(changed, before);
  assert.deepEqual(original, before);
});

test('closed catalog rejects missing, unknown and arbitrary appearance values', () => {
  for (const invalid of [null, {}, { ...DEFAULT_TRAINER_APPEARANCE, hairColor: 'url(secret)' }, { ...DEFAULT_TRAINER_APPEARANCE, upload: 'photo' }]) {
    assert.equal(validateTrainerAppearance(invalid), false);
    assert.throws(() => customizeTrainerAppearance(checkpoint(), invalid));
    const save = checkpoint(); (save.player as unknown as Record<string, unknown>).appearance = invalid;
    assert.equal(validateSave(save).valid, false);
  }
});

test('default is detached and a new trainer keeps selected independent appearance options', () => {
  const legacy = readTrainerAppearance(undefined)!; legacy.hairColor = 'blond';
  assert.equal(DEFAULT_TRAINER_APPEARANCE.hairColor, 'brown');
  const chosen = { ...DEFAULT_TRAINER_APPEARANCE, preset: 'girl' as const, beard: 'short' as const, eyes: 'green' as const };
  const save = personalizeNewGame(checkpoint(), '  Aurora  ', chosen);
  assert.equal(save.player.name, 'Aurora'); assert.deepEqual(save.player.appearance, chosen);
  chosen.eyes = 'brown'; assert.equal(save.player.appearance!.eyes, 'green');
});

test('every hairstyle resolves to a distinct registered local animation sheet', () => {
  const paths = ['short', 'curly', 'long'].map(hairStyle => trainerSourcePath({ ...DEFAULT_TRAINER_APPEARANCE, hairStyle: hairStyle as 'short' | 'curly' | 'long' }));
  assert.equal(new Set(paths).size, 3);
  for (const path of paths) assert.ok(readFileSync(new URL(`../../public/${path}`, import.meta.url)).byteLength > 0);
});
