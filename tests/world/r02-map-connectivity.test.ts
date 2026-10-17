import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

type MapDefinition = {
  id: string;
  tiledAsset: string;
  spawns: { id: string; x: number; y: number }[];
  connections: { toMapId: string; viaSpawnId: string; targetSpawnId: string }[];
};

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const root = process.cwd();
const definitions = new Map<string, MapDefinition>();
for (const filename of ['d01_bosco_veli', 'r02_viale_fronde', 'c01_brumalta']) {
  const map = readJson<MapDefinition>(`${root}/content/maps/${filename}.map.json`);
  definitions.set(map.id, map);
}

function layersFor(map: MapDefinition) {
  const tiled = readJson<any>(`${root}/public/${map.tiledAsset}`);
  return { tiled, layers: Object.fromEntries(tiled.layers.map((layer: any) => [layer.name, layer])) };
}

function isExitReachable(map: MapDefinition, targetMapId: string, targetSpawnId: string): boolean {
  const { tiled, layers } = layersFor(map);
  const connection = map.connections.find(edge => edge.toMapId === targetMapId && edge.targetSpawnId === targetSpawnId);
  if (!connection) return false;
  const spawn = map.spawns.find(item => item.id === connection.viaSpawnId);
  if (!spawn) return false;
  const trigger = layers.triggers.objects.find((item: any) => {
    const properties = Object.fromEntries((item.properties ?? []).map((property: any) => [property.name, property.value]));
    return properties.kind === 'map-exit'
      && properties.destinationMapId === targetMapId
      && properties.destinationSpawnId === targetSpawnId;
  });
  if (!trigger) return false;

  const blocked = new Set<string>();
  for (const object of layers.collision.objects) {
    const left = Math.max(0, Math.floor(object.x / 32));
    const top = Math.max(0, Math.floor(object.y / 32));
    const right = Math.min(tiled.width, Math.ceil((object.x + Math.max(1, object.width ?? 32)) / 32));
    const bottom = Math.min(tiled.height, Math.ceil((object.y + Math.max(1, object.height ?? 32)) / 32));
    for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) blocked.add(`${x},${y}`);
  }
  const start = `${spawn.x},${spawn.y}`;
  if (blocked.has(start)) return false;
  const left = Math.max(0, Math.floor(trigger.x / 32));
  const top = Math.max(0, Math.floor(trigger.y / 32));
  const right = Math.min(tiled.width, Math.ceil((trigger.x + Math.max(1, trigger.width ?? 32)) / 32));
  const bottom = Math.min(tiled.height, Math.ceil((trigger.y + Math.max(1, trigger.height ?? 32)) / 32));
  const targets = new Set<string>();
  for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) {
    const point = `${x},${y}`;
    if (!blocked.has(point)) targets.add(point);
  }
  const pending = [start];
  const visited = new Set(pending);
  while (pending.length) {
    const point = pending.shift()!;
    if (targets.has(point)) return true;
    const [x, y] = point.split(',').map(Number);
    for (const next of [`${x},${y - 1}`, `${x + 1},${y}`, `${x},${y + 1}`, `${x - 1},${y}`]) {
      const [nx, ny] = next.split(',').map(Number);
      if (nx < 0 || ny < 0 || nx >= tiled.width || ny >= tiled.height || blocked.has(next) || visited.has(next)) continue;
      visited.add(next);
      pending.push(next);
    }
  }
  return false;
}

test('R02 connects the existing forest and city maps with reciprocal spawn IDs', () => {
  const forestId = 'veloria/d01_bosco_veli';
  const routeId = 'veloria/r02_viale_fronde';
  const cityId = 'veloria/brumalta';
  const route = definitions.get(routeId)!;
  const forest = definitions.get(forestId)!;
  const city = definitions.get(cityId)!;

  assert.deepEqual(route.connections.map(({ toMapId, viaSpawnId, targetSpawnId }) => ({ toMapId, viaSpawnId, targetSpawnId })), [
    { toMapId: forestId, viaSpawnId: 'from_bosco', targetSpawnId: 'to_r02' },
    { toMapId: cityId, viaSpawnId: 'to_brumalta', targetSpawnId: 'from_r02' },
  ]);
  assert.ok(forest.spawns.some(spawn => spawn.id === 'to_r02' && spawn.x === 29 && spawn.y === 10));
  assert.ok(forest.spawns.some(spawn => spawn.id === 'to_brumalta' && spawn.x === 29 && spawn.y === 10));
  assert.ok(forest.connections.some(edge => edge.toMapId === routeId && edge.viaSpawnId === 'to_r02' && edge.targetSpawnId === 'from_bosco'));
  assert.ok(city.connections.some(edge => edge.toMapId === routeId && edge.viaSpawnId === 'from_r02' && edge.targetSpawnId === 'to_brumalta'));
});

test('each R02 exit is walkable from its authored entry spawn', () => {
  const route = definitions.get('veloria/r02_viale_fronde')!;
  for (const connection of route.connections) {
    assert.equal(isExitReachable(route, connection.toMapId, connection.targetSpawnId), true,
      `${route.id} ${connection.viaSpawnId} → ${connection.toMapId}/${connection.targetSpawnId}`);
  }
});

test('forest and Brumalta exits reach the R02 entry points', () => {
  assert.equal(isExitReachable(definitions.get('veloria/d01_bosco_veli')!, 'veloria/r02_viale_fronde', 'from_bosco'), true);
  assert.equal(isExitReachable(definitions.get('veloria/brumalta')!, 'veloria/r02_viale_fronde', 'to_brumalta'), true);
});
