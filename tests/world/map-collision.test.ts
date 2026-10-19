import assert from 'node:assert/strict';
import test from 'node:test';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';

test('a completed sluice opens its authored cells after flags are serialized', () => {
  const walls = [{ x: 0, y: 0, width: 32, height: 64 }];
  const gate = { x: 32, y: 0, width: 32, height: 64,
    properties: [{ name: 'blocksUntilFlag', value: 'sluice_open' }] };
  const objects = [...walls, gate];
  const before = structuredClone(objects);
  assert.deepEqual([...collectMapCollision(objects, 3, 2, [])].sort(), ['0,0', '0,1', '1,0', '1,1']);
  const flags = JSON.parse(JSON.stringify(['sluice_open']));
  assert.deepEqual([...collectMapCollision(objects, 3, 2, flags)].sort(), ['0,0', '0,1']);
  assert.deepEqual(objects, before);
  assert.deepEqual(flags, ['sluice_open']);
});

test('an open gate never removes a fixed wall overlapping its footprint', () => {
  const gate = { x: 32, y: 32, width: 64, height: 32, properties: { blocksUntilFlag: 'open' } };
  const wall = { x: 64, y: 32, width: 32, height: 32 };
  assert.deepEqual([...collectMapCollision([gate, wall], 4, 3, ['open'])], ['2,1']);
  assert.deepEqual([...collectMapCollision([wall, gate], 4, 3, ['unrelated'])].sort(), ['1,1', '2,1']);
});

test('collision clipping and default tile rectangles preserve map bounds', () => {
  assert.deepEqual([...collectMapCollision([{ x: -32, y: -32, width: 96, height: 96 }], 2, 2, [])].sort(),
    ['0,0', '0,1', '1,0', '1,1']);
  assert.deepEqual([...collectMapCollision([{}], 2, 2, [])], ['0,0']);
  assert.deepEqual([...collectMapCollision([{ x: 128, y: 128 }], 2, 2, [])], []);
});

test('invalid gate flags and bounds fail authoring even when the gate would be open', () => {
  assert.throws(() => collectMapCollision([{ properties: { blocksUntilFlag: '' } }], 2, 2, []), /blocksUntilFlag/);
  assert.throws(() => collectMapCollision([{ properties: [{ name: 'blocksUntilFlag', value: 3 }] }], 2, 2, []), /blocksUntilFlag/);
  assert.throws(() => collectMapCollision([{ x: NaN, properties: { blocksUntilFlag: 'open' } }], 2, 2, ['open']), /finite/);
  assert.throws(() => collectMapCollision([], 0, 2, []), /dimensions/);
});
