import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { collectIceTiles, iceSlideContinues } from '../../src/core/world/ice-movement.ts';
import { tryGridMove, type CardinalDirection, type GridPoint } from '../../src/core/world/grid-movement.ts';

interface Layout {
  grid: { width: number; height: number; tileSize: number };
  spawn: GridPoint;
  exit: GridPoint;
  collision: Array<{ x: number; y: number; width: number; height: number }>;
  movementSurfaces: Array<{ x: number; y: number; width: number; height: number; properties: { surface: string } }>;
  sigils: Array<{ id: string; landing: GridPoint; entry: GridPoint; direction: CardinalDirection }>;
  solution: Array<{ sigil: string; actions: CardinalDirection[]; landing: GridPoint }>;
}
const layout = JSON.parse(readFileSync(new URL('../../content/drafts/mountain/gym07_ice.layout.json', import.meta.url), 'utf8')) as Layout;
const { width, height, tileSize } = layout.grid;
const ice = collectIceTiles(layout.movementSurfaces.map(surface => ({
  x: surface.x * tileSize, y: surface.y * tileSize,
  width: surface.width * tileSize, height: surface.height * tileSize,
  properties: [{ name: 'surface', value: surface.properties.surface }],
})), width, height);
const blocked = new Set<string>();
for (const rect of layout.collision) {
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) blocked.add(`${x},${y}`);
  }
}
const key = (point: GridPoint) => `${point.x},${point.y}`;

/** Apply one player direction and finish all momentum before returning a stoppable state. */
function takeAction(position: GridPoint, direction: CardinalDirection): GridPoint | null {
  const first = tryGridMove(position, direction, width, height, blocked);
  if (!first.moved) return null;
  let current = first.position;
  let steps = 0;
  while (iceSlideContinues(current, direction, width, height, blocked, ice)) {
    const next = tryGridMove(current, direction, width, height, blocked);
    assert.equal(next.moved, true);
    current = next.position;
    assert.ok(++steps <= width + height, 'ice slide must terminate');
  }
  return current;
}
function reachableStops(start: GridPoint): Map<string, GridPoint> {
  const states = new Map([[key(start), start]]);
  const queue = [start];
  for (let index = 0; index < queue.length; index++) {
    const position = queue[index]!;
    for (const direction of ['up', 'down', 'left', 'right'] as const) {
      const destination = takeAction(position, direction);
      if (!destination) continue;
      const destinationKey = key(destination);
      if (!states.has(destinationKey)) {
        states.set(destinationKey, destination);
        queue.push(destination);
      }
    }
  }
  return states;
}
function canReachExit(start: GridPoint): boolean {
  return reachableStops(start).has(key(layout.exit));
}

test('Gym07 draft solution in JSON reaches each sigil using complete forced slides', () => {
  assert.deepEqual(layout.sigils.map(sigil => sigil.id), ['west', 'center', 'east']);
  let position: GridPoint = { x: layout.spawn.x, y: layout.spawn.y };
  for (const step of layout.solution) {
    assert.equal(step.sigil, layout.sigils[layout.solution.indexOf(step)]?.id);
    for (const direction of step.actions) {
      const destination = takeAction(position, direction);
      assert.ok(destination, `blocked ${direction} action from ${key(position)}`);
      position = destination;
    }
    assert.deepEqual(position, step.landing, `${step.sigil} solution must end on its declared landing`);
    assert.deepEqual(position, layout.sigils.find(sigil => sigil.id === step.sigil)?.landing);
  }
});

test('every stoppable state reachable from the spawn can return to the exit', () => {
  const stops = reachableStops(layout.spawn);
  assert.ok(stops.size > 0);
  for (const [positionKey, position] of stops) {
    assert.equal(canReachExit(position), true, `reachable stopped position ${positionKey} must return to exit`);
  }
  for (const sigil of layout.sigils) {
    assert.ok(stops.has(key(sigil.landing)), `${sigil.id} landing must be reachable`);
  }
});
