import assert from 'node:assert/strict';
import test from 'node:test';
import { validateNpcIdleViews } from '../../src/core/world/npc-idle-views.ts';

function validViews() {
  return {
    up: { assetKey: 'ada-up', origin: { x: 0.5, y: 0.9 }, displaySize: 1 },
    down: { assetKey: 'ada-down', origin: { x: 0.5, y: 0.9 }, displaySize: 1 },
    left: { assetKey: 'ada-left', origin: { x: 0.5, y: 0.9 }, displaySize: 1 },
    right: { assetKey: 'ada-right', origin: { x: 0.5, y: 0.9 }, displaySize: 1 },
  };
}

const knownAssets = new Set(['ada-up', 'ada-down', 'ada-left', 'ada-right']);

test('valid directional idle views are copied without mutating authored data', () => {
  const views = validViews();
  const before = structuredClone(views);
  for (const view of Object.values(views)) {
    Object.freeze(view.origin);
    Object.freeze(view);
  }
  Object.freeze(views);
  const validated = validateNpcIdleViews(views, knownAssets);
  assert.deepEqual(validated, before);
  assert.notStrictEqual(validated, views);
  assert.notStrictEqual(validated.up, views.up);
  assert.notStrictEqual(validated.up.origin, views.up.origin);
  assert.deepEqual(views, before);
});

test('direction keys must include all four cardinal views and reject extras', () => {
  const missing = validViews();
  delete (missing as Partial<typeof missing>).left;
  assert.throws(() => validateNpcIdleViews(missing, knownAssets), /exactly up, down, left, right.*missing: left/);

  const extra = { ...validViews(), northeast: { assetKey: 'ada-up', origin: { x: 0.5, y: 0.9 }, displaySize: 1 } };
  assert.throws(() => validateNpcIdleViews(extra, knownAssets), /unexpected: northeast/);
  assert.throws(() => validateNpcIdleViews(null, knownAssets), /object keyed by direction/);
});

test('asset keys must be non-empty, known, and distinct for every direction', () => {
  const unknown = validViews();
  unknown.up.assetKey = 'ada-sideways';
  assert.throws(() => validateNpcIdleViews(unknown, knownAssets), /unknown assetKey "ada-sideways"/);

  const repeated = validViews();
  repeated.right.assetKey = repeated.left.assetKey;
  assert.throws(() => validateNpcIdleViews(repeated, knownAssets), /is repeated/);

  const empty = validViews();
  empty.down.assetKey = '  ';
  assert.throws(() => validateNpcIdleViews(empty, knownAssets), /non-empty string/);
});

test('origins require finite coordinates in the inclusive zero-to-one range', () => {
  const invalidCoordinates = [NaN, Infinity, -Infinity, -0.01, 1.01];
  for (const coordinate of invalidCoordinates) {
    const x = validViews();
    x.up.origin.x = coordinate;
    assert.throws(() => validateNpcIdleViews(x, knownAssets), /origin x and y.*0 to 1/);
    const y = validViews();
    y.down.origin.y = coordinate;
    assert.throws(() => validateNpcIdleViews(y, knownAssets), /origin x and y.*0 to 1/);
  }
  const endpoints = validViews();
  endpoints.up.origin = { x: 0, y: 1 };
  assert.equal(validateNpcIdleViews(endpoints, knownAssets).up.origin.y, 1);
});

test('display sizes must be finite positive numbers', () => {
  for (const size of [0, -1, NaN, Infinity, -Infinity]) {
    const views = validViews();
    views.left.displaySize = size;
    assert.throws(() => validateNpcIdleViews(views, knownAssets), /displaySize must be a finite number greater than 0/);
  }
});
