import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';
const read = (path: string) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const layer = (map: any, name: string): any[] => map.layers.find((item: any) => item.name === name)?.objects ?? [];
const props = (object: any): Record<string, any> => Object.fromEntries((object.properties ?? []).map((item: any) => [item.name, item.value]));
const tiles = (object: any): string[] => {
  const result: string[] = [];
  for (let y = object.y / 32; y < (object.y + object.height) / 32; y++) for (let x = object.x / 32; x < (object.x + object.width) / 32; x++) result.push(`${x},${y}`);
  return result;
};
function flood(map: any, start: { x: number; y: number }, avoidHabitats = false) {
  const blocked = collectMapCollision(layer(map, 'collision'), map.width, map.height, []);
  if (avoidHabitats) for (const zone of layer(map, 'triggers').filter(object => props(object).kind === 'encounter-zone')) for (const tile of tiles(zone)) blocked.add(tile);
  const seen = new Set<string>();
  const queue = [[start.x, start.y]];
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i], key = `${x},${y}`;
    if (x < 0 || y < 0 || x >= map.width || y >= map.height || blocked.has(key) || seen.has(key)) continue;
    seen.add(key);
    queue.push([x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
  }
  return { seen, blocked };
}
function approachable(seen: Set<string>, object: any) {
  return tiles(object).some(tile => {
    const [x, y] = tile.split(',').map(Number);
    return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => seen.has(`${a},${b}`));
  });
}
for (const name of ['r16_cammino_equilibrio', 'league_forecourt']) {
  const map = read(`public/tilemaps/${name}.tmj`), metadata = read(`content/maps/${name}.map.json`);
  test(`${name}: every arrival can return, with reachable solid characters and service entrances`, () => {
    assert.deepEqual([map.width, map.height, map.tilewidth, map.tileheight], [40, 30, 32, 32]);
    const exits = layer(map, 'triggers').filter(object => props(object).kind === 'map-exit');
    assert.ok(exits.length > 0);
    for (const spawn of metadata.spawns) {
      const { seen, blocked } = flood(map, spawn);
      assert.ok(seen.has(`${spawn.x},${spawn.y}`), `${spawn.id} is walkable`);
      assert.equal(seen.size, map.width * map.height - blocked.size, 'all walkable floor joins the return network');
      for (const exit of exits) {
        assert.ok(!tiles(exit).includes(`${spawn.x},${spawn.y}`), `${spawn.id} must not immediately reenter ${exit.name}`);
        assert.ok(tiles(exit).some(tile => seen.has(tile)), `${spawn.id} can reach ${exit.name}`);
      }
      for (const object of [...layer(map, 'characters'), ...layer(map, 'interactions')]) {
        assert.ok(approachable(seen, object), `${object.name} has a reachable adjacent tile`);
        for (const tile of tiles(object)) assert.ok(blocked.has(tile), `${object.name} has a solid footprint at ${tile}`);
      }
    }
  });
}

test('R16 three landings and both exits remain connected when all habitat patches are avoided', () => {
  const map = read('public/tilemaps/r16_cammino_equilibrio.tmj');
  const metadata = read('content/maps/r16_cammino_equilibrio.map.json');
  assert.equal(layer(map, 'triggers').filter(object => props(object).kind === 'encounter-zone').length, 3);
  for (const spawn of metadata.spawns) {
    const { seen, blocked } = flood(map, spawn, true);
    for (const tile of ['8,20', '20,14', '31,5', '0,19', '39,1']) assert.ok(seen.has(tile), `${spawn.id} reaches landing/exit ${tile} without wild encounters`);
    for (const tile of ['5,5', '16,5', '5,25', '27,23', '36,20', '24,25']) assert.ok(blocked.has(tile), `water, cliffs and void remain protected at ${tile}`);
  }
});

test('League forecourt pavilions, pools and palace walls are solid while door approaches remain clear', () => {
  const map = read('public/tilemaps/league_forecourt.tmj');
  const { blocked, seen } = flood(map, { x: 1, y: 15 });
  for (const tile of ['8,11', '9,12', '10,13', '30,11', '31,12', '32,13', '4,8', '35,8', '3,24', '35,24', '20,2']) assert.ok(blocked.has(tile), `pavilion/pool/wall at ${tile} is solid`);
  for (const tile of ['9,15', '31,15', '20,6', '20,8', '20,20']) assert.ok(seen.has(tile), `service or palace approach ${tile} is reachable`);
});

test('Maia and Tobia actual trainer teams use supported official moves learned by their authored levels', () => {
  const species = read('content/battle/species.v1.json').species;
  const moves = read('content/battle/moves.v1.json').moves;
  for (const trainerName of ['r16_maia', 'r16_tobia']) {
    const trainer = read(`content/trainers/${trainerName}.trainer.json`);
    assert.equal(trainer.team.length, 3);
    for (const member of trainer.team) {
      const legal = new Set(species[String(member.speciesId)].officialLearnset.filter((entry: any) => entry.level <= member.level).map((entry: any) => entry.moveId));
      for (const moveId of member.moveIds) {
        assert.ok(moves[moveId], `${trainer.name}: supported ${moveId}`);
        assert.ok(legal.has(moveId), `${trainer.name}: species ${member.speciesId} cannot learn ${moveId} by level ${member.level}`);
      }
    }
  }
});
