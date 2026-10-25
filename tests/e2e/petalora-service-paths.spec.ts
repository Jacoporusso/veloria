import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';

test('Petalora bridge lanes, services and monorail approach are reachable on foot', async ({ page }, info) => {
  // Walk at visible speed throughout; the only teleport is the initial fixture load.
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await enterGame(page);

  const metadata = JSON.parse(await readFile(resolve('content/maps/petalora.map.json'), 'utf8'));
  const fixture = await page.evaluate(async () => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
    return selectStarter(await loadSave(), 4, 'petalora-path-fixture');
  });
  fixture.player = {
    ...fixture.player,
    mapId: 'veloria/petalora',
    spawnPointId: metadata.spawns[0].id,
    x: 18,
    y: 26,
  };
  fixture.flags = [...new Set([
    ...fixture.flags,
    'intro_completed',
    'tutorial_habitat_seen',
    'q_ada_helped',
    'badge_aurora_awarded',
    'prologue_complete_seen',
  ])];
  await seedBrowserSave(page, fixture);
  await page.reload();
  await enterGame(page);

  // Start south of the canal, reach the north bank, then cross down through
  // each of the three walkable center lanes. Returning between lanes also
  // checks that the crossing works in both directions without teleporting.
  await walkTo(page, 'petalora.tmj', 18, 16, { avoidEncounters: true });
  for (const x of [17, 18, 19]) {
    await walkTo(page, 'petalora.tmj', x, 16, { avoidEncounters: true });
    for (const y of [17, 18, 19]) {
      await walkDirection(page, 'down');
      expect((await readBrowserSave(page)).player).toMatchObject({ mapId: 'veloria/petalora', x, y });
      if (y === 18) await page.screenshot({ path: info.outputPath(`petalora-bridge-center-${x}.png`) });
    }
    expect((await readBrowserSave(page)).player).toMatchObject({ mapId: 'veloria/petalora', x, y: 19 });
    await page.screenshot({ path: info.outputPath(`petalora-bridge-lane-${x}.png`) });
    if (x !== 19) {
      await walkTo(page, 'petalora.tmj', 18, 16, { avoidEncounters: true });
    }
  }

  const services = [
    { x: 10, y: 9, name: 'Padiglione delle Cure', screenshot: 'community-center' },
    { x: 27, y: 9, name: 'Bottega dei Ciliegi', screenshot: 'shop' },
    { x: 24, y: 15, name: 'Monorotaia di Petalora', screenshot: 'monorail' },
  ] as const;

  for (const service of services) {
    await walkTo(page, 'petalora.tmj', service.x, service.y, { avoidEncounters: true });
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).click();
    await expect(page.locator('#interaction-prompt')).toContainText(service.name);
    await page.screenshot({ path: info.outputPath(`petalora-${service.screenshot}.png`) });
  }

  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/petalora');
  expect(errors).toEqual([]);
});
