import { expect, test } from '@playwright/test';

test('medal case does not show an unearned medal from a preview story flag', async ({ page }) => {
  await page.goto('/?previewMap=veloria/gym01_brumalta');
  await expect(page.locator('#game-loading')).toBeHidden();
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri le medaglie' }).click();
  const medals = page.getByRole('dialog', { name: 'Le tue medaglie' });
  await expect(medals).toContainText('0 medaglie conquistate');
  await expect(medals.locator('.badge-case-card')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu-button')).toBeFocused();
});

for (const [width, height] of [[390, 844], [844, 390], [320, 568]]) {
  test(`wallet and bag are readable at ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto('/?previewMap=veloria/borgofonte_lab');
    const wallet = page.getByRole('button', { name: 'Apri zaino e dotazioni: 300 monete' });
    await expect(wallet).toBeVisible();
    await wallet.click();
    const bag = page.getByRole('dialog', { name: 'Zaino e dotazioni' });
    await expect(bag).toBeVisible();
    await expect(bag.locator('.bag-balance')).toContainText('300');
    await expect(bag.getByRole('listitem').filter({ hasText: 'Pozione' })).toContainText('×2');
    await expect(bag.getByRole('listitem').filter({ hasText: 'Sfera' })).toContainText('×5');
    const bounds = await bag.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
    await page.screenshot({ path: testInfo.outputPath('bag.png') });
    await page.keyboard.press('Escape');
    await expect(bag).toBeHidden();
    await expect(wallet).toBeFocused();
    await page.getByRole('button', { name: 'Apri diario del viaggio' }).click();
    await expect(page.getByRole('dialog', { name: 'Il tuo viaggio' })).toBeVisible();
    await expect(page.locator('.journey-next')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.locator('#bag-button').click();
    await expect(bag).toBeVisible();
    await expect(page.locator('#exploration-menu')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(page.locator('#menu-button')).toBeFocused();
  });
}

test('bag reflects live quantities and hides exhausted stacks', async ({ page }) => {
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
    import '/src/style.css';
    import { JourneyPanel } from '/src/game/journey/JourneyPanel.ts';
    import { newGameSave } from '/src/persistence/save-store.ts';
    window.bagFixture = new JourneyPanel(document.querySelector('.game-stage'));
    window.bagSave = newGameSave();
    window.bagFixture.update(window.bagSave);
    document.querySelector('#game-loading').hidden = true;
  ` }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Apri zaino e dotazioni: 300 monete' }).click();
  await page.evaluate(() => {
    const fixture = window as any;
    fixture.bagSave.player.money = 100;
    fixture.bagSave.inventory = { potion: 0, antidote: 1, 'ancient-seed': 1 };
    fixture.bagFixture.update(fixture.bagSave);
  });
  const bag = page.getByRole('dialog', { name: 'Zaino e dotazioni' });
  await expect(bag.locator('.bag-balance')).toContainText('100');
  await expect(bag.getByRole('listitem')).toHaveCount(2);
  await expect(bag).toContainText('Antidoto');
  await expect(bag).toContainText('Seme ancestrale');
  await expect(bag).not.toContainText('Pozione');
  await page.evaluate(() => {
    const fixture = window as any;
    fixture.bagSave.inventory = {};
    fixture.bagFixture.update(fixture.bagSave);
  });
  await expect(bag).toContainText('Lo zaino è vuoto');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Apri zaino e dotazioni: 100 monete' })).toBeFocused();
});
