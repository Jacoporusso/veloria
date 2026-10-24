import assert from 'node:assert/strict';
import test from 'node:test';
import { inTrainerPolygon, removeMaskSpecks, trainerPoseMask } from '../../src/game/rendering/trainer-pose-masks.ts';

test('face masks follow walk phases and are absent on the back of every hairstyle', () => {
  for (const style of ['short', 'curly', 'long'] as const) {
    assert.notDeepEqual(trainerPoseMask(style, 0).eyes, trainerPoseMask(style, 1).eyes);
    for (let pose = 0; pose < 16; pose++) {
      const mask = trainerPoseMask(style, pose);
      assert.equal(mask.eyes.length, pose < 4 ? 2 : pose < 12 ? 1 : 0);
      assert.equal(mask.beard.length > 0, pose < 12);
      assert.ok(mask.bags.length > 0);
      for (const [x, y] of [...mask.eyes, ...mask.beard, ...mask.bags.flat()]) assert.ok(x >= 0 && x < 192 && y >= 0 && y < 240);
    }
  }
});

test('material polygon includes the lower backpack without including adjacent hands', () => {
  const bag = trainerPoseMask('short', 13).bags[0];
  assert.equal(inTrainerPolygon(96, 164, bag), true);
  assert.equal(inTrainerPolygon(54, 150, bag), false);
  assert.equal(inTrainerPolygon(139, 150, bag), false);
});

test('speck removal preserves contiguous material and does not join unrelated row edges', () => {
  const mask = new Uint8Array(30);
  for (const index of [0, 1, 2, 5, 6, 7, 10, 11, 12, 19, 20, 24]) mask[index] = 1;
  removeMaskSpecks(mask, 5, 3);
  assert.deepEqual([...mask.entries()].filter(([, value]) => value).map(([i]) => i), [0, 1, 2, 5, 6, 7, 10, 11, 12]);
});
