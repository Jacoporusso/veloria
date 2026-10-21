import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';

for (const [map, npc, x, y] of [
  ['r09_dune_salmastre', 'r09_noemi', 28, 9],
  ['r10_sentiero_canne', 'r10_bruno', 16, 13],
  ['r12_valle_vento', 'r12_ruben', 24, 7],
  ['r13_tornanti_bianchi', 'r13_alma', 25, 13],
] as const) {
  test(`${npc} is solid and both map spawns remain connected without entering habitats`, () => {
    const tiled = JSON.parse(readFileSync(new URL(`../../public/tilemaps/${map}.tmj`, import.meta.url), 'utf8'));
    const metadata = JSON.parse(readFileSync(new URL(`../../content/maps/${map}.map.json`, import.meta.url), 'utf8'));
    const blocked = collectMapCollision(tiled.layers.find((l: any) => l.name === 'collision').objects, tiled.width, tiled.height, []);
    assert.ok(blocked.has(`${x},${y}`), 'NPC collision must exist in the authored map');
    const actor = tiled.layers.flatMap((l: any) => l.objects ?? []).find((o: any) => o.properties?.some((p: any) => p.name === 'npcId' && p.value === npc));
    assert.deepEqual([actor.x / 32, actor.y / 32], [x, y]);
    for (const trigger of tiled.layers.find((l: any) => l.name === 'triggers').objects) {
      if (!trigger.properties?.some((p: any) => p.name === 'kind' && ['encounter-zone', 'map-exit'].includes(p.value))) continue;
      for (const cell of collectMapCollision([trigger], tiled.width, tiled.height, [])) blocked.add(cell);
    }
    for (const spawn of metadata.spawns) {
      const start = `${spawn.x},${spawn.y}`, visited = new Set([start]), queue = [start];
      assert.ok(!blocked.has(start), `spawn ${spawn.id} is blocked`);
      for (let i = 0; i < queue.length; i++) {
        const [cx, cy] = queue[i].split(',').map(Number);
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const nx = cx + dx, ny = cy + dy, key = `${nx},${ny}`;
          if (nx < 0 || ny < 0 || nx >= tiled.width || ny >= tiled.height || blocked.has(key) || visited.has(key)) continue;
          visited.add(key); queue.push(key);
        }
      }
      assert.ok(visited.has(`${x},${y + 1}`), `trainer approach unreachable from ${spawn.id}`);
      for (const target of metadata.spawns) assert.ok(visited.has(`${target.x},${target.y}`), `return ${target.id} unreachable from ${spawn.id}`);
    }
  });
}
