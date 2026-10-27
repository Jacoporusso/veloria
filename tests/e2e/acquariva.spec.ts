import {expect,test,type Page} from '@playwright/test';
import {enterGame} from './helpers/enter-game';
import {readBrowserSave,seedBrowserSave,walkTo,walkDirection} from './helpers/world-navigation';
import species from '../../content/battle/species.v1.json' with {type:'json'};
import moves from '../../content/battle/moves.v1.json' with {type:'json'};
import router from '../../content/puzzles/gym06_reflections.v1.json' with {type:'json'};
import {createBattleCreature} from '../../src/core/battle/create-creature.ts';

test.use({deviceScaleFactor:1,reducedMotion:'reduce'});
const confirm=(page:Page)=>page.getByRole('button',{name:'Conferma e interagisci',exact:true});
async function dialogue(page:Page){
  for(let i=0;i<24&&await page.locator('#dialogue-box').isVisible();i++)await confirm(page).tap();
  await expect(page.locator('#dialogue-box')).toBeHidden();
}
async function face(page:Page,name:string){await page.getByRole('button',{name,exact:true}).tap();}
async function inspect(page:Page,map:string,x:number,y:number,direction='Vai in alto'){
  await walkTo(page,map,x,y,{avoidEncounters:true});await face(page,direction);await confirm(page).tap();await dialogue(page);
}
async function checkpoint(page:Page,mapId:string,spawnPointId:string,x:number,y:number,flags:string[]){
  await page.goto('/');await enterGame(page);
  const save=await readBrowserSave(page);
  save.flags=[...new Set([...save.flags,'q_starter_selected',...flags])];
  save.player={...save.player,mapId,spawnPointId,x,y};
  await seedBrowserSave(page,save);await page.reload();await enterGame(page);
}

test('Portolume gates its garden exit until Marea; dunes connect the Delta and preserve the return',async({page},info)=>{
  test.setTimeout(240_000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await checkpoint(page,'veloria/portolume','from_r09',15,28,['q_centrale_report','q_portolume_visited']);
  await face(page,'Vai in basso');
  await expect(page.locator('#toast')).toContainText('Medaglia Marea');
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/portolume');
  const save=await readBrowserSave(page);save.flags.push('badge_marea_awarded');save.badges.push('badge_marea');
  save.player.x=15;save.player.y=28;
  await seedBrowserSave(page,save);await page.reload();await enterGame(page);
  await walkDirection(page,'down');
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r09_dune_salmastre');
  await walkTo(page,'r09_dune_salmastre.tmj',39,17,{avoidEncounters:true});
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/d04_delta_specchi');
  await page.reload();await enterGame(page);
  await walkDirection(page,'left');
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r09_dune_salmastre');
  await walkTo(page,'r09_dune_salmastre.tmj',19,0,{avoidEncounters:true});
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/portolume');
  await page.screenshot({path:info.outputPath('portolume-garden-return.png')});
  expect(errors).toEqual([]);
});

test('Delta observations guide the player to Acquariva; reports and side kit award once',async({page},info)=>{
  test.setTimeout(360_000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await checkpoint(page,'veloria/d04_delta_specchi','from_r09',1,18,['badge_marea_awarded']);
  await inspect(page,'d04_delta_specchi.tmj',12,18,'Vai a destra');
  await expect.poll(async()=>(await readBrowserSave(page)).flags).not.toContain('q_delta_report');
  // Use a different order from the route description, then reload halfway through.
  await inspect(page,'d04_delta_specchi.tmj',19,23,'Vai in basso');
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_delta_nursery_read');
  await inspect(page,'d04_delta_specchi.tmj',28,6,'Vai in basso');
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_delta_reeds_read');
  await page.reload();await enterGame(page);
  await inspect(page,'d04_delta_specchi.tmj',12,6,'Vai in basso');
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_delta_flow_read');
  const before=await readBrowserSave(page);
  await inspect(page,'d04_delta_specchi.tmj',12,18,'Vai a destra');
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_delta_report');
  expect((await readBrowserSave(page)).player.money).toBe(before.player.money+350);
  expect((await readBrowserSave(page)).inventory['poke-ball']).toBe((before.inventory['poke-ball']??0)+3);
  await inspect(page,'d04_delta_specchi.tmj',12,18,'Vai a destra');
  expect((await readBrowserSave(page)).player.money).toBe(before.player.money+350);
  await walkTo(page,'d04_delta_specchi.tmj',39,7,{avoidEncounters:true});
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r10_sentiero_canne');
  const antidotes=(await readBrowserSave(page)).inventory.antidote??0;
  await inspect(page,'r10_sentiero_canne.tmj',31,18,'Vai in basso');
  await expect.poll(async()=>(await readBrowserSave(page)).inventory.antidote).toBe(antidotes+2);
  await page.reload();await enterGame(page);
  // Collected props disappear; walk onto the cleared landing instead of turning
  // into that walkable tile and planning the next route during the movement tween.
  await walkTo(page,'r10_sentiero_canne.tmj',31,19,{avoidEncounters:true});
  await confirm(page).tap();
  expect((await readBrowserSave(page)).inventory.antidote).toBe(antidotes+2);
  await walkTo(page,'r10_sentiero_canne.tmj',39,5,{avoidEncounters:true});
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
  const potions=(await readBrowserSave(page)).inventory.potion??0;
  await inspect(page,'acquariva.tmj',33,14,'Vai a destra');
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_acquariva_report');
  expect((await readBrowserSave(page)).inventory.potion).toBe(potions+2);
  await page.reload();await enterGame(page);
  await inspect(page,'acquariva.tmj',33,14,'Vai a destra');
  expect((await readBrowserSave(page)).inventory.potion).toBe(potions+2);
  await page.screenshot({path:info.outputPath('acquariva-observatory-portrait.png')});
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#game canvas')).toBeVisible();
  await page.screenshot({path:info.outputPath('acquariva-observatory-landscape.png')});
  expect(errors).toEqual([]);
});

test('Selene reflections persist, award Riflesso once and show the original medal emblem',async({page},info)=>{
  test.setTimeout(240_000);
  await page.route('**/src/main.ts*',async route=>{
    const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nglobalThis.__acquarivaGame=game;'});
  });
  await checkpoint(page,'veloria/gym06_acquariva','from_city',15,22,['q_delta_report','q_acquariva_visited','q_acquariva_report']);
  const save=await readBrowserSave(page);
  // Deliberately strong integration checkpoint; this does not verify natural progression balance.
  const creature=createBattleCreature({species:species.species as any,moves:moves.moves as any,speciesId:82,level:55,instanceId:'p6-checkpoint',moveIds:['thunder-shock','spark']});
  const reserve=createBattleCreature({species:species.species as any,moves:moves.moves as any,speciesId:138,level:55,instanceId:'p6-reserve',moveIds:['mud-shot','water-gun']});
  // This fixture checks puzzle/reward persistence, not random confusion outcomes.
  save.rngState=0x12345678;
  save.player.money=500;
  save.party=[creature,reserve].map(member=>({instanceId:member.instanceId,speciesId:member.speciesId,level:55,experience:0,hp:member.hp,maxHp:member.stats.maxHp,moves:member.moves.map(slot=>({id:slot.moveId,pp:slot.pp}))}));
  await seedBrowserSave(page,save);await page.reload();await enterGame(page);
  for(const [index,id] of ['fourth','second','first','third'].entries()){
    const node=router.nodes.find(node=>node.id===id)!;
    await walkTo(page,'gym06_acquariva.tmj',node.x,node.y+1);await face(page,'Vai in alto');
    for (const viewport of [{width:390,height:844},{width:844,height:390}]) {
      await page.setViewportSize(viewport);
      await page.screenshot({path:info.outputPath(`reflection-${id}-${viewport.width}.png`)});
    }
    await confirm(page).tap();
    await expect(page.locator('#dialogue-text')).toContainText('Orientamento:');
    await page.getByRole('button',{name:'RUOTA',exact:true}).tap();
    if(index<3)await page.getByRole('button',{name:'CHIUDI',exact:true}).tap();
    else await dialogue(page);
    if(index===0){await page.reload();await enterGame(page);}
  }
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain(router.solvedFlag);
  await page.screenshot({path:info.outputPath('reflection-room-portrait.png')});
  await page.setViewportSize({width:844,height:390});
  await page.screenshot({path:info.outputPath('reflection-room-landscape.png')});
  await page.setViewportSize({width:390,height:844});
  await walkTo(page,'gym06_acquariva.tmj',16,3);await face(page,'Vai in alto');await confirm(page).tap();
  for(let i=0;i<12&&!await page.getByRole('button',{name:'SFIDA',exact:true}).isVisible();i++)await confirm(page).tap();
  await page.getByRole('button',{name:'SFIDA',exact:true}).tap();
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).__acquarivaGame.scene.keys.battle;
    return scene?.ui?.list.some((item:any) => item.texture?.key === 'veloria-gym06_acquariva-illustrated-v3') ?? false;
  })).toBe(true);
  await page.screenshot({path:info.outputPath('reflection-battle-background.png')});
  async function tapLabel(prefix:string){
    const point=await page.evaluate(prefix=>{
      const scene=(window as any).__acquarivaGame.scene.keys.battle;
      const label=scene.ui.list.find((item:any)=>item.type==='Text'&&item.text.startsWith(prefix));
      if(!label)throw new Error(`Missing battle command ${prefix}`);
      const b=label.getBounds(),c=scene.game.canvas.getBoundingClientRect();
      return{x:c.x+b.centerX*scene.scale.zoom,y:c.y+b.centerY*scene.scale.zoom};
    },prefix);
    await page.touchscreen.tap(point.x,point.y);
  }
  for(let turn=0;turn<45;turn++){
    await expect.poll(async()=>{
      const mode=await page.evaluate(()=>{const s=(window as any).__acquarivaGame.scene.keys.battle;return !s?.sys.isActive()||!s.ui||!s.state?'loading':s.terminalShown?'terminal':s.mode;});
      if(mode==='learning')await tapLabel('Tieni le mosse');
      return mode==='menu'||mode==='party'||mode==='terminal';
    },{timeout:25_000}).toBe(true);
    if(await page.locator('.battle-celebration').isVisible())break;
    const ready=await page.evaluate(()=>{
      const s=(window as any).__acquarivaGame.scene.keys.battle;
      const team=s.state.player;
      const replacement=team.creatures.find((member:any,index:number)=>member.hp>0&&index!==team.activeIndex);
      return{mode:s.mode,terminal:s.terminalShown,active:team.creatures[team.activeIndex].speciesId,replacement:replacement?`${replacement.name} · ${replacement.hp}/`:null};
    });
    if(ready.terminal)break;
    if(ready.mode==='party'){
      expect(ready.replacement).not.toBeNull();await tapLabel(ready.replacement!);continue;
    }
    await tapLabel('LOTTA');await tapLabel(ready.active===82?'Scintilla':'Colpodifango');
  }
  const banner=page.getByRole('dialog',{name:'Medaglia Riflesso conquistata!'});
  await expect(banner).toBeVisible();await expect(banner).toContainText('Selene');
  await expect(banner.locator('[data-badge-id="badge_riflesso"] svg')).toBeVisible();
  await page.screenshot({path:info.outputPath('riflesso-medal-banner.png')});
  await banner.getByRole('button',{name:'Continua',exact:true}).tap();
  await expect.poll(async()=>(await readBrowserSave(page)).badges).toContain('badge_riflesso');
  expect((await readBrowserSave(page)).player.money).toBe(2300);
  await page.reload();await enterGame(page);
  expect((await readBrowserSave(page)).badges.filter(id=>id==='badge_riflesso')).toHaveLength(1);
  await walkTo(page,'gym06_acquariva.tmj',15,23);
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
});

test('Riflesso opens the waterfall shortcut in both cities and both walking returns survive reload',async({page},info)=>{
  test.setTimeout(240_000);
  await checkpoint(page,'veloria/acquariva','from_r11',7,1,['q_delta_report','q_acquariva_report']);
  await face(page,'Vai in alto');await expect(page.locator('#toast')).toContainText('Medaglia Riflesso');
  const save=await readBrowserSave(page);save.flags.push('badge_riflesso_awarded');save.badges.push('badge_riflesso');save.player.x=7;save.player.y=1;
  await seedBrowserSave(page,save);await page.reload();await enterGame(page);
  await walkDirection(page,'up');
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r11_via_cascate');
  await walkTo(page,'r11_via_cascate.tmj',20,0,{avoidEncounters:true});
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');
  await page.reload();await enterGame(page);
  await walkDirection(page,'down');
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r11_via_cascate');
  await walkTo(page,'r11_via_cascate.tmj',17,29,{avoidEncounters:true});
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
  await page.screenshot({path:info.outputPath('acquariva-waterfall-return.png')});
});
