import assert from 'node:assert/strict';
import test from 'node:test';
import { checksumJson, verifyChecksum } from '../../src/persistence/save-integrity.ts';

test('save checksum is stable across object key order and detects accidental changes', () => {
  const first = { player: { x: 3, y: 8 }, inventory: { potion: 2, ball: 1 } };
  const reordered = { inventory: { ball: 1, potion: 2 }, player: { y: 8, x: 3 } };
  const checksum = checksumJson(first);

  assert.match(checksum, /^fnv1a32-[0-9a-f]{8}$/);
  assert.equal(checksumJson(reordered), checksum);
  assert.equal(verifyChecksum(reordered, checksum), true);
  assert.equal(verifyChecksum({ ...reordered, player: { x: 4, y: 8 } }, checksum), false);
  assert.equal(verifyChecksum(reordered, undefined), false);
});

test('optional undefined object fields hash identically before and after a JSON backup round trip', () => {
  const before = { party: [{ speciesId: 25, status: undefined }], status: { status: 'poison', turnsRemaining: undefined } };
  const restored = JSON.parse(JSON.stringify(before));
  assert.equal(checksumJson(before), checksumJson(restored));
  assert.equal(verifyChecksum(restored, checksumJson(before)), true);
  assert.throws(() => checksumJson(undefined), /non-JSON/);
  assert.throws(() => checksumJson([undefined]), /non-JSON/);
});
