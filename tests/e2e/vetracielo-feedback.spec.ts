import { expect, test } from '@playwright/test';

test('healing feedback stays below a mission reward after rotation', async ({ page }, info) => {
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nglobalThis.__feedbackGame = game;' });
  });
  await page.goto('/?previewMap=veloria/vetracielo');
  await expect(page.locator('#game-loading')).toBeHidden();
  for (const [width, height] of [[390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => {
      const scene = (window as any).__feedbackGame.scene.keys.world;
      scene.journey.celebrated.clear();
      scene.journey.celebrate(['veloria/q_vetracielo_orientation']);
      scene.showToast('La squadra è in piena forma.');
    });
    await expect(page.locator('.journey-reward')).toBeVisible();
    await expect(page.locator('#toast')).toHaveClass(/visible/);
    await expect.poll(() => page.evaluate(() => {
      const reward = document.querySelector('.journey-reward')!.getBoundingClientRect();
      const toast = document.querySelector('#toast')!.getBoundingClientRect();
      return toast.top >= reward.bottom + 8 && toast.bottom <= innerHeight - 8;
    })).toBe(true);
    await page.screenshot({ path: info.outputPath(`reward-healing-${width}.png`) });
  }
});
