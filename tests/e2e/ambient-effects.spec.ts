import { expect, test } from '@playwright/test';

test('forest ambient effects load from map metadata at full animation quality', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Date.prototype.getHours = () => 22;
    localStorage.setItem('veloria-animation-quality', 'full');
  });
  await page.goto('/');
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect(page.locator('#game-loading')).toBeHidden();
  await page.getByRole('button', { name: 'Vai in basso' }).tap();
  await expect.poll(() => page.evaluate(() => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('saves', 'readonly');
      const get = transaction.objectStore('saves').get('main');
      get.onsuccess = () => resolve(get.result?.player?.y ?? -1);
      get.onerror = () => reject(get.error);
      transaction.oncomplete = () => db.close();
    };
  }))).toBe(21);
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      const get = store.get('main');
      get.onsuccess = () => {
        const save = get.result;
        save.player = { ...save.player, mapId: 'veloria/d01_bosco_veli', spawnPointId: 'from_r01', x: 1, y: 10 };
        store.put(save, 'main');
        store.delete('checksum:main');
      };
      get.onerror = () => reject(get.error);
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));
  await page.reload();
  await expect(page.locator('#current-location')).toHaveText('BOSCO DEI VELI');
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect(page.locator('#game-loading')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('veloria-animation-quality'))).toBe('full');
  await expect(page.locator('#toast')).not.toHaveClass(/visible/);
  expect(pageErrors).toEqual([]);
});
