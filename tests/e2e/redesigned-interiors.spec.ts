import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';
import { createBattleCreature } from '../../src/core/battle/create-creature';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`home painted floor and furniture stay aligned at ${viewport.width}`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await page.goto('/'); await enterGame(page);
    const fixture = await readBrowserSave(page);
    fixture.player = { ...fixture.player, mapId: 'veloria/borgofonte_home', spawnPointId: 'from_village', x: 12, y: 12 };
    fixture.flags = [...new Set([...fixture.flags, 'intro_completed', 'tutorial_habitat_seen'])];
    await seedBrowserSave(page, fixture); await page.reload(); await enterGame(page);
    for (const [x, y, label] of [[2, 11, 'south-west'], [2, 5, 'north-west'], [15, 3, 'north-gap'],
      [21, 5, 'north-east'], [21, 11, 'south-east']] as const) {
      await walkTo(page, 'borgofonte_home.tmj', x, y);
      await page.screenshot({ path: info.outputPath(`home-${label}-${viewport.width}.png`) });
    }
    await walkTo(page, 'borgofonte_home.tmj', 11, 4);
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
    await expect(page.locator('#interaction-prompt')).toContainText('Scaffale');
    await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
    await expect(page.locator('#toast')).toContainText('Vecchi diari');
    const before = await readBrowserSave(page);
    await page.reload(); await enterGame(page);
    const after = await readBrowserSave(page);
    for (const key of ['player', 'party', 'inventory', 'flags', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
    await walkTo(page, 'borgofonte_home.tmj', 12, 13);
    await walkDirection(page, 'down');
    await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte');
  });

  test(`redesigned opening interiors keep interactions and exits reachable at ${viewport.width}`, async ({ page }, info) => {
    // CI139 exhausted 90s during the final city walk, after both interior
    // checks had passed. Allow the complete visible movement sequence on CI.
    test.setTimeout(process.env.CI ? 180_000 : 90_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/'); await enterGame(page);
    for (const [map, y, targetX, targetY, label] of [
      ['borgofonte_home', 12, 6, 7, 'Diario'],
      ['borgofonte_lab', 11, 12, 8, 'Elia'],
    ] as const) {
      const fixture = await readBrowserSave(page);
      fixture.player = { ...fixture.player, mapId: `veloria/${map}`, spawnPointId: 'from_village', x: 12, y };
      fixture.flags = [...new Set([...fixture.flags, 'intro_completed', 'tutorial_habitat_seen'])];
      await seedBrowserSave(page, fixture); await page.reload(); await enterGame(page);
      await walkTo(page, `${map}.tmj`, targetX, targetY);
      await page.getByRole('button', { name: 'Vai in alto', exact: true }).click();
      await expect(page.locator('#interaction-prompt')).toContainText(label);
      await page.screenshot({ path: info.outputPath(`${map}.png`) });
      await walkTo(page, `${map}.tmj`, 12, 13);
      await walkDirection(page, 'down');
      await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte');
    }
    // The city artwork must also lead visibly to its actual interior doors.
    for (const [x, y, interior] of [[13, 9, 'borgofonte_home'], [21, 26, 'borgofonte_lab']] as const) {
      await walkTo(page, 'bg_borgofonte.tmj', x, y);
      await page.screenshot({ path: info.outputPath(`borgofonte-${x}-${y}.png`) });
      await walkDirection(page, 'up');
      await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe(`veloria/${interior}`);
      await walkTo(page, `${interior}.tmj`, 12, 13);
      await walkDirection(page, 'down');
      await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte');
    }
    expect(errors).toEqual([]);
  });
}

test('a home save on the old south rail recovers without losing the team or resources', async ({ page }) => {
  await page.goto('/'); await enterGame(page);
  const fixture = await readBrowserSave(page);
  fixture.player = { ...fixture.player, mapId: 'veloria/borgofonte_home', spawnPointId: 'from_village', x: 5, y: 12, money: 1234 };
  const creature = createBattleCreature({ species: species.species as any, moves: moves.moves as any,
    speciesId: 4, level: 5, instanceId: 'home-recovery-charmander' });
  fixture.party = [{ instanceId: creature.instanceId, speciesId: 4, level: 5, experience: 0, hp: 7,
    maxHp: creature.stats.maxHp, moves: creature.moves.map(move => ({ id: move.moveId, pp: 5 })) }];
  fixture.flags = [...new Set([...fixture.flags, 'intro_completed', 'tutorial_habitat_seen'])];
  await seedBrowserSave(page, fixture); await page.reload(); await enterGame(page);
  // Recovery changes the live position; use the player's save action to persist it.
  await page.getByRole('button', { name: 'Salva la partita', exact: true }).tap();
  await expect.poll(async () => (await readBrowserSave(page)).player.x).toBe(12);
  const recovered = await readBrowserSave(page);
  expect(recovered.player).toMatchObject({ mapId: 'veloria/borgofonte_home', x: 12, y: 12, money: 1234 });
  for (const key of ['party', 'storage', 'inventory', 'rngState', 'badges'] as const) expect(recovered[key]).toEqual(fixture[key]);
  expect(recovered.flags).toEqual(expect.arrayContaining(fixture.flags));
  await page.reload(); await enterGame(page);
  const reloaded = await readBrowserSave(page);
  for (const key of ['player', 'party', 'storage', 'inventory', 'rngState', 'flags', 'badges'] as const) expect(reloaded[key]).toEqual(recovered[key]);
});
