import {expect,test} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {createBattleCreature} from '../../src/core/battle/create-creature.ts';
import {enterGame} from './helpers/enter-game';
import {readBrowserSave,seedBrowserSave,walkDirection,walkTo} from './helpers/world-navigation';

test.use({deviceScaleFactor:2,reducedMotion:'reduce'});
test('Petalora irrigation, Dalia, Corolla banner and medal case persist',async({page},testInfo)=>{
  test.setTimeout(180_000);
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.ts*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text())+'\nglobalThis.__gymGame=game;'});
  });
  await page.goto('/');await enterGame(page);
  await expect.poll(async()=>(await readBrowserSave(page))?.flags).toContain('intro_completed');
  const species=JSON.parse(await readFile(new URL('../../content/battle/species.v1.json',import.meta.url),'utf8')).species;
  const moves=JSON.parse(await readFile(new URL('../../content/battle/moves.v1.json',import.meta.url),'utf8')).moves;
  const creature=createBattleCreature({species,moves,speciesId:5,level:16,instanceId:'gym02-fixture',moveIds:['ember','scratch','growl','smokescreen']});
  const save=await readBrowserSave(page);
  save.flags=[...new Set([...save.flags,'q_starter_selected','q_research_sample_received','q_forest_signal_found','q_ada_helped','q_brumalta_visited','gym01_puzzle_solved','badge_aurora_awarded','prologue_complete_seen','q_petalora_visited'])];
  save.badges=['badge_aurora'];
  save.player={...save.player,mapId:'veloria/petalora',spawnPointId:'from_gym02',x:18,y:2,money:500};
  save.party=[{instanceId:creature.instanceId,speciesId:creature.speciesId,level:creature.level,experience:0,hp:creature.hp,maxHp:creature.stats.maxHp,moves:creature.moves.map(slot=>({id:slot.moveId,pp:slot.pp}))}];
  await seedBrowserSave(page,save);await page.reload();await enterGame(page);
  await walkTo(page,'petalora.tmj',18,0);
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI PETALORA');
  async function closeDialogue() {
    for(let i=0;i<10&&await page.locator('#dialogue-box').isVisible();i++)
      await page.getByRole('button',{name:'Conferma e interagisci'}).click();
    await expect(page.locator('#dialogue-box')).toBeHidden();
  }
  async function inspect(x:number,y:number,speaker:string) {
    await walkTo(page,'gym02_petalora.tmj',x,y+2);
    await walkDirection(page,'up');
    await page.getByRole('button',{name:'Conferma e interagisci'}).click();
    await expect(page.locator('#dialogue-speaker')).toHaveText(speaker);
    await expect(page.locator('#dialogue-box')).toBeVisible();
  }
  const flowerCount=()=>page.evaluate(()=>(window as any).__gymGame.scene.keys.world.mapLayer.list.filter((o:any)=>o.type==='Image'&&o.texture.key==='veloria-borgofonte-plants-v1').length);
  expect(await flowerCount()).toBe(0);
  await inspect(13,3,'Dalia');await closeDialogue();
  await expect(page.getByRole('button',{name:'SFIDA',exact:true})).toBeHidden();
  await expect(page.locator('#toast')).toContainText('sorgente');
  await inspect(20,10,'Deviazione est');await closeDialogue();
  expect((await readBrowserSave(page)).flags).not.toContain('gym02_water_east_open');
  await page.screenshot({path:testInfo.outputPath('garden-dry.png')});
  await inspect(5,21,'Sorgente del giardino');await closeDialogue();
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('gym02_water_source_open');
  await page.reload();await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain('gym02_water_source_open');
  await inspect(6,15,'Deviazione ovest');await closeDialogue();
  await inspect(20,10,'Deviazione est');await closeDialogue();
  await inspect(13,6,'Terrazza dei Ciliegi');await closeDialogue();
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('gym02_irrigation_solved');
  expect(await flowerCount()).toBe(6);
  await expect(page.locator('.journey-reward')).toBeVisible();
  await expect(page.locator('#toast.visible')).toHaveCount(0);
  await expect(page.locator('.journey-trigger')).toHaveClass(/is-compact/);
  const rewardBounds = await page.locator('.journey-reward').boundingBox();
  expect(rewardBounds!.height).toBeLessThan(125);
  await page.screenshot({path:testInfo.outputPath('garden-watered.png')});
  await inspect(13,3,'Dalia');
  for(let i=0;i<10&&!(await page.getByRole('button',{name:'SFIDA',exact:true}).isVisible());i++)
    await page.getByRole('button',{name:'Conferma e interagisci'}).click();
  await expect(page.locator('#dialogue-text')).toContainText('livello 12–13');
  await page.getByRole('button',{name:'SFIDA',exact:true}).click();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  async function tapBattleLabel(label:string) {
    const point=await page.evaluate(label=>{
      const scene=(window as any).__gymGame.scene.keys.battle;
      const text=scene.ui.list.find((o:any)=>o.type==='Text'&&o.text.startsWith(label));
      const bounds=text.getBounds(), canvas=scene.game.canvas.getBoundingClientRect();
      return {x:canvas.x+bounds.centerX*scene.scale.zoom,y:canvas.y+bounds.centerY*scene.scale.zoom};
    },label);
    await page.touchscreen.tap(point.x,point.y);
  }
  for(let turn=0;turn<8;turn++) {
    if(await page.locator('.battle-celebration').isVisible())break;
    await expect.poll(()=>page.evaluate(()=>{
      const s=(window as any).__gymGame.scene.keys.battle;
      return Boolean(s?.sys.isActive()&&s.ui?.list.length&&s.mode==='menu');
    })).toBe(true);
    await tapBattleLabel('LOTTA');await tapBattleLabel('Braciere');
    await expect.poll(()=>page.evaluate(()=>{const s=(window as any).__gymGame.scene.keys.battle;return s.terminalShown||s.mode==='menu';}),{timeout:15_000}).toBe(true);
  }
  const banner=page.getByRole('dialog',{name:'Medaglia Corolla conquistata!'});
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('+650 monete');
  await expect(banner).toContainText('Sonnifero');
  await expect(banner.locator('[data-badge-id="badge_corolla"] svg ellipse')).toHaveCount(5);
  await page.screenshot({path:testInfo.outputPath('corolla-banner.png')});
  await page.setViewportSize({width:844,height:390});
  const continueBounds=await banner.getByRole('button',{name:'Continua',exact:true}).boundingBox();
  expect(continueBounds!.y+continueBounds!.height).toBeLessThanOrEqual(390);
  await banner.getByText('Dalia',{exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('corolla-landscape.png')});
  await banner.getByRole('button',{name:'Continua',exact:true}).click();
  await expect.poll(async()=>(await readBrowserSave(page)).badges).toEqual(['badge_aurora','badge_corolla']);
  expect((await readBrowserSave(page)).player.money).toBe(1150);
  await page.reload();await enterGame(page);
  await page.getByRole('button',{name:'Apri menu di gioco'}).click();
  await page.getByRole('button',{name:'Apri le medaglie'}).click();
  const medalCase=page.getByRole('dialog',{name:'Le tue medaglie'});
  await expect(medalCase).toContainText('Medaglia Corolla');
  await expect(medalCase.locator('[data-badge-id="badge_aurora"]')).toHaveCount(1);
  await expect(medalCase.locator('[data-badge-id="badge_corolla"]')).toHaveCount(1);
  await medalCase.locator('[data-badge-id="badge_corolla"]').scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('two-medals.png')});
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:390,height:844});
  await inspect(13,3,'Dalia');await closeDialogue();
  await expect(page.getByRole('button',{name:'SFIDA',exact:true})).toBeHidden();
  expect((await readBrowserSave(page)).player.money).toBe(1150);
  await walkTo(page,'gym02_petalora.tmj',13,25);
  await expect(page.locator('#current-location')).toHaveText('PETALORA');
  expect(errors).toEqual([]);
});
