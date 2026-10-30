import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';
import { adjustEnvironmentRegulator, environmentRegulatorState, type EnvironmentRegulator } from '../../src/core/world/environment-regulator.ts';
import { getLegendaryResearch } from '../../src/game/maps/legendary-research-registry.ts';

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const map = read('../../public/tilemaps/d06_santuario_due_luci.tmj');
const metadata = read('../../content/maps/d06_santuario_due_luci.map.json');
const concordia = read('../../content/maps/concordia.map.json');
const regulator = read('../../content/regulators/sanctuary_balance.v1.json') as EnvironmentRegulator;
const layer = (data: any, name: string) => data.layers.find((item: any) => item.name === name)?.objects ?? [];
const props = (object: any): Record<string, any> => Object.fromEntries((object.properties ?? []).map((item: any) => [item.name, item.value]));

function reachable(start: { x: number; y: number }) {
  const blocked = collectMapCollision(layer(map, 'collision'), map.width, map.height, []);
  assert.ok(!blocked.has(`${start.x},${start.y}`), 'spawn tile must be walkable');
  const seen = new Set<string>([`${start.x},${start.y}`]);
  const queue = [[start.x, start.y]];
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      const key = `${nextX},${nextY}`;
      if (nextX < 0 || nextX >= map.width || nextY < 0 || nextY >= map.height || blocked.has(key) || seen.has(key)) continue;
      seen.add(key);
      queue.push([nextX, nextY]);
    }
  }
  return { blocked, seen };
}

function hasApproach(seen: Set<string>, object: any) {
  const left = object.x / map.tilewidth, top = object.y / map.tileheight;
  const right = (object.x + object.width) / map.tilewidth - 1;
  const bottom = (object.y + object.height) / map.tileheight - 1;
  return Array.from({ length: right - left + 1 }, (_, i) => left + i).some(x =>
    seen.has(`${x},${top - 1}`) || seen.has(`${x},${bottom + 1}`)) ||
    Array.from({ length: bottom - top + 1 }, (_, i) => top + i).some(y =>
      seen.has(`${left - 1},${y}`) || seen.has(`${right + 1},${y}`));
}

test('D06 sanctuary entrance, return path and all authored interactions are reachable', () => {
  assert.equal(metadata.id, 'veloria/d06_santuario_due_luci');
  assert.equal(metadata.tiledAsset, 'tilemaps/d06_santuario_due_luci.tmj');
  assert.deepEqual([map.width, map.height, map.tilewidth, map.tileheight], [32, 24, 32, 32]);
  assert.equal(metadata.spawns.length, 1);
  const spawn = metadata.spawns[0];
  const { blocked, seen } = reachable(spawn);
  const exit = layer(map, 'triggers').find((item: any) => props(item).kind === 'map-exit');
  assert.ok(exit, 'sanctuary has a return portal');
  assert.equal(props(exit).destinationMapId, 'veloria/concordia');
  assert.equal(props(exit).destinationSpawnId, 'from_sanctuary');
  assert.ok(seen.has(`${exit.x / 32},${exit.y / 32}`), 'portal is reachable from the sanctuary entrance');
  assert.ok(!(spawn.x * 32 >= exit.x && spawn.x * 32 < exit.x + exit.width && spawn.y * 32 >= exit.y && spawn.y * 32 < exit.y + exit.height), 'arrival is outside the return portal');
  assert.equal(seen.size, map.width * map.height - blocked.size, 'every walkable tile can return to the entrance');

  const specialPokemon = layer(map, 'interactions').filter((item: any) => props(item).kind === 'wild-pokemon');
  assert.equal(specialPokemon.length, 1, 'Mewtwo is a separate post-League encounter');
  assert.ok(hasApproach(seen, specialPokemon[0]), 'Mewtwo can be approached when unlocked');
  const interactions = layer(map, 'interactions').filter((item: any) => props(item).kind !== 'wild-pokemon');
  assert.equal(interactions.length, 8, 'four original stations plus three research clues and one puzzle');
  const clues = interactions.filter((item: any) => props(item).kind === 'research-clue');
  const puzzles = interactions.filter((item: any) => props(item).kind === 'research-puzzle');
  assert.equal(clues.length, 3);
  assert.equal(puzzles.length, 1);
  const research = getLegendaryResearch('veloria/research_mewtwo')!;
  assert.ok(research);
  assert.deepEqual(clues.map((item: any) => props(item).researchClueId).sort(), research.clues.map(clue => clue.id).sort());
  for (const clue of research.clues) {
    const object = clues.find((item: any) => props(item).researchClueId === clue.id);
    assert.equal(props(object).questEvent, clue.event);
    assert.equal(props(object).activatedFlag, clue.flag);
  }
  assert.equal(props(puzzles[0]).questEvent, research.puzzle.event);
  assert.equal(props(puzzles[0]).collectedFlag, research.revealedFlag);
  for (const terminal of interactions) {
    assert.ok(hasApproach(seen, terminal), `${terminal.name} has an approachable side`);
    if (['hotspot', 'environment-regulator'].includes(props(terminal).kind)) {
      const left = terminal.x / 32, top = terminal.y / 32;
      const right = (terminal.x + terminal.width) / 32 - 1, bottom = (terminal.y + terminal.height) / 32 - 1;
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) assert.ok(blocked.has(`${x},${y}`), `${terminal.name} footprint is solid`);
    }
  }
  const npcs = layer(map, 'characters');
  assert.equal(npcs.length, 1);
  for (const npc of npcs) assert.ok(hasApproach(seen, npc), `${npc.name} is approachable`);
  assert.equal(layer(map, 'triggers').filter((item: any) => props(item).kind === 'encounter-zone').length, 0, 'the sanctuary has no habitat encounter patches');

  for (const tile of ['0,8', '31,8', '8,1', '22,22', '14,5', '15,5', '16,5', '17,5', '15,14', '16,15']) {
    assert.ok(blocked.has(tile), `outer foliage, water edge or sanctuary plinth blocks ${tile}`);
  }
});

test('Concordia links the sanctuary through its authored badge gate and arrival spawn', () => {
  const connection = concordia.connections.find((item: any) => item.toMapId === metadata.id);
  assert.ok(connection);
  assert.equal(connection.viaSpawnId, 'from_sanctuary');
  assert.equal(connection.targetSpawnId, metadata.spawns[0].id);
  assert.deepEqual(connection.requiresFlags, ['badge_drago_awarded']);
  const citySpawn = concordia.spawns.find((item: any) => item.id === connection.viaSpawnId);
  assert.ok(citySpawn);
  assert.deepEqual([citySpawn.x, citySpawn.y], [31, 14]);
  const cityMap = read('../../public/tilemaps/concordia.tmj');
  const cityBlocked = collectMapCollision(layer(cityMap, 'collision'), cityMap.width, cityMap.height, []);
  assert.ok(!cityBlocked.has(`${citySpawn.x},${citySpawn.y}`), 'Concordia arrival is on walkable floor');
});

test('the 27 regulator settings have one balanced state regardless of adjustment order', () => {
  const required = [...regulator.requiredFlags];
  const order = [...regulator.controls].reverse();
  const balanced = new Set<string>();
  let count = 0;
  for (let first = 0; first <= 2; first++) for (let second = 0; second <= 2; second++) for (let third = 0; third <= 2; third++) {
    const wanted = [first, second, third];
    let flags = [...required];
    for (const control of order) {
      const targetValue = wanted[regulator.controls.indexOf(control)];
      while (environmentRegulatorState(regulator, flags).values[control.id] !== targetValue) {
        const current = environmentRegulatorState(regulator, flags).values[control.id];
        flags = adjustEnvironmentRegulator(regulator, control.id, current < targetValue ? 1 : -1, flags).flags;
      }
    }
    const state = environmentRegulatorState(regulator, flags);
    count++;
    if (state.balanced) balanced.add(regulator.controls.map(control => state.values[control.id]).join(','));
  }
  assert.equal(count, 27);
  assert.equal(balanced.size, 1);
});
