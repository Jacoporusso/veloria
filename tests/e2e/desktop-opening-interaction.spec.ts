import { confirmNewTrainer } from './helpers/trainer-wizard';
import { expect, test } from '@playwright/test';
async function enterGame(page: import('@playwright/test').Page) {
  await expect(page.locator('.start-screen')).toBeVisible();
  if (await page.getByRole('button', { name: 'Continua partita' }).isVisible()) await page.getByRole('button', { name: 'Continua partita' }).click();
  else {
    await page.getByRole('button', { name: 'Nuova partita' }).click();
    await page.getByRole('textbox', { name: 'Nome allenatore' }).fill('Luna');
    await confirmNewTrainer(page);
  }
  await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
  for (let i = 0; i < 12 && await page.locator('#dialogue-box').isVisible(); i++) await page.keyboard.press('Space');
  await expect(page.locator('#dialogue-box')).toBeHidden();
}
import { readBrowserSave, seedBrowserSave } from './helpers/world-navigation';
test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });
for (const key of ['e', 'Space', 'Enter', 'mouse']) {
  test(`desktop ${key} opens Elia, selects a starter and talks to Ada`, async ({ page }) => {
    await page.goto('/'); await enterGame(page);
    const save = await readBrowserSave(page);
    save.flags = [...new Set([...save.flags, 'intro_completed'])].filter(f => f !== 'q_starter_selected');
    save.player = { ...save.player, mapId: 'veloria/borgofonte_lab', spawnPointId: 'from_village', x: 12, y: 8 };
    await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
    await page.keyboard.press('ArrowUp');
    if (key === 'mouse') await page.locator('#interaction-prompt').click();
    else await page.keyboard.press(key);
    await expect(page.locator('#dialogue-box')).toBeVisible();
    for (let input = 0; input < 16 && !await page.locator('#starter-choices').isVisible(); input++) {
      if (key === 'mouse') await page.keyboard.press('Space');
      else await page.keyboard.press(key);
    }
    await expect(page.locator('#starter-choices')).toBeVisible();
    const starter = page.getByRole('button', { name: 'Charmander', exact: true });
    if (key === 'mouse') await starter.click();
    else { await starter.focus(); await page.keyboard.press(key === 'e' ? 'Enter' : key); }
    await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_starter_selected');
    for (let i = 0; i < 16 && await page.locator('#dialogue-box').isVisible(); i++) await page.keyboard.press('Space');
    await page.keyboard.press('e');
    for (let i = 0; i < 16 && await page.locator('#dialogue-box').isVisible(); i++) await page.keyboard.press('Space');
    await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_research_sample_received');
    const forest = await readBrowserSave(page);
    forest.player = { ...forest.player, mapId: 'veloria/d01_bosco_veli', spawnPointId: 'from_r01', x: 13, y: 11 };
    await seedBrowserSave(page, forest); await page.reload(); await enterGame(page);
    await page.keyboard.press('ArrowUp');
    if (key === 'mouse') await page.locator('#interaction-prompt').click();
    else await page.keyboard.press(key);
    await expect(page.locator('#dialogue-box')).toBeVisible();
    await expect(page.locator('#dialogue-speaker')).toHaveText('Ada');
    await page.keyboard.press('Space');
    await expect(page.locator('#dialogue-text')).not.toContainText('premi A');
  });
}
