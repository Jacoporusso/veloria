import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { collectMapCollision } from '../../src/core/world/map-collision';
import appearances from '../../content/characters/appearances.v2.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

for (const npc of [
  { map: 'borgofonte', tiled: 'bg_borgofonte', id: 'nilo', spawn: 'start', x: 26, y: 17 },
  { map: 'r15_passo_due_luci', tiled: 'r15_passo_due_luci', id: 'r15_nilo', spawn: 'from_cavern', x: 22, y: 12 },
]) test(`Nilo keeps his identity, foot anchor and authored approaches in ${npc.map}`, async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const profile = appearances.profiles.find(item => item.id === 'rival-nilo')! as any;
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nwindow.__niloIdleGame = game;' });
  });
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
    'prologue_complete_seen', 'trainer_r15_nilo_defeated'])];
  save.player = { ...save.player, mapId: `veloria/${npc.map}`, spawnPointId: npc.spawn, x: npc.x, y: npc.y + 1 };
  const tiled = JSON.parse(await readFile(`public/tilemaps/${npc.tiled}.tmj`, 'utf8'));
  const blocked = collectMapCollision(tiled.layers.find((layer: any) => layer.name === 'collision').objects, tiled.width, tiled.height, save.flags);
  // R15 puts Nilo at the northwest end of a solid ledge: its north and east
  // neighbors remain blocked. All four views are exercised in Borgofonte.
  expect(blocked.has(`${npc.x},${npc.y - 1}`)).toBe(npc.map === 'r15_passo_due_luci');
  expect(blocked.has(`${npc.x + 1},${npc.y}`)).toBe(npc.map === 'r15_passo_due_luci');
  for (const mode of ['reduced', 'full']) {
    await page.evaluate(mode => localStorage.setItem('veloria-animation-quality', mode), mode);
    await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
    for (const stop of [
      { x: npc.x, y: npc.y + 1, facing: 'down', button: 'Vai in alto' },
      { x: npc.x - 1, y: npc.y, facing: 'left', button: 'Vai a destra' },
      { x: npc.x, y: npc.y - 1, facing: 'up', button: 'Vai in basso' },
      { x: npc.x + 1, y: npc.y, facing: 'right', button: 'Vai a sinistra' },
    ].filter(stop => npc.map !== 'r15_passo_due_luci' || stop.facing === 'down' || stop.facing === 'left')) {
      await walkTo(page, `${npc.tiled}.tmj`, stop.x, stop.y, { avoidEncounters: true });
      await page.getByRole('button', { name: stop.button, exact: true }).tap();
      const before = await readBrowserSave(page);
      const action = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
      await action.tap(); await expect(page.locator('#dialogue-speaker')).toHaveText('Nilo');
      for (let i = 0; i < 16 && await page.locator('#dialogue-box').isVisible(); i++) await action.tap();
      await expect(page.locator('#dialogue-box')).toBeHidden();
      const state = await page.evaluate(id => {
        const world = (window as any).__niloIdleGame.scene.keys.world;
        const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === id);
        const image = sprite.texture.getSourceImage();
        return { key: sprite.texture.key, facing: sprite.getData('npcFacing'), x: sprite.x, y: sprite.y,
          origin: { x: sprite.originX, y: sprite.originY }, height: sprite.displayHeight,
          uniform: sprite.scaleX === sprite.scaleY, flipped: sprite.flipX || sprite.flipY,
          compact: image instanceof HTMLCanvasElement && Math.max(image.width, image.height) <= 512,
          tweens: world.tweens.getTweensOf(sprite).length,
          abovePlayer: world.mapLayer.list.indexOf(sprite) > world.mapLayer.list.indexOf(world.player) };
      }, npc.id);
      const view = profile.idleViews[stop.facing];
      expect(state).toMatchObject({ key: view.assetKey, facing: stop.facing, x: npc.x * 32 + 16, y: npc.y * 32 + 35,
        origin: view.origin, uniform: true, flipped: false, compact: true, tweens: 0, abovePlayer: stop.y <= npc.y });
      expect(state.height).toBeCloseTo(view.displaySize, 5);
      const after = await readBrowserSave(page);
      for (const key of ['player', 'flags', 'party', 'inventory', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
      for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
        await page.setViewportSize(viewport);
        await page.screenshot({ path: info.outputPath(`nilo-${mode}-${stop.facing}-${viewport.width}.png`) });
      }
    }
  }
  expect(errors).toEqual([]);
});

test.describe('Nilo on high density screens', () => {
  test.use({ deviceScaleFactor: 3, viewport: { width: 390, height: 844 } });
  test('the compact idle remains available after WebGL context restoration', async ({ page }, info) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace(/x: spawn\.x,\s*y: spawn\.y/, 'x: 26, y: 18');
      await route.fulfill({ response, body: body + '\nwindow.__niloRetinaGame = game;' });
    });
    await page.goto('/?previewMap=veloria/borgofonte');
    await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
    await page.evaluate(() => {
      const game = (window as any).__niloRetinaGame;
      const extension = game.renderer.gl.getExtension('WEBGL_lose_context');
      if (!extension) throw new Error('WebGL context loss extension unavailable');
      (window as any).__niloContextExtension = extension;
      extension.loseContext();
    });
    await expect.poll(() => page.evaluate(() => (window as any).__niloRetinaGame.renderer.contextLost)).toBe(true);
    await page.evaluate(() => (window as any).__niloContextExtension.restoreContext());
    await expect.poll(() => page.evaluate(() => (window as any).__niloRetinaGame.renderer.contextLost)).toBe(false);
    await page.evaluate(() => new Promise<void>(resolve => (window as any).__niloRetinaGame.events.once('postrender', resolve)));
    expect(await page.evaluate(() => {
      const world = (window as any).__niloRetinaGame.scene.keys.world;
      const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === 'nilo');
      const source = sprite.texture.source[0];
      return { key: sprite.texture.key, canvas: source.image instanceof HTMLCanvasElement,
        width: source.width, height: source.height, uploaded: Boolean(source.glTexture) };
    })).toEqual({ key: 'veloria-nilo-idle-south-v1', canvas: true, width: 340, height: 510, uploaded: true });
    await page.screenshot({ path: info.outputPath('nilo-retina-after-context-restore.png') });
    expect(errors).toEqual([]);
  });
});
