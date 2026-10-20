import {expect,test,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {enterGame} from './helpers/enter-game';
import {readBrowserSave,seedBrowserSave,walkTo} from './helpers/world-navigation';
import {collectMapCollision} from '../../src/core/world/map-collision.ts';
import {collectIceTiles,iceSlideContinues} from '../../src/core/world/ice-movement.ts';
import {tryGridMove,type CardinalDirection} from '../../src/core/world/grid-movement.ts';
import species from '../../content/battle/species.v1.json' with {type:'json'};
import moves from '../../content/battle/moves.v1.json' with {type:'json'};
import {createBattleCreature} from '../../src/core/battle/create-creature.ts';
import {fightWithTouch} from './helpers/battle-touch';
const labels={up:'Vai in alto',down:'Vai in basso',left:'Vai a sinistra',right:'Vai a destra'};
const confirm=(p:Page)=>p.getByRole('button',{name:'Conferma e interagisci',exact:true});
async function dialogue(page:Page){for(let i=0;i<24&&await page.locator('#dialogue-box').isVisible();i++)await confirm(page).tap();await expect(page.locator('#dialogue-box')).toBeHidden();}
async function checkpoint(page:Page,mapId:string,spawnPointId:string,x:number,y:number,flags:string[]){
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nglobalThis.mountainGame=game;'});});
 await page.goto('/');await enterGame(page);const save=await readBrowserSave(page);
 save.flags=[...new Set([...save.flags,'q_starter_selected',...flags])];save.player={...save.player,mapId,spawnPointId,x,y};
 await seedBrowserSave(page,save);await page.reload();await enterGame(page);
}
async function iceTo(page:Page,x:number,y:number){
 const map=JSON.parse(readFileSync('public/tilemaps/gym07_biancavetta.tmj','utf8'));const save=await readBrowserSave(page);
 const blocked=collectMapCollision(map.layers.find((l:any)=>l.name==='collision').objects,map.width,map.height,save.flags);
 const ice=collectIceTiles(map.layers.find((l:any)=>l.name==='movement_surfaces').objects,map.width,map.height);
 const start={x:save.player.x!,y:save.player.y!};const key=(p:{x:number;y:number})=>`${p.x},${p.y}`;
 const queue=[start],previous=new Map<string,{from:string;direction:CardinalDirection;point:{x:number;y:number}}>();const seen=new Set([key(start)]);
 for(let i=0;i<queue.length&&!seen.has(`${x},${y}`);i++)for(const direction of ['up','down','left','right'] as const){
  const first=tryGridMove(queue[i],direction,map.width,map.height,blocked);if(!first.moved)continue;
  let point=first.position;while(iceSlideContinues(point,direction,map.width,map.height,blocked,ice))point=tryGridMove(point,direction,map.width,map.height,blocked).position;
  if(point.y===23||seen.has(key(point)))continue;seen.add(key(point));queue.push(point);previous.set(key(point),{from:key(queue[i]),direction,point});
 }
 expect(seen.has(`${x},${y}`),'reachable ice landing').toBe(true);
 const route=[];for(let k=`${x},${y}`;k!==key(start);){const step=previous.get(k)!;route.push(step);k=step.from;}
 for(const step of route.reverse()){
  await page.getByRole('button',{name:labels[step.direction],exact:true}).tap();
  await expect.poll(()=>page.evaluate(()=>{const w=(window as any).mountainGame.scene.keys.world;return {x:w.playerTile.x,y:w.playerTile.y,moving:w.moving,sliding:w.slidingDirection};}),{intervals:[50,100]}).toEqual({...step.point,moving:false,sliding:null});
 }
}
test('P7 three real ice lanes persist through reload and the console opens Nives gate',async({page},info)=>{
 test.setTimeout(180_000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await checkpoint(page,'veloria/gym07_biancavetta','from_city',15,22,['badge_riflesso_awarded','q_passobrina_report']);
 // Strong integration checkpoint: victory flow is tested, natural progression balance is separate.
 const save=await readBrowserSave(page);save.player.money=500;
 const creature=createBattleCreature({species:species.species as any,moves:moves.moves as any,speciesId:6,level:70,instanceId:'p7-integration',moveIds:['ember']});
 save.party=[{instanceId:creature.instanceId,speciesId:6,level:70,experience:0,hp:creature.hp,maxHp:creature.stats.maxHp,moves:creature.moves.map(m=>({id:m.moveId,pp:m.pp}))}];
 await seedBrowserSave(page,save);await page.reload();await enterGame(page);
 for(const [x,y,flag]of [[24,3,'gym07_ice_east'],[8,3,'gym07_ice_west'],[16,3,'gym07_ice_center']]as const){
  await iceTo(page,x,y);await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain(flag);
  if(flag==='gym07_ice_west'){await page.reload();await enterGame(page);}
 }
 expect((await readBrowserSave(page)).flags).not.toContain('gym07_ice_complete');
 await iceTo(page,17,3);await page.getByRole('button',{name:labels.right,exact:true}).tap();await confirm(page).tap();await dialogue(page);
 await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('gym07_ice_complete');
 await iceTo(page,16,2);await page.screenshot({path:info.outputPath('nives-gate-open.png')});
 await page.setViewportSize({width:844,height:390});await page.screenshot({path:info.outputPath('p7-landscape.png')});
 await page.getByRole('button',{name:labels.up,exact:true}).tap();await confirm(page).tap();
 for(let i=0;i<12&&!await page.getByRole('button',{name:'SFIDA',exact:true}).isVisible();i++)await confirm(page).tap();
 await page.getByRole('button',{name:'SFIDA',exact:true}).tap();
 await fightWithTouch(page,'mountainGame',{6:'Braciere'});
 const banner=page.getByRole('dialog',{name:'Medaglia Brina conquistata!'});await expect(banner).toBeVisible();await expect(banner).toContainText('Nives');
 await expect(banner.locator('[data-badge-id="badge_brina"] svg')).toBeVisible();await page.screenshot({path:info.outputPath('brina-medal.png')});
 await banner.getByRole('button',{name:'Continua',exact:true}).tap();
 await expect.poll(async()=>(await readBrowserSave(page)).badges).toContain('badge_brina');expect((await readBrowserSave(page)).player.money).toBe(2600);
 await page.reload();await enterGame(page);expect((await readBrowserSave(page)).badges.filter(b=>b==='badge_brina')).toHaveLength(1);
 await iceTo(page,15,22);expect(errors).toEqual([]);
});
test('Brina cable is locked before badge and makes both trips without consuming resources',async({page})=>{
 test.setTimeout(90_000);
 await checkpoint(page,'veloria/passobrina','cable_arrival',29,22,['badge_riflesso_awarded','q_passobrina_report']);
 await confirm(page).tap();await expect(page.locator('#dialogue-box')).toContainText('Medaglia Brina');await dialogue(page);
 const save=await readBrowserSave(page);save.flags.push('badge_ghiaccio_awarded');save.badges.push('badge_brina');
 await seedBrowserSave(page,save);await page.reload();await enterGame(page);
 const before=await readBrowserSave(page);await confirm(page).tap();await page.getByRole('button',{name:'Biancavetta',exact:true}).tap();
 await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/biancavetta');
 await page.reload();await enterGame(page);await confirm(page).tap();await page.getByRole('button',{name:'Passobrina',exact:true}).tap();
 await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/passobrina');
 const after=await readBrowserSave(page);expect(after.player.money).toBe(before.player.money);expect(after.party).toEqual(before.party);expect(after.inventory).toEqual(before.inventory);
});
test('Riflesso mountain path, three readings, report, Biancavetta and every walking return persist',async({page},info)=>{
 test.setTimeout(300_000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await checkpoint(page,'veloria/acquariva','from_r12',13,1,['badge_riflesso_awarded']);
 const initial=await readBrowserSave(page);
 await walkTo(page,'acquariva.tmj',13,0,{avoidEncounters:true});
 await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r12_valle_vento');
 for(const [x,y,flag]of [[28,20,'q_r12_temperature_read'],[12,8,'q_r12_wind_read']]as const){
  await walkTo(page,'r12_valle_vento.tmj',x,y,{avoidEncounters:true});await page.getByRole('button',{name:labels.up,exact:true}).tap();await confirm(page).tap();await dialogue(page);
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain(flag);
 }
 await walkTo(page,'r12_valle_vento.tmj',39,5,{avoidEncounters:true});
 await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/passobrina');
 await walkTo(page,'passobrina.tmj',32,9,{avoidEncounters:true});await page.getByRole('button',{name:labels.up,exact:true}).tap();await confirm(page).tap();await dialogue(page);
 await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_passobrina_snow_read');
 await page.reload();await enterGame(page);
 await walkTo(page,'passobrina.tmj',28,14,{avoidEncounters:true});await page.getByRole('button',{name:labels.up,exact:true}).tap();await confirm(page).tap();await dialogue(page);
 await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_passobrina_report');
 expect((await readBrowserSave(page)).player.money).toBe(initial.player.money+500);
 await confirm(page).tap();await dialogue(page);expect((await readBrowserSave(page)).player.money).toBe(initial.player.money+500);
 await page.screenshot({path:info.outputPath('passobrina-research.png')});
 await walkTo(page,'passobrina.tmj',39,7,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r13_tornanti_bianchi');
 await walkTo(page,'r13_tornanti_bianchi.tmj',39,5,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/biancavetta');
 await page.screenshot({path:info.outputPath('biancavetta-arrival.png')});await page.reload();await enterGame(page);
 await walkTo(page,'biancavetta.tmj',0,17,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r13_tornanti_bianchi');
 await walkTo(page,'r13_tornanti_bianchi.tmj',0,24,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/passobrina');
 await walkTo(page,'passobrina.tmj',0,15,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r12_valle_vento');
 await walkTo(page,'r12_valle_vento.tmj',0,23,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
 expect(errors).toEqual([]);
});
