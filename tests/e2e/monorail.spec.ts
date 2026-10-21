import { expect, test } from '@playwright/test';
import { prepareMonorailTraveler, stationArrival, travelResources } from './helpers/monorail';
import { readBrowserSave, seedBrowserSave, walkDirection } from './helpers/world-navigation';
import { enterGame } from './helpers/enter-game';

test.use({ deviceScaleFactor: 3, reducedMotion: 'reduce' });

test('Acquariva terminal faces left after reload and returns to a visited city without spending resources',async({page},info)=>{
  test.setTimeout(90_000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await prepareMonorailTraveler(page,true,['vetracielo','acquariva']);
  const before=travelResources(await readBrowserSave(page));
  await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();
  await page.getByRole('button',{name:'Acquariva',exact:true}).tap();
  const {station,spawn}=await stationArrival('acquariva');
  await expect.poll(async()=>(await readBrowserSave(page)).player).toMatchObject({mapId:station.mapId,spawnPointId:spawn.id,x:spawn.x,y:spawn.y});
  await expect(page.locator('#game-loading')).toBeHidden();
  await page.reload();await enterGame(page);
  await page.setViewportSize({width:844,height:390});
  // The arrival faces the terminal on its left, unlike the older north-facing stations.
  await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();
  await expect(page.getByRole('button',{name:'Vetracielo',exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('acquariva-station-landscape.png')});
  await page.getByRole('button',{name:'Vetracielo',exact:true}).tap();
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');
  expect(travelResources(await readBrowserSave(page))).toEqual(before);
  expect(errors).toEqual([]);
});

test('Circuito gates the station; only visited cities are listed and cancel releases movement', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await prepareMonorailTraveler(page, false, ['brumalta', 'vetracielo']);
  await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
  await expect(page.locator('#dialogue-text')).toContainText('Medaglia Circuito');
  await expect(page.locator('#starter-choices')).toBeHidden();
  await page.getByRole('button', { name: 'Annulla', exact: true }).tap();

  const unlocked = await readBrowserSave(page);
  unlocked.flags.push('badge_circuito_awarded'); unlocked.badges.push('badge_circuito');
  await seedBrowserSave(page, unlocked); await page.reload(); await enterGame(page);
  // Holding the interaction key must not board the first destination on release.
  await page.keyboard.down('Space');
  await expect(page.getByRole('button', { name: 'Brumalta', exact: true })).toBeVisible();
  await page.keyboard.up('Space');
  await expect(page.getByRole('button', { name: 'Brumalta', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Petalora', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Ferraluce', exact: true })).toBeHidden();
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');
  await page.keyboard.press('Escape');
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await expect(page.locator('#starter-choices')).toBeHidden();
  await walkDirection(page, 'down');
  await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
  await expect(page.getByRole('button', { name: 'Brumalta', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'NON PARTIRE', exact: true }).tap();
  expect(errors).toEqual([]);
});

test('four visited monorail stations persist with keyboard boarding and both phone orientations', async ({page},info)=>{
  // CI 39594789385 reaches all four stations and the final title-screen reload at 120s.
  // Keep both orientations, keyboard boarding, resource invariance and persistence checks.
  test.setTimeout(process.env.CI ? 180_000 : 90_000);
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await prepareMonorailTraveler(page);
  const before = travelResources(await readBrowserSave(page));
  for (const id of ['brumalta', 'petalora', 'ferraluce', 'vetracielo']) {
    await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
    const { station, spawn } = await stationArrival(id);
    const destination = page.getByRole('button', { name: station.name, exact: true });
    await expect(destination.locator('.service-option__icon--transit')).toBeVisible();
    if (id === 'brumalta') {
      for (const [width, height] of [[390, 844], [844, 390]]) {
        await page.setViewportSize({ width, height });
        for (const button of await page.locator('#starter-choices button').all()) {
          const box = (await button.boundingBox())!;
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.y + box.height).toBeLessThanOrEqual(height);
        }
        await page.screenshot({ path: info.outputPath(`monorail-menu-${width}.png`) });
      }
      await destination.focus(); await page.keyboard.press('Enter');
    } else await destination.tap();
    await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({ mapId: station.mapId, spawnPointId: spawn.id, x: spawn.x, y: spawn.y });
    await expect(page.locator('#game-loading')).toBeHidden();
    expect(travelResources(await readBrowserSave(page))).toEqual(before);
    if (id === 'vetracielo') await expect(page.locator('#toast')).not.toHaveClass(/visible/);
    await page.screenshot({ path: info.outputPath(`station-${id}.png`) });
  }
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');
  expect(travelResources(await readBrowserSave(page))).toEqual(before);
  expect(errors).toEqual([]);
});

test('a failed destination load keeps the origin checkpoint and the station can retry', async ({ page }) => {
  await prepareMonorailTraveler(page);
  const original = await readBrowserSave(page);
  const failedAsset = '**/assets/sprites/veloria-ferraluce-energy-hall-v1.webp';
  await page.route(failedAsset, route => route.abort());
  await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
  await page.getByRole('button', { name: 'Ferraluce', exact: true }).tap();
  await expect(page.locator('#toast')).toContainText('La mappa non è disponibile');
  await expect(page.locator('#game-loading')).toBeHidden();
  expect((await readBrowserSave(page)).player).toEqual(original.player);
  expect(travelResources(await readBrowserSave(page))).toEqual(travelResources(original));
  await page.unroute(failedAsset);
  await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
  await page.getByRole('button', { name: 'Ferraluce', exact: true }).tap();
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/ferraluce');
  expect(travelResources(await readBrowserSave(page))).toEqual(travelResources(original));
});
