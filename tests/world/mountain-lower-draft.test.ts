import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const drafts = path.join(root, 'content/drafts/mountain/lower');
const read = (name: string) => JSON.parse(fs.readFileSync(path.join(drafts, name), 'utf8'));
const maps = {
  r12: { data: read('r12_valle_vento.map.json'), tiled: read('r12_valle_vento.tmj') },
  village: { data: read('passobrina.map.json'), tiled: read('passobrina.tmj') },
};

function blocked(tiled: any) {
  return new Set(tiled.layers.find((layer: any) => layer.name === 'collision').objects.flatMap((object: any) => {
    const x = object.x / 32, y = object.y / 32, width = object.width / 32, height = object.height / 32;
    return Array.from({ length: width * height }, (_, index) => `${x + index % width},${y + Math.floor(index / width)}`);
  }));
}

function reachable(tiled: any, starts: Array<{ x: number; y: number }>) {
  const walls = blocked(tiled), seen = new Set<string>(), pending = [...starts];
  while (pending.length) {
    const point = pending.shift()!, key = `${point.x},${point.y}`;
    if (seen.has(key) || walls.has(key) || point.x < 0 || point.y < 0 || point.x >= 40 || point.y >= 30) continue;
    seen.add(key);
    pending.push({ x: point.x + 1, y: point.y }, { x: point.x - 1, y: point.y }, { x: point.x, y: point.y + 1 }, { x: point.x, y: point.y - 1 });
  }
  return seen;
}

function adjacentTo(reached: Set<string>, x: number, y: number) {
  return [[x, y], [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([a, b]) => reached.has(`${a},${b}`));
}

test('mountain lower draft dimensions, exits, and walkable service/interactions', () => {
  for (const { data, tiled } of Object.values(maps)) {
    assert.equal(tiled.width, 40);
    assert.equal(tiled.height, 30);
    assert.equal(tiled.tilewidth, 32);
    assert.equal(tiled.tileheight, 32);
    const reached = reachable(tiled, data.spawns);
    for (const object of tiled.layers.find((layer: any) => layer.name === 'interactions').objects) {
      assert.ok(adjacentTo(reached, object.x / 32, object.y / 32), `${data.id}: interaction ${object.name} is reachable`);
    }
    for (const object of tiled.layers.find((layer: any) => layer.name === 'triggers').objects.filter((item: any) => item.properties.some((property: any) => property.value === 'encounter-zone'))) {
      const x = object.x / 32, y = object.y / 32, w = object.width / 32, h = object.height / 32;
      for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) assert.ok(reached.has(`${x + dx},${y + dy}`), 'habitat remains optional and off the required route');
    }
  }
});

test('R12 has a two-tile-wide main route that bypasses optional habitat and reaches both readings', () => {
  const { data, tiled } = maps.r12, walls = blocked(tiled), reached = reachable(tiled, [{ x: 1, y: 23 }]);
  const waypoints = [[1, 23], [8, 23], [12, 23], [12, 22], [13, 22], [13, 15], [15, 15], [15, 13], [23, 13], [24, 13], [24, 7], [26, 7], [26, 5], [38, 5]];
  const pathCells: Array<[number, number]> = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [x1, y1] = waypoints[i], [x2, y2] = waypoints[i + 1];
    assert.ok(x1 === x2 || y1 === y2, 'route waypoint segments are orthogonal');
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let step = 0; step <= steps; step++) pathCells.push([x1 + Math.sign(x2 - x1) * step, y1 + Math.sign(y2 - y1) * step]);
  }
  for (const [x, y] of pathCells) {
    assert.ok(reached.has(`${x},${y}`), `main path contains reachable tile ${x},${y}`);
    assert.ok(!walls.has(`${x},${y}`), `main path is clear at ${x},${y}`);
    if (x > 1 && x < 38) {
      assert.ok(![...walls].some(key => { const [a,b] = key.split(',').map(Number); return Math.abs(a-x)+Math.abs(b-y) === 1; }), 'declared route centerline retains at least a two-tile corridor outside the one-tile portal thresholds');
    }
  }
  for (const object of tiled.layers.find((layer: any) => layer.name === 'triggers').objects.filter((item: any) => item.properties.some((property: any) => property.value === 'encounter-zone'))) {
    const x = object.x / 32, y = object.y / 32, w = object.width / 32, h = object.height / 32;
    assert.ok(!pathCells.some(([px, py]) => px >= x && px < x + w && py >= y && py < y + h), 'main path avoids optional habitats');
  }
  assert.equal(data.encounterTableIds[0], 'veloria/r12_wind_patch');
  const portals = tiled.layers.find((layer: any) => layer.name === 'triggers').objects.filter((item: any) => item.properties.some((property: any) => property.value === 'map-exit'));
  assert.ok(portals.some((portal: any) => portal.x / 32 === 0 && portal.y / 32 === 23));
  assert.ok(portals.some((portal: any) => portal.x / 32 === 39 && portal.y / 32 === 5));
});

test('R12 and Passobrina exits point back to matching reciprocal spawns', () => {
  for (const [from, to, exitName, returnName] of [[maps.r12, maps.village, 'Passobrina', 'Valle del Vento'], [maps.village, maps.r12, 'Valle del Vento', 'Passobrina']] as const) {
    const exit = from.tiled.layers.find((layer: any) => layer.name === 'triggers').objects.find((item: any) => item.name === exitName);
    assert.ok(exit);
    const props = Object.fromEntries(exit.properties.map((property: any) => [property.name, property.value]));
    assert.equal(props.destinationMapId, to.data.id);
    assert.ok(to.data.spawns.some((spawn: any) => spawn.id === props.destinationSpawnId));
    const connection = from.data.connections.find((item: any) => item.toMapId === props.destinationMapId && item.targetSpawnId === props.destinationSpawnId);
    assert.ok(connection);
    const sourceSpawn = from.data.spawns.find((spawn: any) => spawn.id === connection.viaSpawnId);
    assert.ok(sourceSpawn, 'every connection viaSpawnId resolves to a local spawn');
    assert.equal(sourceSpawn.y, Number(exit.y) / 32);
    assert.equal(Math.abs(sourceSpawn.x - Number(exit.x) / 32), 1, 'portal connection spawn is adjacent to the matching boundary exit');
    assert.ok(to.tiled.layers.find((layer: any) => layer.name === 'triggers').objects.some((item: any) => item.name === returnName && item.properties.some((property: any) => property.name === 'destinationMapId' && property.value === from.data.id)));
  }
  const gate = maps.village.tiled.layers.find((layer: any) => layer.name === 'triggers').objects.find((item: any) => item.name === 'Tornanti Bianchi');
  assert.ok(gate.properties.some((property: any) => property.name === 'requiredFlag' && property.value === 'q_passobrina_report'));
});
