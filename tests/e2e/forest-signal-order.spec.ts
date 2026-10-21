import { test, expect, type Page } from '@playwright/test';
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game.ts';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation.ts';

const forest = 'd01_bosco_veli.tmj';

async function startForestJourney(page: Page, withResearch: boolean): Promise<void> {
  await page.goto('/');
  await enterGame(page);

  // Keep the real named save and use an ordinary starter creature for the isolated mission fixture.
  const save = await readBrowserSave(page);
  const starter = createBattleCreature({
    species: species.species as any,
    moves: moves.moves as any,
    speciesId: 1,
    level: 5,
    instanceId: 'forest-signal-starter',
  });
  save.party = [{
    instanceId: starter.instanceId,
    speciesId: starter.speciesId,
    level: starter.level,
    experience: starter.experience,
    hp: starter.hp,
    maxHp: starter.stats.maxHp,
    moves: starter.moves.map(move => ({ id: move.moveId, pp: move.pp })),
  }];
  save.flags = [...new Set([...save.flags.filter(flag => flag !== 'q_research_sample_received'), 'q_starter_selected'])];
  if (withResearch) save.flags.push('q_research_sample_received');
  save.player = {
    ...save.player,
    mapId: 'veloria/d01_bosco_veli',
    spawnPointId: 'from_r01',
    x: withResearch ? 13 : 17,
    y: 11,
  };
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
}

async function interact(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
}

async function closeDialogue(page: Page): Promise<void> {
  const dialogue = page.locator('#dialogue-box');
  for (let step = 0; step < 10 && await dialogue.isVisible(); step += 1) await interact(page);
  await expect(dialogue).toBeHidden();
}

async function readForestSensor(page: Page): Promise<void> {
  await walkTo(page, forest, 16, 10, { avoidEncounters: true });
  await walkDirection(page, 'right');
  await expect.poll(async () => {
    const { player } = await readBrowserSave(page);
    return `${player.mapId}|${player.x},${player.y}`;
  }).toBe('veloria/d01_bosco_veli|17,10');
  await interact(page);
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_forest_signal_found');
}

async function reportToAda(page: Page): Promise<void> {
  await walkTo(page, forest, 13, 11, { avoidEncounters: true });
  // Face Ada from the tile below her; movement is resolved by the actual game controls.
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await expect.poll(async () => {
    const { player } = await readBrowserSave(page);
    return `${player.mapId}|${player.x},${player.y}`;
  }).toMatch(/^veloria\/d01_bosco_veli\|13,1[01]$/);
  await interact(page);
  await expect(page.locator('#dialogue-speaker')).toHaveText('Ada');
  await closeDialogue(page);
}

async function returnFromVialeAndReportAgain(page: Page): Promise<void> {
  await walkTo(page, forest, 29, 10, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/r02_viale_fronde');
  await walkTo(page, 'r02_viale_fronde.tmj', 0, 9, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/d01_bosco_veli');
  await reportToAda(page);
}

async function expectReward(page: Page, money: number, potions: number): Promise<void> {
  const save = await readBrowserSave(page);
  expect(save.player.money).toBe(money);
  expect(save.inventory.potion ?? 0).toBe(potions);
  expect(save.flags).toContain('q_ada_helped');
}

test('the forest sensor unlocks Ada report without Elia research and the reward is one-time', async ({ page }) => {
  test.setTimeout(process.env.CI ? 240_000 : 120_000);
  await startForestJourney(page, false);
  const before = await readBrowserSave(page);
  const money = before.player.money;
  const potions = before.inventory.potion ?? 0;
  expect(before.player.name).toBe('Luna');
  expect(before.party).toHaveLength(1);
  expect(before.flags).not.toContain('q_research_sample_received');
  expect(before.flags).not.toContain('q_forest_signal_found');

  await readForestSensor(page);
  expect((await readBrowserSave(page)).flags).not.toContain('q_research_sample_received');
  await page.reload();
  await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain('q_forest_signal_found');
  expect((await readBrowserSave(page)).flags).not.toContain('q_research_sample_received');

  await reportToAda(page);
  await expectReward(page, money + 100, potions + 2);
  await returnFromVialeAndReportAgain(page);
  await expectReward(page, money + 100, potions + 2);
});

test('Ada can be spoken to before the sensor, then the sensor enables her report when research exists', async ({ page }) => {
  await startForestJourney(page, true);
  const before = await readBrowserSave(page);
  const money = before.player.money;
  const potions = before.inventory.potion ?? 0;
  expect(before.flags).toContain('q_research_sample_received');
  expect(before.flags).not.toContain('q_forest_signal_found');

  await reportToAda(page);
  const afterFirstAda = await readBrowserSave(page);
  expect(afterFirstAda.flags).not.toContain('q_ada_helped');
  expect(afterFirstAda.player.money).toBe(money);
  expect(afterFirstAda.inventory.potion ?? 0).toBe(potions);

  await readForestSensor(page);
  await reportToAda(page);
  await expectReward(page, money + 100, potions + 2);
});
