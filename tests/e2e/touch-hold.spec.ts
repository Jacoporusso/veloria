import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';

async function playerY(page: Page): Promise<number> {
  return page.evaluate(() => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('saves', 'readonly');
      const saved = transaction.objectStore('saves').get('main');
      saved.onsuccess = () => resolve(saved.result?.player.y ?? 20);
      transaction.oncomplete = () => db.close();
    };
  }));
}

test('holding the D-pad moves continuously without selection or native context menus', async ({ page, context }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await enterGame(page);
  const down = page.getByRole('button', { name: 'Vai in basso' });
  const bounds = (await down.boundingBox())!;
  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }] });
  await page.waitForTimeout(850); // Deliberately exceed the browser's long-press threshold.
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => playerY(page)).toBeGreaterThanOrEqual(23);
  await page.waitForTimeout(180); // Let the last tile step finish after release.
  const stoppedAt = await playerY(page);
  await page.waitForTimeout(250);
  expect(await playerY(page)).toBe(stoppedAt);
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe('');
  expect(await down.evaluate(button => ({
    selection: getComputedStyle(button).userSelect,
    contextAllowed: button.dispatchEvent(new Event('contextmenu', { bubbles: true, cancelable: true })),
    selectionAllowed: button.dispatchEvent(new Event('selectstart', { bubbles: true, cancelable: true })),
    touchDefaultAllowed: button.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true })),
  }))).toEqual({ selection: 'none', contextAllowed: false, selectionAllowed: false, touchDefaultAllowed: false });

  // Suppressing the D-pad gesture must not suppress the action buttons' native clicks.
  const action = page.getByRole('button', { name: 'Conferma e interagisci' });
  await action.evaluate(button => button.addEventListener('click', () => button.setAttribute('data-clicked', 'true'), { once: true }));
  await action.tap();
  await expect(action).toHaveAttribute('data-clicked', 'true');
  await page.getByRole('button', { name: 'Salva la partita' }).tap();
  await expect(page.locator('#toast')).toContainText('Partita salvata');
});
