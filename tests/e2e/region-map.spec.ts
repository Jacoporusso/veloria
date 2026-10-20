import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, walkDirection } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 3, reducedMotion: 'reduce' });
test('the atlas shows current position, visited places, unexplored destinations and preserves movement and visits', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await enterGame(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la mappa di Veloria' }).click();
  const atlas = page.getByRole('dialog', { name: 'Esplora Veloria' });
  await expect(atlas).toBeVisible();
  await expect(atlas.locator('.region-map-location')).toContainText('Borgofonte');
  await expect(atlas.locator('[data-area="borgofonte"]')).toHaveClass(/is-current/);
  const before = (await readBrowserSave(page)).player;
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight');
  await page.keyboard.press('p');
  expect((await readBrowserSave(page)).player).toEqual(before);
  await expect(page.locator('#pokedex-panel')).toBeHidden();
  const currentHit = await atlas.locator('[data-area="borgofonte"] .region-map-hit').boundingBox();
  expect(currentHit!.width).toBeGreaterThanOrEqual(44);
  await atlas.locator('.region-map-select').selectOption('lega');
  await expect(atlas.locator('.region-map-details')).toContainText('Da esplorare');
  expect((await readBrowserSave(page)).player.mapId).toBe(before.mapId);
  await atlas.getByRole('button', { name: 'Mostra tutta la regione' }).click();
  for (const [width, height] of [[390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    const close = await atlas.getByRole('button', { name: 'Chiudi ×' }).boundingBox();
    expect(close!.y).toBeGreaterThanOrEqual(0);
    expect(close!.y + close!.height).toBeLessThanOrEqual(height);
    await expect.poll(async () => {
      const chart = await atlas.locator('.region-map-chart').boundingBox();
      const viewport = await atlas.locator('.region-map-viewport').boundingBox();
      return chart!.height >= viewport!.height - 1;
    }).toBe(true);
    await page.screenshot({ path: info.outputPath(`atlas-${width}.png`) });
  }
  await atlas.locator('[data-area="borgofonte"]').focus(); await page.keyboard.press('Enter');
  await expect(atlas.locator('.region-map-details h3')).toHaveText('Borgofonte');
  await page.keyboard.press('Escape');
  await expect(atlas).toBeHidden();
  await expect(page.getByRole('button', { name: 'Apri menu di gioco' })).toBeFocused();
  await walkDirection(page, 'left');
  await expect.poll(async () => (await readBrowserSave(page)).flags.some(flag => flag.startsWith('atlas_visited_'))).toBe(true);
  const recorded = (await readBrowserSave(page)).flags.filter(flag => flag.startsWith('atlas_visited_'));
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).flags).toEqual(expect.arrayContaining(recorded));
  // Render a route as the actual current area, not its adjacent city.
  await page.goto('/?previewMap=veloria/r06_anello_magnetico');
  await expect(page.locator('#game-loading')).toBeHidden();
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la mappa di Veloria' }).click();
  await expect(atlas.locator('[data-area="r06"]')).toHaveClass(/is-current/);
  await expect(atlas.locator('.region-map-location')).toContainText('Anello Magnetico');
  expect(errors).toEqual([]);
});
