import assert from 'node:assert/strict';
import test from 'node:test';
import { adjacentGridPoint, isGridTileOpen, isInsideGrid, tryGridMove } from '../../src/core/world/grid-movement.ts';

test('cardinal movement returns a new adjacent grid position', () => {
  const origin = { x: 4, y: 3 };
  assert.deepEqual(adjacentGridPoint(origin, 'up'), { x: 4, y: 2 });
  assert.deepEqual(adjacentGridPoint(origin, 'down'), { x: 4, y: 4 });
  assert.deepEqual(adjacentGridPoint(origin, 'left'), { x: 3, y: 3 });
  assert.deepEqual(adjacentGridPoint(origin, 'right'), { x: 5, y: 3 });
  assert.deepEqual(origin, { x: 4, y: 3 });
});

test('grid bounds include the first tile and exclude negative or fractional coordinates', () => {
  assert.equal(isInsideGrid({ x: 0, y: 0 }, 8, 6), true);
  assert.equal(isInsideGrid({ x: 7, y: 5 }, 8, 6), true);
  assert.equal(isInsideGrid({ x: -1, y: 0 }, 8, 6), false);
  assert.equal(isInsideGrid({ x: 1.5, y: 0 }, 8, 6), false);
});

test('movement rejects map edges and collision tiles without changing the current position', () => {
  const current = { x: 0, y: 0 };
  const blocked = new Set(['1,0']);
  assert.deepEqual(tryGridMove(current, 'up', 4, 4, blocked), { moved: false, reason: 'outside-map', position: current });
  assert.deepEqual(tryGridMove(current, 'right', 4, 4, blocked), { moved: false, reason: 'blocked', position: current });
  assert.deepEqual(tryGridMove(current, 'down', 4, 4, blocked), { moved: true, position: { x: 0, y: 1 } });
  assert.deepEqual(current, { x: 0, y: 0 });
  assert.equal(isGridTileOpen(current, 4, 4, blocked), true);
  assert.equal(isGridTileOpen({ x: 1, y: 0 }, 4, 4, blocked), false);
  assert.equal(isGridTileOpen({ x: 4, y: 0 }, 4, 4, blocked), false);
});
