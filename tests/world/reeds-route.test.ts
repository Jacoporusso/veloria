import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import encounters from '../../content/drafts/acquariva/r10_reed_patch.encounter.json' with {type:'json'};
import quest from '../../content/drafts/acquariva/r10_kit.quest.json' with {type:'json'};
import species from '../../content/battle/species.v1.json' with {type:'json'};
import {validateTable,type EncounterTable} from '../../src/core/encounters/select-encounter.ts';
import {collectMapCollision} from '../../src/core/world/map-collision.ts';
import {applyQuestEvent} from '../../src/core/quests/apply-quest-event.ts';
import type {GameSave} from '../../src/persistence/save-types.ts';

test('Reeds main route and landmarks remain reachable while avoiding optional habitats',()=>{
  validateTable(encounters as EncounterTable,species.species);
  const map=JSON.parse(readFileSync(new URL('../../content/drafts/acquariva/r10_sentiero_canne.tmj',import.meta.url),'utf8'));
  const objects=(name:string)=>map.layers.find((layer:any)=>layer.name===name).objects;
  const blocked=collectMapCollision(objects('collision'),40,30,[]);
  for(const zone of objects('triggers')){
    if(!zone.properties.some((p:any)=>p.name==='kind'&&p.value==='encounter-zone'))continue;
    for(let y=zone.y/32;y<(zone.y+zone.height)/32;y++)for(let x=zone.x/32;x<(zone.x+zone.width)/32;x++)blocked.add(`${x},${y}`);
  }
  const seen=new Set(['1,22']),queue=[[1,22]];
  for(let i=0;i<queue.length;i++){
    const[x,y]=queue[i];
    for(const[nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
      const key=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=40||ny>=30||seen.has(key)||blocked.has(key))continue;
      seen.add(key);queue.push([nx,ny]);
    }
  }
  for(const tile of ['0,22','39,5','10,6','31,18'])assert.ok(seen.has(tile),tile);
  assert.equal(seen.has('20,20'),false);
});

test('Reeds side kit requires the Delta report and cannot duplicate after serialization',()=>{
  const save:GameSave={schemaVersion:2,saveRevision:1,contentVersion:'test',saveId:'kit',savedAt:'2026-10-19T00:00:00Z',player:{name:'Ada',mapId:'veloria/r10_sentiero_canne',spawnPointId:'from_delta',money:100},party:[],storage:[],flags:[],badges:[],inventory:{antidote:1},rngState:42};
  assert.equal(applyQuestEvent(save,'r10/kit/recover',[quest]).progressed,false);
  const collected=applyQuestEvent({...save,flags:['q_delta_report']},'r10/kit/recover',[quest]).save;
  const resumed=JSON.parse(JSON.stringify(collected));
  assert.equal(resumed.inventory.antidote,3);
  assert.deepEqual(applyQuestEvent(resumed,'r10/kit/recover',[quest]).save,resumed);
  assert.equal(save.inventory.antidote,1);
});
