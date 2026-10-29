import coastalFishing from '../../content/encounters/r08_shore_fishing.encounter.json' with { type: 'json' };
import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo, walkDirection } from './helpers/world-navigation';
import species from '../../content/battle/species.v1.json' with {type:'json'};
import moves from '../../content/battle/moves.v1.json' with {type:'json'};
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });
const a = (page: Page) => page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
async function finishDialogue(page: Page) {
  for (let i=0;i<24 && await page.locator('#dialogue-box').isVisible();i++) await a(page).tap();
  await expect(page.locator('#dialogue-box')).toBeHidden();
}
async function face(page: Page, name: string) { await page.getByRole('button',{name,exact:true}).tap(); }

test('Portolume grants one rod, sails to the gauge and returns with persistent research', async ({page},info) => {
  test.setTimeout(180_000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await enterGame(page);
  const save=await readBrowserSave(page);
  save.flags=[...save.flags,'q_starter_selected','q_centrale_report','q_portolume_visited'];
  save.player={...save.player,mapId:'veloria/portolume',spawnPointId:'dock_mainland',x:25,y:14};
  await seedBrowserSave(page,save);await page.reload();await enterGame(page);
  // The ferry walkway remains open, but its southern edge is water.
  await walkTo(page,'portolume.tmj',24,14);
  await face(page,'Vai in basso');
  await page.waitForTimeout(200); // Longer than a complete 132ms walking step.
  expect((await readBrowserSave(page)).player).toMatchObject({ x: 24, y: 14 });
  await walkTo(page,'portolume.tmj',22,14);await face(page,'Vai in basso');await a(page).tap();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Capitana Marina');
  await finishDialogue(page);
  await expect.poll(async()=>(await readBrowserSave(page)).inventory['old-rod']).toBe(1);
  await walkTo(page,'portolume.tmj',25,14);await face(page,'Vai a destra');await a(page).tap();
  await page.getByRole('button',{name:'Osservatorio delle maree',exact:true}).tap();
  await expect.poll(async()=>(await readBrowserSave(page)).player.spawnPointId).toBe('dock_observatory');
  await walkTo(page,'portolume.tmj',36,8);await face(page,'Vai in alto');await a(page).tap();
  await finishDialogue(page);
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_portolume_tide_read');
  await page.reload();await enterGame(page);
  await walkTo(page,'portolume.tmj',33,10);await face(page,'Vai a sinistra');await a(page).tap();
  await page.getByRole('button',{name:'Molo di Portolume',exact:true}).tap();
  await expect.poll(async()=>(await readBrowserSave(page)).player.spawnPointId).toBe('dock_mainland');
  await walkTo(page,'portolume.tmj',22,14);await face(page,'Vai in basso');await a(page).tap();await finishDialogue(page);
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_portolume_tide_report');
  expect((await readBrowserSave(page)).inventory['old-rod']).toBe(1);
  await page.screenshot({path:info.outputPath('portolume-research.png')});
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#game canvas')).toBeVisible();
  const actionBounds=await a(page).boundingBox();
  expect(actionBounds?.width).toBeGreaterThanOrEqual(44);
  expect(actionBounds?.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({path:info.outputPath('portolume-landscape.png')});
  expect(errors).toEqual([]);
});

test('Nerea sluices open in order and the Marea medal survives reload', async({page},info)=>{
  test.setTimeout(180_000);
  await page.route('**/src/main.ts*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:await response.text()+'\nglobalThis.__portolumeGame=game;'});
  });
  await page.goto('/');await enterGame(page);
  const save=await readBrowserSave(page);
  save.flags=[...save.flags,'q_starter_selected','q_centrale_report','q_portolume_visited','q_portolume_orientation','q_portolume_tide_read','q_portolume_tide_report'];
  save.player={...save.player,mapId:'veloria/gym05_portolume',spawnPointId:'from_portolume',x:15,y:22,money:500};
  const creature=createBattleCreature({species:species.species as any,moves:moves.moves as any,speciesId:139,level:45,instanceId:'p5-checkpoint',moveIds:['mud-shot','water-gun']});
  save.party=[{instanceId:creature.instanceId,speciesId:139,level:45,experience:0,hp:creature.hp,maxHp:creature.stats.maxHp,moves:creature.moves.map(slot=>({id:slot.moveId,pp:slot.pp}))}];
  await seedBrowserSave(page,save);await page.reload();await enterGame(page);
  for(const [x,y,flag]of [[8,17,'gym05_basin_balanced'],[24,10,'gym05_sluice_open'],[8,4,'gym05_tide_stable']]as const){
    await walkTo(page,'gym05_portolume.tmj',x,y+1);await face(page,'Vai in alto');
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.screenshot({path:info.outputPath(`sluice-${x}-${y}-${viewport.width}.png`)});
    }
    await a(page).tap();await finishDialogue(page);
    await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain(flag);
  }
  await page.reload();await enterGame(page);
  await walkTo(page,'gym05_portolume.tmj',16,4);await face(page,'Vai in alto');await a(page).tap();
  for(let i=0;i<12&&!await page.getByRole('button',{name:'SFIDA',exact:true}).isVisible();i++)await a(page).tap();
  await page.getByRole('button',{name:'SFIDA',exact:true}).tap();
  async function tapLabel(prefix:string){
    const point=await page.evaluate(prefix=>{
      const scene=(window as any).__portolumeGame.scene.keys.battle;
      const label=scene.ui.list.find((item:any)=>item.type==='Text'&&item.text.startsWith(prefix));
      if(!label)throw new Error(`Missing command ${prefix}`);
      const b=label.getBounds(),c=scene.game.canvas.getBoundingClientRect();
      return{x:c.x+b.centerX*scene.scale.zoom,y:c.y+b.centerY*scene.scale.zoom};
    },prefix);
    await page.touchscreen.tap(point.x,point.y);
  }
  for(let turn=0;turn<20;turn++){
    await expect.poll(async()=>{
      const mode=await page.evaluate(()=>{const s=(window as any).__portolumeGame.scene.keys.battle;return !s?.sys.isActive()||!s.ui||!s.state?'loading':s.terminalShown?'terminal':s.mode;});
      if(mode==='learning')await tapLabel('Tieni le mosse');
      return mode==='menu'||mode==='terminal';
    },{timeout:25_000}).toBe(true);
    if(await page.locator('.battle-celebration').isVisible())break;
    await tapLabel('LOTTA');await tapLabel('Colpodifango');
  }
  const banner=page.getByRole('dialog',{name:'Medaglia Marea conquistata!'});
  await expect(banner).toBeVisible();await expect(banner).toContainText('Nerea');
  await expect(banner.locator('[data-badge-id="badge_marea"] svg')).toBeVisible();
  await page.screenshot({path:info.outputPath('marea-banner.png')});
  await banner.getByRole('button',{name:'Continua',exact:true}).tap();
  await expect.poll(async()=>(await readBrowserSave(page)).badges).toContain('badge_marea');
  expect((await readBrowserSave(page)).player.money).toBe(1900);
  await page.reload();await enterGame(page);
  expect((await readBrowserSave(page)).badges.filter(id=>id==='badge_marea')).toHaveLength(1);
  await walkTo(page,'gym05_portolume.tmj',15,23);
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/portolume');
});

test('Ferraluce reaches Portolume by the coast and fishing starts a coastal wild battle',async({page},info)=>{
  test.setTimeout(180_000);
  await page.addInitScript(()=>localStorage.setItem('veloria-animation-quality','full'));
  await page.route('**/src/main.ts*',async route=>{
    const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nglobalThis.__coastGame=game;'});
  });
  await page.goto('/');await enterGame(page);
  const save=await readBrowserSave(page);
  save.flags=[...save.flags,'q_starter_selected','q_centrale_report'];save.rngState=42;
  save.inventory['old-rod']=1;
  save.player={...save.player,mapId:'veloria/ferraluce',spawnPointId:'from_r08',x:38,y:22};
  const creature=createBattleCreature({species:species.species as any,moves:moves.moves as any,speciesId:138,level:45,instanceId:'fishing-checkpoint',moveIds:['mud-shot','water-gun']});
  save.party=[{instanceId:creature.instanceId,speciesId:138,level:45,experience:0,hp:creature.hp,maxHp:creature.stats.maxHp,moves:creature.moves.map(slot=>({id:slot.moveId,pp:slot.pp}))}];
  await seedBrowserSave(page,save);await page.reload();await enterGame(page);
  await walkDirection(page,'right');
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r08_costa_turbine');
  await walkTo(page,'r08_costa_turbine.tmj',39,11,{avoidEncounters:true});
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/portolume');
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_portolume_visited');
  await walkDirection(page,'left');
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r08_costa_turbine');
  await walkTo(page,'r08_costa_turbine.tmj',21,13,{avoidEncounters:true});
  await face(page,'Vai in basso');await a(page).tap();
  await expect(page.getByRole('button',{name:'PESCA',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'PESCA',exact:true}).tap();
  await expect.poll(()=>page.evaluate(()=>{
    const s=(window as any).__coastGame.scene.keys.battle;
    return Boolean(s?.sys.isActive()&&s.ui&&s.state);
  })).toBe(true);
  const wild=await page.evaluate(()=>{const s=(window as any).__coastGame.scene.keys.battle.state;return s.opponent.creatures[0];});
  expect(Object.values(coastalFishing.timeBands).flat().map(entry => entry.speciesId)).toContain(wild.speciesId);expect(wild.level).toBeGreaterThanOrEqual(20);expect(wild.level).toBeLessThanOrEqual(23);
  expect((await readBrowserSave(page)).inventory['old-rod']).toBe(1);
  await page.screenshot({path:info.outputPath('coastal-fishing-battle.png')});
});
