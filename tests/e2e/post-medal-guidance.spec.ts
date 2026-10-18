import { expect, test } from '@playwright/test';

for (const mapId of ['veloria/brumalta', 'veloria/r03_terrazze_muschio', 'veloria/gym01_brumalta']) {
  test(`post-medal guidance stays inside ${mapId}`, async ({ page }, testInfo) => {
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\nglobalThis.__guidanceGame = game;' });
    });
    await page.goto(`/?previewMap=${encodeURIComponent(mapId)}`);
    await expect.poll(() => page.evaluate(() => Boolean((window as any).__guidanceGame?.scene.keys.world?.openingGuidance))).toBe(true);
    await expect(page.locator('#game-loading')).toBeHidden();
    await page.evaluate(() => {
      const scene = (window as any).__guidanceGame.scene.keys.world;
      const target = scene.openingGuidance.target;
      scene.cameras.main.stopFollow();
      scene.cameras.main.centerOn(target.x + target.width / 2, target.y + target.height / 2);
    });
    const marker = page.locator('.world-guidance');
    await expect(marker).toBeVisible();
    const bounds = await marker.boundingBox();
    const viewport = page.viewportSize()!;
    expect(bounds!.x).toBeGreaterThanOrEqual(8);
    expect(bounds!.y).toBeGreaterThanOrEqual(8);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width - 8);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height - 8);
    await page.screenshot({ path: testInfo.outputPath('post-medal-guidance.png') });
  });
}
