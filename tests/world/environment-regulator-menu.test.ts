import assert from 'node:assert/strict';
import test from 'node:test';
import {environmentRegulatorMenu} from '../../src/game/ui/environment-regulator-menu.ts';
import {adjustEnvironmentRegulator,type EnvironmentRegulator} from '../../src/core/world/environment-regulator.ts';
const regulator:EnvironmentRegulator={id:'testclimate',name:'Console',requiredFlags:['readings'],solvedFlag:'balanced',solvedEvent:'balance',controls:[{id:'air',label:'Aria',hint:'Indizio',min:0,max:2,initial:0,target:1,levels:[{value:0,label:'Chiusa',hint:'Aria ferma.'},{value:1,label:'Delicata',hint:'Un flusso lieve.'},{value:2,label:'Aperta',hint:'Un flusso forte.'}]}]};
test('regulator menu hides controls until readings and completion leaves a single close option',()=>{
 assert.deepEqual(environmentRegulatorMenu(regulator,[]).options.map(o=>o.command.kind),['close']);
 assert.deepEqual(environmentRegulatorMenu(regulator,['balanced','readings']).options.map(o=>o.command.kind),['close']);
});
test('menu names current and next qualitative levels, omits impossible decrements and retains explicit verification',()=>{
 const menu=environmentRegulatorMenu(regulator,['readings']);
 assert.match(menu.prompt,/Aria: Chiusa/);assert.match(menu.prompt,/Aria ferma/);
 assert.deepEqual(menu.options.filter(o=>o.command.kind==='adjust'),[{label:'Aria → Delicata',command:{kind:'adjust',controlId:'air',delta:1}}]);
 assert.ok(menu.options.some(o=>o.command.kind==='verify'));
 const next=adjustEnvironmentRegulator(regulator,'air',1,['readings']);
 assert.equal(next.balanced,true);assert.equal(next.flags.includes('balanced'),false);
 assert.equal(environmentRegulatorMenu(regulator,next.flags).options.filter(o=>o.command.kind==='adjust').length,2);
});
