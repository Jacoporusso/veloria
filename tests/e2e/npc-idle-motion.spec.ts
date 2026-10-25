import { expect, test } from '@playwright/test';

test('NPC breathing keeps the foot anchor and stops cleanly with reduced animations', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addInitScript(() => localStorage.setItem('veloria-animation-quality', 'full'));
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/x: spawn\.x,\s*y: spawn\.y/, 'x: 12, y: 8');
    await route.fulfill({ response, body: body + '\nwindow.__idleGame=game;' });
  });
  await page.goto('/?previewMap=veloria/borgofonte_lab');
  await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
  const read = () => page.evaluate(() => {
    const world = (window as any).__idleGame.scene.getScene('world');
    const npc = world.mapLayer.list.find((child: any) => child.name === 'npc-sprite');
    return { x: npc.x, y: npc.y, originX: npc.originX, originY: npc.originY, scaleY: npc.scaleY, tweens: world.tweens.getTweensOf(npc).length };
  });
  const initial = await read();
  expect(initial.tweens).toBe(1);
  await expect.poll(async () => Math.abs((await read()).scaleY - initial.scaleY)).toBeGreaterThan(.000001);
  const animated = await read();
  expect({ x: animated.x, y: animated.y, originX: animated.originX, originY: animated.originY })
    .toEqual({ x: initial.x, y: initial.y, originX: initial.originX, originY: initial.originY });
  await page.evaluate(() => {
    const world = (window as any).__idleGame.scene.getScene('world');
    (window as any).__oldIdleSprite = world.mapLayer.list.find((child: any) => child.name === 'npc-sprite');
  });
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Impostazioni accessibilità e audio' }).click();
  await page.getByLabel('Qualità animazioni').selectOption('reduced');
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  const reduced = await read();
  expect(reduced.tweens).toBe(0);
  await page.evaluate(async () => {
    for (let frame = 0; frame < 16; frame++) await new Promise(requestAnimationFrame);
  });
  expect((await read()).scaleY).toBe(reduced.scaleY);
  expect(await page.evaluate(() => (window as any).__idleGame.scene.getScene('world').tweens.getTweensOf((window as any).__oldIdleSprite).length)).toBe(0);
});
