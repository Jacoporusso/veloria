import assert from 'node:assert/strict';
import test from 'node:test';
import puzzle from '../../content/puzzles/gym06_reflections.v1.json' with {type:'json'};
import {rotateSignalRouter,traceSignalRouter,validateSignalRouter,type SignalRouter} from '../../src/core/world/signal-router.ts';
const router=puzzle as SignalRouter;
const ids=['first','second','third','fourth'];
function permutations(values:string[]):string[][] {
  return values.length?values.flatMap(value=>permutations(values.filter(other=>other!==value)).map(tail=>[value,...tail])):[[]];
}

test('Acquariva mirrors connect in all 24 interaction orders and resume from saved inclinations',()=>{
  for(const order of permutations(ids)){
    let flags=['badge_marea_awarded'];
    for(let index=0;index<order.length;index++){
      const result=rotateSignalRouter(router,order[index],flags);
      flags=JSON.parse(JSON.stringify(result.flags));
      assert.equal(result.trace.outcome,index===3?'connected':'disconnected');
    }
    assert.deepEqual(traceSignalRouter(router,flags).nodeIds,['source',...ids,'goal']);
    assert.ok(flags.includes('badge_marea_awarded'));
    assert.ok(!flags.includes(router.solvedFlag));
    assert.equal(rotateSignalRouter(router,'first',[...flags,router.solvedFlag]).changed,false);
  }
});

test('mirror inclinations match the incoming light and reject missing presentation data',()=>{
  const incoming={first:'right',second:'up',third:'right',fourth:'up'};
  const reflected={right:{'/':'up','\\':'down'},up:{'/':'right','\\':'left'}};
  for(const node of router.nodes.filter(node=>ids.includes(node.id))){
    for(const state of node.states){
      assert.equal(state.direction,reflected[incoming[node.id as keyof typeof incoming] as keyof typeof reflected][state.mirror!]);
    }
  }
  const invalid=structuredClone(router);delete invalid.nodes[1].states[0].mirror;
  assert.throws(()=>validateSignalRouter(invalid),/mirror inclination/);
  const flags=Object.freeze(['unrelated']);rotateSignalRouter(router,'first',flags);
  assert.deepEqual(flags,['unrelated']);
});
