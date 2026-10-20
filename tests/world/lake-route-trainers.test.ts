import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import placements from '../../content/drafts/acquariva/training/placements.json' with {type:'json'};
import learnsets from '../../content/sources/pokeapi/source-learnsets.json' with {type:'json'};
import moves from '../../content/battle/moves.v1.json' with {type:'json'};
import {collectMapCollision} from '../../src/core/world/map-collision.ts';

for(const placement of placements.placements)test(`${placement.name} has supported HGSS moves and a solid, approachable place off the encounter habitats`,()=>{
  const trainer=JSON.parse(readFileSync(new URL(`../../content/trainers/${placement.npcId}.trainer.json`,import.meta.url),'utf8'));
  for(const member of trainer.team)for(const moveId of member.moveIds){
    assert.ok(moveId in moves.moves);
    assert.ok(learnsets.species[String(member.speciesId) as keyof typeof learnsets.species].some(move=>move.moveId===moveId&&move.level<=member.level));
  }
  const map=JSON.parse(readFileSync(new URL(`../../public/tilemaps/${placement.map}.tmj`,import.meta.url),'utf8'));
  const meta=JSON.parse(readFileSync(new URL(`../../content/maps/${placement.map}.map.json`,import.meta.url),'utf8'));
  assert.ok(meta.npcRefs.includes(placement.npcId));
  const objects=(name:string)=>map.layers.find((layer:any)=>layer.name===name).objects;
  const npc=objects('characters').find((o:any)=>o.properties.some((p:any)=>p.name==='npcId'&&p.value===placement.npcId));
  const properties=Object.fromEntries(npc.properties.map((p:any)=>[p.name,p.value]));
  assert.equal(properties.trainerId,trainer.id);assert.equal(properties.battleOnceFlag,trainer.battleOnceFlag);
  const blocked=collectMapCollision(objects('collision'),map.width,map.height,[]);
  assert.ok(blocked.has(`${placement.x},${placement.y}`));
  for(const zone of objects('triggers').filter((o:any)=>o.properties.some((p:any)=>p.name==='kind'&&p.value==='encounter-zone')))
    for(let y=zone.y/32;y<(zone.y+zone.height)/32;y++)for(let x=zone.x/32;x<(zone.x+zone.width)/32;x++)blocked.add(`${x},${y}`);
  for(const spawn of meta.spawns){
    const seen=new Set([`${spawn.x},${spawn.y}`]),queue=[[spawn.x,spawn.y]];
    for(let i=0;i<queue.length;i++){
      const[x,y]=queue[i];for(const[nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
        const key=`${nx},${ny}`;
        if(nx<0||ny<0||nx>=map.width||ny>=map.height||seen.has(key)||blocked.has(key))continue;
        seen.add(key);queue.push([nx,ny]);
      }
    }
    for(const target of meta.spawns)assert.ok(seen.has(`${target.x},${target.y}`));
    assert.ok([[placement.x-1,placement.y],[placement.x+1,placement.y],[placement.x,placement.y-1],[placement.x,placement.y+1]].some(([x,y])=>seen.has(`${x},${y}`)));
  }
});
