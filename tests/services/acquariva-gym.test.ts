import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import trainer from '../../content/drafts/acquariva/gym06_selene.trainer.json' with {type:'json'};
import puzzle from '../../content/drafts/acquariva/gym06_reflections.quest.json' with {type:'json'};
import badge from '../../content/drafts/acquariva/gym06_badge.quest.json' with {type:'json'};
import router from '../../content/drafts/acquariva/gym06_reflections.v1.json' with {type:'json'};
import learnsets from '../../content/sources/pokeapi/source-learnsets.json' with {type:'json'};
import moves from '../../content/battle/moves.v1.json' with {type:'json'};
import {applyQuestEvent} from '../../src/core/quests/apply-quest-event.ts';
import {collectMapCollision} from '../../src/core/world/map-collision.ts';
import type {GameSave} from '../../src/persistence/save-types.ts';

test('Selene uses only supported HGSS moves available at her team levels',()=>{
  for(const member of trainer.team)for(const moveId of member.moveIds){
    assert.ok(moveId in moves.moves,moveId);
    assert.ok(learnsets.species[String(member.speciesId)as keyof typeof learnsets.species].some(entry=>entry.moveId===moveId&&entry.level<=member.level),`${member.speciesId}: ${moveId}`);
  }
});

test('reflection gym controls and leader stay reachable around all solid devices',()=>{
  const map=JSON.parse(readFileSync(new URL('../../content/drafts/acquariva/gym06_acquariva.tmj',import.meta.url),'utf8'));
  const blocked=collectMapCollision(map.layers.find((l:any)=>l.name==='collision').objects,32,24,[]);
  blocked.add('16,2');
  const seen=new Set(['15,22']),queue=[[15,22]];
  for(let i=0;i<queue.length;i++){
    const[x,y]=queue[i];
    for(const[nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
      const key=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=32||ny>=24||seen.has(key)||blocked.has(key))continue;
      seen.add(key);queue.push([nx,ny]);
    }
  }
  for(const node of router.nodes){
    assert.ok([[node.x-1,node.y],[node.x+1,node.y],[node.x,node.y-1],[node.x,node.y+1]].some(([x,y])=>seen.has(`${x},${y}`)),node.id);
  }
  assert.ok(seen.has('16,3'));assert.ok(seen.has('15,23'));
});

test('sixth badge requires the lake report and puzzle, and remains unique after reload',()=>{
  const save:GameSave={schemaVersion:2,saveRevision:1,contentVersion:'test',saveId:'p6',savedAt:'2026-10-19T00:00:00Z',player:{name:'Ada',mapId:'veloria/gym06_acquariva',spawnPointId:'from_city',money:100},party:[],storage:[],flags:[],badges:[],inventory:{},rngState:42};
  assert.equal(applyQuestEvent(save,trainer.defeatQuestEvent,[puzzle,badge]).progressed,false);
  assert.equal(applyQuestEvent(save,router.solvedEvent,[puzzle,badge]).progressed,false);
  const aligned=applyQuestEvent({...save,flags:['q_acquariva_report']},router.solvedEvent,[puzzle,badge]).save;
  const won=applyQuestEvent(aligned,trainer.defeatQuestEvent,[puzzle,badge]).save;
  const resumed=JSON.parse(JSON.stringify(won));assert.deepEqual(resumed.badges,['badge_riflesso']);
  assert.deepEqual(applyQuestEvent(resumed,trainer.defeatQuestEvent,[puzzle,badge]).save,resumed);
});
