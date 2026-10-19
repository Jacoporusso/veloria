import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import grass from '../../content/drafts/acquariva/r09_dune_patch.encounter.json' with {type:'json'};
import fishing from '../../content/drafts/acquariva/r09_lagoon_fishing.encounter.json' with {type:'json'};
import species from '../../content/battle/species.v1.json' with {type:'json'};
import {validateTable,type EncounterTable} from '../../src/core/encounters/select-encounter.ts';
import {collectMapCollision} from '../../src/core/world/map-collision.ts';

test('Dunes habitat tables use available species and valid time-band weights',()=>{
  for(const table of [grass,fishing])validateTable(table as EncounterTable,species.species);
  assert.ok(!grass.timeBands.day.some(entry=>[72,170,171].includes(entry.speciesId)));
});

test('Dunes exits and fishing remain reachable while avoiding both optional habitats',()=>{
  const map=JSON.parse(readFileSync(new URL('../../content/drafts/acquariva/r09_dune_salmastre.tmj',import.meta.url),'utf8'));
  const objects=(name:string)=>map.layers.find((layer:any)=>layer.name===name).objects;
  const blocked=collectMapCollision(objects('collision'),40,28,[]);
  for(const zone of objects('triggers')){
    if(!zone.properties?.some((p:any)=>p.name==='kind'&&p.value==='encounter-zone'))continue;
    for(let y=zone.y/32;y<(zone.y+zone.height)/32;y++)for(let x=zone.x/32;x<(zone.x+zone.width)/32;x++)blocked.add(`${x},${y}`);
  }
  const seen=new Set(['19,1']),queue=[[19,1]];
  for(let i=0;i<queue.length;i++){
    const[x,y]=queue[i];
    for(const[nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
      const key=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=40||ny>=28||blocked.has(key)||seen.has(key))continue;
      seen.add(key);queue.push([nx,ny]);
    }
  }
  for(const tile of ['19,0','39,17','29,20'])assert.ok(seen.has(tile),tile);
  assert.equal(seen.has('29,23'),false);
});
