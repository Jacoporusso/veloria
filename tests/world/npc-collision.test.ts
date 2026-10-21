import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const intendedNpcIds = new Set([
  'forest_ranger_ada',
  'ferraluce_ivo',
  'ferraluce_care',
  'ferraluce_shop',
  'mira',
  'dalia_gym',
  'nerea_gym',
  'petalora_ivo',
  'portolume_captain',
  'r03_path_guide',
  'nila_r04',
  'oren_r05',
  'radicelmo_keeper',
  'vetracielo_lea',
]);

type Obj = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  properties?: unknown;
};

type MapMeta = {
  id: string;
  tiledAsset: string;
  spawns: Array<{ id: string; x: number; y: number }>;
};

function props(object: Obj): Record<string, unknown> {
  if (Array.isArray(object.properties)) {
    return Object.fromEntries(
      object.properties
        .filter((property: any) => property && typeof property.name === 'string')
        .map((property: any) => [property.name, property.value]),
    );
  }
  return object.properties && typeof object.properties === 'object'
    ? object.properties as Record<string, unknown>
    : {};
}

function tileRect(object: Obj): Set<string> {
  const x = Math.floor((object.x ?? 0) / 32);
  const y = Math.floor((object.y ?? 0) / 32);
  const right = Math.ceil(((object.x ?? 0) + Math.max(1, object.width ?? 32)) / 32);
  const bottom = Math.ceil(((object.y ?? 0) + Math.max(1, object.height ?? 32)) / 32);
  const cells = new Set<string>();

  for (let row = y; row < bottom; row++) {
    for (let column = x; column < right; column++) cells.add(`${column},${row}`);
  }
  return cells;
}

function allLayers(layers: any[]): any[] {
  return layers.flatMap(layer => [
    layer,
    ...(Array.isArray(layer.layers) ? allLayers(layer.layers) : []),
  ]);
}

function flood(width: number, height: number, walls: Set<string>, start: string): Set<string> {
  const seen = new Set<string>();
  if (walls.has(start)) return seen;

  const queue = [start];
  seen.add(start);
  for (let index = 0; index < queue.length; index++) {
    const [x, y] = queue[index].split(',').map(Number);
    for (const [nextX, nextY] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      const next = `${nextX},${nextY}`;
      if (
        nextX >= 0 && nextY >= 0 && nextX < width && nextY < height
        && !walls.has(next) && !seen.has(next)
      ) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

function orthogonalNeighbors(cells: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const cell of cells) {
    const [x, y] = cell.split(',').map(Number);
    for (const adjacent of [`${x + 1},${y}`, `${x - 1},${y}`, `${x},${y + 1}`, `${x},${y - 1}`]) {
      result.add(adjacent);
    }
  }
  return result;
}

async function readMap(meta: MapMeta) {
  const tiledPath = path.join(repo, 'public', meta.tiledAsset);
  const tiled = JSON.parse(await readFile(tiledPath, 'utf8'));
  const layers = allLayers(tiled.layers ?? []);
  const objects = layers
    .filter(layer => layer.type === 'objectgroup')
    .flatMap(layer => layer.objects ?? []) as Obj[];
  const collision = layers
    .filter(layer => layer.name === 'collision')
    .flatMap(layer => layer.objects ?? []) as Obj[];
  return { meta, tiled, collision, npcs: objects.filter(object => props(object).kind === 'npc') };
}

test('map NPC collision covers every NPC and preserves spawn reachability', async () => {
  const files = (await readdir(path.join(repo, 'content/maps')))
    .filter(file => file.endsWith('.map.json'));
  assert.ok(files.length > 0, 'expected map catalog files');

  const maps = await Promise.all(files.map(async file => {
    const meta = JSON.parse(await readFile(path.join(repo, 'content/maps', file), 'utf8')) as MapMeta;
    return readMap(meta);
  }));
  const seenMarkers = new Set<string>();

  for (const { meta, tiled, collision, npcs } of maps) {
    const marked = collision.filter(object => typeof props(object).npcCollisionFor === 'string');
    const npcById = new Map(
      npcs.map(npc => [String(props(npc).npcId ?? props(npc).id ?? npc.name), npc]),
    );
    for (const marker of marked) {
      const id = String(props(marker).npcCollisionFor);
      assert.ok(intendedNpcIds.has(id), `${meta.id}: unexpected npcCollisionFor=${id}`);
      assert.ok(!seenMarkers.has(id), `duplicate npcCollisionFor=${id}`);
      seenMarkers.add(id);

      const npc = npcById.get(id);
      assert.ok(npc, `${meta.id}: marker ${id} has no matching kind=npc object`);
      const markerCells = tileRect(marker);
      for (const cell of tileRect(npc)) {
        assert.ok(markerCells.has(cell), `${meta.id}/${id}: marker misses NPC tile ${cell}`);
      }
    }

    const gateFlags = collision
      .map(object => props(object).blocksUntilFlag)
      .filter((flag): flag is string => typeof flag === 'string');
    const baselineCollision = collision.filter(object => typeof props(object).npcCollisionFor !== 'string');
    const removedNpcCells = new Set(marked.flatMap(marker => [...tileRect(marker)]));

    for (const flags of [[], gateFlags]) {
      const solid = collectMapCollision(collision, tiled.width, tiled.height, flags);
      for (const npc of npcs) {
        const id = String(props(npc).npcId ?? props(npc).id ?? npc.name ?? 'unknown');
        for (const cell of tileRect(npc)) {
          assert.ok(solid.has(cell), `${meta.id}/${id}: NPC footprint cell ${cell} is not solid`);
        }
      }

      if (!marked.length || !meta.spawns.length) continue;
      const beforeWalls = collectMapCollision(baselineCollision, tiled.width, tiled.height, flags);
      const reachableBefore = new Set<string>();
      const reachableAfter = new Set<string>();

      for (const spawn of meta.spawns) {
        const start = `${spawn.x},${spawn.y}`;
        const before = flood(tiled.width, tiled.height, beforeWalls, start);
        const after = flood(tiled.width, tiled.height, solid, start);
        for (const cell of before) reachableBefore.add(cell);
        for (const cell of after) reachableAfter.add(cell);
        for (const cell of before) {
          if (!removedNpcCells.has(cell)) {
            assert.ok(after.has(cell), `${meta.id}: spawn ${spawn.id} loses reachable cell ${cell}`);
          }
        }
      }

      for (const marker of marked) {
        const cells = tileRect(marker);
        if (![...cells].some(cell => reachableBefore.has(cell))) continue;
        const hasApproach = [...orthogonalNeighbors(cells)].some(cell => reachableAfter.has(cell));
        const id = String(props(marker).npcCollisionFor);
        assert.ok(hasApproach, `${meta.id}/${id}: no reachable orthogonal interaction cell remains`);
      }
    }
  }

  assert.deepEqual(
    [...seenMarkers].sort(),
    [...intendedNpcIds].sort(),
    'marker inventory must match the 14 audited NPCs',
  );
});
