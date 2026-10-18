import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { applyQuestEvent, type QuestDefinition } from '../../src/core/quests/apply-quest-event.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

type Spawn = { id: string; x: number; y: number };
type Connection = { toMapId: string; viaSpawnId: string; targetSpawnId: string; requiresFlags?: string[] };
type MapDefinition = { id: string; tiledAsset: string; spawns: Spawn[]; connections: Connection[] };
type TiledObject = { name?: string; x: number; y: number; width?: number; height?: number; properties?: { name: string; value: unknown }[] };
type TiledMap = { width: number; height: number; tilewidth: number; tileheight: number; layers: { name: string; type: string; objects?: TiledObject[] }[] };

const root = process.cwd();
const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const definitions = new Map<string, MapDefinition>();
const tiledMaps = new Map<string, { tiled: TiledMap; layers: Map<string, TiledObject[]> }>();
for (const filename of ['gym03_vetracielo', 'vetracielo']) {
  const map = readJson<MapDefinition>(`${root}/content/maps/${filename}.map.json`);
  const tiled = readJson<TiledMap>(`${root}/public/${map.tiledAsset}`);
  definitions.set(map.id, map);
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

function reachable(mapId: string, spawn: Spawn, avoidEncounterZones = false): Set<string> {
  const { tiled, layers } = tiledMaps.get(mapId)!;
  const collision = objectTiles(layers.get('collision') ?? [], tiled);
  const forbidden = avoidEncounterZones
    ? objectTiles((layers.get('triggers') ?? []).filter(object => properties(object).kind === 'encounter-zone'), tiled)
    : new Set<string>();
  const start = `${spawn.x},${spawn.y}`;
  assert.equal(collision.has(start), false, `${mapId}/${spawn.id} is not walkable`);
  const pending = [start];
  const visited = new Set(pending);
  for (let index = 0; index < pending.length; index += 1) {
    const [x, y] = pending[index].split(',').map(Number);
    for (const [nx, ny] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
      const next = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= tiled.width || ny >= tiled.height || collision.has(next) || forbidden.has(next) || visited.has(next)) continue;
      visited.add(next);
      pending.push(next);
    }
  }
  return visited;
}

function adjacentWalkableTiles(mapId: string, object: TiledObject): Set<string> {
  const { tiled, layers } = tiledMaps.get(mapId)!;
  const occupied = objectTiles([object], tiled);
  const collision = objectTiles(layers.get('collision') ?? [], tiled);
  const result = new Set<string>();
  for (const point of occupied) {
    const [x, y] = point.split(',').map(Number);
    for (const [nx, ny] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
      const next = `${nx},${ny}`;
      if (nx >= 0 && ny >= 0 && nx < tiled.width && ny < tiled.height && !occupied.has(next) && !collision.has(next)) result.add(next);
    }
  }
  return result;
}

test('Gym03 spawn reaches its return threshold, all three blocked consoles, and Aster around explicit collision', () => {
  const id = 'veloria/gym03_vetracielo';
  const map = definitions.get(id)!;
  const { tiled, layers } = tiledMaps.get(id)!;
  const spawn = map.spawns.find(point => point.id === 'from_city')!;
  assert.deepEqual([spawn.x, spawn.y], [15, 28]);
  const path = reachable(id, spawn);
  const collision = objectTiles(layers.get('collision') ?? [], tiled);
  const exit = layers.get('triggers')!.find(object => properties(object).kind === 'map-exit')!;
  assert.ok(exit);
  const exitTiles = [...objectTiles([exit], tiled)].filter(tile => !collision.has(tile));
  assert.equal(exit.x / 32, 13);
  assert.equal(exit.y / 32, 29);
  assert.equal(exit.width! / 32, 5);
  assert.ok(exitTiles.some(tile => path.has(tile)), 'the return threshold is reachable');

  const consoles = layers.get('interactions')!.filter(object => properties(object).kind === 'rail-console');
  const expected = [
    { id: 'gardens', x: 7, y: 23 },
    { id: 'glass', x: 23, y: 19 },
    { id: 'sky', x: 15, y: 15 },
  ];
  assert.equal(consoles.length, expected.length);
  for (const point of expected) {
    const console = consoles.find(object => properties(object).dialogueId === `gym03_${point.id}`);
    assert.ok(console, `console ${point.id} exists`);
    assert.deepEqual([console.x / 32, console.y / 32], [point.x, point.y]);
    assert.ok(collision.has(`${point.x},${point.y}`), `${point.id} console has explicit collision`);
    assert.ok([...adjacentWalkableTiles(id, console)].some(tile => path.has(tile)), `${point.id} console can be reached from a walkable neighbor`);
  }

  const aster = layers.get('characters')!.find(object => properties(object).trainerId === 'veloria/trainer_aster_gym03');
  assert.ok(aster, 'Aster is declared as the gym trainer');
  assert.deepEqual([aster.x / 32, aster.y / 32], [15, 10]);
  assert.ok(collision.has('15,10'), 'Aster position has explicit collision');
  assert.ok([...adjacentWalkableTiles(id, aster)].some(tile => path.has(tile)), 'Aster can be approached from a reachable walkable tile');
  assert.equal(properties(aster).battleRequiredFlag, 'gym03_lines_connected');
});

test('Vetracielo Gym03 entrance is reachable and gated by Lea orientation', () => {
  const cityId = 'veloria/vetracielo';
  const gymId = 'veloria/gym03_vetracielo';
  const city = definitions.get(cityId)!;
  const gym = definitions.get(gymId)!;
  const spawn = city.spawns.find(point => point.id === 'from_gym03')!;
  assert.deepEqual([spawn.x, spawn.y], [20, 17]);
  const edge = city.connections.find(connection => connection.toMapId === gymId)!;
  assert.deepEqual([edge.viaSpawnId, edge.targetSpawnId, edge.requiresFlags], ['from_gym03', 'from_city', ['q_vetracielo_orientation']]);
  assert.ok(gym.connections.some(connection => connection.toMapId === cityId && connection.viaSpawnId === 'from_city' && connection.targetSpawnId === 'from_gym03'));

  const entrance = tiledMaps.get(cityId)!.layers.get('triggers')!.find(object => properties(object).destinationMapId === gymId)!;
  assert.ok(entrance);
  assert.deepEqual([entrance.x / 32, entrance.y / 32, entrance.width! / 32], [19, 16, 3]);
  assert.equal(properties(entrance).requiredFlag, 'q_vetracielo_orientation');
  const routeSpawn = city.spawns.find(point => point.id === 'from_r05')!;
  const route = reachable(cityId, routeSpawn, true);
  const collision = objectTiles(tiledMaps.get(cityId)!.layers.get('collision') ?? [], tiledMaps.get(cityId)!.tiled);
  assert.ok([...objectTiles([entrance], tiledMaps.get(cityId)!.tiled)].some(tile => !collision.has(tile) && route.has(tile)), 'city entrance is walkable from the R05 entry without crossing its park habitat');
});

test('Gym03 lines activate in order and Aster awards the Circuit badge once', () => {
  const lines = readJson<QuestDefinition>(`${root}/content/quests/gym03_lines.quest.json`);
  const badge = readJson<QuestDefinition>(`${root}/content/quests/gym03_badge.quest.json`);
  const expected = [
    ['gym03/line/gardens', 'gym03_line_gardens_active', 'q_vetracielo_orientation'],
    ['gym03/line/glass', 'gym03_line_glass_active', 'gym03_line_gardens_active'],
    ['gym03/line/sky', 'gym03_lines_connected', 'gym03_line_glass_active'],
  ];
  assert.deepEqual(lines.steps.map(step => [step.trigger, step.setFlag, ...(step.requiresFlags ?? [])]), expected);
  const initial: GameSave = {
    schemaVersion: 2, saveRevision: 1, contentVersion: 'test', saveId: 'gym03-test', savedAt: '2026-10-18T00:00:00Z',
    player: { name: 'Allenatore', mapId: 'veloria/gym03_vetracielo', spawnPointId: 'from_city', money: 0, x: 15, y: 28 },
    party: [], storage: [], flags: ['q_vetracielo_orientation'], badges: [], inventory: {}, rngState: 1,
  };
  const pre = applyQuestEvent(structuredClone(initial), 'gym03/line/glass', [lines]);
  assert.equal(pre.progressed, false, 'Vetro cannot activate before Giardini');
  assert.deepEqual(pre.save.flags, initial.flags);
  const gardens = applyQuestEvent(initial, 'gym03/line/gardens', [lines]);
  const glass = applyQuestEvent(gardens.save, 'gym03/line/glass', [lines]);
  const sky = applyQuestEvent(glass.save, 'gym03/line/sky', [lines]);
  assert.ok(sky.save.flags.includes('gym03_lines_connected'));

  const badgeBeforeLines = applyQuestEvent(structuredClone(initial), 'battle/trainer_aster/defeated', [badge]);
  assert.equal(badgeBeforeLines.progressed, false);
  assert.deepEqual(badgeBeforeLines.save.badges, []);
  const leaderWon = applyQuestEvent(structuredClone(sky.save), 'battle/trainer_aster/defeated', [badge]);
  assert.equal(leaderWon.progressed, true);
  assert.deepEqual(leaderWon.completedQuestIds, [badge.id]);
  assert.ok(leaderWon.save.flags.includes('badge_circuito_awarded'));
  assert.deepEqual(leaderWon.save.badges, ['badge_circuito']);
  const afterReload = applyQuestEvent(structuredClone(leaderWon.save), 'battle/trainer_aster/defeated', [badge]);
  assert.equal(afterReload.progressed, false);
  assert.deepEqual(afterReload.save, leaderWon.save);
  assert.deepEqual(initial.flags, ['q_vetracielo_orientation'], 'quest progression does not mutate the original save');

  const badges = readJson<{ badges: Record<string, { emblem: string }> }>(`${root}/content/badges/badges.v1.json`).badges;
  assert.equal(badges.badge_circuito.emblem, 'circuit');
  assert.ok(!['badge_aurora', 'badge_corolla'].some(id => badges[id].emblem === badges.badge_circuito.emblem));
});
