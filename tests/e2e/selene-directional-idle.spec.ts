import { expect, test } from '@playwright/test';
import appearances from '../../content/characters/appearances.v2.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

const profile = appearances.profiles.find(item => item.id === 'gym-leader-selene')!;
const views = profile.idleViews!;
const action = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
const directions = { up: 'Vai in alto', down: 'Vai in basso', left: 'Vai a sinistra', right: 'Vai a destra' } as const;
const orientations = [
  { name: 'portrait', width: 390, height: 844 },
  { name: 'landscape', width: 844, height: 390 },
] as const;
const seleneTile = { x: 16, y: 2 };

for (const reducedMotion of ['reduce', 'no-preference'] as const) test.describe(`Selene directional idle: ${reducedMotion}`, () => {
  test.use({ deviceScaleFactor: 1, reducedMotion });

  test('Selene uses calibrated views at reachable approaches without changing saved state', async ({ page }, info) => {
    test.setTimeout(process.env.CI ? 180_000 : 120_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\nwindow.__seleneIdleGame = game;' });
    });
    await page.addInitScript(mode => localStorage.setItem('veloria-animation-quality', mode), reducedMotion === 'reduce' ? 'reduced' : 'full');
    await page.setViewportSize({ width: orientations[0].width, height: orientations[0].height });
    await page.goto('/');
    await enterGame(page);

    const catalogAssetKeys = new Set(appearances.assets.map(asset => asset.key));
    expect(Object.keys(views).sort()).toEqual(['down', 'left', 'right', 'up']);
    expect(new Set(Object.values(views).map(view => view.assetKey)).size).toBe(4);
    for (const view of Object.values(views)) {
      expect(catalogAssetKeys.has(view.assetKey)).toBe(true);
      expect(view.displaySize).toBeGreaterThan(0);
      expect(view.origin.x).toBeGreaterThanOrEqual(0);
      expect(view.origin.x).toBeLessThanOrEqual(1);
      expect(view.origin.y).toBeGreaterThanOrEqual(0);
      expect(view.origin.y).toBeLessThanOrEqual(1);
    }

    const save = await readBrowserSave(page);
    save.flags = [...new Set([...save.flags,
      'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen', 'prologue_complete_seen',
      'q_acquariva_report', 'gym06_reflections_aligned', 'trainer_gym06_selene_defeated', 'badge_riflesso_awarded'])];
    save.player = { ...save.player, mapId: 'veloria/gym06_acquariva', spawnPointId: 'from_city', x: 15, y: 22 };
    await seedBrowserSave(page, save);
    await page.reload();
    await enterGame(page);
    await expect(page.locator('#game canvas')).toBeVisible();

    // Real collision-map routes from the gym entrance: north is blocked by a
    // continuous wall; south, west and east are independently reachable.
    const stops = [
      { x: 16, y: 3, moveToward: 'up', facing: 'down', name: 'south' },
      { x: 15, y: 2, moveToward: 'right', facing: 'left', name: 'west' },
      { x: 17, y: 2, moveToward: 'left', facing: 'right', name: 'east' },
    ] as const;

    for (const stop of stops) {
      await walkTo(page, 'gym06_acquariva.tmj', stop.x, stop.y, { avoidEncounters: true });
      await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
        mapId: 'veloria/gym06_acquariva', x: stop.x, y: stop.y,
      });
      await page.getByRole('button', { name: directions[stop.moveToward], exact: true }).tap();
      await expect(page.locator('#interaction-prompt')).toContainText('Selene');
      const before = await readBrowserSave(page);
      await action(page).tap();
      await expect(page.locator('#dialogue-speaker')).toHaveText('Selene');
      for (let step = 0; step < 20 && await page.locator('#dialogue-box').isVisible(); step += 1) await action(page).tap();
      await expect(page.locator('#dialogue-box')).toBeHidden();
      const after = await readBrowserSave(page);
      for (const key of ['player', 'rngState', 'party', 'inventory', 'flags'] as const) expect(after[key]).toEqual(before[key]);

      const state = await page.evaluate(() => {
        const world = (window as any).__seleneIdleGame.scene.keys.world;
        const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === 'selene_gym');
        if (!sprite) throw new Error('Selene sprite is missing from the world map layer.');
        const surface = sprite.texture.getSourceImage();
        return {
          key: sprite.texture.key,
          facing: sprite.getData('npcFacing'),
          directionalIdle: sprite.getData('directionalIdle'),
          x: sprite.x,
          y: sprite.y,
          origin: { x: sprite.originX, y: sprite.originY },
          width: sprite.displayWidth,
          height: sprite.displayHeight,
          scaleX: sprite.scaleX,
          scaleY: sprite.scaleY,
          flipped: sprite.flipX || sprite.flipY,
          surface: { width: surface.width, height: surface.height, canvas: surface instanceof HTMLCanvasElement },
          frame: { width: sprite.frame.width, height: sprite.frame.height },
          tweens: world.tweens.getTweensOf(sprite).length,
          abovePlayer: world.mapLayer.list.indexOf(sprite) > world.mapLayer.list.indexOf(world.player),
        };
      });
      const view = views[stop.facing];
      expect(state).toMatchObject({
        key: view.assetKey, facing: stop.facing, directionalIdle: true,
        x: seleneTile.x * 32 + 16, y: seleneTile.y * 32 + 35,
        origin: view.origin, flipped: false, tweens: 0,
        abovePlayer: stop.y <= seleneTile.y,
        surface: { width: 512, height: 512, canvas: true },
        frame: { width: 340, height: 510 },
      });
      expect(state.height).toBeCloseTo(view.displaySize, 5);
      expect(state.width / state.height).toBeCloseTo(2 / 3, 5);
      expect(state.scaleX).toBeCloseTo(state.scaleY, 8);

      for (const orientation of orientations) {
        await page.setViewportSize({ width: orientation.width, height: orientation.height });
        await expect(page.locator('#game canvas')).toBeVisible();
        await page.screenshot({ path: info.outputPath(`selene-${reducedMotion}-${stop.name}-${orientation.name}.png`) });
        const afterResize = await readBrowserSave(page);
        for (const key of ['player', 'rngState', 'party', 'inventory', 'flags'] as const) expect(afterResize[key]).toEqual(after[key]);
      }
      await page.setViewportSize({ width: orientations[0].width, height: orientations[0].height });
    }

    const beforeReload = await readBrowserSave(page);
    await page.reload();
    await enterGame(page);
    const defaultPose = await page.evaluate(() => {
      const world = (window as any).__seleneIdleGame.scene.keys.world;
      const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === 'selene_gym');
      return {
        key: sprite.texture.key,
        facing: sprite.getData('npcFacing'),
        origin: { x: sprite.originX, y: sprite.originY },
        flip: sprite.flipX || sprite.flipY,
        height: sprite.displayHeight,
        tweens: world.tweens.getTweensOf(sprite).length,
      };
    });
    expect(defaultPose).toMatchObject({ key: views.down.assetKey, facing: 'down', origin: views.down.origin, flip: false, tweens: 0 });
    expect(defaultPose.height).toBeCloseTo(views.down.displaySize, 5);
    const afterReload = await readBrowserSave(page);
    for (const key of ['player', 'rngState', 'party', 'inventory', 'flags'] as const) expect(afterReload[key]).toEqual(beforeReload[key]);
    expect(errors).toEqual([]);
  });
});
