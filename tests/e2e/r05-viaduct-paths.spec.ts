import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';

test('R05 reaches Oren and Vetracielo along the real bridge route', async ({ page }, info) => {
  // The save is prepared before entering the scene; all subsequent movement is real.
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await enterGame(page);

  const metadata = JSON.parse(await readFile(resolve('content/maps/r05_viadotto_ciliegi.map.json'), 'utf8'));
  const fixture = await page.evaluate(async () => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
    return selectStarter(await loadSave(), 4, 'r05-bridge-fixture');
  });
  fixture.player = {
    ...fixture.player,
    mapId: 'veloria/r05_viadotto_ciliegi',
    spawnPointId: metadata.spawns[0].id,
    x: metadata.spawns[0].x,
    y: metadata.spawns[0].y,
  };
  fixture.flags = [...new Set([...fixture.flags, 'intro_completed', 'tutorial_habitat_seen', 'q_ada_helped'])];
  await seedBrowserSave(page, fixture);
  await page.reload();
  await enterGame(page);

  // Oren's tile is blocked by his NPC footprint; approach from the north.
  await walkTo(page, 'r05_viadotto_ciliegi.tmj', 18, 11, { avoidEncounters: true });
  await page.getByRole('button', { name: 'Vai in basso', exact: true }).click();
  await expect(page.locator('#interaction-prompt')).toContainText('Parla con Oren');
  await page.screenshot({ path: info.outputPath('r05-oren.png') });

  for (const row of [5, 6, 7]) {
    await walkTo(page, 'r05_viadotto_ciliegi.tmj', 21, row, { avoidEncounters: true });
    for (const x of [22, 23, 24, 25]) {
      await walkDirection(page, 'right');
      expect((await readBrowserSave(page)).player).toMatchObject({ x, y: row });
      if (x === 23) await page.screenshot({ path: info.outputPath(`r05-bridge-lane-${row}.png`) });
    }
  }

  // Continue north-east through the only Tiled river gap and reach the east exit.
  await walkTo(page, 'r05_viadotto_ciliegi.tmj', 44, 6, { avoidEncounters: true });
  await page.screenshot({ path: info.outputPath('r05-bridge-approach.png') });
  await page.getByRole('button', { name: 'Vai a destra', exact: true }).click();
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');
  expect(errors).toEqual([]);
});
