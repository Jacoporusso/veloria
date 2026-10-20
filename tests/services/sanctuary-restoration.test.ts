import test from 'node:test';
import assert from 'node:assert/strict';
import quest from '../../content/quests/sanctuary_restoration.quest.json' with {type:'json'};
import data from '../../content/regulators/sanctuary_balance.v1.json' with {type:'json'};
import { applyQuestEvent } from '../../src/core/quests/apply-quest-event.ts';
import { adjustEnvironmentRegulator, environmentRegulatorState, validateEnvironmentRegulator, type EnvironmentRegulator } from '../../src/core/world/environment-regulator.ts';
import { newGameSave } from '../../src/persistence/save-store.ts';

const regulator=data as EnvironmentRegulator;

test('sanctuary needs both readings, explicit consent, regulation and receiver verification before its unique reward',()=>{
  validateEnvironmentRegulator(regulator);
  for(const order of [['d06/nature/read','d06/network/read'],['d06/network/read','d06/nature/read']]){
    let save=newGameSave();
    for(const step of quest.steps)assert.equal(applyQuestEvent(save,step.trigger,[quest]).progressed,false);
    save={...save,flags:[...save.flags,'badge_drago_awarded']};
    const money=save.player.money,items=save.inventory['hyper-potion']??0;
    save=applyQuestEvent(save,'area/veloria/d06_santuario_due_luci/enter',[quest]).save;
    save=applyQuestEvent(save,order[0],[quest]).save;
    assert.equal(applyQuestEvent(save,'d06/plan/confirm',[quest]).progressed,false);
    save=applyQuestEvent(save,order[1],[quest]).save;
    assert.equal(adjustEnvironmentRegulator(regulator,'water',-1,save.flags).changed,false,'readings alone do not authorize changing the node');
    assert.equal(applyQuestEvent(save,'d06/balance/restored',[quest]).progressed,false);
    save=applyQuestEvent(save,'d06/plan/confirm',[quest]).save;
    for(const event of ['d06/receiver/confirm','d06/report'])assert.equal(applyQuestEvent(save,event,[quest]).progressed,false);
    for(const control of regulator.controls)while(environmentRegulatorState(regulator,save.flags).values[control.id]!==control.target){
      const current=environmentRegulatorState(regulator,save.flags).values[control.id];
      const result=adjustEnvironmentRegulator(regulator,control.id,current<control.target?1:-1,save.flags);
      save=JSON.parse(JSON.stringify({...save,flags:result.flags}));
    }
    assert.equal(environmentRegulatorState(regulator,save.flags).balanced,true);
    assert.equal(save.flags.includes(regulator.solvedFlag),false,'explicit verification remains required');
    save=applyQuestEvent(save,regulator.solvedEvent,[quest]).save;
    assert.equal(applyQuestEvent(save,'d06/report',[quest]).progressed,false,'Elia needs an independent receiver check');
    save=applyQuestEvent(save,'d06/receiver/confirm',[quest]).save;
    save=applyQuestEvent(save,'d06/report',[quest]).save;
    assert.ok(save.flags.includes('q_resonance_restored'));
    assert.equal(save.player.money,money+1000);
    assert.equal(save.inventory['hyper-potion'],items+2);
    for(const step of quest.steps)assert.deepEqual(applyQuestEvent(save,step.trigger,[quest]).save,save);
    assert.equal(adjustEnvironmentRegulator(regulator,'water',1,save.flags).changed,false);
  }
});
