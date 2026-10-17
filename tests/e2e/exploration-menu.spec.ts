import { expect, test, type Page } from '@playwright/test';

async function savedY(page: Page): Promise<number | undefined> {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('saves', 'readonly');
      const save = transaction.objectStore('saves').get('main');
      save.onsuccess = () => resolve(save.result?.player.y);
      transaction.oncomplete = () => db.close();
    };
  }));
}

test('immersive navigation opens real panels and restores focus', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
  const menu = page.getByRole('button', { name: 'Apri menu di gioco' });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Apri il Pokédex' }).click();
  await expect(page.getByRole('dialog', { name: 'Pokédex' })).toBeVisible();
  await page.getByRole('button', { name: 'Chiudi il Pokédex' }).click();
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole('button', { name: 'Diario del viaggio', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Il tuo viaggio' })).toBeVisible();
  await page.keyboard.press('Escape', { delay: 40 });
  await expect(menu).toBeFocused();
});

test('objective compacts on movement and the menu pauses movement input', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Vai in basso' }).tap();
  await expect(page.locator('.journey-trigger')).toHaveClass(/is-compact/);
  await expect.poll(() => savedY(page)).toBe(21);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Impostazioni accessibilità e audio' }).click();
  await expect(page.locator('#settings-menu')).toBeVisible();
  await page.getByRole('button', { name: 'Vai in basso' }).tap();
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(300); // Longer than two full movement steps.
  await page.keyboard.up('ArrowDown');
  expect(await savedY(page)).toBe(21);
  await expect(page.locator('#settings-menu')).toBeVisible();
  await page.keyboard.press('Escape', { delay: 40 });
  await expect(page.locator('#settings-menu')).toBeHidden();
  await expect(page.locator('#menu-button')).toBeFocused();
});
