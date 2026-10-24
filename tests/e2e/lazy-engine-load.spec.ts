import { confirmNewTrainer } from './helpers/trainer-wizard';
import { expect, test } from '@playwright/test';

test('loads Phaser and the world scene only after starting a game', async ({ page }) => {
  const engineRequests: string[] = [];
  page.on('request', request => {
    const url = request.url();
    if (/(?:^|\/)(?:phaser|WorldScene)(?:-[^/?]*)?\.(?:js|ts)(?:\?|$)/i.test(url)) {
      engineRequests.push(url);
    }
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Nuova partita', exact: true })).toBeVisible();
  await expect(page.locator('#game canvas')).toHaveCount(0);
  expect(engineRequests).toEqual([]);

  await page.getByRole('button', { name: 'Nuova partita', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome allenatore' }).fill('Aurora');
  await confirmNewTrainer(page);

  await expect(page.locator('#game canvas')).toBeVisible({ timeout: 30_000 });
  expect(engineRequests.some(url => /phaser/i.test(url))).toBe(true);
  expect(engineRequests.some(url => /WorldScene/i.test(url))).toBe(true);
});
