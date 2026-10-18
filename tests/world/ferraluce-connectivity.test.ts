import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

type Point = { id: string; x: number; y: number };
type Connection = { toMapId: string; viaSpawnId: string; targetSpawnId: string; requiresFlags?: string[] };
type MapDefinition = { id: string; tiledAsset: string; spawns: Point[]; connections: Connection[]; encounterTableIds?: string[] };
type TiledObject = { id: number; name?: string; x: number; y: number; width?: number; height?: number; properties?: { name: string; value: unknown }[] };
type TiledMap = { width: number; height: number; tilewidth: number; tileheight: number; layers: { name: string; type: string; objects?: TiledObject[] }[] };

const root = process.cwd();
const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const mapFiles = ['vetracielo', 'r06_anello_magnetico', 'ferraluce'];
const maps = new Map<string, MapDefinition>();
const tiledMaps = new Map<string, { tiled: TiledMap; layers: Map<string, TiledObject[]> }>();
for (const file of mapFiles) {
  const map = readJson<MapDefinition>(`${root}/content/maps/${file}.map.json`);
  const tiled = readJson<TiledMap>(`${root}/public/${map.tiledAsset}`);
  maps.set(map.id, map);
  tiledMaps.set(map.id, { tiled, layers: new Map(tiled.layers.filter(layer => layer.type === 'objectgroup').map(layer => [layer.name, layer.objects ?? []])) });
}

const properties = (object: TiledObject) => Object.fromEntries((object.properties ?? []).map(property => [property.name, property.value]));

function objectTiles(objects: TiledObject[], tiled: TiledMap): Set<string> {
  const result = new Set<string>();
  for (const object of objects) {
    const left = Math.max(0, Math.floor(object.x / tiled.tilewidth));
    const top = Math.max(0, Math.floor(object.y / tiled.tileheight));
    const right = Math.min(tiled.width, Math.ceil((object.x + Math.max(1, object.width ?? tiled.tilewidth)) / tiled.tilewidth));
    const bottom = Math.min(tiled.height, Math.ceil((object.y + Math.max(1, object.height ?? tiled.tileheight)) / tiled.tileheight));
    for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) result.add(`${x},${y}`);
  }
  return result;
}

function reachable(mapId: string, spawn: Point, avoidEncounterZones = true): Set<string> {
  const { tiled, layers } = tiledMaps.get(mapId)!;
  const blocked = objectTiles(layers.get('collision') ?? [], tiled);
  const forbidden = avoidEncounterZones
    ? objectTiles((layers.get('triggers') ?? []).filter(object => properties(object).kind === 'encounter-zone'), tiled)
    : new Set<string>();
  const start = `${spawn.x},${spawn.y}`;
  assert.equal(blocked.has(start), false, `${mapId}/${spawn.id} spawn is not blocked`);
  const pending = [start];
  const visited = new Set(pending);
  for (let index = 0; index < pending.length; index += 1) {
    const [x, y] = pending[index].split(',').map(Number);
    for (const [nx, ny] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
      const next = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= tiled.width || ny >= tiled.height || blocked.has(next) || forbidden.has(next) || visited.has(next)) continue;
      visited.add(next);
      pending.push(next);
    }
  }
  return visited;
}

function adjacentWalkableTiles(mapId: string, object: TiledObject): Set<string> {
  const { tiled, layers } = tiledMaps.get(mapId)!;
  const occupied = objectTiles([object], tiled);
  const blocked = objectTiles(layers.get('collision') ?? [], tiled);
  const result = new Set<string>();
  for (const point of occupied) {
    const [x, y] = point.split(',').map(Number);
    for (const [nx, ny] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
      const next = `${nx},${ny}`;
      if (nx >= 0 && ny >= 0 && nx < tiled.width && ny < tiled.height && !occupied.has(next) && !blocked.has(next)) result.add(next);
    }
  }
  return result;
}

function exitFor(mapId: string, destinationMapId: string): TiledObject {
  const exit = (tiledMaps.get(mapId)!.layers.get('triggers') ?? []).find(object => {
    const props = properties(object);
    return props.kind === 'map-exit' && props.destinationMapId === destinationMapId;
  });
  assert.ok(exit, `${mapId} has a Tiled exit to ${destinationMapId}`);
  return exit;
}

test('R06 and Ferraluce exits are reachable from every spawn and match reciprocal map metadata', () => {
  const vetracieloId = 'veloria/vetracielo';
  const routeId = 'veloria/r06_anello_magnetico';
  const cityId = 'veloria/ferraluce';
  const pairs = [
    [vetracieloId, routeId, 'from_r06', 'from_vetracielo', ['badge_circuito_awarded']],
    [routeId, vetracieloId, 'from_vetracielo', 'from_r06', []],
    [routeId, cityId, 'from_ferraluce', 'from_r06', []],
    [cityId, routeId, 'from_r06', 'from_ferraluce', []],
  ] as const;

  for (const [fromId, toId, viaSpawnId, targetSpawnId, requiredFlags] of pairs) {
    const from = maps.get(fromId)!;
    const edge = from.connections.find(connection => connection.toMapId === toId);
    assert.ok(edge, `${fromId} declares a connection to ${toId}`);
    assert.deepEqual([edge.viaSpawnId, edge.targetSpawnId, edge.requiresFlags], [viaSpawnId, targetSpawnId, requiredFlags]);
    assert.ok(maps.get(toId)!.spawns.some(spawn => spawn.id === targetSpawnId), `${toId} declares target spawn ${targetSpawnId}`);
    const exit = exitFor(fromId, toId);
    const expectedGeometry = fromId === routeId && toId === vetracieloId
      ? [0, 14, 1, 3]
      : fromId === cityId ? [0, 24, 1, 3] : [39, 24, 1, 3];
    assert.deepEqual([exit.x / 32, exit.y / 32, exit.width! / 32, exit.height! / 32], expectedGeometry, 'the transition is on its intended map edge in tile units');
    const props = properties(exit);
    assert.equal(props.destinationSpawnId, targetSpawnId);
    assert.deepEqual(props.requiredFlag, requiredFlags[0]);
    for (const spawn of from.spawns) {
      const walkable = reachable(fromId, spawn);
      assert.ok([...objectTiles([exit], tiledMaps.get(fromId)!.tiled)].some(tile => walkable.has(tile)), `${fromId}/${spawn.id} reaches the exit to ${toId} without entering encounter zones`);
    }
  }

  const route = maps.get(routeId)!;
  assert.deepEqual(route.encounterTableIds, ['veloria/r06_magnetic_patch']);
  const routeLayers = tiledMaps.get(routeId)!.layers;
  const sensor = (routeLayers.get('interactions') ?? []).find(object => properties(object).questEvent === 'r06/sensor/read');
  assert.ok(sensor, 'R06 declares the measurement sensor interaction');
  for (const spawn of route.spawns) {
    const walkable = reachable(routeId, spawn);
    assert.ok([...adjacentWalkableTiles(routeId, sensor)].some(tile => walkable.has(tile)), `${routeId}/${spawn.id} reaches the measurement sensor without entering encounter zones`);
  }
  const zones = (routeLayers.get('triggers') ?? []).filter(object => properties(object).kind === 'encounter-zone');
  assert.equal(zones.length, 4);
  assert.ok(zones.every(zone => properties(zone).encounterTableId === 'veloria/r06_magnetic_patch'));
});

test('the Ferraluce hall landmark has a solid collider across its full footprint', () => {
  const cityId = 'veloria/ferraluce';
  const { tiled, layers } = tiledMaps.get(cityId)!;
  const hall = (layers.get('decorations') ?? []).find(object => object.name === 'Sala delle Dinamo');
  assert.ok(hall, 'Ferraluce declares the Sala delle Dinamo landmark');
  assert.equal(properties(hall).kind, 'scenery-image');
  const collisionObjects = layers.get('collision') ?? [];
  const blocked = objectTiles(collisionObjects, tiled);
  const footprint = objectTiles([hall], tiled);
  const expectedCollider = new Set<string>();
  for (let y = 1; y <= 16; y += 1) for (let x = 8; x <= 31; x += 1) expectedCollider.add(`${x},${y}`);
  assert.ok([...expectedCollider].every(tile => blocked.has(tile)), 'hall structure remains solid across its declared footprint');
  assert.deepEqual([...footprint].sort(), [...expectedCollider].sort(), 'the landmark collider covers every tile under the rendered structure');
  for (const spawn of maps.get(cityId)!.spawns) {
    const walkable = reachable(cityId, spawn);
    for (const name of ['Addetta del Centro Ferraluce', 'Ivo', 'Mercante di Ferraluce', 'Palestra 4 · Acciaio']) {
      const object = [...(layers.get('characters') ?? []), ...(layers.get('interactions') ?? [])].find(candidate => candidate.name === name);
      assert.ok(object, `Ferraluce declares ${name}`);
      assert.ok([...adjacentWalkableTiles(cityId, object)].some(tile => walkable.has(tile)), `${cityId}/${spawn.id} can reach ${name}`);
    }
  }
});

test('the Circuito gate is enforced by both Vetracielo metadata and its Tiled exit', () => {
  const cityId = 'veloria/vetracielo';
  const routeId = 'veloria/r06_anello_magnetico';
  const edge = maps.get(cityId)!.connections.find(connection => connection.toMapId === routeId);
  assert.deepEqual(edge?.requiresFlags, ['badge_circuito_awarded']);
  assert.deepEqual(properties(exitFor(cityId, routeId)).requiredFlag, 'badge_circuito_awarded');
});

