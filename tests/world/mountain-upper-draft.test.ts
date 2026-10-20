import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {collectMapCollision} from '../../src/core/world/map-collision.ts';

const read = (slug:string, suffix:string) => JSON.parse(readFileSync(new URL(`../../content/drafts/mountain/upper/${slug}.${suffix}`, import.meta.url), 'utf8'));
const properties = (object:any):Record<string,any> => Object.fromEntries((object.properties ?? []).map((p:any) => [p.name,p.value]));
const objects = (map:any, name:string):any[] => map.layers.find((l:any) => l.name===name).objects;
function traverse(map:any, start:{x:number,y:number}, excludeHabitat=true) {
  const blocked=collectMapCollision(objects(map,'collision'),40,30,[]);
  if(excludeHabitat) for(const zone of objects(map,'triggers').filter(z=>properties(z).kind==='encounter-zone'))
    for(let y=zone.y/32;y<(zone.y+zone.height)/32;y++) for(let x=zone.x/32;x<(zone.x+zone.width)/32;x++) blocked.add(`${x},${y}`);
  assert.ok(!blocked.has(`${start.x},${start.y}`));
  const seen=new Set([`${start.x},${start.y}`]), queue=[[start.x,start.y]];
  for(let i=0;i<queue.length;i++) {
    const [x,y]=queue[i];
    for(const [a,b]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
      const key=`${a},${b}`;
      if(a<0||a>=40||b<0||b>=30||blocked.has(key)||seen.has(key))continue;
      seen.add(key);queue.push([a,b]);
    }
  }
  return {seen,blocked};
}

for(const slug of ['r13_tornanti_bianchi','biancavetta']) test(`${slug}: reversible safe spawns and every exit reached without habitat`,()=>{
  const map=read(slug,'tmj'), metadata=read(slug,'map.json');
  assert.deepEqual([map.width,map.height,map.tilewidth,map.tileheight],[40,30,32,32]);
  assert.equal(map.layers.some((l:any)=>l.name==='movement_surfaces'&&l.objects.length),false);
  const exits=objects(map,'triggers').filter(z=>properties(z).kind==='map-exit');
  for(const spawn of metadata.spawns) {
    const {seen}=traverse(map,spawn);
    for(const other of metadata.spawns) assert.ok(seen.has(`${other.x},${other.y}`),other.id);
    for(const exit of exits) {
      assert.ok(seen.has(`${exit.x/32},${exit.y/32}`),exit.name);
      assert.ok(!(spawn.x*32>=exit.x&&spawn.x*32<exit.x+exit.width&&spawn.y*32>=exit.y&&spawn.y*32<exit.y+exit.height),'spawn outside exit');
      const p=properties(exit);
      assert.ok(metadata.connections.some((c:any)=>c.toMapId===p.destinationMapId&&c.targetSpawnId===p.destinationSpawnId));
    }
  }
});

test('R13 has two optional reachable snow patches and a two-tile main switchback',()=>{
  const map=read('r13_tornanti_bianchi','tmj');
  const zones=objects(map,'triggers').filter(z=>properties(z).kind==='encounter-zone');
  assert.deepEqual(zones.map(z=>[z.x/32,z.y/32,z.width/32,z.height/32]),[[8,10,2,2],[32,17,2,2]]);
  const {seen,blocked}=traverse(map,{x:1,y:24},false);
  for(const z of zones){assert.equal(properties(z).encounterTableId,'veloria/r13_snow_patch');assert.ok(seen.has(`${z.x/32},${z.y/32}`));}
  for(const [x,y,w,h] of [[0,23,28,2],[26,22,4,3],[28,19,2,5],[29,16,2,5],[28,13,3,3],[12,13,18,2],[10,12,4,3],[11,6,2,8],[11,3,4,4],[14,4,26,2]])
    for(let b=y;b<y+h;b++)for(let a=x;a<x+w;a++)assert.ok(!blocked.has(`${a},${b}`),`${a},${b}`);
});

test('Biancavetta services and solid guide, terminal and narrative sign have reachable approaches',()=>{
  const map=read('biancavetta','tmj'), {seen,blocked}=traverse(map,{x:1,y:17});
  for(const key of ['7,13','14,13','20,6','20,8','32,14','29,24','35,15','7,8','30,9'])assert.ok(seen.has(key),key);
  for(const key of ['32,15','29,23','35,14','7,12','14,12','20,4','5,4','30,5','25,20','10,23','37,17','2,25'])assert.ok(blocked.has(key),key);
  const interactions=objects(map,'interactions').map(properties);
  assert.ok(interactions.some(p=>p.serviceId==='pokemon_center'));
  assert.ok(interactions.some(p=>p.shopId==='veloria/biancavetta_market'));
  assert.ok(interactions.some(p=>p.kind==='local-transport'&&p.networkId==='mountain_cable'&&p.stopId==='biancavetta'));
  assert.equal(objects(map,'triggers').some(o=>String(properties(o).destinationMapId).includes('r14')),false);
  assert.ok(interactions.some(p=>String(p.message).includes('prototipo termina')));
});

 test('R13 cliff faces, pine banks and open chasms remain outside the authored floor',()=>{
 const {blocked}=traverse(read('r13_tornanti_bianchi','tmj'),{x:1,y:24});
 for(const tile of ['20,20','5,20','20,10','35,10','5,5','15,27','38,20'])assert.ok(blocked.has(tile),tile);
 });
