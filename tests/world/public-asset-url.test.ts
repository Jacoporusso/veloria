import assert from 'node:assert/strict';
import test from 'node:test';
import { publicAssetUrl } from '../../src/core/assets/index.ts';

test('public assets resolve beneath root and subpath Vite bases', () => {
  assert.equal(publicAssetUrl('assets/sprites/tree.png', '/'), '/assets/sprites/tree.png');
  assert.equal(publicAssetUrl('/assets/sprites/tree.png', '/Veloria/'), '/Veloria/assets/sprites/tree.png');
  assert.equal(publicAssetUrl('tilemaps/forest.tmj', './'), './tilemaps/forest.tmj');
});

test('public asset resolution rejects paths that escape the configured base', () => {
  assert.throws(() => publicAssetUrl('../secret.json', '/Veloria/'), /Invalid public asset path/);
  assert.throws(() => publicAssetUrl('', '/'), /Invalid public asset path/);
});
