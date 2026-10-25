import { expect, test } from '@playwright/test';
import { rollEncounterCheck } from '../../src/core/encounters/roll-encounter-check';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection } from './helpers/world-navigation';

test('KO party gets recovery guidance without consuming an encounter roll', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await enterGame(page);

  // Use the normal browser save/starter flow, then prepare a controlled field fixture.
  const fixture = await page.evaluate(async () => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
    return selectStarter(await loadSave(), 4, 'exhausted-habitat-starter');
  });
  expect(fixture).toBeTruthy();
  const zoneChance = 0.09; // Prato alto on r11_via_cascate.tmj.
  let seed = 1;
  while (!rollEncounterCheck(seed, zoneChance).encounter) seed++;

  const prepared = structuredClone(fixture!);
  prepared.flags = [...new Set([...prepared.flags, 'intro_completed', 'tutorial_habitat_seen'])];
  // (6,4) is the walkable northern approach; the former (3,5) fixture was
  // inside a collision and correctly restored to the map's safe spawn.
  prepared.player = { ...prepared.player, mapId: 'veloria/r11_via_cascate', spawnPointId: 'from_acquariva', x: 6, y: 4 };
  prepared.party = prepared.party.map(creature => ({ ...creature, hp: 0 }));
  prepared.rngState = seed;
  await seedBrowserSave(page, prepared);
  await page.reload();
  await enterGame(page);

  expect((await readBrowserSave(page)).player).toMatchObject({ x: 6, y: 4 });
  await walkDirection(page, 'down');
  await expect(page.locator('#toast')).toContainText('La squadra è tutta KO: cura almeno un Pokémon al Centro Pokémon per cercare nuovi incontri.');
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  expect((await readBrowserSave(page)).rngState).toBe(seed);

  // A healed save fixture isolates the live encounter path from any healing-service behavior.
  const healed = structuredClone(prepared);
  healed.party = healed.party.map(creature => ({ ...creature, hp: creature.maxHp }));
  await seedBrowserSave(page, healed);
  await page.reload();
  await enterGame(page);
  await walkDirection(page, 'down');
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  const afterBattleStart = await readBrowserSave(page);
  expect(afterBattleStart.party.length).toBeGreaterThan(0);
  expect(afterBattleStart.party.every(creature => creature.hp > 0)).toBe(true);
});
