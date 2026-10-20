import {test,expect,type Page} from '@playwright/test';
import {enterGame} from './helpers/enter-game';
import {readBrowserSave,seedBrowserSave,walkTo} from './helpers/world-navigation';
const a=(p:Page)=>p.getByRole('button',{name:'Conferma e interagisci',exact:true});
async function dialogue(page:Page){for(let i=0;i<24&&await page.locator('#dialogue-box').isVisible();i++)await a(page).tap();await expect(page.locator('#dialogue-box')).toBeHidden();}
async function checkpoint(page:Page,mapId:string,spawnPointId:string,x:number,y:number,flags:string[]){
 await page.goto('/');await enterGame(page);const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected',...flags])];save.player={...save.player,mapId,spawnPointId,x,y};await seedBrowserSave(page,save);await page.reload();await enterGame(page);
}
async function inspect(page:Page,map:string,x:number,y:number,direction='Vai in alto'){
 await walkTo(page,map,x,y,{avoidEncounters:true});await page.getByRole('button',{name:direction,exact:true}).tap();await a(page).tap();await dialogue(page);
}
async function solve(page:Page){
 await page.getByRole('button',{name:'Ventilazione → Aperta',exact:true}).tap();await page.getByRole('button',{name:'Ventilazione → Delicata',exact:true}).tap();
 await page.getByRole('button',{name:'Scambio termico → Lieve',exact:true}).tap();await page.getByRole('button',{name:'Scambio termico → Moderato',exact:true}).tap();
 expect((await readBrowserSave(page)).flags).not.toContain('q_d05_climate_balanced');await page.getByRole('button',{name:'VERIFICA EQUILIBRIO',exact:true}).tap();
 await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_d05_climate_balanced');await page.getByRole('button',{name:'CHIUDI',exact:true}).tap();
}
test('cavern console explains prerequisites, preserves partial adjustments and resets through portrait and landscape',async({page},info)=>{
 test.setTimeout(90_000);
 await checkpoint(page,'veloria/d05_grotte_cristallo','from_r14',29,3,['badge_ghiaccio_awarded']);
 await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await a(page).tap();await expect(page.locator('#dialogue-text')).toContainText('raccogli le letture');await page.getByRole('button',{name:'CHIUDI',exact:true}).tap();
 const save=await readBrowserSave(page);save.flags.push('q_d05_low_read','q_d05_middle_read');await seedBrowserSave(page,save);await page.reload();await enterGame(page);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await a(page).tap();
 await page.getByRole('button',{name:'VERIFICA EQUILIBRIO',exact:true}).tap();expect((await readBrowserSave(page)).flags).not.toContain('q_d05_climate_balanced');
 await page.getByRole('button',{name:'Ventilazione → Aperta',exact:true}).tap();await page.getByRole('button',{name:'CHIUDI',exact:true}).tap();await page.reload();await enterGame(page);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await a(page).tap();
 await expect(page.locator('#dialogue-text')).toContainText('Ventilazione: Aperta');await page.setViewportSize({width:844,height:390});
 await page.getByRole('button',{name:'RIPRISTINA',exact:true}).tap();await expect(page.locator('#dialogue-text')).toContainText('Ventilazione: Forte');await page.screenshot({path:info.outputPath('regulator-landscape.png')});
 await solve(page);await page.setViewportSize({width:390,height:844});await page.screenshot({path:info.outputPath('crystal-console-portrait.png')});
});
test('Brina gates the crystal bridge; all cavern readings and report persist with a complete walking return',async({page},info)=>{
 test.setTimeout(300_000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await checkpoint(page,'veloria/biancavetta','from_r14',38,15,[]);
 await page.getByRole('button',{name:'Vai a destra',exact:true}).tap();await expect(page.locator('#toast')).toContainText('Medaglia Brina');
 const save=await readBrowserSave(page);save.flags.push('badge_ghiaccio_awarded');save.badges.push('badge_brina');await seedBrowserSave(page,save);await page.reload();await enterGame(page);
 await walkTo(page,'biancavetta.tmj',38,15,{avoidEncounters:true});await walkTo(page,'biancavetta.tmj',39,15,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r14_varco_cristallo');
 await walkTo(page,'r14_varco_cristallo.tmj',34,5,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/d05_grotte_cristallo');
 await inspect(page,'d05_grotte_cristallo.tmj',18,12);await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_d05_middle_read');await page.reload();await enterGame(page);
 await inspect(page,'d05_grotte_cristallo.tmj',5,14);await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_d05_low_read');
 await walkTo(page,'d05_grotte_cristallo.tmj',29,3,{avoidEncounters:true});await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await a(page).tap();await solve(page);
 await inspect(page,'d05_grotte_cristallo.tmj',37,3,'Vai a destra');await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_d05_upper_read');await page.screenshot({path:info.outputPath('crystal-upper-reading.png')});
 await walkTo(page,'d05_grotte_cristallo.tmj',11,29,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r14_varco_cristallo');
 const before=await readBrowserSave(page);await inspect(page,'r14_varco_cristallo.tmj',29,12);await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_d05_report');
 const reward=await readBrowserSave(page);expect(reward.player.money).toBe(before.player.money+700);expect(reward.inventory.potion??0).toBe((before.inventory.potion??0)+2);
 await a(page).tap();await dialogue(page);expect((await readBrowserSave(page)).player.money).toBe(reward.player.money);await page.screenshot({path:info.outputPath('crystal-report.png')});
 await walkTo(page,'r14_varco_cristallo.tmj',0,16,{avoidEncounters:true});await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/biancavetta');await page.reload();await enterGame(page);
 expect((await readBrowserSave(page)).flags).toContain('q_d05_report');expect(errors).toEqual([]);
});
