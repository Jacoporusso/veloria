import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { collectMapCollision } from '../../src/core/world/map-collision';
import appearances from '../../content/characters/appearances.v2.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

for (const npc of [
  { name: 'Rami', speaker: 'Rami', profile: 'guide-rami-r03', map: 'r03_terrazze_muschio', tiled: 'r03_terrazze_muschio', id: 'r03_path_guide', spawn: 'from_brumalta', x: 6, y: 16, flags: [] },
  { name: 'Leda', speaker: 'Custode Leda', profile: 'radicelmo-keeper-leda', map: 'radicelmo', tiled: 'radicelmo', id: 'radicelmo_keeper', spawn: 'from_r03', x: 25, y: 11, flags: ['q_radicelmo_seed_found', 'q_radicelmo_seed_archived', 'q_radicelmo_greenhouse_started', 'q_radicelmo_seed_sprouted', 'q_radicelmo_greenhouse_complete', 'q_radicelmo_fire_stone_found'] },
  { name: 'Lea', speaker: 'Lea', profile: 'vetracielo-lea', map: 'vetracielo', tiled: 'vetracielo', id: 'vetracielo_lea', spawn: 'from_r05', x: 22, y: 18, flags: ['q_vetracielo_orientation'] },
]) test(`${npc.name} keeps a stable identity, foot anchor and authored approaches in ${npc.map}`, async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const profile = appearances.profiles.find(item => item.id === npc.profile)! as any;
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch({ maxRetries: 2 });
    await route.fulfill({ response, body: await response.text() + '\nwindow.__journeyIdleGame = game;' });
  });
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
    'prologue_complete_seen', ...npc.flags])];
  save.player = { ...save.player, mapId: `veloria/${npc.map}`, spawnPointId: npc.spawn, x: npc.x, y: npc.y + 1 };
  const tiled = JSON.parse(await readFile(`public/tilemaps/${npc.tiled}.tmj`, 'utf8'));
  const blocked = collectMapCollision(tiled.layers.find((layer: any) => layer.name === 'collision').objects, tiled.width, tiled.height, save.flags);
  expect(blocked.has(`${npc.x},${npc.y - 1}`)).toBe(false);
  expect(blocked.has(`${npc.x + 1},${npc.y}`)).toBe(false);
  for (const mode of ['reduced', 'full']) {
    await page.evaluate(mode => localStorage.setItem('veloria-animation-quality', mode), mode);
    await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
    for (const stop of [
      { x: npc.x, y: npc.y + 1, facing: 'down', button: 'Vai in alto' },
      { x: npc.x - 1, y: npc.y, facing: 'left', button: 'Vai a destra' },
      { x: npc.x, y: npc.y - 1, facing: 'up', button: 'Vai in basso' },
      { x: npc.x + 1, y: npc.y, facing: 'right', button: 'Vai a sinistra' },
    ]) {
      await walkTo(page, `${npc.tiled}.tmj`, stop.x, stop.y, { avoidEncounters: true });
      await page.getByRole('button', { name: stop.button, exact: true }).tap();
      const before = await readBrowserSave(page);
      const action = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
      await action.tap(); await expect(page.locator('#dialogue-speaker')).toHaveText(npc.speaker);
      for (let i = 0; i < 16 && await page.locator('#dialogue-box').isVisible(); i++) await action.tap();
      await expect(page.locator('#dialogue-box')).toBeHidden();
      const state = await page.evaluate(id => {
        const world = (window as any).__journeyIdleGame.scene.keys.world;
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
        await page.screenshot({ path: info.outputPath(`${npc.name}-${mode}-${stop.facing}-${viewport.width}.png`) });
      }
    }
  }
  expect(errors).toEqual([]);
});
