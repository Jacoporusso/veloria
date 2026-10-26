import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

async function enterR06(page: Page, spawnIndex: number) {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await enterGame(page);
  const metadata = JSON.parse(await readFile(resolve('content/maps/r06_anello_magnetico.map.json'), 'utf8'));
  const spawn = metadata.spawns[spawnIndex];
  const fixture = await page.evaluate(async () => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
    return selectStarter(await loadSave(), 4, 'r06-magnetic-path-fixture');
  });
  fixture.player = { ...fixture.player, mapId: 'veloria/r06_anello_magnetico', spawnPointId: spawn.id, x: spawn.x, y: spawn.y };
  fixture.flags = [...new Set([...fixture.flags, 'intro_completed', 'tutorial_habitat_seen', 'q_ada_helped'])];
  await seedBrowserSave(page, fixture);
  await page.reload();
  await enterGame(page);
}

test('R06 west access can route around the raised railway to the north side', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enterR06(page, 0);

  await walkTo(page, 'r06_anello_magnetico.tmj', 2, 7, { avoidEncounters: true });
  expect((await readBrowserSave(page)).player).toMatchObject({ mapId: 'veloria/r06_anello_magnetico', x: 2, y: 7 });
  await page.screenshot({ path: info.outputPath('r06-north-rail-bypass.png') });
  expect(errors).toEqual([]);
});

test('R06 west-to-east corridor reaches Ferraluce through the east exit band', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enterR06(page, 0);

  await walkTo(page, 'r06_anello_magnetico.tmj', 38, 25, { avoidEncounters: true });
  await page.screenshot({ path: info.outputPath('r06-east-exit-approach.png') });
  await page.getByRole('button', { name: 'Vai a destra', exact: true }).click();
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/ferraluce');
  await expect(page.locator('#game-loading')).toBeHidden();
  expect(errors).toEqual([]);
});

test('R06 east-to-west corridor returns to Vetracielo', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enterR06(page, 1);

  await walkTo(page, 'r06_anello_magnetico.tmj', 1, 15, { avoidEncounters: true });
  await page.screenshot({ path: info.outputPath('r06-west-exit-approach.png') });
  await page.getByRole('button', { name: 'Vai a sinistra', exact: true }).click();
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');
  await expect(page.locator('#game-loading')).toBeHidden();
  expect(errors).toEqual([]);
});
