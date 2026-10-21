import {expect,test,type Page} from '@playwright/test';
import {enterGame} from './helpers/enter-game';
import {readBrowserSave,seedBrowserSave,walkTo} from './helpers/world-navigation';
import {prepareMonorailTraveler,travelResources} from './helpers/monorail';
import {fightWithTouch} from './helpers/battle-touch';
import species from '../../content/battle/species.v1.json' with {type:'json'};
import moves from '../../content/battle/moves.v1.json' with {type:'json'};
import {createBattleCreature} from '../../src/core/battle/create-creature.ts';
const a=(page:Page)=>page.getByRole('button',{name:'Conferma e interagisci',exact:true});
async function dialogue(page:Page){for(let i=0;i<24&&await page.locator('#dialogue-box').isVisible();i++)await a(page).tap();await expect(page.locator('#dialogue-box')).toBeHidden();}
async function untilChoices(page:Page){for(let i=0;i<24&&!await page.getByRole('button',{name:'Ripristiniamo l’equilibrio',exact:true}).isVisible();i++)await a(page).tap();await expect(page.getByRole('button',{name:'Ripristiniamo l’equilibrio',exact:true})).toBeVisible();}
async function checkpoint(page:Page,mapId:string,spawnPointId:string,x:number,y:number,flags:string[]){
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch({maxRetries:2});await route.fulfill({response,body:await response.text()+'\nglobalThis.concordiaGame=game;'});});
 await page.goto('/');await enterGame(page);const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected',...flags])];save.player={...save.player,mapId,spawnPointId,x,y,money:4000};await seedBrowserSave(page,save);await page.reload();await enterGame(page);
}
async function inspect(page:Page,map:string,x:number,y:number,direction='Vai in alto'){
 await walkTo(page,map,x,y,{avoidEncounters:true});await page.getByRole('button',{name:direction,exact:true}).tap();await a(page).tap();await dialogue(page);
}
test('D05 opens R15 and Concordia; observations, explicit plan, medicine purchases and walking return persist',async({page},info)=>{
 test.setTimeout(process.env.CI?480_000:300_000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await checkpoint(page,'veloria/d05_grotte_cristallo','from_r15',37,3,['q_d05_report','badge_ghiaccio_awarded']);
 await walkTo(page,'d05_grotte_cristallo.tmj',38,3,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r15_passo_due_luci');
 await inspect(page,'r15_passo_due_luci.tmj',29,19);await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_r15_network_read');await page.reload();await enterGame(page);
 await inspect(page,'r15_passo_due_luci.tmj',17,4);await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_r15_nature_read');
 await walkTo(page,'r15_passo_due_luci.tmj',39,9,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/concordia');
 await walkTo(page,'concordia.tmj',20,4,{avoidEncounters:true});await expect(page.locator('#toast')).toContainText('Elia');
 await walkTo(page,'concordia.tmj',29,11,{avoidEncounters:true});await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await a(page).tap();await untilChoices(page);
 await page.getByRole('button',{name:'Rivediamo le misure',exact:true}).tap();await dialogue(page);expect((await readBrowserSave(page)).flags).not.toContain('q_concordia_restore_plan');
 await a(page).tap();await untilChoices(page);await page.getByRole('button',{name:'DECIDO DOPO',exact:true}).tap();expect((await readBrowserSave(page)).flags).not.toContain('q_concordia_restore_plan');
 await a(page).tap();await untilChoices(page);await page.getByRole('button',{name:'Ripristiniamo l’equilibrio',exact:true}).tap();await dialogue(page);await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_concordia_restore_plan');
 await page.reload();await enterGame(page);await page.screenshot({path:info.outputPath('concordia-plan.png')});
 await walkTo(page,'concordia.tmj',13,12,{avoidEncounters:true});await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await a(page).tap();
 await expect(page.getByRole('button',{name:/Superpozione/}).locator('.service-option__icon--potion')).toBeVisible();await page.getByRole('button',{name:/Superpozione/}).tap();
 await expect.poll(async()=>(await readBrowserSave(page)).inventory['super-potion']).toBe(1);await a(page).tap();await page.getByRole('button',{name:/Antiparalisi/}).tap();await expect.poll(async()=>(await readBrowserSave(page)).inventory['paralyze-heal']).toBe(1);expect((await readBrowserSave(page)).player.money).toBe(3100);
 await walkTo(page,'concordia.tmj',0,15,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r15_passo_due_luci');
 await walkTo(page,'r15_passo_due_luci.tmj',2,9,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/d05_grotte_cristallo');
 await page.reload();await enterGame(page);expect((await readBrowserSave(page)).flags).toContain('q_concordia_restore_plan');expect(errors).toEqual([]);
});
test('P8 requires both flows, saves partial convergence and awards the eighth medal once after real touch battle',async({page},info)=>{
 test.setTimeout(process.env.CI?360_000:240_000);
 await checkpoint(page,'veloria/gym08_concordia','from_city',15,22,['q_concordia_restore_plan','q_d05_report','badge_ghiaccio_awarded']);
 const save=await readBrowserSave(page);save.player.money=1000;
 // Strong integration checkpoint; this is not a proof of natural progression balance.
 const creature=createBattleCreature({species:species.species as any,moves:moves.moves as any,speciesId:87,level:75,instanceId:'p8-integration',moveIds:['ice-beam','aurora-beam','ice-shard']});
 save.party=[{instanceId:creature.instanceId,speciesId:87,level:75,experience:0,hp:creature.hp,maxHp:creature.stats.maxHp,moves:creature.moves.map(m=>({id:m.moveId,pp:m.pp}))}];await seedBrowserSave(page,save);await page.reload();await enterGame(page);
 for(const [index,x,y]of [[0,21,14],[1,21,8],[2,11,8],[3,11,14]]as const){
  await walkTo(page,'gym08_concordia.tmj',x,y+1,{avoidEncounters:true});await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await a(page).tap();await page.getByRole('button',{name:'RUOTA',exact:true}).tap();
  if(index<3){expect((await readBrowserSave(page)).flags).not.toContain('gym08_convergence_complete');if(index===1)await expect(page.locator('#dialogue-text')).toContainText('Luce della rete: raggiunge il ricevitore');await page.getByRole('button',{name:'CHIUDI',exact:true}).tap();}
  else await dialogue(page);
  if(index===1){await page.reload();await enterGame(page);}
 }
 await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('gym08_convergence_complete');await page.screenshot({path:info.outputPath('p8-convergence.png')});
 await page.setViewportSize({width:844,height:390});await page.screenshot({path:info.outputPath('p8-landscape.png')});
 await walkTo(page,'gym08_concordia.tmj',16,3,{avoidEncounters:true});await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await a(page).tap();for(let i=0;i<12&&!await page.getByRole('button',{name:'SFIDA',exact:true}).isVisible();i++)await a(page).tap();await page.getByRole('button',{name:'SFIDA',exact:true}).tap();
 await fightWithTouch(page,'concordiaGame',{87:'Geloraggio'});
 const banner=page.getByRole('dialog',{name:'Medaglia Armonia conquistata!'});await expect(banner).toBeVisible();await expect(banner).toContainText('Aurel');await expect(banner.locator('[data-badge-id="badge_armonia"] svg')).toBeVisible();await page.screenshot({path:info.outputPath('armonia-medal.png')});await banner.getByRole('button',{name:'Continua',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).badges).toContain('badge_armonia');expect((await readBrowserSave(page)).player.money).toBe(3600);
 await page.reload();await enterGame(page);expect((await readBrowserSave(page)).badges.filter(b=>b==='badge_armonia')).toHaveLength(1);await walkTo(page,'gym08_concordia.tmj',15,23,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/concordia');
});
test('visited Concordia monorail arrival survives reload and both orientations without changing resources',async({page},info)=>{
 test.setTimeout(90_000);await prepareMonorailTraveler(page,true,['vetracielo','concordia']);const before=travelResources(await readBrowserSave(page));await a(page).tap();await page.getByRole('button',{name:'Concordia',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/concordia');await page.reload();await enterGame(page);await page.setViewportSize({width:844,height:390});await page.screenshot({path:info.outputPath('concordia-station.png')});await a(page).tap();await page.getByRole('button',{name:'Vetracielo',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');expect(travelResources(await readBrowserSave(page))).toEqual(before);
});


test('Nilo can be declined, then beaten through touch for one persistent reward',async({page})=>{
 test.setTimeout(process.env.CI?300_000:180_000);
 await checkpoint(page,'veloria/r15_passo_due_luci','from_cavern',22,13,['q_d05_report']);
 const save=await readBrowserSave(page);
 // Deliberately strong checkpoint to isolate interaction and reward integration.
 const creature=createBattleCreature({species:species.species as any,moves:moves.moves as any,speciesId:195,level:75,instanceId:'nilo-integration',moveIds:['water-gun']});
 save.party=[{instanceId:creature.instanceId,speciesId:195,level:75,experience:0,hp:creature.hp,maxHp:creature.stats.maxHp,moves:creature.moves.map(m=>({id:m.moveId,pp:m.pp}))}];await seedBrowserSave(page,save);await page.reload();await enterGame(page);
 async function challenge(){await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await a(page).tap();for(let i=0;i<16&&!await page.getByRole('button',{name:'SFIDA',exact:true}).isVisible();i++)await a(page).tap();}
 await challenge();await page.getByRole('button',{name:'NON ORA',exact:true}).tap();expect((await readBrowserSave(page)).player.money).toBe(4000);expect((await readBrowserSave(page)).flags).not.toContain('trainer_r15_nilo_defeated');
 await challenge();await page.getByRole('button',{name:'SFIDA',exact:true}).tap();await fightWithTouch(page,'concordiaGame',{195:'Pistolacqua'});
 const banner=page.getByRole('dialog').filter({hasText:'Nilo'});await expect(banner).toBeVisible();await expect(banner).toContainText('1600');await banner.getByRole('button',{name:'Continua',exact:true}).tap();
 await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_r15_nilo_helped');expect((await readBrowserSave(page)).player.money).toBe(5600);
 await page.reload();await enterGame(page);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await a(page).tap();await dialogue(page);expect((await readBrowserSave(page)).player.money).toBe(5600);await expect(page.getByRole('button',{name:'SFIDA',exact:true})).toBeHidden();
});
