import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave } from './helpers/world-navigation';

async function setup(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nglobalThis.__managementGame = game;' });
  });
  await page.goto('/');
  await expect(page.locator('.start-screen')).toBeVisible();
  const backup = await readFile(new URL('../../docs/playtests/2026-10-22-natural-portolume-backup-charmander.json', import.meta.url), 'utf8');
  const original = await page.evaluate(async text => {
    const { importSave } = await import('/src/persistence/save-backup.ts' as string);
    const { saveGame } = await import('/src/persistence/save-store.ts' as string);
    const save = importSave(text);
    save.party = save.party.filter(member => member.speciesId <= 151);
    save.storage = save.storage.filter(member => member.speciesId <= 151);
    save.flags = save.flags.filter(flag => !/^pokedex_(seen|caught)_\d+$/.test(flag) || Number(flag.split('_').at(-1)) <= 151);
    // Explicit integration fixture: extra boxed members, no claim of natural catches.
    save.storage = save.party.slice(1).map((member, index) => ({ ...member, instanceId: `box-${index}` }));
    await saveGame(save);
    return save;
  }, backup);
  await page.reload(); await enterGame(page);
  return { original, errors };
}

for (const [width, height] of [[390, 844], [844, 390]]) {
  test(`multiple box transfers, bulk purchases and reload at ${width}x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    const { original, errors } = await setup(page);
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
    await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
    await page.getByRole('button', { name: 'DEPOSITO', exact: true }).click();
    const depot = page.getByRole('dialog', { name: 'Deposito Pokémon' });
    const party = depot.getByRole('region', { name: 'Squadra', exact: true });
    const box = depot.getByRole('region', { name: 'Box', exact: true });
    await party.getByRole('button').nth(1).click();
    await expect(party.getByRole('button').nth(1)).toHaveAttribute('aria-pressed', 'true');
    await party.getByRole('button').nth(1).click();
    await expect(party.getByRole('button').nth(1)).toHaveAttribute('aria-pressed', 'false');
    await party.getByRole('button').nth(1).click();
    await party.getByRole('button').nth(2).click();
    await depot.getByRole('button', { name: 'Sposta selezionati' }).click();
    await expect(depot).toHaveAttribute('aria-busy', 'false');
    await expect(party.getByRole('button')).toHaveCount(1);
    await expect(box.getByRole('button')).toHaveCount(4);
    await party.getByRole('button').first().click();
    await expect(depot.getByRole('button', { name: 'Sposta selezionati' })).toBeDisabled();
    await depot.getByRole('button', { name: 'Deseleziona tutti' }).click();
    await box.getByRole('button').nth(2).click();
    await box.getByRole('button').nth(3).click();
    await page.screenshot({ path: info.outputPath(`depot-${width}.png`) });
    await depot.getByRole('button', { name: 'Sposta selezionati' }).click();
    await expect(depot).toHaveAttribute('aria-busy', 'false');
    await expect(party.getByRole('button')).toHaveCount(3);
    await depot.getByRole('button', { name: 'Chiudi', exact: true }).click();
    expect((await readBrowserSave(page)).party).toEqual(original.party);
    expect((await readBrowserSave(page)).storage).toEqual(original.storage);

    await page.evaluate(() => (window as any).__managementGame.scene.keys.world.showShopMenu('Mercato', 'veloria/portolume_market'));
    const market = page.getByRole('dialog', { name: 'Mercato', exact: true });
    const potion = market.getByRole('article', { name: 'Pozione', exact: true });
    const quantity = potion.getByRole('spinbutton');
    await quantity.fill('3');
    await expect(potion.getByRole('button')).toHaveText('Acquista ×3 · 600 ₿');
    await page.screenshot({ path: info.outputPath(`market-${width}.png`) });
    await potion.getByRole('button').click();
    await expect(market).toHaveAttribute('aria-busy', 'false');
    await expect(market.getByRole('status')).toContainText('×3');
    await expect(market).toContainText(`Monete: ${original.player.money - 600} ₿`);
    await quantity.fill('999');
    await expect(potion.getByRole('button')).toBeDisabled();
    await quantity.fill('1');
    await potion.getByRole('button').click();
    await expect(market).toHaveAttribute('aria-busy', 'false');
    await market.getByRole('button', { name: 'Chiudi', exact: true }).click();
    await page.reload(); await enterGame(page);
    const restored = await readBrowserSave(page);
    expect(restored.inventory.potion).toBe(original.inventory.potion + 4);
    expect(restored.player.money).toBe(original.player.money - 800);
    expect(restored.party).toEqual(original.party);
    expect(restored.storage).toEqual(original.storage);
    expect(restored.rngState).toBe(original.rngState);
    expect(errors).toEqual([]);
  });
}

test('party drag handles support mouse, touch and keyboard and persist the order', async ({ page, context }) => {
  const { original, errors } = await setup(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la squadra' }).click();
  const panel = page.getByRole('dialog', { name: 'Squadra', exact: true });
  const rows = panel.locator('.party-order-row');
  const start = await rows.nth(2).locator('.party-drag').boundingBox();
  const end = await rows.first().boundingBox();
  await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2);
  await page.mouse.down();
  await page.mouse.move(end!.x + end!.width / 2, end!.y + end!.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => (await readBrowserSave(page)).party[0].instanceId).toBe(original.party[2].instanceId);
  await expect(panel.locator('.is-drop-target,.is-dragging')).toHaveCount(0);
  // A real touch pointer sequence, rather than HTML drag events which mobile lacks.
  const from = await rows.first().locator('.party-drag').boundingBox();
  const to = await rows.nth(2).boundingBox();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from!.x + from!.width / 2, y: from!.y + from!.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: to!.x + to!.width / 2, y: to!.y + to!.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await readBrowserSave(page)).party.map(member => member.instanceId)).toEqual(original.party.map(member => member.instanceId));
  await rows.nth(1).locator('.party-drag').focus();
  await page.keyboard.press('ArrowUp');
  await expect.poll(async () => (await readBrowserSave(page)).party[0].instanceId).toBe(original.party[1].instanceId);
  await expect(rows.first().locator('.party-drag')).toBeFocused();
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).party).toEqual([original.party[1], original.party[0], original.party[2]]);
  expect(errors).toEqual([]);
});

test('bulk purchase waits for durable save and retry does not purchase twice', async ({ page }) => {
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export {};' }));
  await page.goto('/');
  await page.evaluate(async () => {
    const { showShopManager } = await import('/src/game/ui/ShopMenu.ts' as string);
    const { ensureSavedProgress } = await import('/src/game/ui/SaveRetryDialog.ts' as string);
    const state = (window as any).bulkFixture = { applications: 0, attempts: 0, save: {
      player: { money: 1000 }, party: [], storage: [], inventory: {}, flags: [], badges: [], rngState: 17,
    } };
    void showShopManager({ name: 'Mercato di prova', shop: { id: 'test', items: ['potion'] },
      catalog: { potion: { id: 'potion', name: 'Pozione', price: 200, maxStack: 99 } },
      getSave: () => state.save, commit: async save => {
        state.applications++; state.save = save;
        return ensureSavedProgress(async () => { state.attempts++; return state.attempts > 1; });
      } });
  });
  const market = page.getByRole('dialog', { name: 'Mercato di prova' });
  await market.getByRole('spinbutton').fill('3');
  await market.getByRole('button', { name: /^Acquista/ }).click();
  const retry = page.getByRole('dialog', { name: 'Salvataggio da completare' });
  await expect(retry).toBeVisible();
  await expect(market.getByRole('button', { name: 'Chiudi', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(retry).toBeVisible();
  await retry.getByRole('button', { name: 'Riprova salvataggio' }).click();
  await expect(retry).toHaveCount(0);
  await expect(market).toHaveAttribute('aria-busy', 'false');
  const state = await page.evaluate(() => (window as any).bulkFixture);
  expect(state.applications).toBe(1); expect(state.attempts).toBe(2);
  expect(state.save.player.money).toBe(400); expect(state.save.inventory.potion).toBe(3);
  await page.keyboard.press('Tab');
  await expect(market.getByRole('button', { name: /^Acquista/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(market).toHaveCount(0);
});
