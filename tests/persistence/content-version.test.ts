import assert from 'node:assert/strict';
import test from 'node:test';
import { contentManifest } from '../../src/core/content/index.ts';
import { newGameSave } from '../../src/persistence/save-store.ts';

test('new saves use the version declared by the content manifest', () => {
  assert.equal(contentManifest.manifestVersion, 1);
  assert.match(contentManifest.contentVersion, /^veloria-content-/);
  assert.equal(newGameSave().contentVersion, contentManifest.contentVersion);
});
