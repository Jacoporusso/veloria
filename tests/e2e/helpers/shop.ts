import { expect, type Page } from '@playwright/test';

/** Buy through the visible quantity controls and leave the persistent market. */
export async function buyFromShop(page: Page, itemName: string, amount = 1): Promise<void> {
  const row = page.getByRole('article', { name: itemName, exact: true });
  await row.getByRole('spinbutton', { name: `Quantità ${itemName}`, exact: true }).fill(String(amount));
  await row.getByRole('button', { name: /^Acquista/ }).click();
  const dialog = row.locator('xpath=ancestor::*[@role="dialog"]');
  await expect(dialog).toHaveAttribute('aria-busy', 'false');
  await expect(dialog.getByRole('status')).toContainText('Acquisto salvato');
  await dialog.getByRole('button', { name: 'Chiudi', exact: true }).click();
}
