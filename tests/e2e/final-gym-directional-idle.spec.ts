import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import appearances from '../../content/characters/appearances.v2.json' with { type: 'json' };
import { collectMapCollision } from '../../src/core/world/map-collision';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';
import { walkIceTo } from './helpers/ice-navigation';

const labels = { up: 'Vai in alto', down: 'Vai in basso', left: 'Vai a sinistra', right: 'Vai a destra' } as const;
const gyms = [
  { name: 'Nives', profileId: 'gym-leader-nives', npcId: 'nives_gym', map: 'gym07_biancavetta', y: 1,
    flags: ['gym07_ice_complete', 'trainer_gym07_nives_defeated', 'badge_ghiaccio_awarded'], northBlocked: true },
  { name: 'Aurel', profileId: 'gym-leader-aurel', npcId: 'aurel_gym', map: 'gym08_concordia', y: 2,
    flags: ['gym08_convergence_complete', 'trainer_gym08_aurel_defeated', 'badge_drago_awarded'], northBlocked: false },
] as const;

for (const gym of gyms) for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test.describe(`${gym.name} directional idle: ${reducedMotion}`, () => {
    test.use({ reducedMotion, deviceScaleFactor: 1 });
    test('calibrated poses follow real approaches and preserve progress on resize and reload', async ({ page }, info) => {
      test.setTimeout(process.env.CI ? 180_000 : 120_000);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/src/main.ts*', async route => {
        const response = await route.fetch({ maxRetries: 2 });
        await route.fulfill({ response, body: await response.text() + '\nwindow.__finalGymIdleGame = game;' });
      });
      await page.addInitScript(mode => localStorage.setItem('veloria-animation-quality', mode), reducedMotion === 'reduce' ? 'reduced' : 'full');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/'); await enterGame(page);
      const profile = appearances.profiles.find(item => item.id === gym.profileId)!;
      const views = profile.idleViews!;
      expect(Object.keys(views).sort()).toEqual(['down', 'left', 'right', 'up']);
      expect(new Set(Object.values(views).map(view => view.assetKey)).size).toBe(4);
      for (const view of Object.values(views)) expect(appearances.assets.some(asset => asset.key === view.assetKey)).toBe(true);
      const fixture = await readBrowserSave(page);
      fixture.flags = [...new Set([...fixture.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
        'prologue_complete_seen', ...gym.flags])];
      fixture.player = { ...fixture.player, mapId: `veloria/${gym.map}`, spawnPointId: 'from_city', x: 15, y: 22 };
      await seedBrowserSave(page, fixture); await page.reload(); await enterGame(page);
      const tiled = JSON.parse(await readFile(`public/tilemaps/${gym.map}.tmj`, 'utf8'));
      const blocked = collectMapCollision(tiled.layers.find((layer: any) => layer.name === 'collision').objects, tiled.width, tiled.height, fixture.flags);
      expect(blocked.has(`16,${gym.y - 1}`)).toBe(gym.northBlocked);
      const stops = [
        { x: 16, y: gym.y + 1, move: 'up', facing: 'down' },
        { x: 15, y: gym.y, move: 'right', facing: 'left' },
        ...(!gym.northBlocked ? [{ x: 16, y: gym.y - 1, move: 'down', facing: 'up' } as const] : []),
        { x: 17, y: gym.y, move: 'left', facing: 'right' },
      ] as const;
      const action = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
      for (const stop of stops) {
        if (gym.map === 'gym07_biancavetta') await walkIceTo(page, `${gym.map}.tmj`, stop.x, stop.y);
        else await walkTo(page, `${gym.map}.tmj`, stop.x, stop.y);
        await page.getByRole('button', { name: labels[stop.move], exact: true }).tap();
        await expect(page.locator('#interaction-prompt')).toContainText(gym.name);
        const before = await readBrowserSave(page);
        await action.tap();
        await expect(page.locator('#dialogue-speaker')).toHaveText(gym.name);
        for (let step = 0; step < 20 && await page.locator('#dialogue-box').isVisible(); step++) await action.tap();
        await expect(page.locator('#dialogue-box')).toBeHidden();
        const after = await readBrowserSave(page);
        for (const key of ['player', 'party', 'inventory', 'flags', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
        const state = await page.evaluate(npcId => {
          const world = (window as any).__finalGymIdleGame.scene.keys.world;
          const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === npcId);
          const surface = sprite.texture.getSourceImage();
          return { key: sprite.texture.key, facing: sprite.getData('npcFacing'), directional: sprite.getData('directionalIdle'),
            x: sprite.x, y: sprite.y, origin: { x: sprite.originX, y: sprite.originY }, height: sprite.displayHeight,
            ratio: sprite.displayWidth / sprite.displayHeight, scaleX: sprite.scaleX, scaleY: sprite.scaleY,
            flipped: sprite.flipX || sprite.flipY, tweens: world.tweens.getTweensOf(sprite).length,
            legacyAtlasLoaded: world.textures.exists('veloria-gym-leaders-b-v1'),
            abovePlayer: world.mapLayer.list.indexOf(sprite) > world.mapLayer.list.indexOf(world.player),
            surface: { width: surface.width, height: surface.height, canvas: surface instanceof HTMLCanvasElement } };
        }, gym.npcId);
        const view = views[stop.facing];
        expect(state).toMatchObject({ key: view.assetKey, facing: stop.facing, directional: true, x: 16 * 32 + 16,
          y: gym.y * 32 + 35, origin: view.origin, flipped: false, tweens: 0, legacyAtlasLoaded: false, abovePlayer: stop.y <= gym.y,
          surface: { width: 340, height: 510, canvas: true } });
        expect(state.height).toBeCloseTo(view.displaySize, 5);
        expect(state.ratio).toBeCloseTo(2 / 3, 5);
        expect(state.scaleX).toBeCloseTo(state.scaleY, 8);
        for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
          await page.setViewportSize(viewport);
          await page.screenshot({ path: info.outputPath(`${gym.name}-${reducedMotion}-${stop.facing}-${viewport.width}.png`) });
          const resized = await readBrowserSave(page);
          for (const key of ['player', 'party', 'inventory', 'flags', 'rngState'] as const) expect(resized[key]).toEqual(after[key]);
        }
        await page.setViewportSize({ width: 390, height: 844 });
      }
      const beforeReload = await readBrowserSave(page);
      await page.reload(); await enterGame(page);
      const reset = await page.evaluate(npcId => {
        const world = (window as any).__finalGymIdleGame.scene.keys.world;
        const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === npcId);
        return { key: sprite.texture.key, facing: sprite.getData('npcFacing'), flipped: sprite.flipX || sprite.flipY };
      }, gym.npcId);
      expect(reset).toEqual({ key: views.down.assetKey, facing: 'down', flipped: false });
      const reloaded = await readBrowserSave(page);
      for (const key of ['player', 'party', 'inventory', 'flags', 'rngState'] as const) expect(reloaded[key]).toEqual(beforeReload[key]);
      expect(errors).toEqual([]);
    });
  });
}
