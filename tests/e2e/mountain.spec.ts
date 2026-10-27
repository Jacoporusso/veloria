import {expect,test,type Page} from '@playwright/test';
import {enterGame} from './helpers/enter-game';
import {readBrowserSave,seedBrowserSave,walkTo} from './helpers/world-navigation';
import {planIceRoute} from './helpers/ice-navigation';
import species from '../../content/battle/species.v1.json' with {type:'json'};
import moves from '../../content/battle/moves.v1.json' with {type:'json'};
import {createBattleCreature} from '../../src/core/battle/create-creature.ts';
import {fightWithTouch} from './helpers/battle-touch';
const labels={up:'Vai in alto',down:'Vai in basso',left:'Vai a sinistra',right:'Vai a destra'};
const confirm=(p:Page)=>p.getByRole('button',{name:'Conferma e interagisci',exact:true});
async function dialogue(page:Page){
 const stayHere=page.getByRole('button',{name:'RESTA QUI',exact:true});
 if(await stayHere.isVisible())await stayHere.tap();
 for(let i=0;i<24&&await page.locator('#dialogue-box').isVisible();i++)await confirm(page).tap();
 await expect(page.locator('#dialogue-box')).toBeHidden();
}
async function checkpoint(page:Page,mapId:string,spawnPointId:string,x:number,y:number,flags:string[]){
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch({ maxRetries: 2 });await route.fulfill({response,body:await response.text()+'\nglobalThis.mountainGame=game;'});});
 await page.goto('/');await enterGame(page);const save=await readBrowserSave(page);
 save.flags=[...new Set([...save.flags,'q_starter_selected',...flags])];save.player={...save.player,mapId,spawnPointId,x,y};
 await seedBrowserSave(page,save);await page.reload();await enterGame(page);
}
async function iceTo(page:Page,x:number,y:number){
 for(const step of await planIceRoute(page,'gym07_biancavetta.tmj',x,y)){
  await page.getByRole('button',{name:labels[step.direction],exact:true}).tap();
  await expect.poll(()=>page.evaluate(()=>{const w=(window as any).mountainGame.scene.keys.world;return {x:w.playerTile.x,y:w.playerTile.y,moving:w.moving,sliding:w.slidingDirection};}),{intervals:[50,100]}).toEqual({...step.point,moving:false,sliding:null});
 }
}
test('P7 three real ice lanes persist through reload and the console opens Nives gate',async({page},info)=>{
 test.setTimeout(180_000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await checkpoint(page,'veloria/gym07_biancavetta','from_city',15,22,['badge_riflesso_awarded','q_passobrina_report']);
 // Strong integration checkpoint: victory flow is tested, natural progression balance is separate.
 const save=await readBrowserSave(page);save.player.money=500;
 const creature=createBattleCreature({species:species.species as any,moves:moves.moves as any,speciesId:6,level:100,instanceId:'p7-integration',moveIds:['flamethrower']});
 save.party=[{instanceId:creature.instanceId,speciesId:6,level:70,experience:0,hp:creature.hp,maxHp:creature.stats.maxHp,moves:creature.moves.map(m=>({id:m.moveId,pp:m.pp}))}];
 await seedBrowserSave(page,save);await page.reload();await enterGame(page);
 for(const [x,y,flag]of [[24,3,'gym07_ice_east'],[8,3,'gym07_ice_west'],[16,3,'gym07_ice_center']]as const){
  await iceTo(page,x,y);await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain(flag);
  expect(await page.evaluate(flag=>{
   const markers=(window as any).mountainGame.scene.keys.world.mapLayer.list.filter((item:any)=>item.name==='quest-sigil-marker');
   return {count:markers.length,active:markers.find((item:any)=>item.getData('activatedFlag')===flag)?.getData('activated')};
  },flag)).toEqual({count:3,active:true});
  for(const viewport of [{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.screenshot({path:info.outputPath(`ice-landing-${x}-${viewport.width}.png`)});
  }
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
 await expect.poll(()=>page.evaluate(()=>{
  const scene=(window as any).mountainGame.scene.keys.battle;
  return scene?.ui?.list.some((item:any)=>item.texture?.key==='veloria-gym07_biancavetta-illustrated-v3')??false;
 })).toBe(true);
 await page.screenshot({path:info.outputPath('p7-battle-background.png')});
 await fightWithTouch(page,'mountainGame',{6:'Lanciafiamme'});
 const banner=page.getByRole('dialog',{name:'Medaglia Brina conquistata!'});await expect(banner).toBeVisible();await expect(banner).toContainText('Nives');
 await expect(banner.locator('[data-badge-id="badge_brina"] svg')).toBeVisible();await page.screenshot({path:info.outputPath('brina-medal.png')});
 await banner.getByRole('button',{name:'Continua',exact:true}).tap();
 await expect.poll(async()=>(await readBrowserSave(page)).badges).toContain('badge_brina');expect((await readBrowserSave(page)).player.money).toBe(2600);
 await page.reload();await enterGame(page);expect((await readBrowserSave(page)).badges.filter(b=>b==='badge_brina')).toHaveLength(1);
 await iceTo(page,15,22);await page.getByRole('button',{name:labels.down,exact:true}).tap();
 await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/biancavetta');expect(errors).toEqual([]);
});
test('a save on a formerly open P7 wall resumes at the entrance without losing progress',async({page})=>{
 await checkpoint(page,'veloria/gym07_biancavetta','from_city',15,22,['badge_riflesso_awarded','q_passobrina_report','gym07_ice_west']);
 const fixture=await readBrowserSave(page);
 const member=createBattleCreature({species:species.species as any,moves:moves.moves as any,speciesId:6,level:50,instanceId:'p7-wall-recovery-companion'});
 fixture.player={...fixture.player,x:11,y:10,money:1234};
 fixture.party=[{instanceId:member.instanceId,speciesId:6,level:50,experience:0,hp:member.hp,maxHp:member.stats.maxHp,moves:member.moves.map(slot=>({id:slot.moveId,pp:slot.pp}))}];
 fixture.flags=[...new Set([...fixture.flags,'pokedex_seen_6','pokedex_caught_6'])];
 await seedBrowserSave(page,fixture);await page.reload();await enterGame(page);
 const before=await readBrowserSave(page);
 expect(await page.evaluate(()=>{const w=(window as any).mountainGame.scene.keys.world;return w.playerTile;})).toEqual({x:15,y:22});
 await page.getByRole('button',{name:'Salva la partita',exact:true}).tap();
 await expect.poll(async()=>{const s=await readBrowserSave(page);return{x:s.player.x,y:s.player.y};}).toEqual({x:15,y:22});
 const after=await readBrowserSave(page);
 expect(after.player.money).toBe(1234);
 expect(new Set(after.flags)).toEqual(new Set([...before.flags,'atlas_visited_veloria/gym07_biancavetta']));
 for(const field of ['party','inventory','badges','rngState'] as const)expect(after[field]).toEqual(before[field]);
 await page.reload();await enterGame(page);
 await page.getByRole('button',{name:labels.up,exact:true}).tap();
 await expect.poll(async()=>{const s=await readBrowserSave(page);return{x:s.player.x,y:s.player.y};}).toEqual({x:15,y:21});
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
 // CI 39579019618 completes research/Biancavetta and all but the last 36
 // R12 return steps at 480s (1.1s per progressing step). Preserve the full round trip.
 test.setTimeout(process.env.CI?600_000:300_000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
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
