import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import appearances from '../../content/characters/appearances.v2.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

const profile = appearances.profiles.find(profile => profile.id === 'gym-leader-nerea-portolume')!;
const views = profile.idleViews!;
expect(Object.keys(views).sort()).toEqual(['down', 'left', 'right', 'up']);
expect(new Set(Object.values(views).map(view => view.assetKey)).size).toBe(4);
const action = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Conferma e interagisci', exact: true });

for (const reducedMotion of ['reduce', 'no-preference'] as const) test.describe(`Nerea directional idle: ${reducedMotion}`, () => {
  test.use({ deviceScaleFactor: 1, reducedMotion });

  test('Nerea uses calibrated directional idle views during real interactions', async ({ page }, info) => {
    test.setTimeout(process.env.CI ? 180_000 : 120_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\nwindow.__nereaIdleGame = game;' });
    });
    await page.addInitScript(mode => localStorage.setItem('veloria-animation-quality', mode), reducedMotion === 'reduce' ? 'reduced' : 'full');
    await page.goto('/');
    await enterGame(page);

    const save = await readBrowserSave(page);
    save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
      'prologue_complete_seen', 'q_portolume_tide_report', 'gym05_basin_balanced', 'gym05_sluice_open', 'gym05_tide_stable', 'trainer_gym05_nerea_defeated', 'badge_marea_awarded'])];
    save.player = { ...save.player, mapId: 'veloria/gym05_portolume', spawnPointId: 'from_portolume', x: 15, y: 22 };
    await seedBrowserSave(page, save);
    await page.reload();
    await enterGame(page);

    const map = JSON.parse(await readFile(new URL('../../public/tilemaps/gym05_portolume.tmj', import.meta.url), 'utf8'));
    const northApproachCenter = { x: 16 * 32 + 16, y: 2 * 32 + 16 };
    const northApproachBlocked = map.layers.find((layer: any) => layer.name === 'collision').objects.some((object: any) =>
      object.x <= northApproachCenter.x && northApproachCenter.x < object.x + object.width &&
      object.y <= northApproachCenter.y && northApproachCenter.y < object.y + object.height);
    expect(northApproachBlocked, 'north approach tile (16,2) remains blocked by existing gym geometry').toBe(true);

    const stops = [
      { x: 16, y: 4, pose: 'down', button: 'Vai in alto' },
      { x: 15, y: 3, pose: 'left', button: 'Vai a destra' },
      { x: 17, y: 3, pose: 'right', button: 'Vai a sinistra' },
    ] as const;
    for (const stop of stops) {
      await walkTo(page, 'gym05_portolume.tmj', stop.x, stop.y);
      await page.getByRole('button', { name: stop.button, exact: true }).tap();
      const before = await readBrowserSave(page);
      await action(page).tap();
      await expect(page.locator('#dialogue-speaker')).toHaveText('Nerea');
      for (let i = 0; i < 20 && await page.locator('#dialogue-box').isVisible(); i++) await action(page).tap();
      await expect(page.locator('#dialogue-box')).toBeHidden();

      const state = await page.evaluate(() => {
        const world = (window as any).__nereaIdleGame.scene.keys.world;
        const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === 'nerea_gym');
        const surface = sprite.texture.getSourceImage();
        return {
          key: sprite.texture.key, facing: sprite.getData('npcFacing'), x: sprite.x, y: sprite.y,
          origin: { x: sprite.originX, y: sprite.originY }, width: sprite.displayWidth, height: sprite.displayHeight,
          scaleX: sprite.scaleX, scaleY: sprite.scaleY, flipped: sprite.flipX || sprite.flipY,
          surface: { width: surface.width, height: surface.height, canvas: surface instanceof HTMLCanvasElement },
          frame: { width: sprite.frame.width, height: sprite.frame.height },
          tweens: world.tweens.getTweensOf(sprite).length,
          abovePlayer: world.mapLayer.list.indexOf(sprite) > world.mapLayer.list.indexOf(world.player),
        };
      });
      const view = views[stop.pose];
      expect(state).toMatchObject({ key: view.assetKey, facing: stop.pose, x: 16 * 32 + 16, y: 3 * 32 + 35,
        origin: view.origin, flipped: false, tweens: 0, abovePlayer: stop.y <= 3,
        surface: { width: 512, height: 512, canvas: true }, frame: { width: 340, height: 510 } });
      expect(state.height).toBeCloseTo(view.displaySize, 5);
      expect(state.width / state.height).toBeCloseTo(2 / 3, 5);
      expect(state.scaleX).toBeCloseTo(state.scaleY, 8);

      const after = await readBrowserSave(page);
      for (const key of ['player', 'rngState', 'party', 'inventory', 'flags'] as const) expect(after[key]).toEqual(before[key]);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: info.outputPath(`nerea-${reducedMotion}-${stop.pose}-portrait.png`) });
      await page.setViewportSize({ width: 844, height: 390 });
      await page.screenshot({ path: info.outputPath(`nerea-${reducedMotion}-${stop.pose}-landscape.png`) });
      await page.setViewportSize({ width: 390, height: 844 });
    }
    const beforeReload = await readBrowserSave(page);
    await page.reload();
    await enterGame(page);
    const defaultPose = await page.evaluate(() => {
      const world = (window as any).__nereaIdleGame.scene.keys.world;
      const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === 'nerea_gym');
      return { key: sprite.texture.key, facing: sprite.getData('npcFacing'),
        origin: { x: sprite.originX, y: sprite.originY }, flip: sprite.flipX || sprite.flipY,
        height: sprite.displayHeight, tweens: world.tweens.getTweensOf(sprite).length };
    });
    expect(defaultPose).toMatchObject({ key: views.down.assetKey, facing: 'down', origin: views.down.origin, flip: false, tweens: 0 });
    expect(defaultPose.height).toBeCloseTo(views.down.displaySize, 5);
    const afterReload = await readBrowserSave(page);
    for (const key of ['player', 'rngState', 'party', 'inventory', 'flags'] as const) expect(afterReload[key]).toEqual(beforeReload[key]);
    expect(errors).toEqual([]);
  });
});
