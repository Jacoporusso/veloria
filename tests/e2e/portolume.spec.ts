import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

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
  await walkTo(page,'portolume.tmj',24,15);await face(page,'Vai a sinistra');await a(page).tap();
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
  await walkTo(page,'portolume.tmj',24,15);await face(page,'Vai a sinistra');await a(page).tap();await finishDialogue(page);
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_portolume_tide_report');
  expect((await readBrowserSave(page)).inventory['old-rod']).toBe(1);
  await page.screenshot({path:info.outputPath('portolume-research.png')});
  expect(errors).toEqual([]);
});
