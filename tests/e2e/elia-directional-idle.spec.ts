import { expect, test } from '@playwright/test';
import appearances from '../../content/characters/appearances.v2.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });
const action = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
const profile = appearances.profiles.find(profile => profile.id === 'professor-elia')!;
const views = profile.idleViews!;

for (const [map, npcId, x, y, spawn] of [
  ['borgofonte_lab', 'prof_elia', 12, 7, 'from_village'],
  ['concordia', 'concordia_elia', 29, 10, 'from_r15'],
  ['d06_santuario_due_luci', 'd06_elia', 18, 17, 'from_concordia'],
] as const) test(`Elia keeps calibrated portrait poses and real dialogue in ${map}`, async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nwindow.__eliaIdleGame = game;' });
  });
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
    'prologue_complete_seen', 'q_research_sample_received'])];
  save.player = { ...save.player, mapId: `veloria/${map}`, spawnPointId: spawn, x, y: y + 1 };
  const stops = map === 'borgofonte_lab' ? [
    { x, y: y + 1, face: 'down', button: 'Vai in alto' },
    { x: x - 1, y, face: 'left', button: 'Vai a destra' },
    { x, y: y - 1, face: 'up', button: 'Vai in basso' },
    { x: x + 1, y, face: 'right', button: 'Vai a sinistra' },
  ] as const : [{ x, y: y + 1, face: 'down', button: 'Vai in alto' }] as const;
  for (const mode of map === 'borgofonte_lab' ? ['reduced', 'full'] : ['reduced']) {
    await page.evaluate(mode => localStorage.setItem('veloria-animation-quality', mode), mode);
    await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
    for (const stop of stops) {
      await walkTo(page, `${map}.tmj`, stop.x, stop.y);
      await page.getByRole('button', { name: stop.button, exact: true }).tap();
      const before = await readBrowserSave(page);
      expect(before.player).toMatchObject({ mapId: `veloria/${map}`, x: stop.x, y: stop.y });
      await action(page).tap(); await expect(page.locator('#dialogue-speaker')).toHaveText(map === 'd06_santuario_due_luci' ? 'Elia' : 'Professoressa Elia');
      for (let i = 0; i < 16 && await page.locator('#dialogue-box').isVisible(); i++) await action(page).tap();
      await expect(page.locator('#dialogue-box')).toBeHidden();
      const state = await page.evaluate(id => {
        const world = (window as any).__eliaIdleGame.scene.keys.world;
        const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === id);
        return { key: sprite.texture.key, facing: sprite.getData('npcFacing'), x: sprite.x, y: sprite.y,
          origin: { x: sprite.originX, y: sprite.originY }, width: sprite.displayWidth, height: sprite.displayHeight,
          scaleX: sprite.scaleX, scaleY: sprite.scaleY, flip: sprite.flipX || sprite.flipY,
          tweens: world.tweens.getTweensOf(sprite).length,
          abovePlayer: world.mapLayer.list.indexOf(sprite) > world.mapLayer.list.indexOf(world.player) };
      }, npcId);
      const view = views[stop.face];
      expect(state).toMatchObject({ key: view.assetKey, facing: stop.face, x: x * 32 + 16, y: y * 32 + 35,
        origin: view.origin, flip: false, tweens: 0, abovePlayer: stop.y <= y });
      expect(state.height).toBeCloseTo(view.displaySize, 5);
      expect(state.width / state.height).toBeCloseTo(2 / 3, 5);
      expect(state.scaleX).toBeCloseTo(state.scaleY, 8);
      const after = await readBrowserSave(page);
      for (const key of ['player', 'rngState', 'party', 'inventory', 'flags'] as const) expect(after[key]).toEqual(before[key]);
      for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
        await page.setViewportSize(viewport);
        await page.screenshot({ path: info.outputPath(`elia-${mode}-${stop.face}-${viewport.width}.png`) });
      }
    }
  }
  expect(errors).toEqual([]);
});
