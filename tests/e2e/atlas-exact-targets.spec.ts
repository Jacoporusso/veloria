import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave } from './helpers/world-navigation';

test.use({ reducedMotion: 'reduce', deviceScaleFactor: 1 });

test('atlas pins are on the map and clicking one isolates its exact fishing point', async ({ page }, info) => {
  await page.goto('/'); await enterGame(page);
  const before = await readBrowserSave(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la mappa di Veloria' }).click();
  const atlas = page.getByRole('dialog', { name: 'Esplora Veloria' });
  for (const kind of ['gift', 'encounter', 'fishing']) await expect(atlas.locator(`.region-map-discovery-pin[data-kind="${kind}"]`).first()).toBeVisible();
  for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  await page.setViewportSize(size);
  for (const [kind, label] of [['gift', '🎁 Doni'], ['encounter', '✦ Incontri'], ['fishing', '🎣 Pesca']] as const) {
    await atlas.getByRole('button', { name: label, exact: true }).click();
    await expect(atlas.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(atlas.locator(`.region-map-discovery-pin[data-kind="${kind}"]`).first()).toBeVisible();
    await expect(atlas.locator(`.region-map-discovery-pin:not([data-kind="${kind}"])`)).toHaveCount(0);
    await expect(atlas.locator('.region-map-node:visible')).toHaveCount(0);
    await expect(atlas.locator('.region-map-path:visible')).toHaveCount(0);
    await expect(atlas.locator('.region-map-details .region-map-locate').first()).toBeVisible();
    const viewport = await atlas.locator('.region-map-viewport').boundingBox();
    const chart = await atlas.locator('.region-map-chart').boundingBox();
    expect(chart!.width).toBeLessThanOrEqual(viewport!.width + 1);
    expect(chart!.height).toBeLessThanOrEqual(viewport!.height + 1);
    // Category controls must not cover the destinations they are filtering.
    const covered = await atlas.evaluate(dialog => {
      const controls = [...dialog.querySelectorAll('.region-map-tools, .region-map-legend')].map(item => item.getBoundingClientRect());
      return [...dialog.querySelectorAll('.region-map-discovery-pin')].filter(pin => {
        const box = pin.getBoundingClientRect();
        return controls.some(control => box.left < control.right && box.right > control.left
          && box.top < control.bottom && box.bottom > control.top);
      }).map(pin => pin.getAttribute('data-discovery-id'));
    });
    expect(covered, 'category pins obscured by map controls').toEqual([]);
  }
  }
  const fishing = atlas.locator('.region-map-discovery-pin[data-kind="fishing"]').first();
  const id = await fishing.getAttribute('data-discovery-id');
  const hit = await fishing.locator('.region-map-pin-hit').boundingBox();
  expect(hit!.width).toBeGreaterThanOrEqual(44);
  await fishing.click();
  const pin = atlas.locator('.region-map-local-target');
  await expect(pin).toHaveAttribute('data-discovery-id', id!);
  await expect(atlas.locator('.region-map-discovery-pin')).toHaveCount(1);
  await expect(atlas.locator('.region-map-node')).toHaveCount(0);
  await expect(atlas.locator('.region-map-path')).toHaveCount(0);
  await expect(atlas.locator('.region-map-legend')).toBeHidden();
  await expect(atlas.getByRole('region', { name: 'Punti pesca' })).toBeVisible();
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => {
      const marker = await pin.boundingBox();
      const visibleMap = await atlas.locator('.region-map-viewport').boundingBox();
      return Boolean(marker && visibleMap && marker.x >= visibleMap.x && marker.y >= visibleMap.y
        && marker.x + marker.width <= visibleMap.x + visibleMap.width
        && marker.y + marker.height <= visibleMap.y + visibleMap.height);
    }).toBe(true);
    await page.screenshot({ path: info.outputPath(`fishing-exact-${viewport.width}.png`) });
  }
  await atlas.getByRole('button', { name: 'Mostra tutta la regione' }).click();
  await expect(atlas.locator('.region-map-local')).toHaveCount(0);
  await expect(atlas.locator('.region-map-discovery-pin[data-kind="gift"]').first()).toBeVisible();
  await atlas.locator('.region-map-discovery-pin[data-kind="fishing"]').first().click();
  await expect(atlas.locator('.region-map-local')).toHaveCount(1);
  await atlas.getByRole('button', { name: 'Mostra la tua posizione' }).click();
  await expect(atlas.locator('.region-map-local')).toHaveCount(0);
  await expect(atlas.locator('.region-map-location')).toContainText('Sei qui:');
  const after = await readBrowserSave(page);
  for (const key of ['player', 'flags', 'party', 'rngState', 'inventory'] as const) expect(after[key]).toEqual(before[key]);
});

test('one unavailable map does not hide unrelated discovery pins', async ({ page }) => {
  await page.goto('/'); await enterGame(page);
  await page.route('**/tilemaps/borgofonte_lab.tmj', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la mappa di Veloria' }).click();
  const atlas = page.getByRole('dialog', { name: 'Esplora Veloria' });
  await expect(atlas.getByRole('status')).toContainText('Alcuni punti non sono disponibili');
  for (const kind of ['gift', 'encounter', 'fishing']) {
    await expect(atlas.locator(`.region-map-discovery-pin[data-kind="${kind}"]`).first()).toBeVisible();
  }
  await atlas.getByRole('button', { name: '🎣 Pesca', exact: true }).click();
  await atlas.locator('.region-map-discovery-pin[data-kind="fishing"]').first().click();
  await expect(atlas.locator('.region-map-local-target')).toBeVisible();
  await expect(atlas.locator('.region-map-discovery-pin')).toHaveCount(1);
});

test('an unfinished research quest in the diary targets its next actual station', async ({ page }, info) => {
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'prologue_complete_seen',
    'tutorial_habitat_seen', 'badge_ghiaccio_awarded', 'q_r14_visited', 'q_d05_visited'])];
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
  const before = await readBrowserSave(page);
  await page.locator('.journey-trigger').click();
  await page.getByRole('button', { name: 'Mostra Le correnti del Cristallo sulla mappa', exact: true }).click();
  const atlas = page.getByRole('dialog', { name: 'Esplora Veloria' });
  await expect(atlas.locator('.region-map-local')).toHaveAttribute('data-map-id', 'veloria/d05_grotte_cristallo');
  const pin = atlas.locator('.region-map-local-target');
  await expect(pin).toHaveAttribute('data-map-x', '176'); await expect(pin).toHaveAttribute('data-map-y', '451');
  await expect(atlas.locator('.region-map-discovery-pin')).toHaveCount(1);
  await expect(atlas.getByRole('region', { name: 'Missione: Le correnti del Cristallo' })).toContainText('Misuratore inferiore');
  await page.screenshot({ path: info.outputPath('research-exact.png') });
  const after = await readBrowserSave(page);
  for (const key of ['player', 'flags', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
});

test('a category chosen while the diary target loads keeps the latest selection', async ({ page }) => {
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'prologue_complete_seen',
    'tutorial_habitat_seen', 'badge_ghiaccio_awarded', 'q_r14_visited', 'q_d05_visited'])];
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  // Hold the shared discovery catalogue before the requested quest is resolved.
  await page.route('**/tilemaps/borgofonte_lab.tmj', async route => {
    await gate;
    await route.continue();
  });
  try {
    await page.locator('.journey-trigger').click();
    await page.getByRole('button', { name: 'Mostra Le correnti del Cristallo sulla mappa', exact: true }).click();
    const atlas = page.getByRole('dialog', { name: 'Esplora Veloria' });
    await atlas.getByRole('button', { name: '🎣 Pesca', exact: true }).click();
    release();
    await expect(atlas.locator('.region-map-discovery-pin[data-kind="fishing"]').first()).toBeVisible();
    await expect(atlas.getByRole('button', { name: '🎣 Pesca', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(atlas.locator('.region-map-local')).toHaveCount(0);
    await expect(atlas.locator('.region-map-discovery-pin:not([data-kind="fishing"])')).toHaveCount(0);
    await expect(atlas.locator('.region-map-node:visible')).toHaveCount(0);
  } finally {
    release();
  }
});
