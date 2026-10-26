import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave } from './helpers/world-navigation';
import { tapBattleLabel } from './helpers/battle-touch';

async function prepare(page: Page, map: string, x: number, y: number, speciesId = 64, fullParty = false) {
  await page.addInitScript(() => localStorage.setItem('veloria-animation-quality', 'reduced'));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nwindow.__collectionGame=game;' });
  });
  await page.goto('/'); await enterGame(page);
  const fixture = await page.evaluate(async ({ map, x, y, speciesId, fullParty }) => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { createBattleCreature } = await import('/src/core/battle/create-creature.ts' as string);
    const { battleSpecies, battleMoves } = await import('/src/game/battle/catalog.ts' as string);
    const metadata = await (await fetch(`/content/maps/${map}.map.json`)).json();
    const save = await loadSave();
    const mon = createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId, level: 30, instanceId: 'collection-fixture' });
    save.player = { ...save.player, mapId: metadata.id, spawnPointId: metadata.spawns[0].id, x, y };
    save.rngState = 2;
    save.inventory['poke-ball'] = 3;
    save.party = Array.from({ length: fullParty ? 6 : 1 }, (_, index) => ({ instanceId: `companion-${index}`, speciesId,
      level: 30, experience: 0, maxHp: mon.stats.maxHp, hp: mon.hp, moves: mon.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }));
    save.flags = [...new Set([...save.flags, 'intro_completed', 'q_starter_selected', 'tutorial_habitat_seen', 'prologue_complete_seen',
      'q_acquariva_report', 'q_league_completed', 'q_league_epilogue_seen', 'q_radicelmo_seed_found', 'q_radicelmo_seed_archived', 'q_radicelmo_greenhouse_started',
      'q_radicelmo_greenhouse_watered', 'q_radicelmo_greenhouse_lit', 'q_radicelmo_seed_sprouted'])];
    return save;
  }, { map, x, y, speciesId, fullParty });
  await seedBrowserSave(page, fixture); await page.reload(); await enterGame(page);
  return fixture;
}

test('assisted trade at a real Center preserves the companion through ceremony and reload', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const before = await prepare(page, 'radicelmo', 5, 8);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await page.locator('#action-a').tap();
  await page.getByRole('button', { name: 'SCAMBI', exact: true }).tap();
  const menu = page.getByRole('dialog', { name: /Scambio assistito/ });
  await menu.getByRole('button', { name: /Kadabra/ }).tap();
  await expect(menu).toContainText('Conserva livello e mosse');
  await page.screenshot({ path: info.outputPath('trade-preview.png') });
  await menu.getByRole('button', { name: 'Evolvi in Alakazam', exact: true }).tap();
  const ceremony = page.getByRole('dialog', { name: 'Ora è Alakazam!' });
  await ceremony.getByRole('button', { name: 'Continua', exact: true }).tap();
  await expect.poll(async () => (await readBrowserSave(page)).party[0].speciesId).toBe(65);
  const after = await readBrowserSave(page);
  expect(after.party[0].instanceId).toBe(before.party[0].instanceId);
  expect(after.party[0].moves).toEqual(before.party[0].moves);
  expect(after.inventory).toEqual(before.inventory);
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).party[0].speciesId).toBe(65);
});

test('Leda gives Bulbasaur once and explains full-party delivery in the reward card', async ({ page }, info) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await prepare(page, 'radicelmo', 25, 12, 4, true);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await page.locator('#action-a').tap();
  for (let line = 0; line < 10 && await page.locator('#dialogue-box').isVisible(); line++) await page.locator('#action-a').tap();
  const card = page.locator('.journey-companion-reward');
  await expect(card).toContainText('Bulbasaur');
  await expect(card).toContainText('deposito');
  await expect(card.locator('.creature-portrait')).toBeVisible();
  await page.locator('.journey-reward').evaluate(async element => {
    await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => undefined)));
  });
  await page.screenshot({ path: info.outputPath('gift-storage.png') });
  await expect.poll(async () => (await readBrowserSave(page)).storage.filter(mon => mon.speciesId === 1).length).toBe(1);
  await page.getByRole('button', { name: 'Chiudi ricompensa', exact: true }).tap();
  await page.locator('#action-a').tap();
  for (let line = 0; line < 10 && await page.locator('#dialogue-box').isVisible(); line++) await page.locator('#action-a').tap();
  expect((await readBrowserSave(page)).storage.filter(mon => mon.speciesId === 1)).toHaveLength(1);
});

test('a visible Snorlax settles only on real capture and stays captured after reload', async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 844, height: 390 });
  await prepare(page, 'r12_valle_vento', 28, 18, 123);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await page.screenshot({ path: info.outputPath('snorlax-world.png') });
  await page.locator('#action-a').tap();
  await page.getByRole('button', { name: 'INCONTRA', exact: true }).tap();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  await expect.poll(() => page.evaluate(() => (window as any).__collectionGame.scene.keys.battle.state?.opponent.creatures[0].speciesId)).toBe(143);
  expect((await readBrowserSave(page)).flags).not.toContain('q_special_snorlax_caught');
  await page.screenshot({ path: info.outputPath('snorlax-battle.png') });
  await tapBattleLabel(page, '__collectionGame', 'CATTURA');
  await tapBattleLabel(page, '__collectionGame', 'SFERA');
  const ceremony = page.getByRole('dialog', { name: 'Snorlax catturato!' });
  await expect(ceremony).toBeVisible({ timeout: 25_000 });
  await page.screenshot({ path: info.outputPath('snorlax-captured.png') });
  await ceremony.getByRole('button', { name: 'Continua', exact: true }).tap();
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  const save = await readBrowserSave(page);
  expect(save.flags).toContain('q_special_snorlax_caught');
  expect(save.party.filter(mon => mon.speciesId === 143)).toHaveLength(1);
  expect(save.inventory['poke-ball']).toBe(2);
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain('q_special_snorlax_caught');
  expect(await page.evaluate(() => (window as any).__collectionGame.scene.keys.world.mapLayer.list
    .filter((item: any) => item.name === 'special-pokemon-sprite').length)).toBe(0);
});
