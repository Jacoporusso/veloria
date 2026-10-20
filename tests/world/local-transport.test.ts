import assert from 'node:assert/strict';
import test from 'node:test';
import cableData from '../../content/transit/mountain_cable.transport.json' with { type: 'json' };
import harborData from '../../content/transit/portolume_harbor.transport.json' with { type: 'json' };
import {
  localTransportDestinations,
  planLocalTransportTrip,
  validateLocalTransportNetwork,
  type LocalTransportNetwork,
} from '../../src/core/world/local-transport.ts';

const network: LocalTransportNetwork = {
  id: 'portolume-ferry',
  name: 'Portolume Ferry',
  kind: 'ferry',
  lockedMessage: 'Parla con la capitana per aprire il battello.',
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
  const choices = localTransportDestinations(network, traveler(['ferry_open', 'west_unlocked']), 'east-pier');
  assert.deepEqual(choices.map(stop => stop.id), ['west-pier']);
  assert.deepEqual(localTransportDestinations(network, traveler(['ferry_open', 'west_unlocked', 'return_route']), 'west-pier').map(stop => stop.id), ['east-pier']);
  assert.deepEqual(localTransportDestinations(network, traveler(['ferry_open', 'west_unlocked']), 'west-pier'), []);
});

test('destination and route gates are checked again when boarding', () => {
  assert.deepEqual(planLocalTransportTrip(network, traveler(['ferry_open']), 'east-pier', 'west-pier'), { ok: false, reason: 'locked' });
  assert.deepEqual(planLocalTransportTrip(network, traveler(['ferry_open', 'west_unlocked']), 'east-pier', 'isle-pier'), { ok: false, reason: 'locked' });
  assert.deepEqual(planLocalTransportTrip(network, traveler(['ferry_open', 'west_unlocked']), 'east-pier', 'west-pier'), {
    ok: true, destination: network.stops[1],
  });
});

test('planning reports unknown, wrong-origin, same-stop and missing-route states', () => {
  const state = traveler(['ferry_open', 'west_unlocked']);
  assert.deepEqual(planLocalTransportTrip(network, state, 'missing', 'west-pier'), { ok: false, reason: 'unknown-stop' });
  assert.deepEqual(planLocalTransportTrip(network, state, 'east-pier', 'missing'), { ok: false, reason: 'unknown-stop' });
  assert.deepEqual(planLocalTransportTrip(network, traveler(['ferry_open'], 'portolume/isle'), 'east-pier', 'west-pier'), { ok: false, reason: 'wrong-origin' });
  assert.deepEqual(planLocalTransportTrip(network, state, 'east-pier', 'east-pier'), { ok: false, reason: 'same-stop' });
  assert.deepEqual(planLocalTransportTrip(network, state, 'west-pier', 'isle-pier'), { ok: false, reason: 'no-route' });
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
  localTransportDestinations(frozen, state, 'east-pier');
  planLocalTransportTrip(frozen, state, 'east-pier', 'west-pier');
  assert.equal(JSON.stringify(frozen), beforeNetwork);
  assert.equal(JSON.stringify(state), beforeState);
});

test('malformed network data fails clearly before listing or planning', () => {
  const cases: LocalTransportNetwork[] = [
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
    assert.throws(() => validateLocalTransportNetwork(invalid), /Local transport/);
    assert.throws(() => localTransportDestinations(invalid, traveler(['ferry_open']), 'east-pier'), /Local transport/);
    assert.throws(() => planLocalTransportTrip(invalid, traveler(['ferry_open']), 'east-pier', 'west-pier'), /Local transport/);
  }
});

const cable = cableData as LocalTransportNetwork;

test('cable car requires P7 and rechecks the badge and origin at boarding', () => {
  const origin = traveler([], 'veloria/passobrina');
  assert.deepEqual(localTransportDestinations(cable, origin, 'passobrina'), []);
  assert.deepEqual(planLocalTransportTrip(cable, origin, 'passobrina', 'biancavetta'), {ok:false,reason:'locked'});
  const unlocked = {...origin,flags:['badge_ghiaccio_awarded']};
  assert.deepEqual(localTransportDestinations(cable, unlocked, 'passobrina').map(s=>s.id), ['biancavetta']);
  // A menu selection does not retain permission if the authoritative save changes.
  assert.deepEqual(planLocalTransportTrip(cable, {...unlocked,flags:[]}, 'passobrina', 'biancavetta'), {ok:false,reason:'locked'});
  assert.deepEqual(planLocalTransportTrip(cable, {...unlocked,player:{mapId:'veloria/r13_tornanti_bianchi'}}, 'passobrina', 'biancavetta'), {ok:false,reason:'wrong-origin'});
});

test('both authored cable routes are free and preserve money, HP, PP and all save data', () => {
  assert.equal(cable.kind, 'cable-car');
  assert.deepEqual(cable.requiredFlags, ['badge_ghiaccio_awarded']);
  assert.equal(cable.routes.length, 2);
  for(const [from,to] of [['passobrina','biancavetta'],['biancavetta','passobrina']]) {
    const state={player:{mapId:`veloria/${from}`,spawnPointId:'cable_arrival',money:0},flags:['badge_ghiaccio_awarded'],party:[{hp:7,maxHp:40,moves:[{id:'tackle',pp:2,maxPp:35}]}]};
    const before=structuredClone(state);
    const choices=localTransportDestinations(cable,state,from);
    assert.deepEqual(choices.map(s=>s.id),[to]);
    const trip=planLocalTransportTrip(cable,state,from,to);
    assert.deepEqual(trip,{ok:true,destination:{id:to,name:to==='passobrina'?'Passobrina':'Biancavetta',mapId:`veloria/${to}`,spawnPointId:'cable_arrival'}});
    assert.deepEqual(state,before);
  }
});

test('transport kind is required and only the authored transport kinds are accepted',()=>{
  for(const kind of [undefined,'train','']) assert.throws(()=>validateLocalTransportNetwork({...network,kind} as unknown as LocalTransportNetwork), /invalid kind/);
  validateLocalTransportNetwork(cable);
  validateLocalTransportNetwork(harborData as LocalTransportNetwork);
});

test('Portolume retains its orientation gate, same-map docks and two directed routes',()=>{
  const harbor=harborData as LocalTransportNetwork;
  assert.equal(harbor.kind,'ferry');
  assert.equal(harbor.id,'portolume_harbor');
  assert.deepEqual(harbor.requiredFlags,['q_portolume_orientation']);
  assert.deepEqual(harbor.stops.map(s=>[s.id,s.mapId,s.spawnPointId]),[
    ['mainland','veloria/portolume','dock_mainland'],['observatory','veloria/portolume','dock_observatory'],
  ]);
  assert.deepEqual(harbor.routes,[{fromStopId:'mainland',toStopId:'observatory'},{fromStopId:'observatory',toStopId:'mainland'}]);
  assert.deepEqual(localTransportDestinations(harbor,traveler([],'veloria/portolume'),'mainland'),[]);
  for(const [from,to]of [['mainland','observatory'],['observatory','mainland']]) {
    assert.equal(planLocalTransportTrip(harbor,traveler(['q_portolume_orientation'],'veloria/portolume'),from,to).ok,true);
  }
});
