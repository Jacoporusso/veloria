import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';

const lanes = [13, 14, 15, 22, 23, 24] as const;

test('R04 crossing bridges remain walkable across all six lanes', async ({ page }, info) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await enterGame(page);

  const metadata = JSON.parse(await readFile(new URL('../../content/maps/r04_salita_petali.map.json', import.meta.url), 'utf8'));
  const start = metadata.spawns.find((spawn: any) => spawn.id === 'from_radicelmo');
  expect(start, 'use the authored R04 arrival spawn').toBeTruthy();

  const fixture = await page.evaluate(async () => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
    return selectStarter(await loadSave(), 4, 'r04-bridge-path-starter');
  });
  expect(fixture).toBeTruthy();
  fixture!.flags = [...new Set([...fixture!.flags, 'intro_completed', 'prologue_complete_seen', 'tutorial_habitat_seen'])];
  fixture!.player = { ...fixture!.player, mapId: metadata.id, spawnPointId: start.id, x: start.x, y: start.y };
  await seedBrowserSave(page, fixture!);
  await page.reload();
  await enterGame(page);
  expect((await readBrowserSave(page)).player).toMatchObject({ mapId: metadata.id, spawnPointId: start.id, x: start.x, y: start.y });

  for (const row of lanes) {
    // Approach the western end only through normal directional input, avoiding habitats.
    await walkTo(page, 'r04_salita_petali.tmj', 14, row, { avoidEncounters: true });
    expect((await readBrowserSave(page)).player).toMatchObject({ mapId: metadata.id, x: 14, y: row });

    for (let step = 1; step <= 4; step++) {
      await walkDirection(page, 'right');
      const player = (await readBrowserSave(page)).player;
      expect(player).toMatchObject({ mapId: metadata.id, x: 14 + step, y: row });
      if (step === 2) {
        await page.screenshot({ path: info.outputPath(`bridge-lane-${row}-center.png`) });
      }
    }
  }
});
