import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';

for (const [width, height] of [[390, 844], [844, 390]]) {
  test(`drag movement, cancellation and saved control preference at ${width}x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch({ maxRetries: 2 });
      await route.fulfill({ response, body: `${await response.text()}\nglobalThis.__joystickGame = game;` });
    });
    await page.goto('/'); await enterGame(page);
    const state = () => page.evaluate(() => {
      const scene = (globalThis as any).__joystickGame.scene.getScene('world');
      const free = [[0,-1],[0,1],[-1,0],[1,0]].find(([dx,dy]) => !scene.occupied.has(`${scene.playerTile.x+dx},${scene.playerTile.y+dy}`));
      return { held: scene.heldDirection, x: scene.playerTile.x, y: scene.playerTile.y, free };
    });
    const settings = async () => {
      await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
      await page.getByRole('button', { name: 'Impostazioni accessibilità e audio' }).click();
    };
    await expect(page.locator('.dpad')).toBeVisible();
    await settings(); await page.locator('#movement-control').selectOption('joystick');
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    const stick = page.locator('.movement-stick');
    await expect(stick).toBeVisible(); await expect(page.locator('.dpad')).toBeHidden();
    const rect = (await stick.boundingBox())!;
    const actions = (await page.locator('.touch-actions').boundingBox())!;
    expect(actions.x + actions.width).toBeLessThan(rect.x);
    const cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2;
    await page.mouse.move(cx, cy); await page.mouse.down();
    expect((await state()).held).toBeNull();
    const before = await state();
    expect(before.free).toBeTruthy();
    await page.mouse.move(cx + before.free![0] * 40, cy + before.free![1] * 40);
    await expect.poll(async () => { const next = await state(); return next.x !== before.x || next.y !== before.y; }).toBe(true);
    await page.mouse.move(cx, cy);
    await page.mouse.move(cx + 40, cy); await expect.poll(async () => (await state()).held).toBe('right');
    await page.mouse.move(cx, cy - 40); await expect.poll(async () => (await state()).held).toBe('up');
    await page.mouse.move(cx, cy); await expect.poll(async () => (await state()).held).toBeNull();
    await page.mouse.move(cx - 40, cy); await expect.poll(async () => (await state()).held).toBe('left');
    await page.mouse.up(); await expect.poll(async () => (await state()).held).toBeNull();
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 35, cy);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect.poll(async () => (await state()).held).toBeNull();
    await page.mouse.up();
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx, cy + 35);
    await stick.dispatchEvent('pointercancel', { pointerId: 1 });
    await expect.poll(async () => (await state()).held).toBeNull();
    await page.mouse.up();
    await page.screenshot({ path: info.outputPath('joystick.png') });
    await page.reload(); await enterGame(page); await expect(stick).toBeVisible();
    await settings(); await expect(page.locator('#movement-control')).toHaveValue('joystick');
    await page.locator('#movement-control').selectOption('buttons');
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    await expect(page.locator('.dpad')).toBeVisible(); await expect(stick).toBeHidden();
    await page.locator('.dpad-key.right').dispatchEvent('pointerdown');
    await expect.poll(async () => (await state()).held).toBe('right');
    await page.locator('.dpad-key.right').dispatchEvent('pointerup');
    await expect.poll(async () => (await state()).held).toBeNull();
  });
}

