import { expect, test } from '@playwright/test';

for (const deviceScaleFactor of [1, 3]) test.describe(`guidance DPR ${deviceScaleFactor}`, () => {
  test.use({ deviceScaleFactor, reducedMotion: 'reduce' });
  test('Dalia guidance avoids HUD after rotation, follows the camera and hides for menus', async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\nglobalThis.__guidanceGame = game;' });
    });
    await page.goto('/?previewMap=veloria/gym02_petalora');
    await expect(page.locator('#game-loading')).toBeHidden();
    await page.evaluate(() => {
      const scene = (window as any).__guidanceGame.scene.keys.world;
      scene.save.flags.push('gym02_irrigation_solved');
      scene.drawOpeningGuidance();
      scene.cameras.main.stopFollow();
      scene.cameras.main.centerOn(13 * 32, 3 * 32);
    });
    const marker = page.locator('.world-guidance');
    for (const [width, height] of [[390, 844], [844, 390], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => {
        const scene = (window as any).__guidanceGame.scene.keys.world;
        scene.player.setPosition(13 * 32, 5 * 32);
        scene.fitWorldCamera();
      });
      await expect(marker).toBeVisible();
      await expect(marker).toContainText('DALIA');
      await expect.poll(() => page.evaluate(() => {
        const label = document.querySelector('.world-guidance')!.getBoundingClientRect();
        const overlaps = (b: DOMRect) => label.left < b.right && label.right > b.left && label.top < b.bottom && label.bottom > b.top;
        return [...document.querySelectorAll('.game-header, .journey-trigger, .dpad, .touch-actions')]
          .filter(item => item.getClientRects().length).some(item => overlaps(item.getBoundingClientRect()));
      })).toBe(false);
      await page.screenshot({ path: info.outputPath(`dalia-${width}x${height}.png`) });
    }
    await page.getByRole('button', { name: 'Apri menu di gioco', exact: true }).click();
    await expect(marker).toBeHidden();
    await page.getByRole('button', { name: 'Apri menu di gioco', exact: true }).click();
    await expect(marker).toBeVisible();
    await page.evaluate(() => {
      const scene = (window as any).__guidanceGame.scene.keys.world;
      scene.cameras.main.setBounds(0, 0, 2000, 2000);
      scene.cameras.main.centerOn(1500, 1500);
    });
    await expect(marker).toBeHidden();
    expect(errors).toEqual([]);
  });
});
