import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {collectMapCollision} from '../../src/core/world/map-collision.ts';

const read = (slug: string, suffix: string) => JSON.parse(readFileSync(new URL(`../../content/drafts/concordia/${slug}.${suffix}`, import.meta.url), 'utf8'));
const properties = (object: any): Record<string, any> => Object.fromEntries((object.properties ?? []).map((p: any) => [p.name, p.value]));
const objects = (map: any, name: string): any[] => map.layers.find((layer: any) => layer.name === name).objects;
function traverse(map: any, start: {x: number; y: number}, flags: string[], avoidHabitat = true) {
  const blocked = collectMapCollision(objects(map, 'collision'), map.width, map.height, flags);
  if (avoidHabitat) for (const zone of objects(map, 'triggers').filter(zone => properties(zone).kind === 'encounter-zone')) {
    for (let y = zone.y / 32; y < (zone.y + zone.height) / 32; y++) {
      for (let x = zone.x / 32; x < (zone.x + zone.width) / 32; x++) blocked.add(`${x},${y}`);
    }
  }
  assert.ok(!blocked.has(`${start.x},${start.y}`), 'spawn is on authored floor');
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [[start.x, start.y]];
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [a, b] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      const key = `${a},${b}`;
      if (a < 0 || a >= map.width || b < 0 || b >= map.height || blocked.has(key) || seen.has(key)) continue;
      seen.add(key);
      queue.push([a, b]);
    }
  }
  return {seen, blocked};
}
function hasApproach(seen: Set<string>, object: any) {
  const x = object.x / 32, y = object.y / 32;
  return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => seen.has(`${a},${b}`));
}

for (const slug of ['r15_passo_due_luci', 'concordia', 'gym08_concordia']) {
  for (const unlocked of [false, true]) test(`${slug}: reversible floor and usable interactions with gate ${unlocked ? 'open' : 'closed'}`, () => {
    const map = read(slug, 'tmj'), meta = read(slug, 'map.json');
    const flags = unlocked ? ['gym08_convergence_complete'] : [];
    assert.equal(meta.version, 2);
    assert.deepEqual([map.tilewidth, map.tileheight], [32, 32]);
    assert.deepEqual([map.width, map.height], slug === 'gym08_concordia' ? [32, 24] : [40, 30]);
    const exits = objects(map, 'triggers').filter(object => properties(object).kind === 'map-exit');
    for (const spawn of meta.spawns) {
      const {seen} = traverse(map, spawn, flags);
      for (const other of meta.spawns) assert.ok(seen.has(`${other.x},${other.y}`), other.id);
      for (const exit of exits) {
        const props = properties(exit);
        assert.ok(seen.has(`${exit.x / 32},${exit.y / 32}`), exit.name);
        assert.ok(meta.connections.some((c: any) => c.toMapId === props.destinationMapId && c.targetSpawnId === props.destinationSpawnId), exit.name);
        assert.ok(!(spawn.x * 32 >= exit.x && spawn.x * 32 < exit.x + exit.width && spawn.y * 32 >= exit.y && spawn.y * 32 < exit.y + exit.height), 'arrival is outside portal');
      }
      for (const object of objects(map, 'interactions')) assert.ok(hasApproach(seen, object), object.name);
      for (const npc of objects(map, 'characters')) {
        if (!unlocked && properties(npc).battleRequiredFlag) continue;
        assert.ok(hasApproach(seen, npc), npc.name);
      }
    }
  });
}

test('R15 keeps both readings reachable, habitat optional and the disconnected lower island closed', () => {
  const map = read('r15_passo_due_luci', 'tmj');
  const safe = traverse(map, {x: 2, y: 10}, []);
  for (const tile of ['17,4', '29,19', '38,9']) assert.ok(safe.seen.has(tile), tile);
  for (const tile of ['5,21', '7,23', '9,24', '20,25', '30,4', '31,4', '32,4']) assert.ok(safe.blocked.has(tile), tile);
  const zones = objects(map, 'triggers').filter(object => properties(object).kind === 'encounter-zone');
  assert.equal(zones.length, 1);
  for (const zone of zones) {
    assert.equal(properties(zone).encounterChance, 0.2);
    assert.equal(properties(zone).encounterTableId, 'veloria/r15_garden_patch');
    assert.ok(traverse(map, {x: 2, y: 10}, [], false).seen.has(`${zone.x / 32},${zone.y / 32}`));
  }
});

test('Concordia fountain, services, Elia and terminal retain solid footprints with reachable approaches', () => {
  const map = read('concordia', 'tmj');
  const {seen, blocked} = traverse(map, {x: 1, y: 15}, []);
  for (const tile of ['8,11', '13,12', '29,11', '20,24', '20,6']) assert.ok(seen.has(tile), tile);
  for (const tile of ['20,14', '8,10', '13,11', '29,10', '20,23']) assert.ok(blocked.has(tile), tile);
  const exits = objects(map, 'triggers').filter(object => properties(object).kind === 'map-exit');
  assert.equal(exits.length, 2);
  assert.equal(exits.some(object => /sanctuary|r16|league/.test(properties(object).destinationMapId)), false);
});

test('P8 controls precede the gate and only the completed network unlocks Aurel', () => {
  const map = read('gym08_concordia', 'tmj');
  const closed = traverse(map, {x: 15, y: 22}, []);
  const opened = traverse(map, {x: 15, y: 22}, ['gym08_convergence_complete']);
  const controls = objects(map, 'interactions').filter(object => properties(object).kind === 'signal-router-switch');
  assert.deepEqual(controls.map(object => properties(object).nodeId), ['westlower', 'westupper', 'eastlower', 'eastupper']);
  for (const control of controls) {
    assert.ok(hasApproach(closed.seen, control));
    assert.ok(closed.blocked.has(`${control.x / 32},${control.y / 32}`));
    assert.equal(properties(control).routerId, 'gym08convergence');
  }
  assert.equal(closed.seen.has('16,3'), false);
  assert.ok(opened.seen.has('16,3'));
  for (const tile of ['7,14', '24,14', '16,8', '16,2']) assert.ok(opened.blocked.has(tile), tile);
  // Every reachable dry tile can return to the entrance in the same gate state.
  for (const state of [closed, opened]) assert.ok(state.seen.has('15,23'));
});
