import assert from 'node:assert/strict';
import test from 'node:test';
import {
  localFerryDestinations,
  planLocalFerryTrip,
  validateLocalFerryNetwork,
  type LocalFerryNetwork,
} from '../../src/core/world/local-ferry.ts';

const network: LocalFerryNetwork = {
  id: 'portolume-ferry',
  name: 'Portolume Ferry',
  requiredFlags: ['ferry_open'],
  stops: [
    { id: 'east-pier', name: 'East Pier', mapId: 'portolume/harbor', spawnPointId: 'east-dock' },
    { id: 'west-pier', name: 'West Pier', mapId: 'portolume/harbor', spawnPointId: 'west-dock', requiredFlags: ['west_unlocked'] },
    { id: 'isle-pier', name: 'Isle Pier', mapId: 'portolume/isle', spawnPointId: 'arrival-dock' },
  ],
  routes: [
    { fromStopId: 'east-pier', toStopId: 'west-pier' },
    { fromStopId: 'west-pier', toStopId: 'east-pier', requiredFlags: ['return_route'] },
    { fromStopId: 'east-pier', toStopId: 'isle-pier', requiredFlags: ['isle_route'] },
  ],
};

const traveler = (flags: readonly string[], mapId = 'portolume/harbor') => ({ player: { mapId }, flags });

test('same-map docks are distinct stops and only authored directed routes appear', () => {
  const choices = localFerryDestinations(network, traveler(['ferry_open', 'west_unlocked']), 'east-pier');
  assert.deepEqual(choices.map(stop => stop.id), ['west-pier']);
  assert.deepEqual(localFerryDestinations(network, traveler(['ferry_open', 'west_unlocked', 'return_route']), 'west-pier').map(stop => stop.id), ['east-pier']);
  assert.deepEqual(localFerryDestinations(network, traveler(['ferry_open', 'west_unlocked']), 'west-pier'), []);
});

test('destination and route gates are checked again when boarding', () => {
  assert.deepEqual(planLocalFerryTrip(network, traveler(['ferry_open']), 'east-pier', 'west-pier'), { ok: false, reason: 'locked' });
  assert.deepEqual(planLocalFerryTrip(network, traveler(['ferry_open', 'west_unlocked']), 'east-pier', 'isle-pier'), { ok: false, reason: 'locked' });
  assert.deepEqual(planLocalFerryTrip(network, traveler(['ferry_open', 'west_unlocked']), 'east-pier', 'west-pier'), {
    ok: true, destination: network.stops[1],
  });
});

test('planning reports unknown, wrong-origin, same-stop and missing-route states', () => {
  const state = traveler(['ferry_open', 'west_unlocked']);
  assert.deepEqual(planLocalFerryTrip(network, state, 'missing', 'west-pier'), { ok: false, reason: 'unknown-stop' });
  assert.deepEqual(planLocalFerryTrip(network, state, 'east-pier', 'missing'), { ok: false, reason: 'unknown-stop' });
  assert.deepEqual(planLocalFerryTrip(network, traveler(['ferry_open'], 'portolume/isle'), 'east-pier', 'west-pier'), { ok: false, reason: 'wrong-origin' });
  assert.deepEqual(planLocalFerryTrip(network, state, 'east-pier', 'east-pier'), { ok: false, reason: 'same-stop' });
  assert.deepEqual(planLocalFerryTrip(network, state, 'west-pier', 'isle-pier'), { ok: false, reason: 'no-route' });
});

test('network and traveler inputs are not mutated', () => {
  const state = Object.freeze({ player: Object.freeze({ mapId: 'portolume/harbor', x: 12, y: 20 }), flags: Object.freeze(['ferry_open', 'west_unlocked']) });
  const frozen = Object.freeze({
    ...network,
    requiredFlags: Object.freeze([...network.requiredFlags]),
    stops: Object.freeze(network.stops.map(stop => Object.freeze({ ...stop, requiredFlags: stop.requiredFlags && Object.freeze([...stop.requiredFlags]) }))),
    routes: Object.freeze(network.routes.map(route => Object.freeze({ ...route, requiredFlags: route.requiredFlags && Object.freeze([...route.requiredFlags]) }))),
  });
  const beforeNetwork = JSON.stringify(frozen);
  const beforeState = JSON.stringify(state);
  localFerryDestinations(frozen, state, 'east-pier');
  planLocalFerryTrip(frozen, state, 'east-pier', 'west-pier');
  assert.equal(JSON.stringify(frozen), beforeNetwork);
  assert.equal(JSON.stringify(state), beforeState);
});

test('malformed network data fails clearly before listing or planning', () => {
  const cases: LocalFerryNetwork[] = [
    { ...network, id: '' },
    { ...network, name: '' },
    { ...network, stops: [] },
    { ...network, routes: [] },
    { ...network, stops: [...network.stops, network.stops[0]] },
    { ...network, routes: [...network.routes, network.routes[0]] },
    { ...network, routes: [{ fromStopId: 'east-pier', toStopId: 'missing' }] },
    { ...network, routes: [{ fromStopId: 'east-pier', toStopId: 'east-pier' }] },
    { ...network, stops: [{ ...network.stops[0], id: ' ' }, ...network.stops.slice(1)] },
    { ...network, stops: [{ ...network.stops[0], name: '' }, ...network.stops.slice(1)] },
  ];
  for (const invalid of cases) {
    assert.throws(() => validateLocalFerryNetwork(invalid), /Local ferry/);
    assert.throws(() => localFerryDestinations(invalid, traveler(['ferry_open']), 'east-pier'), /Local ferry/);
    assert.throws(() => planLocalFerryTrip(invalid, traveler(['ferry_open']), 'east-pier', 'west-pier'), /Local ferry/);
  }
});
