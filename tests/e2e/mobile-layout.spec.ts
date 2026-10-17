import { expect, test } from '@playwright/test';

test('mobile movement and action controls keep thumb-sized touch targets in portrait and landscape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const button of await page.locator('.dpad-key, .action-button').all()) {
    const box = await button.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  const portraitActions = await page.locator('.touch-actions').boundingBox();
  const portraitDpad = await page.locator('.dpad').boundingBox();
  expect(portraitActions && portraitDpad).toBeTruthy();
  expect(
    portraitActions!.x + portraitActions!.width <= portraitDpad!.x ||
      portraitDpad!.x + portraitDpad!.width <= portraitActions!.x,
  ).toBe(true);

  await page.setViewportSize({ width: 844, height: 390 });
  for (const button of await page.locator('.dpad-key, .action-button').all()) {
    const box = await button.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(40);
    expect(box?.height).toBeGreaterThanOrEqual(40);
  }
  await expect(page.locator('.touch-actions')).toBeVisible();
  const landscapeActions = await page.locator('.touch-actions').boundingBox();
  const landscapeDpad = await page.locator('.dpad').boundingBox();
  expect(landscapeActions && landscapeDpad).toBeTruthy();
  expect(
    landscapeActions!.x + landscapeActions!.width <= landscapeDpad!.x ||
      landscapeDpad!.x + landscapeDpad!.width <= landscapeActions!.x,
  ).toBe(true);
  expect((await page.locator('.game-stage').boundingBox())?.height).toBeGreaterThan(120);
});

test('long interior names and an available update keep header and touch controls inside narrow phone viewports', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const map of ['borgofonte_home', 'borgofonte_lab']) {
      await page.goto(`/?previewMap=veloria/${map}`);
      await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
      await expect(page.locator('#game canvas')).toBeVisible();
      for (const showUpdate of [false, true]) {
        await page.locator('#update-button').evaluate((button, visible) => {
          (button as HTMLButtonElement).hidden = !visible;
        }, showUpdate);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        const stage = (await page.locator('.game-stage').boundingBox())!;
        expect(stage.width).toBe(width);
        expect(stage.height).toBe(844);
        const pad = (await page.locator('.dpad').boundingBox())!;
        for (const button of await page.locator('.action-button').all()) {
          const bounds = (await button.boundingBox())!;
          expect(bounds.x + bounds.width + 20).toBeLessThanOrEqual(pad.x);
        }
        for (const control of await page.locator('.game-header, .game-stage, .header-actions button:not([hidden]), .dpad, .touch-actions').all()) {
          const box = await control.boundingBox();
          expect(box).toBeTruthy();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        }
      }
    }
  }
});
