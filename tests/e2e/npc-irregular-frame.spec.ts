import { expect, test } from '@playwright/test';
import manifest from '../../assets/npc-idle-views-v1.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave } from './helpers/world-navigation';

test('an irregular NPC pose stays bounded and proportional in the Canvas renderer', async ({ page }) => {
  const pose = manifest.profiles.find(profile => profile.profileId === 'r14-guide-livia')!
    .views.find(view => view.direction === 'left')!;
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch({ maxRetries: 2 });
    const body = await response.text();
    expect(body).toContain('type: Phaser.AUTO');
    await route.fulfill({ response, body: body.replace('type: Phaser.AUTO', 'type: Phaser.CANVAS')
      + '\nwindow.__irregularNpcGame = game;' });
  });
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'intro_completed', 'tutorial_habitat_seen',
    'q_starter_selected', 'prologue_complete_seen'])];
  save.player = { ...save.player, mapId: 'veloria/r14_varco_cristallo', spawnPointId: 'from_biancavetta', x: 28, y: 11 };
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
  await page.getByRole('button', { name: 'Vai a destra', exact: true }).tap();
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Guida Livia');
  const state = await page.evaluate(() => {
    const world = (window as any).__irregularNpcGame.scene.keys.world;
    const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === 'r14_guide');
    const image = sprite.texture.getSourceImage();
    return { renderer: world.game.renderer.type, canvas: image instanceof HTMLCanvasElement,
      width: image.width, height: image.height, frameWidth: sprite.frame.width, frameHeight: sprite.frame.height,
      uniform: sprite.scaleX === sprite.scaleY, key: sprite.texture.key, displayHeight: sprite.displayHeight,
      origin: { x: sprite.originX, y: sprite.originY } };
  });
  expect(state.renderer).toBe(1); // Phaser.CANVAS
  expect(state.canvas).toBe(true);
  expect(state.key).toBe(pose.assetKey);
  expect(Math.max(state.width, state.height)).toBeLessThanOrEqual(512);
  expect(state.width).toBeGreaterThanOrEqual(state.frameWidth);
  expect(state.height).toBeGreaterThanOrEqual(state.frameHeight);
  expect(Number.isInteger(state.frameWidth)).toBe(false);
  expect(state.frameWidth / state.frameHeight).toBeCloseTo(pose.width / pose.height, 10);
  expect(state.uniform).toBe(true);
  expect(state.displayHeight).toBeCloseTo(pose.displaySize, 5);
  expect(state.origin).toEqual(pose.origin);
});
