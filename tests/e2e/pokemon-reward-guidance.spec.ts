import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test.use({ reducedMotion: 'reduce' });

async function settleAtlasArt(page: Page) {
  await page.evaluate(async () => {
    const image = document.querySelector<SVGImageElement>('.region-map-chart image')!;
    const decoded = new Image(); decoded.src = image.href.baseVal; await decoded.decode();
    await new Promise(requestAnimationFrame);
  });
}

async function prepare(page: Page, flags: string[], lab = false) {
  await page.goto('/'); await enterGame(page);
  const save = await page.evaluate(async ({ flags, lab }) => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
    let save = await loadSave();
    if (!save.party.length) save = selectStarter(save, 4, 'gift-guidance-starter') ?? save;
    save.flags = [...new Set([...save.flags.filter((flag: string) => !flag.startsWith('q_league_') && !flag.startsWith('q_fossil_')),
      'q_research_sample_received', 'prologue_complete_seen', ...flags])];
    const metadata = await (await fetch(`/content/maps/${lab ? 'borgofonte_lab' : 'acquariva'}.map.json`)).json();
    const spawn = metadata.spawns[0];
    save.player = { ...save.player, mapId: metadata.id, spawnPointId: spawn.id, x: spawn.x, y: spawn.y };
    return save;
  }, { flags, lab });
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
  return save;
}

test('fossil quest cards explain Elia and locate the lab without moving the player', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const before = await prepare(page, []);
  await page.locator('.journey-trigger').click();
  const journal = page.getByRole('dialog', { name: 'Il tuo viaggio' });
  for (const name of ['Aerodactyl', 'Kabuto', 'Omanyte']) {
    const card = journal.locator('.journey-quest').filter({ hasText: `Una nuova vita per ${name}` });
    await expect(card.locator('.journey-quest-state')).toHaveText('Da sbloccare');
    await expect(card).toContainText('Lega');
    await expect(card).toContainText('Elia');
    await expect(card).toContainText('Borgofonte');
    await expect(card).toContainText(`Ridona vita a ${name}`);
  }
  await journal.getByRole('button', { name: 'Mostra Aerodactyl sulla mappa', exact: true }).click();
  const atlas = page.getByRole('dialog', { name: 'Esplora Veloria' });
  await expect(atlas.locator('.region-map-select')).toHaveValue('borgofonte');
  const gift = atlas.getByRole('region', { name: 'Pokémon in dono: Aerodactyl', exact: true });
  await expect(gift).toContainText('Laboratorio di Elia');
  await expect(gift).toContainText('Da sbloccare');
  await expect(gift).toContainText('Elia');
  await expect(atlas.getByRole('region', { name: 'Pokémon in dono: Omanyte', exact: true })).toHaveCount(0);
  await settleAtlasArt(page);
  await page.screenshot({ path: info.outputPath('fossil-location-portrait.png') });
  const after = await readBrowserSave(page);
  for (const key of ['player', 'party', 'storage', 'flags', 'inventory', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
});

test('League completion and individual receipts update gift states and the atlas gift symbol', async ({ page }, info) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await prepare(page, ['q_league_completed', 'q_league_epilogue_seen', 'q_fossil_kabuto_received']);
  await page.locator('.journey-trigger').click();
  const journal = page.getByRole('dialog', { name: 'Il tuo viaggio' });
  await expect(journal.locator('.journey-quest').filter({ hasText: 'Una nuova vita per Kabuto' }).locator('.journey-quest-state')).toHaveText('Ricevuto ✓');
  await expect(journal.locator('.journey-quest').filter({ hasText: 'Una nuova vita per Omanyte' }).locator('.journey-quest-state')).toHaveText('Da ricevere');
  await journal.getByRole('button', { name: 'Mostra Omanyte sulla mappa', exact: true }).click();
  const atlas = page.getByRole('dialog', { name: 'Esplora Veloria' });
  await expect(atlas.locator('[data-area="borgofonte"]')).toContainText('🎁');
  await expect(atlas.getByRole('region', { name: 'Pokémon in dono: Omanyte', exact: true })).toContainText('Da ricevere');
  await expect(atlas.getByRole('region', { name: 'Pokémon in dono: Aerodactyl', exact: true })).toHaveCount(0);
  await settleAtlasArt(page);
  await page.screenshot({ path: info.outputPath('fossils-ready-landscape.png') });
});

test('Elia actually restores all three fossils and their received states survive reload', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await prepare(page, ['q_league_completed', 'q_league_epilogue_seen'], true);
  await walkTo(page, 'borgofonte_lab.tmj', 12, 8);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  for (const [name, speciesId] of [['Aerodactyl', 142], ['Kabuto', 140], ['Omanyte', 138]] as const) {
    await page.locator('#action-a').tap();
    const choice = page.getByRole('button', { name: `Ridona vita a ${name}`, exact: true });
    for (let tap = 0; tap < 12 && !await choice.isVisible(); tap++) await page.locator('#action-a').tap();
    await expect(choice).toBeVisible(); await choice.click();
    for (let tap = 0; tap < 12 && await page.locator('#dialogue-box').isVisible(); tap++) await page.locator('#action-a').tap();
    await expect(page.locator('.journey-companion-reward')).toContainText(name);
    const save = await readBrowserSave(page);
    expect([...save.party, ...save.storage].filter(mon => mon.speciesId === speciesId)).toMatchObject([{ level: 20 }]);
    await page.getByRole('button', { name: 'Chiudi ricompensa', exact: true }).tap();
  }
  await page.reload(); await enterGame(page); await page.locator('.journey-trigger').click();
  const journal = page.getByRole('dialog', { name: 'Il tuo viaggio' });
  for (const name of ['Aerodactyl', 'Kabuto', 'Omanyte']) {
    await expect(journal.locator('.journey-quest').filter({ hasText: `Una nuova vita per ${name}` }).locator('.journey-quest-state')).toHaveText('Ricevuto ✓');
  }
  await page.screenshot({ path: info.outputPath('all-fossils-received.png') });
  expect(errors).toEqual([]);
});
