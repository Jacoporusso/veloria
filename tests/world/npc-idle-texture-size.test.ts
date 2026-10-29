import { test } from 'node:test';
import assert from 'node:assert/strict';
import { npcIdleTextureSize } from '../../src/game/rendering/npc-idle-texture-size.ts';

test('Ada and Elia idle surfaces fit the world budget with their exact source ratios', () => {
  assert.deepEqual(npcIdleTextureSize(1254, 1254), { width: 512, height: 512 });
  assert.deepEqual(npcIdleTextureSize(1024, 1536), { width: 340, height: 510 });
  assert.deepEqual(npcIdleTextureSize(1536, 1024), { width: 510, height: 340 });
});

test('small images stay unchanged', () => {
  assert.deepEqual(npcIdleTextureSize(128, 256), { width: 128, height: 256 });
});

test('unusual ratios fit the budget using an unrounded image frame', () => {
  for (const [width, height] of [[1253, 1254], [1064, 1478], [1478, 1064], [997, 1000]]) {
    const size = npcIdleTextureSize(width, height);
    assert.equal(Math.max(size.width, size.height), 512);
    assert.ok(size.width <= width && size.height <= height);
    assert.ok(Math.abs(size.width / size.height - width / height) < Number.EPSILON * 4);
    assert.ok(Math.ceil(size.width) <= 512 && Math.ceil(size.height) <= 512);
  }
});

test('bounded surfaces preserve proportions and never enlarge either axis', () => {
  for (const ratio of [[1, 1], [2, 3], [4, 3], [4, 7]]) {
    for (const scale of [1, 64, 256, 512, 1024]) {
      const [w, h] = ratio.map(side => side * scale);
      const size = npcIdleTextureSize(w, h);
      assert.equal(size.width * h, size.height * w);
      assert.ok(size.width <= w && size.height <= h);
      assert.ok(Math.max(size.width, size.height) <= 512);
    }
  }
});

test('invalid dimensions or limits fail before a render surface can be allocated', () => {
  for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => npcIdleTextureSize(value, 100), /positive safe integers/);
    assert.throws(() => npcIdleTextureSize(100, value), /positive safe integers/);
    assert.throws(() => npcIdleTextureSize(100, 100, value), /positive safe integers/);
  }
});
