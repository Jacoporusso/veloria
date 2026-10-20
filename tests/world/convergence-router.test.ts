import test from 'node:test';
import assert from 'node:assert/strict';
import { rotateSignalRouter, traceSignalRouter, validateSignalRouter, type SignalRouter } from '../../src/core/world/signal-router.ts';
import { renderSignalRouter } from '../../src/game/rendering/signal-router.ts';

const router: SignalRouter = {
  id: 'convergence', presentation: 'convergence', sourceNodeId: 'water', additionalSourceNodeIds: ['light'],
  goalNodeId: 'goal', solvedFlag: 'q_convergence', solvedEvent: 'convergence/solved',
  nodes: [
    {id:'water',label:'Acqua del giardino',x:0,y:2,initialStateId:'fixed',states:[{id:'fixed',label:'Est',direction:'right',nextNodeId:'first'}]},
    {id:'light',label:'Luce della rete',x:2,y:0,initialStateId:'fixed',states:[{id:'fixed',label:'Sud',direction:'down',nextNodeId:'second'}]},
    {id:'first',label:'Canale',x:1,y:2,initialStateId:'closed',states:[{id:'closed',label:'Chiuso',direction:'up',nextNodeId:null},{id:'open',label:'Est',direction:'right',nextNodeId:'join'}]},
    {id:'second',label:'Rete',x:2,y:1,initialStateId:'cycle',states:[{id:'cycle',label:'Ritorno',direction:'up',nextNodeId:'light'},{id:'open',label:'Sud',direction:'down',nextNodeId:'join'}]},
    {id:'join',label:'Convergenza',x:2,y:2,initialStateId:'fixed',states:[{id:'fixed',label:'Est',direction:'right',nextNodeId:'goal'}]},
    {id:'goal',label:'Ricevitore',x:4,y:2,initialStateId:'fixed',states:[{id:'fixed',label:'Ricevitore',direction:'up',nextNodeId:null}]},
  ],
};

test('both sources must connect in the same persisted configuration; solved routing is immutable', () => {
  const initial=Object.freeze(['q_foreign']);
  const partial=rotateSignalRouter(router,'first',initial);
  assert.deepEqual(initial,['q_foreign']);
  assert.deepEqual(partial.trace.paths.map(path=>path.outcome),['connected','cycle']);
  assert.equal(partial.trace.outcome,'cycle');
  const complete=rotateSignalRouter(router,'second',partial.flags);
  assert.equal(complete.trace.outcome,'connected');
  assert.deepEqual(complete.trace.paths.map(path=>path.nodeIds),[['water','first','join','goal'],['light','second','join','goal']]);
  assert.deepEqual(complete.trace.nodeIds,['water','first','join','goal','light','second']);
  assert.deepEqual(traceSignalRouter(router,JSON.parse(JSON.stringify(complete.flags))),complete.trace);
  assert.ok(complete.flags.includes('q_foreign'));
  assert.ok(!complete.flags.includes(router.solvedFlag));
  const solved=Object.freeze([...complete.flags,router.solvedFlag]);
  const locked=rotateSignalRouter(router,'first',solved);
  assert.deepEqual(locked.flags,solved);
  assert.equal(locked.changed,false);
});

test('a connected primary source cannot hide an unreachable additional source', () => {
  const disconnected=structuredClone(router);
  disconnected.nodes[3].states=disconnected.nodes[3].states.map(state=>({...state,nextNodeId:null}));
  assert.equal(rotateSignalRouter(disconnected,'first',[]).trace.outcome,'disconnected');
});

test('invalid or repeated sources, goal sources and duplicate nodes are rejected', () => {
  for(const additional of [['water'],['light','light'],['goal'],['missing']]) assert.throws(()=>validateSignalRouter({...router,additionalSourceNodeIds:additional}),/endpoints/);
  assert.throws(()=>validateSignalRouter({...router,sourceNodeId:'goal'}),/endpoints/);
  assert.throws(()=>validateSignalRouter({...router,nodes:[...router.nodes,router.nodes[0]]}),/endpoints/);
});

test('renderer highlights each actual path without drawing synthetic union edges', () => {
  const flags=rotateSignalRouter(router,'second',rotateSignalRouter(router,'first',[]).flags).flags;
  const lines: {color:number;points:number[]}[]=[];
  const chain:any={setDepth(){return this;},fillStyle(){return this;},fillEllipse(){return this;},fillCircle(){return this;},strokeCircle(){return this;},setOrigin(){return this;},lineStyle(_width:number,color:number){this.color=color;return this;},lineBetween(...points:number[]){lines.push({color:this.color,points});return this;}};
  const scene:any={add:{graphics:()=>Object.create(chain),text:()=>Object.create(chain)}};
  renderSignalRouter(scene,{add() {}} as any,router,flags);
  const mint=lines.filter(line=>line.color===0x64d9cd), lilac=lines.filter(line=>line.color===0xc5a1ff);
  assert.ok(mint.some(line=>line.points[0]===16&&line.points[2]===48));
  assert.ok(lilac.some(line=>line.points[1]===16&&line.points[3]===48));
  assert.ok(!lines.some(line=>line.points[0]===144&&line.points[1]===80&&line.points[2]===80&&line.points[3]===16),'no receiver-to-second-source union bridge');
  assert.ok(lilac.length>0&&mint.length>0);
});
