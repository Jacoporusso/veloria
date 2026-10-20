import assert from 'node:assert/strict';
import test from 'node:test';
import report from '../../content/quests/passobrina_report.quest.json' with {type:'json'};
import ice from '../../content/quests/gym07_ice.quest.json' with {type:'json'};
import badge from '../../content/quests/gym07_badge.quest.json' with {type:'json'};
import {applyQuestEvent} from '../../src/core/quests/apply-quest-event.ts';
import type {GameSave} from '../../src/persistence/save-types.ts';
const initial:GameSave={schemaVersion:2,saveRevision:1,contentVersion:'test',saveId:'mountain',savedAt:'2026-10-20T00:00:00Z',player:{name:'Luna',mapId:'veloria/passobrina',spawnPointId:'from_r12',x:1,y:15,money:500},party:[],storage:[],flags:['badge_riflesso_awarded'],badges:[],inventory:{},rngState:42};
const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
test('mountain readings accept every order; report and rewards require all three and apply once',()=>{
 for(const order of orders){let save=structuredClone(initial);
  for(const i of order){assert.equal(applyQuestEvent(save,report.steps[3].trigger,[report]).progressed,false);save=JSON.parse(JSON.stringify(applyQuestEvent(save,report.steps[i].trigger,[report]).save));}
  save=applyQuestEvent(save,report.steps[3].trigger,[report]).save;
  assert.equal(save.player.money,1000);assert.equal(save.inventory.potion,2);
  for(const step of report.steps)assert.deepEqual(applyQuestEvent(save,step.trigger,[report]).save,save);
 }
});
test('all six sigil orders persist and require an explicit console event; badge cannot be duplicated',()=>{
 for(const order of orders){let save={...structuredClone(initial),flags:[...initial.flags,'q_passobrina_report']};
  assert.equal(applyQuestEvent(save,badge.steps[0].trigger,[badge]).progressed,false);
  for(const i of order){assert.equal(applyQuestEvent(save,'gym07/ice/open',[ice]).progressed,false);save=JSON.parse(JSON.stringify(applyQuestEvent(save,ice.steps[i].trigger,[ice]).save));}
  assert.equal(save.flags.includes('gym07_ice_complete'),false);
  save=applyQuestEvent(save,'gym07/ice/open',[ice]).save;assert.ok(save.flags.includes('gym07_ice_complete'));
  save=applyQuestEvent(save,badge.steps[0].trigger,[badge]).save;assert.deepEqual(save.badges,['badge_brina']);
  assert.deepEqual(applyQuestEvent(save,badge.steps[0].trigger,[badge]).save,save);
 }
});
