import assert from 'node:assert/strict';
import test from 'node:test';
import { collectIceTiles, iceSlideContinues } from '../../src/core/world/ice-movement.ts';
import { adjacentGridPoint, tryGridMove } from '../../src/core/world/grid-movement.ts';

const surface = (x: number, y: number, width: number, height: number) => ({
  x: x * 32, y: y * 32, width: width * 32, height: height * 32,
  properties: [{ name: 'surface', value: 'ice' }],
});

test('Tiled surfaces use the world grid, merge overlaps and leave dry tiles alone', () => {
  const ice = collectIceTiles([surface(1, 1, 2, 2), surface(2, 2, 1, 1)], 5, 5);
  assert.deepEqual([...ice].sort(), ['1,1', '1,2', '2,1', '2,2']);
  assert.deepEqual(collectIceTiles([], 5, 5), new Set());
  assert.equal(iceSlideContinues({x: 0, y: 1}, 'right', 5, 5, new Set(), ice), false);
});

test('ice stops before a wall or map boundary and on the first dry tile in every direction', () => {
  for (const direction of ['up', 'down', 'left', 'right'] as const) {
    const ice = collectIceTiles([surface(1, 1, 3, 3)], 5, 5);
    const blocked = new Set<string>();
    let position = {x: 2, y: 2};
    let steps = 0;
    while (iceSlideContinues(position, direction, 5, 5, blocked, ice)) {
      const move = tryGridMove(position, direction, 5, 5, blocked);
      assert.equal(move.moved, true);
      position = move.position;
      assert.ok(++steps < 5, 'sliding must stop');
    }
    assert.equal(steps, 2);
    assert.equal(ice.has(`${position.x},${position.y}`), false);
    const wall = adjacentGridPoint({x:2,y:2}, direction);
    assert.equal(iceSlideContinues({x: 2, y: 2}, direction, 5, 5,
      new Set([`${wall.x},${wall.y}`]), ice), false);
  }
  assert.equal(iceSlideContinues({x:0,y:0}, 'up', 1, 1, new Set(), new Set(['0,0'])), false);
});

test('a stopped ice position can choose a new direction instead of becoming trapped', () => {
  const ice = collectIceTiles([surface(1, 1, 3, 3)], 5, 5);
  const blocked = new Set(['3,2']);
  assert.equal(iceSlideContinues({x:2,y:2}, 'right', 5, 5, blocked, ice), false);
  assert.equal(tryGridMove({x:2,y:2}, 'up', 5, 5, blocked).moved, true);
});

test('bad surface authoring fails instead of silently changing collision or grid geometry', () => {
  for (const object of [{...surface(0,0,1,1),x:1}, surface(-1,0,1,1), surface(4,4,2,2),
    surface(1,1,0,1), {...surface(0,0,1,1),rotation:90}, {...surface(0,0,1,1),ellipse:true},
    {...surface(0,0,1,1),properties:[{name:'surface',value:'water'}]}]) {
    assert.throws(() => collectIceTiles([object], 5, 5), /Movement surfaces/);
  }
  assert.throws(() => collectIceTiles([], 0, 5), /dimensions/);
});
