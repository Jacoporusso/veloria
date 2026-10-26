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
    level: 13,
    instanceId: 'snorlax-access-bulbasaur',
  });
  return [{
    instanceId: creature.instanceId,
    speciesId: creature.speciesId,
    level: creature.level,
    experience: creature.experience,
    hp: creature.hp,
    maxHp: creature.stats.maxHp,
    moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })),
  }];
}

test('Snorlax is reachable from Acquariva and can be inspected without starting battle', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await enterGame(page);

  const save = await readBrowserSave(page);
  save.player = { ...save.player, mapId: 'veloria/acquariva', spawnPointId: 'from_r12', x: 13, y: 1 };
  save.flags = [...new Set([
    ...save.flags.filter(flag => !['q_league_completed', 'q_special_snorlax_caught'].includes(flag)),
    'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen', 'prologue_complete_seen',
    'q_acquariva_report', 'badge_riflesso_awarded', 'trainer_r12_ruben_defeated',
  ])];
  save.badges = [...new Set([...save.badges, 'badge_riflesso'])];
  save.party = readyGen1Party();
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  expect((await readBrowserSave(page)).flags).not.toContain('q_league_completed');

  // Use the real north exit from Acquariva; no map or player teleport after setup.
  await walkTo(page, 'acquariva.tmj', 13, 0, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/r12_valle_vento', spawnPointId: 'from_acquariva', x: 1, y: 23,
  });

  const route = [
    [1, 22], [11, 22], [12, 21], [12, 12], [23, 12], [23, 8], [28, 8], [28, 16],
  ] as const;
  const reach = async (x: number, y: number) => {
    await walkTo(page, 'r12_valle_vento.tmj', x, y, { avoidEncounters: true });
    await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
      mapId: 'veloria/r12_valle_vento', x, y,
    });
  };

  for (const [x, y] of route.slice(0, 5)) await reach(x, y);
  await page.screenshot({ path: info.outputPath('snorlax-bivio-portrait.png') });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.screenshot({ path: info.outputPath('snorlax-bivio-landscape.png') });
  for (const [x, y] of route.slice(5)) await reach(x, y);
  await page.screenshot({ path: info.outputPath('snorlax-clearing-landscape.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: info.outputPath('snorlax-clearing-portrait.png') });

  await page.getByRole('button', { name: 'Vai in basso', exact: true }).tap();
  await page.locator('#action-a').tap();
  await expect(page.getByRole('button', { name: 'INCONTRA', exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  expect((await readBrowserSave(page)).flags).not.toContain('q_league_completed');
  expect(errors).toEqual([]);
});
