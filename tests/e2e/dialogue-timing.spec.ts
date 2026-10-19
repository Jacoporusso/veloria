import { expect, test } from '@playwright/test';
import { prepareMonorailTraveler } from './helpers/monorail';

test('dialogue typing catches up after a busy browser without advancing its page', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('veloria-text-speed', 'slow'));
  await prepareMonorailTraveler(page, false);
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Monorotaia di Veloria');
  const revealed = await page.evaluate(async () => {
    const text = document.querySelector('#dialogue-text')!;
    const before = Array.from(text.textContent ?? '').length;
    const changed = new Promise<void>(resolve => {
      const observer = new MutationObserver(() => { observer.disconnect(); resolve(); });
      observer.observe(text, { childList: true, characterData: true, subtree: true });
    });
    const start = performance.now();
    // Simulate an expensive task: timer callbacks cannot run during this time.
    while (performance.now() - start < 750) { /* intentional event-loop stall */ }
    await changed;
    return Array.from(text.textContent ?? '').length - before;
  });
  expect(revealed).toBeGreaterThanOrEqual(12);
  await expect(page.locator('#dialogue-box')).toBeVisible();
  await expect(page.locator('#dialogue-text')).toContainText('Conquista');
  // A still reveals the current page; it must not close an unfinished message.
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect(page.locator('#dialogue-text')).toContainText('città che hai già visitato');
  await expect(page.locator('#dialogue-box')).toBeVisible();
});
