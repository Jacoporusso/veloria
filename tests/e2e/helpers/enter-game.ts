import { confirmNewTrainer } from './trainer-wizard';
import { expect, type Page } from '@playwright/test';

/** Enter through the player's real title-screen choice and dismiss only the new-game intro. */
export async function enterGame(page: Page): Promise<void> {
  const title = page.locator('.start-screen');
  const canvas = page.locator('#game canvas');

  await expect.poll(async () => (await title.isVisible()) || (await canvas.isVisible()), { timeout: 30_000 }).toBe(true);

  let startedNewGame = false;
  if (await title.isVisible()) {
    const continueButton = page.getByRole('button', { name: 'Continua partita' });
    if (await continueButton.isVisible()) {
      await continueButton.click();
    } else {
      startedNewGame = true;
      await page.getByRole('button', { name: 'Nuova partita' }).click();
      await page.getByRole('textbox', { name: 'Nome allenatore' }).fill('Luna');
      await confirmNewTrainer(page);
    }
  }

  await expect(canvas).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });

  const dialogue = page.locator('#dialogue-box');
  const speaker = page.locator('#dialogue-speaker');
  if (startedNewGame) await expect(speaker).toHaveText('Il tuo viaggio', { timeout: 30_000 });
  for (let step = 0; step < 10 && await dialogue.isVisible() && await speaker.innerText() === 'Il tuo viaggio'; step += 1) {
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  }
  if (startedNewGame) await expect(dialogue).toBeHidden({ timeout: 30_000 });
}
