import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';
import { tryGridMove, type CardinalDirection, type GridPoint } from '../../src/core/world/grid-movement.ts';

type TiledObject = {
  id?: number;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  properties?: unknown;
};
type TiledLayer = { name: string; type: string; objects?: TiledObject[]; layers?: TiledLayer[] };
type TiledMap = { width: number; height: number; tilewidth: number; tileheight: number; layers: TiledLayer[] };
type Spawn = { id: string; x: number; y: number };
type MapMetadata = { id: string; tiledAsset: string; spawns: Spawn[] };
type Target = { label: string; select: (properties: Record<string, unknown>) => boolean };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const directions: readonly CardinalDirection[] = ['up', 'right', 'down', 'left'];

function properties(object: TiledObject): Record<string, unknown> {
  if (Array.isArray(object.properties)) {
    return Object.fromEntries(object.properties
      .filter((property): property is { name: string; value: unknown } =>
        property !== null && typeof property === 'object' && typeof (property as { name?: unknown }).name === 'string')
      .map(property => [property.name, property.value]));
  }
  return object.properties && typeof object.properties === 'object'
    ? object.properties as Record<string, unknown>
    : {};
}

function flattenLayers(layers: TiledLayer[]): TiledLayer[] {
  return layers.flatMap(layer => [layer, ...flattenLayers(layer.layers ?? [])]);
}

function tileCells(object: TiledObject, tiled: TiledMap): Set<string> {
  const x = object.x ?? 0;
  const y = object.y ?? 0;
  const width = object.width ?? tiled.tilewidth;
  const height = object.height ?? tiled.tileheight;
  const left = Math.max(0, Math.floor(x / tiled.tilewidth));
  const top = Math.max(0, Math.floor(y / tiled.tileheight));
  const right = Math.min(tiled.width, Math.ceil((x + Math.max(1, width)) / tiled.tilewidth));
  const bottom = Math.min(tiled.height, Math.ceil((y + Math.max(1, height)) / tiled.tileheight));
  const cells = new Set<string>();
  for (let row = top; row < bottom; row += 1) {
    for (let column = left; column < right; column += 1) cells.add(`${column},${row}`);
  }
  return cells;
}

function targetApproachCells(objects: TiledObject[], tiled: TiledMap): Set<string> {
  const occupied = new Set(objects.flatMap(object => [...tileCells(object, tiled)]));
  const adjacent = new Set<string>();
  for (const cell of occupied) {
    const [x, y] = cell.split(',').map(Number);
    for (const [nextX, nextY] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
      if (nextX < 0 || nextY < 0 || nextX >= tiled.width || nextY >= tiled.height) continue;
      const next = `${nextX},${nextY}`;
      if (!occupied.has(next)) adjacent.add(next);
    }
  }
  return adjacent;
}

function legalRoute(start: GridPoint, destinations: ReadonlySet<string>, width: number, height: number, blocked: ReadonlySet<string>): GridPoint[] | null {
  const startKey = `${start.x},${start.y}`;
  if (blocked.has(startKey)) return null;
  const queue: GridPoint[] = [start];
  const previous = new Map<string, string | null>([[startKey, null]]);
  let reached: string | undefined;

  for (let index = 0; index < queue.length && reached === undefined; index += 1) {
    const current = queue[index];
    const currentKey = `${current.x},${current.y}`;
    if (destinations.has(currentKey)) { reached = currentKey; break; }
    for (const direction of directions) {
      const move = tryGridMove(current, direction, width, height, blocked);
      if (!move.moved) continue;
      const nextKey = `${move.position.x},${move.position.y}`;
      if (previous.has(nextKey)) continue;
      previous.set(nextKey, currentKey);
      queue.push(move.position);
    }
  }

  if (reached === undefined) return null;
  const route: GridPoint[] = [];
  for (let key: string | null = reached; key !== null; key = previous.get(key) ?? null) {
    const [x, y] = key.split(',').map(Number);
    route.push({ x, y });
  }
  route.reverse();
  return route;
}

function layerObjects(layers: TiledLayer[], layerName: string): TiledObject[] {
  return flattenLayers(layers)
    .filter(layer => layer.name === layerName && layer.type === 'objectgroup')
    .flatMap(layer => layer.objects ?? []);
}

function hasProperties(target: Target, object: TiledObject): boolean {
  return target.select(properties(object));
}

function assertMapTargetsReachable(mapFile: string, spawnId: string, states: { label: string; flags: string[] }[], targets: Target[]): void {
  const metadata = readJson<MapMetadata>(path.join(root, 'content/maps', mapFile));
  const tiled = readJson<TiledMap>(path.join(root, 'public', metadata.tiledAsset));
  assert.equal(tiled.tilewidth, 32, `${metadata.id}: collision helper uses 32px tiles`);
  assert.equal(tiled.tileheight, 32, `${metadata.id}: collision helper uses 32px tiles`);
  const spawn = metadata.spawns.find(candidate => candidate.id === spawnId);
  assert.ok(spawn, `${metadata.id}: documented entry spawn ${spawnId} exists`);
  const interactionObjects = [...layerObjects(tiled.layers, 'interactions'), ...layerObjects(tiled.layers, 'characters'), ...layerObjects(tiled.layers, 'triggers')];
  const collisionObjects = layerObjects(tiled.layers, 'collision');

  for (const target of targets) {
    const objects = interactionObjects.filter(object => hasProperties(target, object));
    assert.ok(objects.length > 0, `${metadata.id}: Tiled properties select ${target.label}`);
    const approachCells = targetApproachCells(objects, tiled);
    assert.ok(approachCells.size > 0, `${metadata.id}/${target.label}: target has an in-map adjacent interaction tile`);

    for (const state of states) {
      // Include every Tiled collision object, including npcCollisionFor footprints.
      const blocked = collectMapCollision(collisionObjects, tiled.width, tiled.height, state.flags);
      const route = legalRoute({ x: spawn.x, y: spawn.y }, approachCells, tiled.width, tiled.height, blocked);
      assert.ok(route, `${metadata.id}/${spawnId} (${state.label}) cannot legally reach an adjacent tile for ${target.label}`);
      assert.ok(route.length > 1, `${metadata.id}/${target.label}: route should contain a movement step`);
      for (let index = 1; index < route.length; index += 1) {
        const before = route[index - 1];
        const after = route[index];
        const direction = directions.find(candidate => {
          const move = tryGridMove(before, candidate, tiled.width, tiled.height, blocked);
          return move.moved && move.position.x === after.x && move.position.y === after.y;
        });
        assert.ok(direction, `${metadata.id}/${target.label}: route step ${index} must be a legal grid move`);
      }
    }
  }
}

test('Borgofonte home and laboratory interactions remain reachable from their entry spawns', () => {
  const states = [{ label: 'inizio, uscita laboratorio chiusa', flags: [] }, { label: 'starter scelto', flags: ['q_starter_selected'] }];
  assertMapTargetsReachable('borgofonte_lab.map.json', 'from_village', states, [
    { label: 'Elia', select: props => props.kind === 'npc' && props.npcId === 'prof_elia' },
  ]);
  assertMapTargetsReachable('borgofonte_home.map.json', 'from_village', states, [
    { label: 'punto di riposo', select: props => props.kind === 'hotspot' && props.serviceId === 'rest_point' },
    { label: 'diario', select: props => props.kind === 'hotspot' && String(props.message).startsWith('Il primo giorno') },
    { label: 'scaffale', select: props => props.kind === 'hotspot' && String(props.message).startsWith('Vecchi diari') },
  ]);
});

test('the painted home floor reaches its north gap and side aisles while walls and furniture stay solid', () => {
  const tiled = readJson<TiledMap>(path.join(root, 'public/tilemaps/borgofonte_home.tmj'));
  const blocked = collectMapCollision(layerObjects(tiled.layers, 'collision'), tiled.width, tiled.height, []);
  for (const [x, y] of [[2, 5], [14, 3], [15, 3], [21, 5], [2, 11], [21, 11], [11, 4], [12, 12], [12, 14]]) {
    assert.ok(legalRoute({ x: 12, y: 12 }, new Set([`${x},${y}`]), tiled.width, tiled.height, blocked), `painted floor ${x},${y} must be reachable`);
  }
  for (const [x, y] of [[15, 2], [1, 7], [22, 7], [2, 3], [21, 4], [6, 5], [11, 3], [18, 6], [16, 4], [3, 3], [5, 12], [20, 12]]) {
    assert.ok(blocked.has(`${x},${y}`), `wall or furniture ${x},${y} must stay solid`);
  }
});

test('Ada and the forest sensor remain reachable with the quest gate closed and open', () => {
  assertMapTargetsReachable('d01_bosco_veli.map.json', 'from_r01', [
    { label: 'starter scelto, gate Ada non completato', flags: ['q_starter_selected'] },
    { label: 'starter scelto, gate Ada completato', flags: ['q_starter_selected', 'q_ada_helped'] },
  ], [
    { label: 'Ada', select: props => props.kind === 'npc' && props.npcId === 'forest_ranger_ada' },
    { label: 'sensore del bosco', select: props => props.kind === 'rock' && props.questEvent === 'event/forest_signal/read' },
  ]);
});

test('Brumalta center, shop, gym entrance and monorail remain reachable in early and unlocked states', () => {
  assertMapTargetsReachable('c01_brumalta.map.json', 'from_r02', [
    { label: 'accesso al Bosco completato, senza le medaglie', flags: ['q_starter_selected', 'q_ada_helped'] },
    { label: 'uscita per Radicelmo e monorotaia sbloccate', flags: ['q_starter_selected', 'q_ada_helped', 'badge_aurora_awarded', 'badge_circuito_awarded'] },
  ], [
    { label: 'Centro Pokémon', select: props => props.kind === 'house' && props.serviceId === 'pokemon_center' },
    { label: 'negozio', select: props => props.kind === 'house' && typeof props.shopId === 'string' },
    { label: 'palestra', select: props => props.kind === 'house' && props.houseSprite === 'brumalta-gym' },
    { label: 'ingresso palestra', select: props => props.kind === 'map-exit' && props.destinationMapId === 'veloria/gym01_brumalta' },
    { label: 'terminale monorotaia', select: props => props.kind === 'transit-terminal' && props.serviceId === 'monorail' },
  ]);
});

test('Leda, three research instruments and Radicelmo services remain reachable in early and unlocked states', () => {
  const states = [
    { label: 'arrivo da Brumalta, ricerca da completare', flags: ['q_starter_selected', 'q_ada_helped', 'badge_aurora_awarded'] },
    { label: 'ricerca completata e valico disponibile', flags: [
      'q_starter_selected', 'q_ada_helped', 'badge_aurora_awarded',
      'q_radicelmo_greenhouse_watered', 'q_radicelmo_seed_sprouted', 'q_radicelmo_greenhouse_lit',
    ] },
  ];
  assertMapTargetsReachable('radicelmo.map.json', 'from_r03', states, [
    { label: 'Leda', select: props => props.kind === 'npc' && props.npcId === 'radicelmo_keeper' },
    { label: 'regolatore acqua', select: props => props.kind === 'rock' && props.completedFlag === 'q_radicelmo_greenhouse_watered' },
    { label: 'vaso del seme', select: props => props.kind === 'rock' && props.completedFlag === 'q_radicelmo_seed_sprouted' },
    { label: 'misuratore di luce', select: props => props.kind === 'rock' && props.completedFlag === 'q_radicelmo_greenhouse_lit' },
    { label: 'Centro della Comunità', select: props => props.kind === 'house' && props.serviceId === 'pokemon_center' },
    { label: 'erboristeria', select: props => props.kind === 'house' && typeof props.shopId === 'string' },
    { label: 'serra e archivio', select: props => props.kind === 'house' && props.houseSprite === 'radicelmo-greenhouse' },
  ]);
});
