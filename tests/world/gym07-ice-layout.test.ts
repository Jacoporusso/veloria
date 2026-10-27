import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { collectIceTiles, iceSlideContinues } from '../../src/core/world/ice-movement.ts';
import { tryGridMove, type CardinalDirection, type GridPoint } from '../../src/core/world/grid-movement.ts';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';

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

test('runtime ice gym rectangles match the designed maze, with only the completed gate removed', () => {
  const tiled = JSON.parse(readFileSync(new URL('../../public/tilemaps/gym07_biancavetta.tmj', import.meta.url), 'utf8'));
  const objects = tiled.layers.find((layer: any) => layer.name === 'collision').objects;
  assert.deepEqual([...collectIceTiles(tiled.layers.find((layer: any) => layer.name === 'movement_surfaces').objects, width, height)].sort(), [...ice].sort());
  const closed = collectMapCollision(objects, width, height, []);
  assert.deepEqual([...closed].sort(), [...blocked].sort(), 'runtime must use the complete design walls, not single-cell anchors');
  const open = collectMapCollision(objects, width, height, ['gym07_ice_complete']);
  const expectedOpen = new Set(blocked);
  for (let x = 14; x <= 18; x++) expectedOpen.delete(`${x},2`);
  assert.deepEqual([...open].sort(), [...expectedOpen].sort());
  assert.equal(closed.size, 462);
  assert.equal(open.size, 457);
  const markers = tiled.layers.find((layer: any) => layer.name === 'decorations').objects.filter((o: any) => o.properties?.some((p: any) => p.name === 'kind' && p.value === 'quest-sigil'));
  assert.deepEqual(markers.map((o: any) => ({ x: o.x / 32, y: o.y / 32,
    flag: o.properties.find((p: any) => p.name === 'activatedFlag').value })),
    layout.sigils.map(sigil => ({ ...sigil.landing, flag: `gym07_ice_${sigil.id}` })));
});

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
test('no sigil can be reached by walking only on dry ground', () => {
 const seen=new Set([key(layout.spawn)]),queue=[layout.spawn];
 for(let i=0;i<queue.length;i++)for(const direction of ['up','down','left','right'] as const){
  const next=tryGridMove(queue[i],direction,width,height,blocked);
  if(!next.moved||ice.has(key(next.position))||seen.has(key(next.position)))continue;
  seen.add(key(next.position));queue.push(next.position);
 }
 for(const sigil of layout.sigils)assert.equal(seen.has(key(sigil.landing)),false,`${sigil.id} must require ice traversal`);
});
