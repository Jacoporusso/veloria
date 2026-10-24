import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

type Point = { id: string; x: number; y: number };
type Connection = { toMapId: string; viaSpawnId: string; targetSpawnId: string; requiresFlags?: string[] };
type MapDefinition = {
  id: string;
  tiledAsset: string;
  spawns: Point[];
  connections: Connection[];
  encounterTableIds?: string[];
  npcRefs?: string[];
};
type TiledObject = { id: number; name?: string; x: number; y: number; width?: number; height?: number; properties?: { name: string; value: unknown }[] };
type TiledMap = { width: number; height: number; tilewidth: number; tileheight: number; layers: { name: string; type: string; objects?: TiledObject[] }[] };

const root = process.cwd();
const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const maps = new Map<string, MapDefinition>();
const tiledMaps = new Map<string, { tiled: TiledMap; layers: Map<string, TiledObject[]> }>();
for (const name of ['r04_salita_petali', 'radicelmo', 'petalora']) {
  const map = readJson<MapDefinition>(`${root}/content/maps/${name}.map.json`);
  const tiled = readJson<TiledMap>(`${root}/public/${map.tiledAsset}`);
  maps.set(map.id, map);
  tiledMaps.set(map.id, {
    tiled,
    layers: new Map(tiled.layers.filter(layer => layer.type === 'objectgroup').map(layer => [layer.name, layer.objects ?? []])),
  });
}

const properties = (object: TiledObject) => Object.fromEntries((object.properties ?? []).map(property => [property.name, property.value]));
const objectTiles = (objects: TiledObject[], tiled: TiledMap): Set<string> => {
  const result = new Set<string>();
  for (const object of objects) {
    const left = Math.max(0, Math.floor(object.x / tiled.tilewidth));
    const top = Math.max(0, Math.floor(object.y / tiled.tileheight));
    const right = Math.min(tiled.width, Math.ceil((object.x + Math.max(1, object.width ?? tiled.tilewidth)) / tiled.tilewidth));
    const bottom = Math.min(tiled.height, Math.ceil((object.y + Math.max(1, object.height ?? tiled.tileheight)) / tiled.tileheight));
    for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) result.add(`${x},${y}`);
  }
  return result;
};

function reachable(mapId: string, spawn: Point, avoidEncounterZones = false): Set<string> {
  const { tiled, layers } = tiledMaps.get(mapId)!;
  const blocked = objectTiles(layers.get('collision') ?? [], tiled);
  const forbidden = avoidEncounterZones
    ? new Set([
      ...objectTiles((layers.get('collision') ?? []).filter(object => object.name?.startsWith('water-')), tiled),
      ...objectTiles((layers.get('triggers') ?? []).filter(object => properties(object).kind === 'encounter-zone'), tiled),
    ])
    : new Set<string>();
  const start = `${spawn.x},${spawn.y}`;
  assert.equal(blocked.has(start), false, `${mapId}/${spawn.id} spawn must be walkable`);
  const pending = [start];
  const visited = new Set(pending);
  for (let index = 0; index < pending.length; index += 1) {
    const [x, y] = pending[index].split(',').map(Number);
    for (const [nextX, nextY] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
      const next = `${nextX},${nextY}`;
      if (nextX < 0 || nextY < 0 || nextX >= tiled.width || nextY >= tiled.height
        || blocked.has(next) || forbidden.has(next) || visited.has(next)) continue;
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
  const candidates = new Set<string>();
  for (const point of occupied) {
    const [x, y] = point.split(',').map(Number);
    for (const [nextX, nextY] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
      const next = `${nextX},${nextY}`;
      if (nextX >= 0 && nextY >= 0 && nextX < tiled.width && nextY < tiled.height
        && !occupied.has(next) && !blocked.has(next)) candidates.add(next);
    }
  }
  return candidates;
}

function assertReachable(mapId: string, spawn: Point, targets: Set<string>, label: string, avoidEncounterZones = false) {
  const visited = reachable(mapId, spawn, avoidEncounterZones);
  assert.ok([...targets].some(point => visited.has(point)), `${mapId}/${spawn.id} cannot reach ${label}`);
}

test('R04 map exits are reachable from every spawn and use reciprocal spawn IDs', () => {
  const r04Id = 'veloria/r04_salita_petali';
  const r04 = maps.get(r04Id)!;
  const destinations = [
    { id: 'veloria/radicelmo', targetSpawnId: 'from_r04', viaSpawnId: 'from_radicelmo' },
    { id: 'veloria/petalora', targetSpawnId: 'from_r04', viaSpawnId: 'from_petalora' },
  ];

  for (const spawn of r04.spawns) {
    for (const destination of destinations) {
      const edge = r04.connections.find(connection => connection.toMapId === destination.id);
      assert.ok(edge, `R04 is missing connection to ${destination.id}`);
      assert.equal(edge.targetSpawnId, destination.targetSpawnId);
      assert.equal(edge.viaSpawnId, destination.viaSpawnId);
      const trigger = (tiledMaps.get(r04Id)!.layers.get('triggers') ?? []).find(object => {
        const props = properties(object);
        return props.kind === 'map-exit' && props.destinationMapId === destination.id && props.destinationSpawnId === destination.targetSpawnId;
      });
      assert.ok(trigger, `R04 Tiled exit to ${destination.id} has the expected destination spawn`);
      assertReachable(r04Id, spawn, objectTiles([trigger], tiledMaps.get(r04Id)!.tiled), `exit to ${destination.id}`);
    }
  }

  for (const [sourceId, destId, viaSpawnId, targetSpawnId] of [
    ['veloria/radicelmo', r04Id, 'from_r04', 'from_radicelmo'],
    ['veloria/petalora', r04Id, 'from_r04', 'from_petalora'],
  ]) {
    const source = maps.get(sourceId)!;
    const destination = maps.get(destId)!;
    const edge = source.connections.find(connection => connection.toMapId === destId);
    assert.ok(edge, `${sourceId} must connect to R04`);
    assert.equal(edge.viaSpawnId, viaSpawnId);
    assert.equal(edge.targetSpawnId, targetSpawnId);
    assert.ok(destination.spawns.some(spawn => spawn.id === edge!.targetSpawnId));
  }
});

test('every Radicelmo and Petalora spawn can reach every authored map exit', () => {
  for (const mapId of ['veloria/radicelmo', 'veloria/petalora']) {
    const map = maps.get(mapId)!;
    const exits = (tiledMaps.get(mapId)!.layers.get('triggers') ?? []).filter(object => properties(object).kind === 'map-exit');
    assert.ok(exits.length > 0, `${mapId} has at least one exit`);
    for (const spawn of map.spawns) {
      for (const exit of exits) {
        const props = properties(exit);
        assertReachable(mapId, spawn, objectTiles([exit], tiledMaps.get(mapId)!.tiled), `exit ${String(props.destinationMapId)}/${String(props.destinationSpawnId)}`);
      }
    }
  }
});

test('Radicelmo to Petalora and the return route use the Aurora badge gate only', () => {
  const r04 = maps.get('veloria/r04_salita_petali')!;
  const radicelmo = maps.get('veloria/radicelmo')!;
  const petalora = maps.get('veloria/petalora')!;
  const badge = 'badge_aurora_awarded';
  const up = radicelmo.connections.find(connection => connection.toMapId === r04.id)!;
  const onward = r04.connections.find(connection => connection.toMapId === petalora.id)!;
  const back = r04.connections.find(connection => connection.toMapId === radicelmo.id)!;
  const returnToR04 = petalora.connections.find(connection => connection.toMapId === r04.id)!;
  assert.deepEqual(up.requiresFlags, [badge]);
  assert.deepEqual(onward.requiresFlags, [badge]);
  assert.deepEqual(back.requiresFlags, []);
  assert.deepEqual(returnToR04.requiresFlags, []);
  for (const [mapId, destinationId] of [[radicelmo.id, r04.id], [r04.id, petalora.id]]) {
    const exit = (tiledMaps.get(mapId)!.layers.get('triggers') ?? []).find(object => {
      const props = properties(object);
      return props.kind === 'map-exit' && props.destinationMapId === destinationId;
    });
    assert.ok(exit, `${mapId} has an exit to ${destinationId}`);
    assert.equal(properties(exit).requiredFlag, badge);
    assert.equal(String(properties(exit).requiredFlag).includes('greenhouse'), false);
  }
  const greenhouseQuest = readJson<{ id: string; steps: { trigger: string; setFlag?: string }[] }>(`${root}/content/quests/radicelmo_greenhouse.quest.json`);
  assert.equal([...up.requiresFlags!, ...onward.requiresFlags!].some(flag => flag.includes('greenhouse')), false);
  assert.equal(greenhouseQuest.steps.some(step => step.trigger === 'area/veloria/petalora/enter'), false);
});

test('all R04 spawn points reach Nila and the central route avoids grass, water, and collision', () => {
  const r04Id = 'veloria/r04_salita_petali';
  const r04 = maps.get(r04Id)!;
  const layers = tiledMaps.get(r04Id)!.layers;
  const nila = (layers.get('characters') ?? []).find(object => properties(object).npcId === 'nila_r04');
  assert.ok(nila, 'R04 Tiled map declares Nila');
  assert.equal(properties(nila).trainerId, 'veloria/trainer_r04_nila');
  for (const spawn of r04.spawns) assertReachable(r04Id, spawn, adjacentWalkableTiles(r04Id, nila), 'a walkable tile next to Nila');

  const centralSpawn = r04.spawns.find(spawn => spawn.id === 'from_radicelmo')!;
  const petaloraExit = (layers.get('triggers') ?? []).find(object => {
    const props = properties(object);
    return props.kind === 'map-exit' && props.destinationMapId === 'veloria/petalora';
  });
  assert.ok(petaloraExit);
  assertReachable(r04Id, centralSpawn, objectTiles([petaloraExit], tiledMaps.get(r04Id)!.tiled), 'the Petalora exit along the grass-free route', true);

  const encounterZones = (layers.get('triggers') ?? []).filter(object => properties(object).kind === 'encounter-zone');
  assert.ok(encounterZones.length >= 4, `R04 has ${encounterZones.length} encounter zones`);
  assert.equal(encounterZones.filter(object => properties(object).encounterTableId === 'veloria/r04_petal_ascent').length, 3);
  assert.equal(encounterZones.filter(object => properties(object).encounterTableId === 'veloria/r04_stream_patch').length, 1);
  assert.ok(r04.encounterTableIds?.includes('veloria/r04_petal_ascent'));
});

test('Petalora spawn reaches its return exit and walkable tiles beside the cure pavilion, shop, and Ivo', () => {
  const petaloraId = 'veloria/petalora';
  const petalora = maps.get(petaloraId)!;
  const spawn = petalora.spawns.find(point => point.id === 'from_r04')!;
  const layers = tiledMaps.get(petaloraId)!.layers;
  const exit = (layers.get('triggers') ?? []).find(object => properties(object).kind === 'map-exit');
  assert.ok(exit);
  assert.equal(properties(exit).destinationMapId, 'veloria/r04_salita_petali');
  assert.equal(properties(exit).destinationSpawnId, 'from_petalora');
  assertReachable(petaloraId, spawn, objectTiles([exit], tiledMaps.get(petaloraId)!.tiled), 'the R04 return exit');

  const cure = (layers.get('interactions') ?? []).find(object => properties(object).serviceId === 'pokemon_center');
  const shop = (layers.get('interactions') ?? []).find(object => typeof properties(object).shopId === 'string');
  const ivo = (layers.get('characters') ?? []).find(object => properties(object).npcId === 'petalora_ivo');
  assert.ok(cure, 'Petalora has a cure service');
  assert.ok(shop, 'Petalora has a shop');
  assert.ok(ivo, 'Petalora has Ivo');
  for (const [target, label] of [[cure, 'cure pavilion'], [shop, 'shop'], [ivo, 'Ivo']] as const) {
    assertReachable(petaloraId, spawn, adjacentWalkableTiles(petaloraId, target), `a walkable tile beside ${label}`);
  }
});

test('Nila has the configured reward and unique defeat flag, and Petalora arrival requires Aurora', () => {
  const trainer = readJson<{ id: string; rewardMoney: number; battleOnceFlag: string; team: unknown[] }>(`${root}/content/trainers/r04_nila.trainer.json`);
  const otherTrainers = ['r01_timo', 'r01_sera', 'gym01_mira'].map(name =>
    readJson<{ battleOnceFlag: string }>(`${root}/content/trainers/${name}.trainer.json`));
  assert.equal(trainer.id, 'veloria/trainer_r04_nila');
  assert.equal(trainer.rewardMoney, 180);
  assert.equal(trainer.battleOnceFlag, 'trainer_r04_nila_defeated');
  assert.ok(trainer.team.length >= 2);
  assert.equal(otherTrainers.some(other => other.battleOnceFlag === trainer.battleOnceFlag), false, 'Nila uses a unique defeat flag');
  const nila = (tiledMaps.get('veloria/r04_salita_petali')!.layers.get('characters') ?? []).find(object => properties(object).npcId === 'nila_r04')!;
  assert.equal(properties(nila).battleOnceFlag, trainer.battleOnceFlag);

  const arrival = readJson<{ steps: { trigger: string; requiresFlags?: string[] }[] }>(`${root}/content/quests/petalora_arrival.quest.json`);
  const arrivalStep = arrival.steps.find(step => step.trigger === 'area/veloria/petalora/enter');
  assert.ok(arrivalStep, 'Petalora arrival quest listens for the requested area event');
  assert.ok(arrivalStep.requiresFlags?.includes('badge_aurora_awarded'));
  assert.equal(arrivalStep.requiresFlags?.some(flag => flag.includes('greenhouse')), false);
});
