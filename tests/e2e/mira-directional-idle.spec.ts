import { expect, test } from '@playwright/test';
import appearances from '../../content/characters/appearances.v2.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

const profile = appearances.profiles.find(profile => profile.id === 'gym-leader-mira')!;
const views = profile.idleViews!;
const action = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Conferma e interagisci', exact: true });

for (const reducedMotion of ['reduce', 'no-preference'] as const) test.describe(`Mira directional idle: ${reducedMotion}`, () => {
test.use({ deviceScaleFactor: 1, reducedMotion });

test('Mira uses calibrated directional idle views during real interactions', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nwindow.__miraIdleGame = game;' });
  });
  await page.addInitScript(mode => localStorage.setItem('veloria-animation-quality', mode), reducedMotion === 'reduce' ? 'reduced' : 'full');
  await page.goto('/');
  await enterGame(page);

  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
    'prologue_complete_seen', 'gym01_puzzle_solved', 'trainer_gym01_mira_defeated'])];
  save.player = { ...save.player, mapId: 'veloria/gym01_brumalta', spawnPointId: 'from_city', x: 14, y: 3 };
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);

  const stops = [
    { x: 14, y: 3, pose: 'down', button: 'Vai in alto' },
    { x: 13, y: 2, pose: 'left', button: 'Vai a destra' },
    { x: 14, y: 1, pose: 'up', button: 'Vai in basso' },
    { x: 15, y: 2, pose: 'right', button: 'Vai a sinistra' },
  ] as const;
  for (const stop of stops) {
    await walkTo(page, 'gym01_brumalta.tmj', stop.x, stop.y);
    await page.getByRole('button', { name: stop.button, exact: true }).tap();
    const before = await readBrowserSave(page);
    await action(page).tap();
    await expect(page.locator('#dialogue-speaker')).toHaveText('Mira');
    for (let i = 0; i < 20 && await page.locator('#dialogue-box').isVisible(); i++) await action(page).tap();
    await expect(page.locator('#dialogue-box')).toBeHidden();

    const state = await page.evaluate(() => {
      const world = (window as any).__miraIdleGame.scene.keys.world;
      const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === 'mira');
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
    expect(state).toMatchObject({ key: view.assetKey, facing: stop.pose, x: 14 * 32 + 16, y: 2 * 32 + 35,
      origin: view.origin, flipped: false, tweens: 0, abovePlayer: stop.y <= 2,
      surface: { width: 512, height: 512, canvas: true }, frame: { width: 340, height: 510 } });
    expect(state.height).toBeCloseTo(view.displaySize, 5);
    expect(state.width / state.height).toBeCloseTo(2 / 3, 5);
    expect(state.scaleX).toBeCloseTo(state.scaleY, 8);

    const after = await readBrowserSave(page);
    for (const key of ['player', 'rngState', 'party', 'inventory', 'flags'] as const) expect(after[key]).toEqual(before[key]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: info.outputPath(`mira-${reducedMotion}-${stop.pose}-portrait.png`) });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.screenshot({ path: info.outputPath(`mira-${reducedMotion}-${stop.pose}-landscape.png`) });
    await page.setViewportSize({ width: 390, height: 844 });
  }
  const beforeReload = await readBrowserSave(page);
  await page.reload();
  await enterGame(page);
  const defaultPose = await page.evaluate(() => {
    const world = (window as any).__miraIdleGame.scene.keys.world;
    const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === 'mira');
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
