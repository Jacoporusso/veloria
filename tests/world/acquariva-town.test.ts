import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import metadata from '../../content/maps/acquariva.map.json' with {type:'json'};
import quest from '../../content/quests/acquariva_research.quest.json' with {type:'json'};
import {collectMapCollision} from '../../src/core/world/map-collision.ts';
import {applyQuestEvent} from '../helpers/quest-event.ts';
import type {GameSave} from '../../src/persistence/save-types.ts';

test('Acquariva services, observatory and exits connect without crossing the lake',()=>{
  const map=JSON.parse(readFileSync(new URL('../../public/tilemaps/acquariva.tmj',import.meta.url),'utf8'));
  const blocked=collectMapCollision(map.layers.find((l:any)=>l.name==='collision').objects,40,30,[]);
  assert.ok(blocked.has('34,14'),'Tessa occupies a real collision tile');
  const seen=new Set(['1,16']),queue=[[1,16]];
  for(let i=0;i<queue.length;i++){
    const[x,y]=queue[i];
    for(const[nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
      const key=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=40||ny>=30||seen.has(key)||blocked.has(key))continue;
      seen.add(key);queue.push([nx,ny]);
    }
  }
  for(const spawn of metadata.spawns)assert.ok(seen.has(`${spawn.x},${spawn.y}`),spawn.id);
  for(const tile of ['8,14','13,15','33,14','17,7','7,0','0,16'])assert.ok(seen.has(tile),tile);
  assert.equal(seen.has('27,20'),false);
  assert.equal(seen.has('17,15'),false);
});

test('Tessa only accepts the completed Delta report and does not repeat the reward',()=>{
  const initial:GameSave={schemaVersion:2,saveRevision:1,contentVersion:'test',saveId:'lake',savedAt:'2026-10-19T00:00:00Z',player:{name:'Ada',mapId:metadata.id,spawnPointId:'from_r10',money:100},party:[],storage:[],flags:[],badges:[],inventory:{potion:1},rngState:42};
  assert.equal(applyQuestEvent(initial,'acquariva/tessa/report',[quest]).progressed,false);
  const arrived=applyQuestEvent({...initial,flags:['q_delta_report']},'area/veloria/acquariva/enter',[quest]).save;
  const reported=applyQuestEvent(arrived,'acquariva/tessa/report',[quest]).save;
  const resumed=JSON.parse(JSON.stringify(reported));
  assert.equal(resumed.inventory.potion,3);
  assert.deepEqual(applyQuestEvent(resumed,'acquariva/tessa/report',[quest]).save,resumed);
});
