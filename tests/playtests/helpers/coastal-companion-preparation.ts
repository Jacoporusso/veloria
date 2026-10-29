import { expect } from '@playwright/test';
import speciesData from '../../../content/battle/species.v1.json' with { type: 'json' };
import itemsData from '../../../content/items/items.v1.json' with { type: 'json' };
import grass from '../../../content/encounters/r08_coastal_grass.encounter.json' with { type: 'json' };
import { buyFromShop } from '../../e2e/helpers/shop';
import type { NaturalJourneyContext } from './natural-journey-context';

const CITY = 'veloria/portolume';
const ROUTE = 'veloria/r08_costa_turbine';
const EXEGGCUTE = 102;
const HUNT_TILES = [[30, 4], [31, 4]] as const;

/** Catch the actual local Grass companion, keeping money, balls and encounter RNG earned. */
export async function runCoastalCompanionPreparation(context: NaturalJourneyContext): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = context;
  const initial = (await observe()).save;
  expect(initial.badges).toHaveLength(4);
  expect(initial.flags).toContain('q_portolume_tide_report');
  expect(Object.values(grass.timeBands).every(entries => entries.some(entry => entry.speciesId === EXEGGCUTE && entry.minLevel >= 20))).toBe(true);
  if ((await observe()).mapId === ROUTE) await walk(39, 11);
  expect((await observe()).mapId).toBe(CITY);
  await interact(8, 14);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  const starter = (await observe()).save.party.find(member => member.speciesId === 5);
  expect(starter, 'Preserve the genuinely earned Charmeleon').toBeTruthy();
  const support = (await observe()).save.party.find(member => member.speciesId === 46 && member.moves.some(move => move.id === 'stun-spore' && move.pp > 0));
  expect(support, 'The actual Paras provides the attempted capture status move').toBeTruthy();
  if ((await observe()).save.party[0].instanceId !== starter!.instanceId) {
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Apri la squadra' }).click();
    const team = page.getByRole('dialog', { name: 'Squadra', exact: true });
    await team.locator('.pokemon-select').filter({ hasText: speciesData.species['5'].name }).click();
    await team.getByRole('button', { name: '↑ Metti in testa', exact: true }).click();
    await page.keyboard.press('Escape');
  }
  if (!(await observe()).save.party.some(member => member.speciesId === EXEGGCUTE)) {
    expect((await observe()).save.party.length, 'The new companion must fit without an invented storage change').toBeLessThan(6);
    if (((await observe()).save.inventory['poke-ball'] ?? 0) === 0) {
      const price = itemsData.items['poke-ball'].price;
      const amount = Math.min(2, Math.floor((await observe()).save.player.money / price));
      expect(amount, 'No free balls are granted').toBeGreaterThan(0);
      await interact(14, 14); await buyFromShop(page, 'Sfera', amount); await settle();
    }
    await record('Coastal hunt uses existing balls and real Center rest');
    await exportCheckpoint('natural-exeggcute-before-search-backup.json');
    await walk(0, 17);
    expect((await observe()).mapId).toBe(ROUTE);
    await walk(HUNT_TILES[0][0], HUNT_TILES[0][1]);
    for (let step = 0; step < 240; step++) {
      const save = (await observe()).save;
      if (save.party.some(member => member.speciesId === EXEGGCUTE) || !(save.inventory['poke-ball'] > 0)) break;
      const lead = save.party.find(member => member.instanceId === starter!.instanceId)!;
      if (lead.hp < lead.maxHp * .35) break;
      const [x, y] = HUNT_TILES[step % HUNT_TILES.length];
      await walk(x, y);
      if ((step + 1) % 40 === 0) await record(`Coastal Exeggcute search: ${step + 1} actual steps`);
    }
    await record('Coastal search outcome preserves consumed resources');
    await exportCheckpoint('natural-exeggcute-search-backup.json');
    await walk(39, 11);
    expect((await observe()).mapId).toBe(CITY);
    await interact(8, 14);
    await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  }
  const final = (await observe()).save;
  await record('Coastal companion terminal checkpoint');
  await exportCheckpoint('natural-exeggcute-preparation-backup.json');
  const caught = final.party.find(member => member.speciesId === EXEGGCUTE);
  expect(caught, 'Exeggcute must be caught with actual wild encounters and inventory').toBeTruthy();
  expect(caught!.level).toBeGreaterThanOrEqual(20);
  expect(caught!.moves.some(move => move.id === 'bullet-seed')).toBe(true);
  expect(final.flags).toContain('pokedex_caught_102');
  expect(final.badges).toEqual(initial.badges);
  expect(final.player.mapId).toBe(CITY);
}
