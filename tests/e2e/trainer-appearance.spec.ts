import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave } from './helpers/world-navigation';

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`trainer wizard, map appearance and subsequent editing persist at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('**/src/main.ts', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\nwindow.__appearanceGame = game;' });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Nuova partita', exact: true }).click();
    await page.getByRole('textbox', { name: 'Nome allenatore' }).fill('Aurora');
    await page.getByRole('button', { name: 'Personalizza allenatore', exact: true }).click();
    await page.getByRole('combobox', { name: 'Personaggio', exact: true }).selectOption('girl');
    await page.getByRole('combobox', { name: 'Capelli', exact: true }).selectOption('curly');
    await page.getByRole('combobox', { name: 'Carnagione', exact: true }).selectOption('deep');
    await page.getByRole('combobox', { name: 'Zaino', exact: true }).selectOption('mint');
    await expect.poll(() => page.locator('.start-screen__content').evaluate(element => getComputedStyle(element).opacity)).toBe('1');
    await expect.poll(() => page.locator('.start-screen__dialog').evaluate(element => getComputedStyle(element).opacity)).toBe('1');
    await expect(page.locator('.trainer-avatar-preview')).toHaveAttribute('data-ready', 'true');
    await page.screenshot({ path: testInfo.outputPath('trainer-editor.png') });
    await page.getByRole('button', { name: 'Indietro', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Nome allenatore' })).toHaveValue('Aurora');
    await page.getByRole('button', { name: 'Personalizza allenatore', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Capelli', exact: true })).toHaveValue('curly');
    await page.getByRole('button', { name: 'Riepilogo', exact: true }).click();
    await page.getByRole('button', { name: 'Inizia il viaggio', exact: true }).click();
    await enterGame(page);
    const before = await readBrowserSave(page);
    expect(before.player.appearance).toMatchObject({ preset: 'girl', skin: 'deep', hairStyle: 'curly', backpack: 'mint' });
    await expect.poll(() => page.evaluate(() => (window as any).__appearanceGame.scene.getScene('world').playerSprite.texture.key)).toBe('veloria-avatar-custom');
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Impostazioni accessibilità e audio' }).click();
    await page.getByRole('button', { name: 'Aspetto allenatore' }).click();
    await expect(page.getByRole('dialog', { name: 'Un aspetto tutto tuo.' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Abbigliamento', exact: true }).selectOption('coral');
    await page.getByRole('combobox', { name: 'Barba', exact: true }).selectOption('short');
    // Enter in a native select must not advance the game behind the modal.
    await page.getByRole('combobox', { name: 'Barba', exact: true }).focus();
    await page.keyboard.press('ArrowUp');
    await page.getByRole('button', { name: 'Salva aspetto', exact: true }).click();
    await expect(page.locator('.trainer-avatar-dialog')).toHaveCount(0);
    const after = await readBrowserSave(page);
    expect(after.player.appearance).toMatchObject({ outfit: 'coral', preset: 'girl' });
    for (const field of ['party', 'storage', 'inventory', 'flags', 'badges', 'rngState'] as const) expect(after[field]).toEqual(before[field]);
    expect(after.player.x).toBe(before.player.x); expect(after.player.y).toBe(before.player.y);
    await page.reload(); await enterGame(page);
    expect((await readBrowserSave(page)).player.appearance).toEqual(after.player.appearance);
    const poses = await page.evaluate(() => {
      const sprite = (window as any).__appearanceGame.scene.getScene('world').playerSprite;
      return Object.keys(sprite.texture.frames).filter(name => /^\d+$/.test(name)).length;
    });
    expect(poses).toBe(16);
    await page.screenshot({ path: testInfo.outputPath('trainer-in-world.png') });
    expect(errors).toEqual([]);
  });
}
