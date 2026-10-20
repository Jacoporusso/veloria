import assert from 'node:assert/strict';
import test from 'node:test';
import quest from '../../content/quests/crystal_research.quest.json' with {type:'json'};
import data from '../../content/regulators/crystal_climate.v1.json' with {type:'json'};
import {applyQuestEvent} from '../../src/core/quests/apply-quest-event.ts';
import {adjustEnvironmentRegulator,environmentRegulatorState,type EnvironmentRegulator} from '../../src/core/world/environment-regulator.ts';
import {newGameSave} from '../../src/persistence/save-store.ts';
const regulator=data as EnvironmentRegulator;
test('crystal readings accept both orders; regulation, upper reading and report cannot be skipped or duplicated',()=>{
 for(const order of [['d05/low/read','d05/middle/read'],['d05/middle/read','d05/low/read']]){
  let save=newGameSave();save.flags.push('badge_ghiaccio_awarded');const money=save.player.money, potions=save.inventory.potion??0;
  for(const event of ['r14/guide/report','d05/climate/balanced','d05/upper/read'])assert.equal(applyQuestEvent(save,event,[quest]).progressed,false);
  for(const event of ['area/veloria/r14_varco_cristallo/enter','area/veloria/d05_grotte_cristallo/enter'])save=applyQuestEvent(save,event,[quest]).save;
  for(const event of order)save=JSON.parse(JSON.stringify(applyQuestEvent(save,event,[quest]).save));
  assert.equal(applyQuestEvent(save,'r14/guide/report',[quest]).progressed,false);
  for(const control of regulator.controls)while(environmentRegulatorState(regulator,save.flags).values[control.id]!==control.target){
   const value=environmentRegulatorState(regulator,save.flags).values[control.id];
   const result=adjustEnvironmentRegulator(regulator,control.id,value<control.target?1:-1,save.flags);save={...save,flags:result.flags};
  }
  assert.equal(save.flags.includes(regulator.solvedFlag),false,'adjustment does not bypass explicit verification');
  save=applyQuestEvent(save,regulator.solvedEvent,[quest]).save;assert.equal(environmentRegulatorState(regulator,save.flags).completed,true);
  save=applyQuestEvent(save,'d05/upper/read',[quest]).save;save=applyQuestEvent(save,'r14/guide/report',[quest]).save;
  assert.equal(save.player.money,money+700);assert.equal(save.inventory.potion,potions+2);
  for(const step of quest.steps)assert.deepEqual(applyQuestEvent(save,step.trigger,[quest]).save,save);
 }
});
test('every authored regulator combination can reach its target without touching unrelated progress',()=>{
 for(let air=0;air<=3;air++)for(let heat=0;heat<=3;heat++){
  let flags=[...regulator.requiredFlags,'unrelated','regulator_crystalclimate_ventilation_level'+air,'regulator_crystalclimate_exchange_level'+heat];
  for(const control of regulator.controls)while(environmentRegulatorState(regulator,flags).values[control.id]!==control.target){
   const value=environmentRegulatorState(regulator,flags).values[control.id];flags=adjustEnvironmentRegulator(regulator,control.id,value<control.target?1:-1,flags).flags;
  }
  assert.ok(environmentRegulatorState(regulator,flags).balanced);assert.ok(flags.includes('unrelated'));
 }
});
