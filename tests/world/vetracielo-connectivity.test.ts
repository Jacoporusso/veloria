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
const mapIds = ['veloria/petalora', 'veloria/r05_viadotto_ciliegi', 'veloria/vetracielo'];
const maps = new Map<string, MapDefinition>();
const tiledMaps = new Map<string, { tiled: TiledMap; layers: Map<string, TiledObject[]> }>();
for (const file of ['petalora', 'r05_viadotto_ciliegi', 'vetracielo']) {
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

function reachable(mapId: string, spawn: Point, avoidEncounterZones = false): Set<string> {
  const { tiled, layers } = tiledMaps.get(mapId)!;
  const blocked = objectTiles(layers.get('collision') ?? [], tiled);
  const forbidden = avoidEncounterZones ? objectTiles((layers.get('triggers') ?? []).filter(object => properties(object).kind === 'encounter-zone'), tiled) : new Set<string>();
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

function assertExitReachable(mapId: string, spawn: Point, exit: TiledObject) {
  const props = properties(exit);
  const tiles = objectTiles([exit], tiledMaps.get(mapId)!.tiled);
  const walkableTargets = new Set([...tiles].filter(tile => !objectTiles(tiledMaps.get(mapId)!.layers.get('collision') ?? [], tiledMaps.get(mapId)!.tiled).has(tile)));
  assert.ok([...walkableTargets].some(tile => reachable(mapId, spawn, true).has(tile)), `${mapId}/${spawn.id} reaches ${String(props.destinationMapId)} without entering an encounter zone`);
}

test('Petalora connects east to R05 after Corolla and preserves its existing north/south exits', () => {
  const petalora = maps.get('veloria/petalora')!;
  const r04 = petalora.connections.find(edge => edge.toMapId === 'veloria/r04_salita_petali')!;
  const gym = petalora.connections.find(edge => edge.toMapId === 'veloria/gym02_petalora')!;
  const r05 = petalora.connections.find(edge => edge.toMapId === 'veloria/r05_viadotto_ciliegi')!;
  assert.deepEqual([r04.viaSpawnId, r04.targetSpawnId, r04.requiresFlags], ['from_r04', 'from_petalora', []]);
  assert.deepEqual([gym.viaSpawnId, gym.targetSpawnId, gym.requiresFlags], ['from_gym02', 'from_city', ['badge_aurora_awarded']]);
  assert.deepEqual([r05.viaSpawnId, r05.targetSpawnId, r05.requiresFlags], ['from_r05', 'from_petalora', ['badge_corolla_awarded']]);
  assert.deepEqual(petalora.spawns.find(spawn => spawn.id === 'from_r05'), { id: 'from_r05', x: 36, y: 12, facing: 'left' });

  const exits = tiledMaps.get(petalora.id)!.layers.get('triggers')!.filter(object => properties(object).kind === 'map-exit');
  const r05Exit = exits.find(object => properties(object).destinationMapId === r05.toMapId)!;
  assert.ok(r05Exit);
  assert.equal(r05Exit.x / 32, 37);
  assert.equal(r05Exit.y / 32, 11);
  assert.equal(r05Exit.width! / 32, 1);
  assert.equal(r05Exit.height! / 32, 3);
  assert.deepEqual(properties(r05Exit).requiredFlag, 'badge_corolla_awarded');
  assert.deepEqual(exits.find(object => properties(object).destinationMapId === gym.toMapId) && properties(exits.find(object => properties(object).destinationMapId === gym.toMapId)!).requiredFlag, 'badge_aurora_awarded');

  const route = maps.get(r05.toMapId)!;
  assert.ok(route.connections.some(edge => edge.toMapId === petalora.id && edge.viaSpawnId === 'from_petalora' && edge.targetSpawnId === 'from_r05'));
  assert.ok(route.connections.some(edge => edge.toMapId === 'veloria/vetracielo' && edge.viaSpawnId === 'from_vetracielo' && edge.targetSpawnId === 'from_r05'));
  assert.ok(maps.get('veloria/vetracielo')!.connections.some(edge => edge.toMapId === route.id && edge.viaSpawnId === 'from_r05' && edge.targetSpawnId === 'from_vetracielo'));
});

test('all Petalora, R05 and Vetracielo exits are reachable from every spawn without entering encounter habitats', () => {
  for (const mapId of mapIds) {
    const map = maps.get(mapId)!;
    const exits = (tiledMaps.get(mapId)!.layers.get('triggers') ?? []).filter(object => properties(object).kind === 'map-exit');
    assert.ok(exits.length > 0, `${mapId} has exits`);
    for (const spawn of map.spawns) for (const exit of exits) assertExitReachable(mapId, spawn, exit);
  }
});

test('R05 and the city declare their route and park encounter habitats', () => {
  const route = maps.get('veloria/r05_viadotto_ciliegi')!;
  const city = maps.get('veloria/vetracielo')!;
  const routeZones = tiledMaps.get(route.id)!.layers.get('triggers')!.filter(object => properties(object).kind === 'encounter-zone');
  const parkZones = tiledMaps.get(city.id)!.layers.get('triggers')!.filter(object => properties(object).kind === 'encounter-zone');
  assert.equal(routeZones.length, 4, 'R05 has four separate habitat patches');
  assert.equal(parkZones.length, 1, 'Vetracielo has a distinct park habitat');
  for (const [map, zones, tableId] of [[route, routeZones, 'veloria/r05_cherry_viaduct'], [city, parkZones, 'veloria/vetracielo_park']] as const) {
    assert.ok(map.encounterTableIds?.includes(tableId));
    assert.ok(zones.every(zone => properties(zone).encounterTableId === tableId));
    const table = readJson<{ id: string; mapId: string; status: string; timeBands: Record<string, { speciesId: number }[]> }>(`${root}/content/encounters/${tableId.split('/')[1]}.encounter.json`);
    assert.equal(table.id, tableId);
    assert.equal(table.mapId, map.id);
    assert.equal(table.status, 'prototype');
    for (const band of ['morning', 'day', 'night']) assert.ok(table.timeBands[band]?.length, `${tableId} has a ${band} pool`);
  }
});

test('route rails and station foundation block movement while map services remain reachable', () => {
  const routeId = 'veloria/r05_viadotto_ciliegi';
  const cityId = 'veloria/vetracielo';
  const rail = tiledMaps.get(routeId)!.layers.get('collision')!.find(object => object.name === 'railway-restricted');
  const station = tiledMaps.get(cityId)!.layers.get('collision')!.find(object => object.name === 'station-foundation');
  assert.ok(rail, 'R05 marks the elevated rail as collision');
  assert.ok(station, 'Vetracielo marks the station foundation as collision');
  for (const [mapId, object] of [[routeId, rail], [cityId, station]] as const) {
    const { tiled, layers } = tiledMaps.get(mapId)!;
    const blocked = objectTiles(layers.get('collision')!, tiled);
    assert.ok(objectTiles([object], tiled).size > 0);
    assert.ok([...objectTiles([object], tiled)].every(tile => blocked.has(tile)));
  }

  const map = maps.get(cityId)!;
  const interactions = tiledMaps.get(cityId)!.layers.get('interactions') ?? [];
  const services = interactions.filter(object => properties(object).serviceId === 'pokemon_center' || typeof properties(object).shopId === 'string');
  assert.ok(services.some(object => properties(object).serviceId === 'pokemon_center'), 'Vetracielo declares healing');
  assert.ok(services.some(object => typeof properties(object).shopId === 'string'), 'Vetracielo declares a shop');
  for (const spawn of map.spawns) for (const service of services) {
    const reachableTiles = reachable(cityId, spawn, true);
    assert.ok([...adjacentWalkableTiles(cityId, service)].some(tile => reachableTiles.has(tile)), `${cityId}/${spawn.id} reaches a safe interaction tile beside ${service.name}`);
  }
});

test('Oren is reachable off the encounter patches and uses source-supported HGSS moves', () => {
  const routeId = 'veloria/r05_viadotto_ciliegi';
  const route = maps.get(routeId)!;
  const layers = tiledMaps.get(routeId)!.layers;
  const oren = layers.get('characters')!.find(object => properties(object).trainerId === 'veloria/trainer_r05_oren');
  assert.ok(oren);
  for (const spawn of route.spawns) {
    const walkable = reachable(routeId, spawn, true);
    assert.ok([...adjacentWalkableTiles(routeId, oren)].some(tile => walkable.has(tile)), `${spawn.id} reaches Oren without entering encounter patches`);
  }

  const trainer = readJson<{ id: string; team: { speciesId: number; level: number; moveIds: string[] }[] }>(`${root}/content/trainers/r05_oren.trainer.json`);
  const battleSpecies = readJson<{ species: Record<string, { officialLearnset?: { level: number; moveId: string }[] }> }>(`${root}/content/battle/species.v1.json`).species;
  const moves = readJson<{ source: { versionGroup: string }; moves: Record<string, unknown> }>(`${root}/content/battle/moves.v1.json`);
  const source = readJson<{ source: { versionGroup: string }; species: Record<string, { level: number; moveId: string }[]> }>(`${root}/content/sources/pokeapi/source-learnsets.json`);
  assert.equal(moves.source.versionGroup, 'heartgold-soulsilver');
  assert.equal(source.source.versionGroup, 'heartgold-soulsilver');
  assert.equal(trainer.id, 'veloria/trainer_r05_oren');
  assert.equal(properties(oren).battleOnceFlag, 'trainer_r05_oren_defeated');
  for (const member of trainer.team) {
    const official = battleSpecies[String(member.speciesId)]?.officialLearnset ?? [];
    const sourceLearnset = source.species[String(member.speciesId)] ?? [];
    assert.ok(official.length, `species ${member.speciesId} has an official runtime learnset`);
    for (const moveId of member.moveIds) {
      assert.ok(moves.moves[moveId], `${moveId} is implemented in the runtime move catalog`);
      assert.ok(official.some(entry => entry.moveId === moveId && entry.level <= member.level), `${moveId} is available to species ${member.speciesId} by level ${member.level}`);
      assert.ok(sourceLearnset.some(entry => entry.moveId === moveId && entry.level <= member.level), `${moveId} is present in the cached HGSS source learnset for species ${member.speciesId}`);
    }
  }
});
