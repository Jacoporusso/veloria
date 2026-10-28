import assert from 'node:assert/strict';
import test from 'node:test';
import { npcAnimationPose, validateNpcWalkCycle } from '../../src/core/world/npc-animation.ts';
import { NPC_DIRECTIONS, validateNpcIdleViews } from '../../src/core/world/npc-idle-views.ts';

const pose = (assetKey: string) => ({ assetKey, origin: { x: .5, y: .9 }, displaySize: 64 });
const authoredIdle = Object.fromEntries(NPC_DIRECTIONS.map(direction => [direction, pose(`idle-${direction}`)]));
const authoredWalk = { frameDurationMs: 150,
  views: Object.fromEntries(NPC_DIRECTIONS.map(direction => [direction, [pose(`${direction}-a`), pose(`${direction}-b`)]])) };
const keys = new Set([...Object.values(authoredIdle).map(view => view.assetKey),
  ...Object.values(authoredWalk.views).flat().map(view => view.assetKey)]);
const idle = validateNpcIdleViews(authoredIdle, keys);

test('walk frames are copied with calibrated origins and authored input stays intact', () => {
  const before = structuredClone(authoredWalk);
  const cycle = validateNpcWalkCycle(authoredWalk, keys, idle);
  assert.deepEqual(cycle, authoredWalk);
  assert.notEqual(cycle.views.up[0], authoredWalk.views.up[0]);
  assert.notEqual(cycle.views.up[0].origin, authoredWalk.views.up[0].origin);
  assert.deepEqual(authoredWalk, before);
});

test('all directions alternate authentic frames at boundaries and wrap without changing the pose geometry', () => {
  const cycle = validateNpcWalkCycle(authoredWalk, keys, idle);
  for (const direction of NPC_DIRECTIONS) for (const [elapsed, index] of [[0, 0], [149, 0], [150, 1], [299, 1], [300, 0], [450, 1]]) {
    const selected = npcAnimationPose(idle, cycle, direction, true, elapsed, false);
    assert.equal(selected.motion, 'walk');
    assert.equal(selected.frameIndex, index);
    assert.deepEqual(selected.pose, cycle.views[direction][index]);
  }
});

test('stopping returns to the matching idle and an absent walk capability stays explicitly idle', () => {
  const cycle = validateNpcWalkCycle(authoredWalk, keys, idle);
  for (const direction of NPC_DIRECTIONS) {
    assert.deepEqual(npcAnimationPose(idle, cycle, direction, false, 150, false), { pose: idle[direction], motion: 'idle', frameIndex: 0 });
    assert.deepEqual(npcAnimationPose(idle, undefined, direction, true, 150, false), { pose: idle[direction], motion: 'idle', frameIndex: 0 });
  }
});

test('reduced motion holds an authentic step but still follows every direction', () => {
  const cycle = validateNpcWalkCycle(authoredWalk, keys, idle);
  for (const direction of NPC_DIRECTIONS) {
    assert.deepEqual(npcAnimationPose(idle, cycle, direction, true, 999, true), { pose: cycle.views[direction][0], motion: 'walk', frameIndex: 0 });
  }
});

test('walk capability rejects incomplete directions, single or sparse frames, and unknown assets', () => {
  const missing = structuredClone(authoredWalk); delete (missing.views as any).up;
  assert.throws(() => validateNpcWalkCycle(missing, keys, idle), /exactly up, down, left, right/);
  const single = structuredClone(authoredWalk); single.views.up = [pose('up-a')];
  assert.throws(() => validateNpcWalkCycle(single, keys, idle), /at least two/);
  const sparse = structuredClone(authoredWalk); sparse.views.up = new Array(2);
  assert.throws(() => validateNpcWalkCycle(sparse, keys, idle), /must be an object/);
  const unknown = structuredClone(authoredWalk); unknown.views.up[0].assetKey = 'missing';
  assert.throws(() => validateNpcWalkCycle(unknown, keys, idle), /unknown assetKey/);
});

test('walk capability cannot reuse idle artwork, duplicate another frame, or hide invalid geometry', () => {
  const duplicate = structuredClone(authoredWalk); duplicate.views.up[1] = duplicate.views.up[0];
  assert.throws(() => validateNpcWalkCycle(duplicate, keys, idle), /repeats an idle or another/);
  const repeatedIdle = structuredClone(authoredWalk); repeatedIdle.views.up[0] = pose('idle-up');
  assert.throws(() => validateNpcWalkCycle(repeatedIdle, keys, idle), /repeats an idle or another/);
  const badOrigin = structuredClone(authoredWalk); badOrigin.views.up[0].origin.y = 2;
  assert.throws(() => validateNpcWalkCycle(badOrigin, keys, idle), /origin x and y/);
  const badSize = structuredClone(authoredWalk); badSize.views.up[0].displaySize = -1;
  assert.throws(() => validateNpcWalkCycle(badSize, keys, idle), /displaySize/);
});

test('clock and schema errors fail authoring instead of selecting an undefined frame', () => {
  for (const frameDurationMs of [0, -1, NaN, Infinity]) {
    assert.throws(() => validateNpcWalkCycle({ ...authoredWalk, frameDurationMs }, keys, idle), /frameDurationMs/);
  }
  assert.throws(() => validateNpcWalkCycle({ ...authoredWalk, flipX: true }, keys, idle), /requires exactly/);
  for (const elapsed of [-1, NaN, Infinity]) assert.throws(() => npcAnimationPose(idle, undefined, 'up', true, elapsed, false), /elapsed time/);
  assert.throws(() => npcAnimationPose(idle, undefined, 'diagonal' as any, true, 0, false), /Unknown NPC direction/);
  const cycle = validateNpcWalkCycle({ ...authoredWalk, frameDurationMs: Number.MIN_VALUE }, keys, idle);
  assert.ok(npcAnimationPose(idle, cycle, 'up', true, Number.MAX_VALUE, false).pose);
});
