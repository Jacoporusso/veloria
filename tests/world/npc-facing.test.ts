import assert from 'node:assert/strict';
import test from 'node:test';
import { directionTowardObserver } from '../../src/core/world/npc-facing.ts';

test('an NPC faces the observer in each cardinal direction', () => {
  const npc = { x: 4, y: 7 };
  assert.equal(directionTowardObserver(npc, { x: 4, y: 2 }), 'up');
  assert.equal(directionTowardObserver(npc, { x: 4, y: 12 }), 'down');
  assert.equal(directionTowardObserver(npc, { x: 1, y: 7 }), 'left');
  assert.equal(directionTowardObserver(npc, { x: 9, y: 7 }), 'right');
});

test('the larger coordinate delta wins and ties prefer the vertical axis', () => {
  const npc = { x: 2, y: 2 };
  assert.equal(directionTowardObserver(npc, { x: 8, y: 5 }), 'right');
  assert.equal(directionTowardObserver(npc, { x: 5, y: 8 }), 'down');
  assert.equal(directionTowardObserver(npc, { x: 5, y: 5 }), 'down');
  assert.equal(directionTowardObserver(npc, { x: 0, y: 0 }), 'up');
});

test('coincident coordinates preserve the current pose and inputs are not mutated', () => {
  const npc = { x: 6, y: 3 };
  const observer = { x: 6, y: 3 };
  const before = structuredClone({ npc, observer });
  assert.equal(directionTowardObserver(npc, observer), undefined);
  assert.deepEqual({ npc, observer }, before);
});

test('non-finite grid coordinates are rejected', () => {
  const valid = { x: 0, y: 0 };
  for (const point of [{ x: NaN, y: 0 }, { x: 0, y: Infinity }, { x: -Infinity, y: 0 }]) {
    assert.throws(() => directionTowardObserver(point, valid), /finite/);
    assert.throws(() => directionTowardObserver(valid, point), /finite/);
  }
});
