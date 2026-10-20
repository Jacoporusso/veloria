import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave } from './helpers/world-navigation';

// Isolated Tiled geometry exercises the real world scene; it does not open P7 early.
async function mountIce(page: Page, options: { wall?: boolean; exit?: boolean } = {}) {
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nglobalThis.iceGame = game;` });
  });
  await page.route('**/tilemaps/gym06_acquariva.tmj*', async route => {
    const response = await route.fetch();
    const map = await response.json();
    map.layers.push({ id: 90, name: 'movement_surfaces', type: 'objectgroup', visible: false, opacity: 1,
      objects: [{id:9001,name:'Ice fixture',x:15*32,y:(options.exit?21:18)*32,width:32,height:(options.exit?2:3)*32,
        properties:[{name:'surface',type:'string',value:'ice'}]}] });
    if(options.wall) map.layers.find((layer:any)=>layer.name==='collision').objects.push({id:9002,x:15*32,y:17*32,width:32,height:32});
    await route.fulfill({response, json:map});
  });
  await page.goto('/');
  await enterGame(page);
  await page.evaluate(async exit => {
    const {newGameSave,saveGame}=await import('/src/persistence/save-store.ts' as string);
    const {selectStarter}=await import('/src/core/party/select-starter.ts' as string);
    const save=selectStarter(newGameSave(),4,'ice-starter');
    save.flags.push('intro_completed');
    save.player={...save.player,mapId:'veloria/gym06_acquariva',spawnPointId:'from_city',x:15,y:exit?20:22};
    await saveGame(save);
  },Boolean(options.exit));
  await page.reload();await enterGame(page);
  await expect.poll(()=>page.evaluate(()=>(window as any).iceGame?.scene.keys.world?.renderedMap.iceTiles.size)).toBe(options.exit?2:3);
}

async function stoppedAt(page:Page,x:number,y:number){
  await expect.poll(()=>page.evaluate(()=>{
    const world=(window as any).iceGame.scene.keys.world;
    return {x:world.playerTile.x,y:world.playerTile.y,moving:world.moving,sliding:world.slidingDirection};
  })).toEqual({x,y,moving:false,sliding:null});
}

test('one touch slides to dry ground, ignores a turn on ice and works after rotation',async({page})=>{
  await mountIce(page);
  const up=page.getByRole('button',{name:'Vai in alto',exact:true});
  await up.tap();await stoppedAt(page,15,21);
  await up.tap();
  await page.getByRole('button',{name:'Vai a sinistra',exact:true}).tap();
  await stoppedAt(page,15,17);
  await page.setViewportSize({width:844,height:390});
  await page.getByRole('button',{name:'Vai in basso',exact:true}).tap();
  await stoppedAt(page,15,21);
  expect((await readBrowserSave(page)).player).toMatchObject({x:15,y:21});
});

test('a wall stops the slide, allows a new direction and persists the landing',async({page})=>{
  await mountIce(page,{wall:true});
  const up=page.getByRole('button',{name:'Vai in alto',exact:true});
  await up.tap();await stoppedAt(page,15,21);await up.tap();await stoppedAt(page,15,18);
  await page.getByRole('button',{name:'Vai a destra',exact:true}).tap();await stoppedAt(page,16,18);
  await expect.poll(async()=> (await readBrowserSave(page)).player.x).toBe(16);
  await page.reload();await enterGame(page);await stoppedAt(page,16,18);
});

test('a slide through a doorway changes maps once and releases its movement lock',async({page})=>{
  await mountIce(page,{exit:true});
  await page.getByRole('button',{name:'Vai in basso',exact:true}).tap();
  await expect.poll(async()=> (await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
  await expect(page.locator('#game-loading')).toBeHidden();
  await stoppedAt(page,17,8);
  await page.getByRole('button',{name:'Vai in basso',exact:true}).tap();await stoppedAt(page,17,9);
});

test('reload during a slide restores the last valid landing instead of a turn halfway across ice',async({page})=>{
  await mountIce(page);
  const up=page.getByRole('button',{name:'Vai in alto',exact:true});
  await up.tap();await stoppedAt(page,15,21);
  await expect.poll(async()=> (await readBrowserSave(page)).player.y).toBe(21);
  await up.tap();
  const interrupted=await page.evaluate(()=>{
    const world=(window as any).iceGame.scene.keys.world;
    world.scene.pause();
    return {y:world.playerTile.y,sliding:world.slidingDirection};
  });
  expect(interrupted.sliding).toBe('up');expect(interrupted.y).toBeLessThan(21);expect(interrupted.y).toBeGreaterThan(17);
  expect((await readBrowserSave(page)).player).toMatchObject({x:15,y:21});
  await page.reload();await enterGame(page);await stoppedAt(page,15,21);
  await up.tap();await stoppedAt(page,15,17);
});
