import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { monorailNetwork, monorailUnlocked, monorailDestinations, planMonorailTrip } from '../../src/core/world/monorail.ts';
import { areaForMap } from '../../src/core/world/region-atlas.ts';

const unlocked = 'badge_circuito_awarded';
const save = (flags: readonly string[], mapId = 'veloria/vetracielo') => ({ player: { mapId }, flags });

test('Circuito unlock is required both to list destinations and to plan a trip', () => {
  const state = save(['q_brumalta_visited']);
  assert.equal(monorailUnlocked(state.flags), false);
  assert.deepEqual(monorailDestinations(state, 'vetracielo'), []);
  assert.deepEqual(planMonorailTrip(state, 'vetracielo', 'brumalta'), { ok: false, reason: 'locked' });
  assert.equal(monorailUnlocked([unlocked]), true);
});

test('origin must match the current map and cannot teleport from an interior', () => {
  const state = save([unlocked, 'q_brumalta_visited']);
  assert.deepEqual(monorailDestinations(state, 'petalora'), []);
  assert.deepEqual(planMonorailTrip(state, 'petalora', 'brumalta'), { ok: false, reason: 'wrong-origin' });
  assert.deepEqual(planMonorailTrip(save(state.flags, 'veloria/gym03_vetracielo'), 'vetracielo', 'brumalta'), { ok: false, reason: 'wrong-origin' });
});

test('unvisited, same-station and future destinations cannot be selected', () => {
  const state = save([unlocked]);
  assert.deepEqual(monorailDestinations(state, 'vetracielo'), []);
  assert.deepEqual(planMonorailTrip(state, 'vetracielo', 'brumalta'), { ok: false, reason: 'unvisited' });
  assert.deepEqual(planMonorailTrip(state, 'vetracielo', 'vetracielo'), { ok: false, reason: 'same-station' });
  assert.deepEqual(planMonorailTrip(state, 'vetracielo', 'concordia'), { ok: false, reason: 'unvisited' });
  assert.deepEqual(planMonorailTrip(state, 'vetracielo', 'lega'), { ok: false, reason: 'unknown-station' });
  assert.deepEqual(planMonorailTrip(state, 'missing', 'brumalta'), { ok: false, reason: 'unknown-station' });
});

test('each city uses explicit atlas visit flags and existing quest visit evidence', () => {
  for (const destination of monorailNetwork.stations) {
    const origin = monorailNetwork.stations.find(station => station.id !== destination.id)!;
    const area = areaForMap(destination.mapId)!;
    for (const evidence of [...area.visitedFlags, ...area.mapIds.map(id => `atlas_visited_${id}`)]) {
      const state = save([unlocked, evidence], origin.mapId);
      assert.ok(monorailDestinations(state, origin.id).some(station => station.id === destination.id), evidence);
      assert.deepEqual(planMonorailTrip(state, origin.id, destination.id), { ok: true, destination });
    }
  }
});

test('listing and planning preserve frozen player state, flags and progression', () => {
  const state = Object.freeze({ player: Object.freeze({ mapId: 'veloria/vetracielo', money: 850 }), flags: Object.freeze([unlocked, 'q_brumalta_visited']), badges: Object.freeze(['badge_circuito']) });
  const before = JSON.stringify(state);
  const choices = monorailDestinations(state, 'vetracielo');
  assert.equal(choices.some(station => station.id === 'vetracielo'), false);
  assert.equal(planMonorailTrip(state, 'vetracielo', 'brumalta').ok, true);
  assert.equal(JSON.stringify(state), before);
});

test('all transit station maps and arrival spawn IDs are authored in runtime content', () => {
  const maps = readdirSync('content/maps').filter(file => file.endsWith('.map.json')).map(file => JSON.parse(readFileSync(`content/maps/${file}`, 'utf8')));
  assert.equal(new Set(monorailNetwork.stations.map(station => station.id)).size, monorailNetwork.stations.length);
  for (const station of monorailNetwork.stations) {
    const map = maps.find(item => item.id === station.mapId);
    assert.ok(map, station.mapId);
    assert.ok(map.spawns.some((spawn: { id: string }) => spawn.id === station.spawnPointId));
  }
});
