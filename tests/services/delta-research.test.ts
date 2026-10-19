import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import quest from '../../content/drafts/acquariva/delta_research.quest.json' with {type:'json'};
import {applyQuestEvent} from '../../src/core/quests/apply-quest-event.ts';
import {collectMapCollision} from '../../src/core/world/map-collision.ts';
import type {GameSave} from '../../src/persistence/save-types.ts';
const initial:GameSave={schemaVersion:2,saveRevision:1,contentVersion:'test',saveId:'delta',savedAt:'2026-10-19T00:00:00Z',player:{name:'Ada',mapId:'veloria/d04_delta_specchi',spawnPointId:'from_r09',money:100},party:[],storage:[],flags:['badge_marea_awarded'],badges:['badge_marea'],inventory:{},rngState:42};

test('Delta observations work in any order, require all three and reward once after reload',()=>{
  const readings=quest.steps.slice(0,3),report=quest.steps[3];
  for(const first of readings)for(const second of readings.filter(step=>step!==first)){
    const third=readings.find(step=>step!==first&&step!==second)!;
    let save=structuredClone(initial);
    for(const step of [first,second,third]){
      assert.equal(applyQuestEvent(save,report.trigger,[quest]).progressed,false);
      save=JSON.parse(JSON.stringify(applyQuestEvent(save,step.trigger,[quest]).save));
    }
    save=applyQuestEvent(save,report.trigger,[quest]).save;
    assert.equal(save.player.money,450);assert.equal(save.inventory['poke-ball'],3);
    for(const step of quest.steps)assert.deepEqual(applyQuestEvent(save,step.trigger,[quest]).save,save);
  }
  for(const step of quest.steps)assert.equal(applyQuestEvent({...initial,flags:[]},step.trigger,[quest]).progressed,false);
});

test('Delta boardwalk reaches every observation and both exits without entering water',()=>{
  const map=JSON.parse(readFileSync(new URL('../../content/drafts/acquariva/d04_delta_specchi.tmj',import.meta.url),'utf8'));
  const blocked=collectMapCollision(map.layers.find((l:any)=>l.name==='collision').objects,40,30,[]);
  blocked.add('13,18'); // The biologist occupies this tile; row 17 provides a bypass.
  const seen=new Set(['1,18']),queue=[[1,18]];
  for(let i=0;i<queue.length;i++){
    const[x,y]=queue[i];
    for(const[nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
      const key=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=40||ny>=30||seen.has(key)||blocked.has(key))continue;
      seen.add(key);queue.push([nx,ny]);
    }
  }
  for(const tile of ['0,18','39,7','12,6','28,6','19,23','13,17','17,18'])assert.ok(seen.has(tile),tile);
  assert.equal(seen.has('25,15'),false);
});
