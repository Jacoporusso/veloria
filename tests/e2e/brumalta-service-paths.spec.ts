import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test('Brumalta streets reach the station, center and shop using visible movement controls', async ({ page }, info) => {
  // This test performs three complete collision-aware walks at visible tile speed.
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/'); await enterGame(page);
  const fixture = await readBrowserSave(page);
  fixture.player = { ...fixture.player, mapId: 'veloria/brumalta', spawnPointId: 'from_r02', x: 1, y: 12 };
  fixture.flags = [...new Set([...fixture.flags, 'intro_completed', 'q_ada_helped', 'tutorial_habitat_seen'])];
  await seedBrowserSave(page, fixture); await page.reload(); await enterGame(page);
  for (const [x, y, name] of [[21,11,'Monorotaia di Brumalta'], [6,7,'Centro Pokémon'], [6,20,'Bottega del Parco']] as const) {
    await walkTo(page, 'c01_brumalta.tmj', x, y, { avoidEncounters: true });
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).click();
    await expect(page.locator('#interaction-prompt')).toContainText(name);
    const dismiss = page.getByRole('button', { name: 'Chiudi ricompensa', exact: true });
    if (await dismiss.isVisible()) await dismiss.click();
    await page.screenshot({ path: info.outputPath(`service-${x}-${y}.png`) });
  }
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/brumalta');
});
