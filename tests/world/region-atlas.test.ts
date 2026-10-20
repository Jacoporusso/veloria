import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { areaForMap, deriveAtlasState, recordAreaVisited, regionAtlas, visitedAreaIds } from '../../src/core/world/region-atlas.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const save = (mapId: string, flags: string[] = []) => ({ player: { mapId }, flags }) as Pick<GameSave, 'player' | 'flags'>;

test('every runtime map belongs to one atlas area, including grouped interiors', () => {
  const maps = readdirSync('content/maps').filter(path => path.endsWith('.map.json'))
    .map(path => JSON.parse(readFileSync(`content/maps/${path}`, 'utf8')));
  const assigned = regionAtlas.areas.flatMap(area => area.mapIds);
  assert.equal(new Set(assigned).size, assigned.length);
  assert.deepEqual([...assigned].sort(), maps.map(map => map.id).sort());
  for (const map of maps) for (const connection of map.connections) {
    const a = areaForMap(map.id)!.id;
    const b = areaForMap(connection.toMapId)!.id;
    if (a !== b) assert.ok(regionAtlas.connections.some(([from, to]) => from === a && to === b || from === b && to === a), `${a} must connect to ${b}`);
  }
});

test('current home, lab and gyms point at their settlement; routes retain their own marker', () => {
  assert.equal(deriveAtlasState(save('veloria/borgofonte_lab')).currentAreaId, 'borgofonte');
  assert.equal(deriveAtlasState(save('veloria/borgofonte_home')).currentAreaId, 'borgofonte');
  assert.equal(deriveAtlasState(save('veloria/gym03_vetracielo')).currentAreaId, 'vetracielo');
  assert.equal(deriveAtlasState(save('veloria/r02_viale_fronde')).currentAreaId, 'r02');
  assert.equal(deriveAtlasState(save('veloria/r06_anello_magnetico')).currentAreaId, 'r06');
  const current = deriveAtlasState(save('veloria/r06_anello_magnetico')).areas.find(area => area.current)!;
  assert.ok(current.visited); assert.equal(current.status, 'Sei qui');
});

test('visit recording is immutable, idempotent and ignores unknown destinations', () => {
  const original = ['q_starter_selected'];
  const next = recordAreaVisited(original, 'veloria/r01_sentiero_alba');
  assert.deepEqual(original, ['q_starter_selected']);
  assert.deepEqual(recordAreaVisited(next, 'veloria/r01_sentiero_alba'), next);
  assert.deepEqual(recordAreaVisited(next, 'veloria/unknown'), next);
  assert.deepEqual(visitedAreaIds(next), ['borgofonte', 'r01']);
});

test('quest evidence marks only witnessed places, never inferred routes or the unvisited League forecourt', () => {
  const state = deriveAtlasState(save('veloria/gym03_vetracielo', ['badge_aurora_awarded', 'q_ferraluce_report']));
  assert.deepEqual(state.areas.filter(area => area.visited).map(area => area.id), ['brumalta', 'vetracielo', 'ferraluce']);
  assert.ok(!state.areas.find(area => area.id === 'r06')!.visited);
  const league = state.areas.find(area => area.id === 'lega')!;
  assert.equal(league.available, true);
  assert.equal(league.visited, false);
  assert.ok(league.mapIds.includes('veloria/league_forecourt'));
  assert.ok(league.mapIds.includes('veloria/league_champion'));
  assert.equal(league.mapIds.length, 6);
  const witnessed = deriveAtlasState(save('veloria/concordia', ['q_league_visited']));
  assert.equal(witnessed.areas.find(area => area.id === 'lega')!.status, 'Visitato');
  assert.equal(witnessed.areas.find(area => area.id === 'r16')!.visited, false);
});

test('macro geography follows the documented peninsula and all eight gym cities', () => {
  const cities = regionAtlas.areas.filter(area => area.gym).sort((a, b) => a.gym! - b.gym!);
  assert.deepEqual(cities.map(area => area.id), ['brumalta', 'petalora', 'vetracielo', 'ferraluce', 'portolume', 'acquariva', 'biancavetta', 'concordia']);
  const at = (id: string) => regionAtlas.areas.find(area => area.id === id)!;
  assert.ok(at('petalora').y < at('brumalta').y);
  assert.ok(at('ferraluce').x > at('vetracielo').x);
  assert.ok(at('portolume').y > at('ferraluce').y);
  assert.ok(at('acquariva').x < at('portolume').x);
  assert.ok(at('biancavetta').y < at('vetracielo').y);
  assert.ok(at('concordia').x > at('biancavetta').x);
  for (const [a, b] of regionAtlas.connections) { assert.ok(at(a)); assert.ok(at(b)); }
});
