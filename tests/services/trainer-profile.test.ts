import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeTrainerName, personalizeNewGame } from '../../src/core/party/trainer-profile.ts';
import { newGameSave } from '../../src/persistence/save-store.ts';

test('normalizes Unicode trainer names and internal whitespace', () => {
  assert.equal(normalizeTrainerName('  Jose\u0301   Serra  '), 'José Serra');
  assert.equal(normalizeTrainerName('  星  空  '), '星 空');
});

test('accepts 1 through 16 visible graphemes and rejects empty or longer names', () => {
  assert.equal(normalizeTrainerName('A'), 'A');
  assert.equal(normalizeTrainerName('1234567890123456'), '1234567890123456');
  assert.equal(normalizeTrainerName('12345678901234567'), null);
  assert.equal(normalizeTrainerName('   '), null);
  assert.equal(normalizeTrainerName('👩‍🚀'), null); // format characters are forbidden
  assert.equal(normalizeTrainerName('e\u0301'), 'é');
});

test('rejects controls and invisible formatting characters', () => {
  assert.equal(normalizeTrainerName('Al\nlen'), null);
  assert.equal(normalizeTrainerName('Al\u0000len'), null);
  assert.equal(normalizeTrainerName('Al\u200Blen'), null);
  assert.equal(normalizeTrainerName('Al\u00ADlen'), null);
});

test('personalizes a cloned save and marks intro_started without mutating input', () => {
  const original = newGameSave();
  const originalFlags = [...original.flags];
  const result = personalizeNewGame(original, '  Mira  Vale ');

  assert.equal(result.player.name, 'Mira Vale');
  assert.ok(result.flags.includes('intro_started'));
  assert.notEqual(result, original);
  assert.notEqual(result.player, original.player);
  assert.deepEqual(original.flags, originalFlags);
  assert.equal(original.player.name, 'Allenatore');
});

test('personalizeNewGame rejects an invalid name without changing the save', () => {
  const original = newGameSave();
  const snapshot = structuredClone(original);
  assert.throws(() => personalizeNewGame(original, 'bad\u200Bname'), /Invalid trainer name/);
  assert.deepEqual(original, snapshot);
});
