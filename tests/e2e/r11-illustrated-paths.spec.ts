import { expect, test } from '@playwright/test';
import { createBattleCreature } from '../../src/core/battle/create-creature';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

function readyGen1Party() {
  const creature = createBattleCreature({
    species: species.species as any,
    moves: moves.moves as any,
    speciesId: 1,
    level: 8,
    instanceId: 'r11-art-fixture-bulbasaur',
  });
  return [{
    instanceId: creature.instanceId,
    speciesId: creature.speciesId,
    level: creature.level,
    experience: 0,
    hp: creature.hp,
    maxHp: creature.stats.maxHp,
    moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })),
  }];
}

test('R11 illustrated path, meadow edges and waterfall overlook stay readable in both orientations', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await enterGame(page);

  const save = await readBrowserSave(page);
  save.player = { ...save.player, mapId: 'veloria/r11_via_cascate', spawnPointId: 'from_acquariva', x: 17, y: 28 };
  save.flags = [...new Set([
    ...save.flags, 'q_starter_selected', 'tutorial_habitat_seen', 'prologue_complete_seen',
  ])];
  save.party = readyGen1Party();
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  await expect(page.locator('#game canvas')).toBeVisible();

  const captureStop = async (x: number, y: number, label: string) => {
    await walkTo(page, 'r11_via_cascate.tmj', x, y, { avoidEncounters: true });
    await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
      mapId: 'veloria/r11_via_cascate', x, y,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: info.outputPath(`r11-${label}-portrait.png`) });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.screenshot({ path: info.outputPath(`r11-${label}-landscape.png`) });
  };

  // Start on the southern walking lane; view the lower meadow from its clear east edge.
  await captureStop(17, 27, 'south-path');
  await captureStop(8, 19, 'lower-meadow-edge');
  await captureStop(15, 13, 'waterfall-overlook');
  // The upper meadow's open north approach avoids stepping into its random-encounter zone.
  await captureStop(6, 4, 'upper-meadow-edge');

  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/r11_via_cascate');
  expect(errors).toEqual([]);
});
