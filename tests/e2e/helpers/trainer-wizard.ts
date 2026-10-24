import type { Page } from '@playwright/test';

/** Follow real wizard buttons, retaining validation errors and the saved draft on retry. */
export async function confirmNewTrainer(page: Page): Promise<void> {
  const customize = page.getByRole('button', { name: 'Personalizza allenatore', exact: true });
  if (await customize.isVisible()) {
    await customize.click();
    if (await customize.isVisible()) return; // Invalid name remains on step one.
  }
  const summary = page.getByRole('button', { name: 'Riepilogo', exact: true });
  if (await summary.isVisible()) await summary.click();
  await page.getByRole('button', { name: 'Inizia il viaggio', exact: true }).click();
}
