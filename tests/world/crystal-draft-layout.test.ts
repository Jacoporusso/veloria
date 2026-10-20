import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';

const read = (slug: string, ext: string) => JSON.parse(readFileSync(new URL(`../../content/drafts/crystal/${slug}.${ext}`, import.meta.url), 'utf8'));
const objects = (map: any, layer: string): any[] => map.layers.find((item: any) => item.name === layer).objects;
const props = (object: any): Record<string, any> => Object.fromEntries((object.properties ?? []).map((item: any) => [item.name, item.value]));
function traverse(map: any, start: {x: number; y: number}, safe = true, extra: string[] = []) {
  const blocked = collectMapCollision(objects(map, 'collision'), 40, 30, []);
  for (const tile of extra) blocked.add(tile);
  if (safe) for (const zone of objects(map, 'triggers').filter(item => props(item).kind === 'encounter-zone')) {
    for (let y = zone.y / 32; y < (zone.y + zone.height) / 32; y++) for (let x = zone.x / 32; x < (zone.x + zone.width) / 32; x++) blocked.add(`${x},${y}`);
  }
  const seen = new Set<string>(), queue = [[start.x, start.y]];
  assert.ok(!blocked.has(`${start.x},${start.y}`));
  for (let index = 0; index < queue.length; index++) {
    const [x, y] = queue[index], key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const [a, b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
      if (a >= 0 && a < 40 && b >= 0 && b < 30 && !blocked.has(`${a},${b}`) && !seen.has(`${a},${b}`)) queue.push([a,b]);
    }
  }
  return {seen, blocked};
}

for (const slug of ['r14_varco_cristallo', 'd05_grotte_cristallo']) {
  test(`${slug}: illustration, all safe spawns, portals and solid interactions remain reversible`, () => {
    const map = read(slug, 'tmj'), definition = read(slug, 'map.json');
    assert.equal(definition.version, 2);
    if (slug === 'd05_grotte_cristallo') assert.equal(definition.displayName, 'Grotte del Cristallo');
    assert.deepEqual([map.width, map.height, map.tilewidth, map.tileheight], [40,30,32,32]);
    assert.equal(definition.terrainBase.tileIndex, 0);
    assert.ok(definition.renderAssets.some((asset: any) => asset.key === definition.terrainBase.assetKey));
    const {seen, blocked} = traverse(map, definition.spawns[0]);
    for (const spawn of definition.spawns) {
      assert.ok(seen.has(`${spawn.x},${spawn.y}`));
      assert.deepEqual(traverse(map, spawn).seen, seen);
    }
    for (const trigger of objects(map, 'triggers').filter(item => props(item).kind === 'map-exit')) {
      assert.ok(seen.has(`${trigger.x/32},${trigger.y/32}`));
      assert.ok(definition.connections.some((connection: any) => connection.toMapId === props(trigger).destinationMapId && connection.targetSpawnId === props(trigger).destinationSpawnId));
      assert.ok(!definition.spawns.some((spawn: any) => spawn.x === trigger.x/32 && spawn.y === trigger.y/32));
    }
    for (const terminal of [...objects(map, 'interactions'), ...objects(map, 'characters')]) {
      const x=terminal.x/32, y=terminal.y/32;
      assert.ok(blocked.has(`${x},${y}`), terminal.name);
      assert.ok([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([a,b]) => seen.has(`${a},${b}`)), terminal.name);
    }
    const all = traverse(map, definition.spawns[0], false);
    assert.equal(all.seen.size, 1200-all.blocked.size, 'every walkable tile belongs to the returnable component');
    for (const zone of objects(map, 'triggers').filter(item => props(item).kind === 'encounter-zone')) assert.ok(all.seen.has(`${zone.x/32},${zone.y/32}`));
  });
}

test('R14 cliff and tree banks block shortcuts; belvedere and refuge have intended approaches', () => {
  const map = read('r14_varco_cristallo', 'tmj'), {seen,blocked} = traverse(map,{x:1,y:16});
  for (const tile of ['12,6','30,13','29,12','34,6']) assert.ok(seen.has(tile),tile);
  for (const tile of ['7,10','10,10','20,11','19,15','27,18','31,18','15,20','5,25']) assert.ok(blocked.has(tile),tile);
  const withoutStair=traverse(map,{x:1,y:16},true,['15,11','16,11','17,11']);
  assert.ok(!withoutStair.seen.has('34,6'), 'upper plateau is only accessible by its visible staircase');
});

test('D05 each height transition uses its visible stair and upper passage is narrative only', () => {
  const map=read('d05_grotte_cristallo','tmj'), {seen,blocked}=traverse(map,{x:11,y:28});
  for (const tile of ['5,14','18,12','29,3','37,3']) assert.ok(seen.has(tile),tile);
  for (const tile of ['14,16','16,15','22,17','23,7','29,8','9,8','32,10','30,20','4,21']) assert.ok(blocked.has(tile),tile);
  assert.ok(!traverse(map,{x:11,y:28},true,['18,16','19,16','20,16']).seen.has('18,12'));
  assert.ok(!traverse(map,{x:11,y:28},true,['25,8','26,8','27,8']).seen.has('29,3'));
  assert.equal(objects(map,'triggers').filter(item=>props(item).kind==='map-exit').length,1);
  assert.ok(objects(map,'interactions').some(item=>props(item).dialogueId==='d05_upper_passage'));
  assert.ok(objects(map,'interactions').some(item=>props(item).kind==='environment-regulator'&&props(item).regulatorId==='crystalclimate'));
});
