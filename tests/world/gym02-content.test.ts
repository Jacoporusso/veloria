import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { applyQuestEvent, type QuestDefinition } from '../../src/core/quests/apply-quest-event.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';
import irrigationJson from '../../content/quests/gym02_irrigation.quest.json' with { type: 'json' };
import badgeJson from '../../content/quests/gym02_badge.quest.json' with { type: 'json' };

type TiledObject = {
  id: number;
  name?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  properties?: { name: string; value: unknown }[];
};
type TiledMap = {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: { name: string; type: string; objects?: TiledObject[] }[];
};
type Point = { id: string; x: number; y: number };
type MapDefinition = {
  id: string;
  tiledAsset: string;
  spawns: Point[];
  connections: { toMapId: string; viaSpawnId: string; targetSpawnId: string; requiresFlags?: string[] }[];
};

const root = process.cwd();
const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const irrigation = irrigationJson as unknown as QuestDefinition;
const badge = badgeJson as unknown as QuestDefinition;
const quests = [irrigation, badge];
const initialSave: GameSave = {
  schemaVersion: 2,
  saveRevision: 1,
  contentVersion: 'gym02-content-test',
  saveId: 'gym02-content-test-save',
  savedAt: '2026-10-17T00:00:00.000Z',
  player: { name: 'Allenatore', mapId: 'veloria/petalora', spawnPointId: 'from_gym02', money: 0, x: 0, y: 0 },
  party: [],
  storage: [],
  flags: [],
  badges: [],
  inventory: {},
  rngState: 1,
};
const irrigationEvents = [
  'gym02/irrigation/source',
  'gym02/irrigation/west',
  'gym02/irrigation/east',
  'gym02/irrigation/bloom',
];
const irrigationFlags = [
  'gym02_water_source_open',
  'gym02_water_west_open',
  'gym02_water_east_open',
  'gym02_irrigation_solved',
];

function gymData() {
  const map = readJson<MapDefinition>(`${root}/content/maps/gym02_petalora.map.json`);
  const tiled = readJson<TiledMap>(`${root}/public/${map.tiledAsset}`);
  const layers = new Map(tiled.layers.filter(layer => layer.type === 'objectgroup').map(layer => [layer.name, layer.objects ?? []]));
  return { map, tiled, layers };
}

function props(object: TiledObject): Record<string, unknown> {
  return Object.fromEntries((object.properties ?? []).map(property => [property.name, property.value]));
}

function objectTiles(objects: TiledObject[], tiled: TiledMap): Set<string> {
  const cells = new Set<string>();
  for (const object of objects) {
    const left = Math.max(0, Math.floor(object.x / tiled.tilewidth));
    const top = Math.max(0, Math.floor(object.y / tiled.tileheight));
    const right = Math.min(tiled.width, Math.ceil((object.x + Math.max(1, object.width ?? tiled.tilewidth)) / tiled.tilewidth));
    const bottom = Math.min(tiled.height, Math.ceil((object.y + Math.max(1, object.height ?? tiled.tileheight)) / tiled.tileheight));
    for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) cells.add(`${x},${y}`);
  }
  return cells;
}

function reachableFrom(spawn: Point): Set<string> {
  const { tiled, layers } = gymData();
  const blocked = objectTiles(layers.get('collision') ?? [], tiled);
  const start = `${spawn.x},${spawn.y}`;
  assert.equal(blocked.has(start), false, `Gym spawn ${spawn.id} must be walkable`);
  const pending = [start];
  const visited = new Set(pending);
  for (let index = 0; index < pending.length; index += 1) {
    const [x, y] = pending[index].split(',').map(Number);
    for (const [nextX, nextY] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
      const next = `${nextX},${nextY}`;
      if (nextX < 0 || nextY < 0 || nextX >= tiled.width || nextY >= tiled.height
        || blocked.has(next) || visited.has(next)) continue;
      visited.add(next);
      pending.push(next);
    }
  }
  return visited;
}

function adjacentWalkableCells(object: TiledObject): Set<string> {
  const { tiled, layers } = gymData();
  const occupied = objectTiles([object], tiled);
  const blocked = objectTiles(layers.get('collision') ?? [], tiled);
  const adjacent = new Set<string>();
  for (const cell of occupied) {
    const [x, y] = cell.split(',').map(Number);
    for (const [nextX, nextY] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
      const next = `${nextX},${nextY}`;
      if (nextX >= 0 && nextY >= 0 && nextX < tiled.width && nextY < tiled.height
        && !occupied.has(next) && !blocked.has(next)) adjacent.add(next);
    }
  }
  return adjacent;
}

test('gym02 irrigation quest advances only in source, west, east, bloom order', () => {
  const untouched = structuredClone(initialSave);
  assert.equal(applyQuestEvent(initialSave, irrigationEvents[0], quests).progressed, false, 'Petalora must be visited first');
  for (const event of irrigationEvents.slice(1)) assert.equal(applyQuestEvent(initialSave, event, quests).progressed, false, `${event} cannot start out of order`);
  assert.deepEqual(initialSave, untouched, 'rejected events do not mutate the saved data');

  let save = { ...initialSave, flags: ['q_petalora_visited'] };
  const wrongOrder = applyQuestEvent(save, irrigationEvents[2], quests);
  assert.equal(wrongOrder.progressed, false, 'east cannot be opened before west');
  const source = applyQuestEvent(save, irrigationEvents[0], quests);
  assert.equal(source.progressed, true);
  assert.ok(source.save.flags.includes(irrigationFlags[0]));
  assert.equal(applyQuestEvent(source.save, irrigationEvents[2], quests).progressed, false);
  const west = applyQuestEvent(structuredClone(source.save), irrigationEvents[1], quests);
  const east = applyQuestEvent(west.save, irrigationEvents[2], quests);
  const bloom = applyQuestEvent(east.save, irrigationEvents[3], quests);
  assert.deepEqual(bloom.completedQuestIds, [irrigation.id]);
  assert.ok(irrigationFlags.every(flag => bloom.save.flags.includes(flag)));
  assert.deepEqual(initialSave, untouched);
});

test('quest flags wire the rendered channels, flowers, and Dalia battle gate to irrigation progress', () => {
  const { layers } = gymData();
  const channels = (layers.get('decorations') ?? []).filter(object => props(object).kind === 'irrigation-channel');
  const flowers = (layers.get('decorations') ?? []).filter(object => props(object).kind === 'plant' && props(object).visibleWhenFlag);
  assert.equal(channels.length, 6);
  assert.ok(channels.every(object => irrigationFlags.includes(String(props(object).activatedFlag))));
  assert.ok(flowers.length >= 4);
  assert.ok(flowers.every(object => props(object).visibleWhenFlag === irrigation.completionFlag));

  let save: GameSave = { ...initialSave, flags: ['q_petalora_visited'] };
  for (const [event, flag] of irrigationEvents.map((value, index) => [value, irrigationFlags[index]] as const)) {
    save = applyQuestEvent(save, event, quests).save;
    assert.ok(save.flags.includes(flag));
    const enabledChannels = channels.filter(object => save.flags.includes(String(props(object).activatedFlag)));
    assert.ok(enabledChannels.length > 0, `the ${flag} stage activates its channel art`);
    const visibleFlowers = flowers.filter(object => save.flags.includes(String(props(object).visibleWhenFlag)));
    assert.equal(visibleFlowers.length > 0, save.flags.includes(irrigation.completionFlag));
  }

  const dalia = (layers.get('characters') ?? []).find(object => props(object).npcId === 'dalia_gym');
  assert.ok(dalia);
  assert.equal(props(dalia).battleRequiredFlag, irrigation.completionFlag);
  assert.equal((layers.get('interactions') ?? []).filter(object => /^gym02_(source|west|east|bloom)$/.test(String(props(object).dialogueId))).length, 4);
});

test('irrigation progress survives a save clone and Dalia awards Corolla only after both prerequisites', () => {
  let progressed = { ...initialSave, flags: ['q_petalora_visited'] };
  for (const event of irrigationEvents.slice(0, 2)) progressed = applyQuestEvent(progressed, event, quests).save;
  const reloaded = structuredClone(progressed);
  assert.deepEqual(reloaded.flags, ['q_petalora_visited', ...irrigationFlags.slice(0, 2)]);

  const battleEvent = 'battle/trainer_dalia/defeated';
  const missingVisit = applyQuestEvent({ ...reloaded, flags: reloaded.flags.filter(flag => flag !== 'q_petalora_visited') }, battleEvent, quests);
  assert.equal(missingVisit.progressed, false);
  const missingPuzzle = applyQuestEvent({ ...initialSave, flags: ['q_petalora_visited'] }, battleEvent, quests);
  assert.equal(missingPuzzle.progressed, false);

  const solved = applyQuestEvent(applyQuestEvent(reloaded, irrigationEvents[2], quests).save, irrigationEvents[3], quests).save;
  const ready = applyQuestEvent(solved, battleEvent, quests);
  assert.equal(ready.progressed, true);
  assert.deepEqual(ready.completedQuestIds, [badge.id]);
  assert.ok(ready.save.flags.includes('badge_corolla_awarded'));
  assert.deepEqual(ready.save.badges, ['badge_corolla']);
  const repeated = applyQuestEvent(structuredClone(ready.save), battleEvent, quests);
  assert.equal(repeated.progressed, false);
  assert.deepEqual(repeated.save.badges, ['badge_corolla']);
  assert.equal(repeated.save.flags.filter(flag => flag === 'badge_corolla_awarded').length, 1);
});

test('gym spawn reaches all four stations, Dalia, and the exit; Petalora connects to the city gate', () => {
  const { map, tiled, layers } = gymData();
  const spawn = map.spawns.find(point => point.id === 'from_city');
  assert.ok(spawn);
  const visited = reachableFrom(spawn);
  const interactions = layers.get('interactions') ?? [];
  const stations = ['gym02_source', 'gym02_west', 'gym02_east', 'gym02_bloom'].map(dialogueId => {
    const station = interactions.find(object => props(object).dialogueId === dialogueId);
    assert.ok(station, `missing station ${dialogueId}`);
    return station;
  });
  const dalia = (layers.get('characters') ?? []).find(object => props(object).npcId === 'dalia_gym');
  const exit = (layers.get('triggers') ?? []).find(object => props(object).kind === 'map-exit');
  assert.ok(dalia);
  assert.ok(exit);
  for (const [object, label] of [...stations.map((object, index) => [object, `irrigation station ${index + 1}`] as const), [dalia, 'Dalia'], [exit, 'Petalora exit'] as const]) {
    assert.ok([...adjacentWalkableCells(object)].some(cell => visited.has(cell)), `gym spawn cannot reach ${label}`);
  }
  assert.equal(props(exit).destinationMapId, 'veloria/petalora');
  assert.equal(props(exit).destinationSpawnId, 'from_gym02');

  const petalora = readJson<MapDefinition>(`${root}/content/maps/petalora.map.json`);
  const inbound = petalora.connections.find(connection => connection.toMapId === map.id);
  const outbound = map.connections.find(connection => connection.toMapId === petalora.id);
  assert.ok(inbound);
  assert.ok(outbound);
  assert.equal(inbound.viaSpawnId, 'from_gym02');
  assert.equal(inbound.targetSpawnId, 'from_city');
  assert.equal(outbound.viaSpawnId, 'from_city');
  assert.equal(outbound.targetSpawnId, 'from_gym02');
  const petaloraTiles = readJson<TiledMap>(`${root}/public/${petalora.tiledAsset}`);
  const petaloraTriggers = petaloraTiles.layers.find(layer => layer.name === 'triggers')?.objects ?? [];
  const cityGate = petaloraTriggers.find(object => props(object).destinationMapId === map.id);
  assert.ok(cityGate);
  assert.equal(props(cityGate).requiredFlag, 'badge_aurora_awarded');
});
