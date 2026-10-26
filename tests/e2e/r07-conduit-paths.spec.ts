import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

async function enterR07(page: Page, spawnIndex: number) {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await enterGame(page);
  const metadata = JSON.parse(await readFile(resolve('content/maps/r07_condotto_risonante.map.json'), 'utf8'));
  const spawn = metadata.spawns[spawnIndex];
  const fixture = await page.evaluate(async () => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
    return selectStarter(await loadSave(), 4, 'r07-conduit-path-fixture');
  });
  fixture.player = { ...fixture.player, mapId: 'veloria/r07_condotto_risonante', spawnPointId: spawn.id, x: spawn.x, y: spawn.y };
  fixture.flags = [...new Set([
    ...fixture.flags,
    'intro_completed',
    'tutorial_habitat_seen',
    'q_ada_helped',
    'badge_acciaio_awarded',
  ])];
  await seedBrowserSave(page, fixture);
  await page.reload();
  await enterGame(page);
}

test('R07 reaches the conduit console from the west path', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enterR07(page, 0);

  // Stand below the blocked console and face it; leave the quest action untouched.
  await walkTo(page, 'r07_condotto_risonante.tmj', 20, 17, { avoidEncounters: true });
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).click();
  await expect(page.locator('#interaction-prompt')).toContainText('Sensore del Condotto');
  await page.screenshot({ path: info.outputPath('r07-console-approach.png') });
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/r07_condotto_risonante');
  expect(errors).toEqual([]);
});

test('R07 west-to-east path reaches the Centrale exit after the badge', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enterR07(page, 0);

  await walkTo(page, 'r07_condotto_risonante.tmj', 38, 11, { avoidEncounters: true });
  await page.screenshot({ path: info.outputPath('r07-east-exit-approach.png') });
  await page.getByRole('button', { name: 'Vai a destra', exact: true }).click();
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/d03_centrale_risonante');
  await expect(page.locator('#game-loading')).toBeHidden();
  expect(errors).toEqual([]);
});

test('R07 east-to-west path returns to Ferraluce', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enterR07(page, 1);

  await walkTo(page, 'r07_condotto_risonante.tmj', 1, 23, { avoidEncounters: true });
  await page.screenshot({ path: info.outputPath('r07-west-exit-approach.png') });
  await page.getByRole('button', { name: 'Vai a sinistra', exact: true }).click();
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/ferraluce');
  await expect(page.locator('#game-loading')).toBeHidden();
  expect(errors).toEqual([]);
});
