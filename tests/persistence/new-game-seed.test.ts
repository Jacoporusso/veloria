import assert from 'node:assert/strict';
import test from 'node:test';
import { newGameSave } from '../../src/persistence/save-store.ts';
import { exportSave, importSave } from '../../src/persistence/save-backup.ts';
import { validateSave } from '../../src/persistence/save-validation.ts';

test('new adventures draw independent seeds while backup import preserves their cursor', t => {
  const seeds = [1, 0xffffffff];
  let draws = 0;
  t.mock.method(globalThis.crypto, 'getRandomValues', (buffer: Uint32Array) => {
    assert.ok(buffer instanceof Uint32Array);
    assert.equal(buffer.length, 1);
    buffer[0] = seeds[draws++];
    return buffer;
  });
  const first = newGameSave(), second = newGameSave();
  assert.equal(first.rngState, 1);
  assert.equal(second.rngState, 0xffffffff);
  assert.equal(validateSave(first).valid, true);
  assert.equal(validateSave(second).valid, true);
  assert.equal(importSave(exportSave(first, '2026-10-22T00:00:00Z')).rngState, first.rngState);
  assert.equal(importSave(exportSave(second, '2026-10-22T00:00:00Z')).rngState, second.rngState);
  assert.equal(draws, 2, 'restoring an adventure must not draw another seed');
});

test('a zero entropy word starts a valid nonzero xorshift sequence', t => {
  t.mock.method(globalThis.crypto, 'getRandomValues', (buffer: Uint32Array) => {
    buffer[0] = 0;
    return buffer;
  });
  const save = newGameSave();
  assert.ok(Number.isInteger(save.rngState) && save.rngState > 0 && save.rngState <= 0xffffffff);
  assert.equal(validateSave(save).valid, true);
});
