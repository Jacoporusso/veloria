import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

async function enterRoute(page: Page, mapId: string, spawnPointId: string, x: number, y: number) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await enterGame(page);
  const fixture = await page.evaluate(async () => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
    return selectStarter(await loadSave(), 4, 'delta-route-path-fixture');
  });
  fixture.player = { ...fixture.player, mapId, spawnPointId, x, y };
  fixture.flags = [...new Set([
    ...fixture.flags,
    'intro_completed',
    'tutorial_habitat_seen',
    'q_centrale_report',
    'q_portolume_visited',
    'q_delta_report',
    'badge_marea_awarded',
    'trainer_r09_lina_defeated',
    'trainer_r09_noemi_defeated',
    'trainer_r10_maya_defeated',
    'trainer_r10_bruno_defeated',
  ])];
  fixture.badges = [...new Set([...fixture.badges, 'badge_marea'])];
  fixture.inventory['old-rod'] = 1;
  await seedBrowserSave(page, fixture);
  await page.reload();
  await enterGame(page);
}

test('R09 lagoon spur and eastern Delta exit are reachable on foot', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enterRoute(page, 'veloria/r09_dune_salmastre', 'from_portolume', 19, 1);

  await walkTo(page, 'r09_dune_salmastre.tmj', 29, 19, { avoidEncounters: true });
  expect((await readBrowserSave(page)).player).toMatchObject({ mapId: 'veloria/r09_dune_salmastre', x: 29, y: 19 });
  await page.getByRole('button', { name: 'Vai in basso', exact: true }).tap();
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'PESCA', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('r09-lagoon-spur-portrait.png') });
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 844, height: 390 });
  await walkTo(page, 'r09_dune_salmastre.tmj', 38, 17, { avoidEncounters: true });
  await page.screenshot({ path: info.outputPath('r09-delta-lane-landscape.png') });
  await page.getByRole('button', { name: 'Vai a destra', exact: true }).tap();
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/d04_delta_specchi');
  await expect(page.locator('#game-loading')).toBeHidden();
  expect(errors).toEqual([]);
});

test('R10 campana, recovered kit and eastern Acquariva exit connect the reed trail', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enterRoute(page, 'veloria/r10_sentiero_canne', 'from_delta', 1, 22);

  await walkTo(page, 'r10_sentiero_canne.tmj', 10, 6, { avoidEncounters: true });
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await expect(page.locator('#interaction-prompt')).toContainText('Campana delle Canne');
  await page.screenshot({ path: info.outputPath('r10-willow-bell-portrait.png') });

  await walkTo(page, 'r10_sentiero_canne.tmj', 11, 14, { avoidEncounters: true });
  await walkTo(page, 'r10_sentiero_canne.tmj', 21, 14, { avoidEncounters: true });
  await walkTo(page, 'r10_sentiero_canne.tmj', 21, 6, { avoidEncounters: true });
  await walkTo(page, 'r10_sentiero_canne.tmj', 31, 18, { avoidEncounters: true });
  await page.getByRole('button', { name: 'Vai in basso', exact: true }).tap();
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  await expect.poll(async () => (await readBrowserSave(page)).flags.filter(flag => flag === 'q_r10_kit_found')).toHaveLength(1);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.screenshot({ path: info.outputPath('r10-kit-pontile-landscape.png') });

  await walkTo(page, 'r10_sentiero_canne.tmj', 38, 5, { avoidEncounters: true });
  await page.screenshot({ path: info.outputPath('r10-acquariva-lane-landscape.png') });
  await page.getByRole('button', { name: 'Vai a destra', exact: true }).tap();
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
  await expect(page.locator('#game-loading')).toBeHidden();
  expect(errors).toEqual([]);
});
