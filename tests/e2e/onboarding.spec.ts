import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { enterGame } from './helpers/enter-game';

async function saved(page: Page): Promise<any> {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('saves', 'readonly');
      const value = tx.objectStore('saves').get('main');
      value.onsuccess = () => resolve(value.result ?? null);
      tx.oncomplete = () => db.close();
    };
  }));
}

// Navigate authored collision data using only the game's visible movement controls.
async function walk(page: Page, mapFile: string, targetX: number, targetY: number) {
  const map = JSON.parse(await readFile(new URL('../../public/tilemaps/' + mapFile, import.meta.url), 'utf8'));
  const blocked = new Set<string>();
  for (const object of map.layers.find((layer: any) => layer.name === 'collision').objects) {
    for (let y = Math.floor(object.y / 32); y < Math.ceil((object.y + object.height) / 32); y++) {
      for (let x = Math.floor(object.x / 32); x < Math.ceil((object.x + object.width) / 32); x++) blocked.add(x + ',' + y);
    }
  }
  for (const object of map.layers.find((layer: any) => layer.name === 'triggers').objects) {
    const props = Object.fromEntries((object.properties ?? []).map((prop: any) => [prop.name, prop.value]));
    if (props.kind !== 'map-exit') continue;
    for (let y = Math.floor(object.y / 32); y < Math.ceil((object.y + object.height) / 32); y++) {
      for (let x = Math.floor(object.x / 32); x < Math.ceil((object.x + object.width) / 32); x++) {
        if (x !== targetX || y !== targetY) blocked.add(x + ',' + y);
      }
    }
  }
  const current = (await saved(page)).player;
  const queue: Array<{ x: number; y: number; path: string[] }> = [{ x: current.x, y: current.y, path: [] }];
  const seen = new Set<string>([current.x + ',' + current.y]);
  let route: string[] | undefined;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const node = queue[cursor];
    if (node.x === targetX && node.y === targetY) { route = node.path; break; }
    for (const [dx,dy,label] of [[0,-1,'Vai in alto'],[0,1,'Vai in basso'],[-1,0,'Vai a sinistra'],[1,0,'Vai a destra']] as const) {
      const x=node.x+dx,y=node.y+dy,key=x+','+y;
      if(x<0||y<0||x>=map.width||y>=map.height||blocked.has(key)||seen.has(key))continue;
      seen.add(key);queue.push({x,y,path:[...node.path,label]});
    }
  }
  if(!route)throw Error('No route to the authored objective');
  for(const name of route){
    const before=(await saved(page)).player;
    await page.getByRole('button',{name,exact:true}).tap();
    await expect.poll(async()=>{const p=(await saved(page)).player;return p.mapId+'|'+p.x+','+p.y}).not.toBe(before.mapId+'|'+before.x+','+before.y);
    await expect(page.locator('#game-loading')).toBeHidden({timeout:30000});
  }
}

test('a named trainer starts the story, chooses one starter and resumes the same adventure', async ({page},testInfo)=>{
  test.setTimeout(120000);
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Nuova partita',exact:true})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('title-screen.png')});
  await page.getByRole('button',{name:'Nuova partita',exact:true}).click();
  await page.getByRole('textbox',{name:'Nome allenatore'}).fill('                 ');
  await page.getByRole('button',{name:'Inizia il viaggio'}).click();
  await expect(page.locator('.start-screen__form-error')).toBeVisible();
  await page.getByRole('textbox',{name:'Nome allenatore'}).fill('Aurora');
  await page.screenshot({path:testInfo.outputPath('trainer-name.png')});
  await page.getByRole('button',{name:'Inizia il viaggio'}).click();
  await expect(page.locator('#dialogue-text')).toContainText('Aurora');
  await page.screenshot({path:testInfo.outputPath('opening-story.png')});
  await enterGame(page);
  expect((await saved(page)).player.name).toBe('Aurora');
  expect((await saved(page)).party).toHaveLength(0);
  const saveId=(await saved(page)).saveId;
  await walk(page,'bg_borgofonte.tmj',20,30);
  await expect(page.locator('#current-location')).toHaveText('LABORATORIO DI ELIA');
  await walk(page,'borgofonte_lab.tmj',12,8);
  await expect(page.locator('#interaction-prompt')).toContainText('Elia');
  await page.locator('#interaction-prompt').tap();
  for(let step=0;step<8&&!await page.locator('#starter-choices').isVisible();step++)await page.getByRole('button',{name:'Conferma e interagisci'}).tap();
  for(const name of ['Pikachu','Charmander','Squirtle','Bulbasaur']) {
    const button = page.getByRole('button',{name,exact:true});
    await expect(button).toBeVisible();
    expect(await button.locator('.creature-portrait').evaluate(async element => {
      const url = getComputedStyle(element).backgroundImage.slice(5, -2);
      const image = new Image(); image.src = url; await image.decode();
      return image.naturalWidth > 0 && !element.classList.contains('creature-portrait-pending');
    })).toBe(true);
  }
  await page.screenshot({path:testInfo.outputPath('starter-selection.png')});
  await page.getByRole('button',{name:'Bulbasaur',exact:true}).tap();
  await expect.poll(async()=>(await saved(page)).party?.[0]?.speciesId).toBe(1);
  await page.reload();
  await expect(page.getByRole('button',{name:'Continua partita'})).toBeVisible();
  await expect(page.locator('.start-screen__save-card')).toContainText('Aurora');
  await page.getByRole('button',{name:'Nuova partita',exact:true}).click();
  await expect(page.getByText('Iniziando un nuovo viaggio', {exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Torna al titolo'}).click();
  expect((await saved(page)).saveId).toBe(saveId);
  await enterGame(page);
  expect((await saved(page)).player.name).toBe('Aurora');
  expect((await saved(page)).party).toHaveLength(1);
  expect((await saved(page)).saveId).toBe(saveId);
  await page.getByRole('button',{name:'Vai in alto'}).tap(); // Face Elia after reloading.
  await page.getByRole('button',{name:'Conferma e interagisci'}).tap();
  for (let step=0; step<10 && await page.locator('#dialogue-box').isVisible(); step++) {
    await page.getByRole('button',{name:'Conferma e interagisci'}).tap();
  }
  await expect.poll(async () => (await saved(page)).flags).toContain('q_research_sample_received');
  await walk(page,'borgofonte_lab.tmj',11,14);
  await expect(page.locator('#current-location')).toHaveText('BORGOFONTE');
  // Follow the visible street directly north on x23, beside the former one-tile trigger.
  await walk(page,'bg_borgofonte.tmj',23,7);
  await expect(page.locator('#current-location')).toHaveText("SENTIERO DELL'ALBA");
  expect((await saved(page)).party).toHaveLength(1);
  await page.screenshot({ path: testInfo.outputPath('first-route-after-starter.png') });
});


test('storage failure keeps new-game recovery and prevents leaving an unsaved adventure', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Nuova partita', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome allenatore' }).fill('Aurora');
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    const setItem = Storage.prototype.setItem;
    IDBObjectStore.prototype.put = function () { throw new DOMException('Test storage full', 'QuotaExceededError'); };
    Storage.prototype.setItem = function () { throw new DOMException('Test storage full', 'QuotaExceededError'); };
    (window as any).restoreStorage = () => { IDBObjectStore.prototype.put = put; Storage.prototype.setItem = setItem; };
  });
  await page.getByRole('button', { name: 'Inizia il viaggio' }).click();
  await expect(page.getByRole('alert')).toContainText('Non riesco a salvare');
  await expect(page.getByRole('textbox', { name: 'Nome allenatore' })).toHaveValue('Aurora');
  await expect(page.locator('#game canvas')).toHaveCount(0);
  await page.evaluate(() => (window as any).restoreStorage());
  await page.getByRole('button', { name: 'Inizia il viaggio' }).click();
  await expect(page.locator('#game canvas')).toBeVisible({ timeout: 30000 });
  await enterGame(page);
  await expect.poll(async () => (await saved(page)).flags.includes('intro_completed')).toBe(true);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    const setItem = Storage.prototype.setItem;
    IDBObjectStore.prototype.put = function () { throw new DOMException('Test storage full', 'QuotaExceededError'); };
    Storage.prototype.setItem = function () { throw new DOMException('Test storage full', 'QuotaExceededError'); };
    (window as any).restoreStorage = () => { IDBObjectStore.prototype.put = put; Storage.prototype.setItem = setItem; };
  });
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Salva e torna al titolo' }).click();
  await expect(page.locator('#toast')).toHaveText('Salvataggio non riuscito.');
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect(page.locator('.start-screen')).toHaveCount(0);
  await page.evaluate(() => (window as any).restoreStorage());
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Salva e torna al titolo' }).click();
  await expect(page.getByRole('button', { name: 'Continua partita' })).toBeVisible();
  expect((await saved(page)).player.name).toBe('Aurora');
});
