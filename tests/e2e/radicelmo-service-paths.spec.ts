import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test('Radicelmo paths reach the community center, herbalist and research garden', async ({ page }, info) => {
  // Five collision-aware walks at visible tile speed; no encounter action or quest interaction is triggered.
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/'); await enterGame(page);

  const metadata = JSON.parse(await readFile(resolve('content/maps/radicelmo.map.json'), 'utf8'));
  const fixture = await page.evaluate(async () => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
    return selectStarter(await loadSave(), 4, 'radicelmo-fixture');
  });
  fixture.player = {
    ...fixture.player,
    mapId: 'veloria/radicelmo',
    spawnPointId: metadata.spawns[0].id,
    x: 1,
    y: 14,
  };
  fixture.flags = [...new Set([...fixture.flags, 'intro_completed', 'tutorial_habitat_seen', 'q_ada_helped', 'badge_aurora_awarded', 'prologue_complete_seen'])];
  await seedBrowserSave(page, fixture); await page.reload(); await enterGame(page);

  const services = [
    { x: 5, y: 8, name: 'Centro della Comunità', screenshot: 'community-center' },
    { x: 13, y: 8, name: 'Erboristeria delle Fronde', screenshot: 'herbalist' },
    { x: 22, y: 17, name: 'Regolatore dell’acqua', screenshot: 'water-regulator' },
    { x: 25, y: 17, name: 'Vaso del seme ancestrale', screenshot: 'seed-pot' },
    { x: 28, y: 17, name: 'Misuratore di luce', screenshot: 'light-meter' },
  ] as const;

  for (const service of services) {
    await walkTo(page, 'radicelmo.tmj', service.x, service.y, { avoidEncounters: true });
    const dismissReward = page.getByRole('button', { name: 'Chiudi ricompensa', exact: true });
    if (await dismissReward.isVisible()) await dismissReward.click();
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).click();
    await expect(page.locator('#interaction-prompt')).toContainText(service.name);
    await page.screenshot({ path: info.outputPath(`radicelmo-${service.screenshot}.png`) });
  }

  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/radicelmo');
  expect(errors).toEqual([]);
});
