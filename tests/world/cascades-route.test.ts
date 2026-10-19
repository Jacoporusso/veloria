import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import encounters from '../../content/encounters/r11_cascade_patch.encounter.json' with {type:'json'};
import metadata from '../../content/maps/r11_via_cascate.map.json' with {type:'json'};
import species from '../../content/battle/species.v1.json' with {type:'json'};
import {validateTable,type EncounterTable} from '../../src/core/encounters/select-encounter.ts';
import {collectMapCollision} from '../../src/core/world/map-collision.ts';

test('Waterfall shortcut connects both returns and overlook without mandatory encounters',()=>{
  validateTable(encounters as EncounterTable,species.species);
  const map=JSON.parse(readFileSync(new URL('../../public/tilemaps/r11_via_cascate.tmj',import.meta.url),'utf8'));
  const objects=(name:string)=>map.layers.find((layer:any)=>layer.name===name).objects;
  const collision=collectMapCollision(objects('collision'),40,30,[]);
  const blocked=new Set(collision);
  const zones=objects('triggers').filter((o:any)=>o.properties.some((p:any)=>p.name==='kind'&&p.value==='encounter-zone'));
  assert.equal(zones.length,2);
  for(const zone of zones){
    for(let y=zone.y/32;y<(zone.y+zone.height)/32;y++)for(let x=zone.x/32;x<(zone.x+zone.width)/32;x++){
      assert.equal(collision.has(`${x},${y}`),false,'habitat must be on reachable land');
      blocked.add(`${x},${y}`);
    }
  }
  for(const spawn of metadata.spawns){
    const seen=new Set([`${spawn.x},${spawn.y}`]),queue=[[spawn.x,spawn.y]];
    for(let i=0;i<queue.length;i++){
      const[x,y]=queue[i];
      for(const[nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
        const key=`${nx},${ny}`;
        if(nx<0||ny<0||nx>=40||ny>=30||seen.has(key)||blocked.has(key))continue;
        seen.add(key);queue.push([nx,ny]);
      }
    }
    for(const tile of ['17,29','20,0','14,13'])assert.ok(seen.has(tile),`${spawn.id}: ${tile}`);
    for(const tile of ['30,15','25,20','20,20'])assert.equal(seen.has(tile),false,'water and cliff stay blocked');
  }
  assert.ok(metadata.connections.every(connection=>connection.requiresFlags.length===0),'returns must never trap the player');
  for(const exit of objects('triggers').filter((o:any)=>o.properties.some((p:any)=>p.name==='kind'&&p.value==='map-exit'))){
    assert.equal(exit.properties.some((p:any)=>p.name==='requiredFlag'),false);
  }
});
