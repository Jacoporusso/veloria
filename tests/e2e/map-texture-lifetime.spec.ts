import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

test('walking out of the lab releases exclusive textures and returning rebuilds calibrated idle surfaces', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nwindow.__textureGame = game;' });
  });
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen', 'prologue_complete_seen'])];
  save.player = { ...save.player, mapId: 'veloria/borgofonte_lab', spawnPointId: 'from_village', x: 12, y: 13 };
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
  await page.evaluate(() => {
    const textures = (window as any).__textureGame.textures;
    (window as any).__sharedNpcTexture = textures.get('veloria-npcs-v3');
    (window as any).__retiredEliaTexture = textures.get('veloria-elia-idle-south-v1');
  });
  await walkDirection(page, 'down');
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte');
  expect(await page.evaluate(() => {
    const textures = (window as any).__textureGame.textures;
    return { oldRoom: textures.exists('borgofonte-lab-interior-v2'), oldIdle: textures.exists('veloria-elia-idle-south-v1'),
      retiredDestroyed: (window as any).__retiredEliaTexture.source.length === 0,
      sharedRetained: textures.get('veloria-npcs-v3') === (window as any).__sharedNpcTexture,
      town: textures.exists('veloria-borgofonte-illustrated-v3'), seamless: textures.exists('veloria-ground-hd-v5-seamless') };
  })).toEqual({ oldRoom: false, oldIdle: false, retiredDestroyed: true, sharedRetained: true, town: true, seamless: true });
  await walkTo(page, 'bg_borgofonte.tmj', 21, 26); await walkDirection(page, 'up');
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte_lab');
  expect(await page.evaluate(() => {
    const textures = (window as any).__textureGame.textures;
    const elia = textures.get('veloria-elia-idle-south-v1');
    const image = elia.getSourceImage();
    return { town: textures.exists('veloria-borgofonte-illustrated-v3'), seamless: textures.exists('veloria-ground-hd-v5-seamless'),
      sharedRetained: textures.get('veloria-npcs-v3') === (window as any).__sharedNpcTexture,
      rebuilt: elia !== (window as any).__retiredEliaTexture, compact: image instanceof HTMLCanvasElement,
      width: image.width, height: image.height };
  })).toEqual({ town: false, seamless: false, sharedRetained: true, rebuilt: true, compact: true, width: 340, height: 510 });
  await walkTo(page, 'borgofonte_lab.tmj', 12, 8);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Professoressa Elia');
  await page.screenshot({ path: info.outputPath('elia-after-texture-reload.png') });
  expect(errors).toEqual([]);
});
