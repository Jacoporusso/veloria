import { expect, test } from '@playwright/test';
import appearances from '../../content/characters/appearances.v2.json' with { type: 'json' };

test('calibrated NPC poses keep uniform scale and foot anchors across animation quality changes', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addInitScript(() => localStorage.setItem('veloria-animation-quality', 'full'));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    const body = await response.text();
    await route.fulfill({ response, body: body + '\nwindow.__idleGame=game;' });
  });
  await page.goto('/?previewMap=veloria/league_champion');
  await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
  await page.waitForFunction(() => Boolean((window as any).__idleGame?.scene?.keys?.world?.mapLayer));
  const read = () => page.evaluate(() => {
    const world = (window as any).__idleGame.scene.getScene('world');
    const npc = world.mapLayer.list.find((child: any) => child.name === 'npc-sprite' && child.getData('npcId') === 'league_champion');
    return { x: npc.x, y: npc.y, originX: npc.originX, originY: npc.originY, scaleX: npc.scaleX, scaleY: npc.scaleY, key: npc.texture.key, tweens: world.tweens.getTweensOf(npc).length };
  });
  const initial = await read();
  const profile = appearances.profiles.find(profile => profile.id === 'league-champion-enea')!;
  expect(initial.tweens).toBe(0);
  expect(initial.key).toBe(profile.idleViews!.down.assetKey);
  expect({ x: initial.originX, y: initial.originY }).toEqual(profile.idleViews!.down.origin);
  expect(initial.scaleX).toBe(initial.scaleY);
  await page.evaluate(async () => { for (let frame = 0; frame < 16; frame++) await new Promise(requestAnimationFrame); });
  expect(await read()).toEqual(initial);
  const animated = await read();
  expect({ x: animated.x, y: animated.y, originX: animated.originX, originY: animated.originY })
    .toEqual({ x: initial.x, y: initial.y, originX: initial.originX, originY: initial.originY });
  await page.evaluate(() => {
    const world = (window as any).__idleGame.scene.getScene('world');
    (window as any).__oldIdleSprite = world.mapLayer.list.find((child: any) => child.name === 'npc-sprite' && child.getData('npcId') === 'league_champion');
  });
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Impostazioni accessibilità e audio' }).click();
  await page.getByLabel('Qualità animazioni').selectOption('reduced');
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  const reduced = await read();
  expect(reduced.tweens).toBe(0);
  expect(reduced.scaleX).toBe(reduced.scaleY);
  expect(reduced).toEqual(initial);
  await page.evaluate(async () => {
    for (let frame = 0; frame < 16; frame++) await new Promise(requestAnimationFrame);
  });
  expect((await read()).scaleY).toBe(reduced.scaleY);
  expect(await page.evaluate(() => (window as any).__idleGame.scene.getScene('world').tweens.getTweensOf((window as any).__oldIdleSprite).length)).toBe(0);
});
