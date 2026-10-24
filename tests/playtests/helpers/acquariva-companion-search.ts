import { expect } from '@playwright/test';
import { encounterTimeBand } from '../../../src/core/encounters/select-encounter.ts';
import table from '../../../content/encounters/r10_reed_patch.encounter.json' with { type: 'json' };
import type { NaturalJourneyContext } from './natural-journey-context';

/** Search authored habitats with earned balls; preserve unsuccessful searches too. */
export async function runAcquarivaCompanionSearch(context: NaturalJourneyContext): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = context;
  const target = Number(process.env.PLAYTEST_CAPTURE_SPECIES);
  expect([96, 133]).toContain(target);
  expect((await observe()).mapId).toBe('veloria/acquariva');
  const initial = (await observe()).save;
  expect(initial.flags).toContain('q_acquariva_report');
  const owned = async () => {
    const save = (await observe()).save;
    return [...save.party, ...save.storage].find(member => member.speciesId === target);
  };
  const hour = await page.evaluate(() => new Date().getHours());
  const band = encounterTimeBand(hour);
  if (!table.timeBands[band].some(entry => entry.speciesId === target && entry.weight > 0)) {
    await record(`Requested companion ${target} is absent in the current ${band} habitat; device clock retained`);
    await exportCheckpoint('natural-acquariva-search-backup.json'); return;
  }
  async function rest() {
    await interact(8, 13); await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  }
  await rest();
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la squadra' }).click();
  const team = page.getByRole('dialog', { name: 'Squadra', exact: true });
  await team.locator('.pokemon-select').filter({ hasText: 'Quagsire' }).click();
  const lead = team.getByRole('button', { name: '↑ Metti in testa', exact: true });
  if (await lead.isVisible()) await lead.click();
  await expect.poll(async () => (await observe()).save.party[0].speciesId).toBe(195);
  await page.keyboard.press('Escape');
  for (let round = 0; round < 4 && !await owned(); round++) {
    if (!((await observe()).save.inventory['poke-ball'] > 0)) break;
    await walk(0, 16);
    expect((await observe()).mapId).toBe('veloria/r10_sentiero_canne');
    await walk(33, 12);
    for (let step = 0; step < 100 && !await owned(); step++) {
      const save = (await observe()).save;
      if (!(save.inventory['poke-ball'] > 0) || save.party[0].hp < save.party[0].maxHp * .55) break;
      await walk(33, step % 2 === 0 ? 13 : 12);
    }
    await record(`Natural Acquariva companion search ${target}, round ${round + 1}`);
    await walk(39, 5);
    expect((await observe()).mapId).toBe('veloria/acquariva');
    await rest();
  }
  const companion = await owned();
  if (!companion) {
    await record('Search budget exhausted; no capture or missing resources granted');
    await exportCheckpoint('natural-acquariva-search-backup.json'); return;
  }
  if (target === 96) {
    expect(companion.moves?.some(slot => slot.id === 'headbutt')).toBe(true);
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Apri la squadra' }).click();
    await team.locator('.pokemon-select').filter({ hasText: 'Drowzee' }).click();
    const move = team.locator('.pokemon-move').filter({ hasText: /Bottintesta · PP/ });
    await expect(move).toContainText('30%'); await expect(move).toContainText('prima che agisca');
    await page.keyboard.press('Escape');
    const rats = (await observe()).save.party.filter(member => member.speciesId === 19);
    if (rats.length) {
      await interact(8, 13); await page.getByRole('button', { name: 'DEPOSITO', exact: true }).click();
      const storage = page.getByRole('dialog', { name: 'Deposito Pokémon', exact: true });
      for (const member of rats) await storage.getByRole('button', { name: `BOX · Rattata Lv.${member.level}`, exact: true }).click();
      await storage.getByRole('button', { name: 'Sposta selezionati', exact: true }).click();
      await expect(storage.getByRole('status')).toContainText('Pokémon spostati e salvati');
      await storage.getByRole('button', { name: 'Chiudi', exact: true }).click(); await settle();
      const after = (await observe()).save;
      for (const member of rats) expect(after.storage.some(stored => stored.instanceId === member.instanceId)).toBe(true);
      await record('Both early Rattata deposited together through the persistent storage UI');
    }
  }
  const final = (await observe()).save;
  expect(final.player.money).toBe(initial.player.money);
  expect(final.badges).toEqual(initial.badges);
  expect(final.flags).toContain(`pokedex_caught_${target}`);
  await record('Requested companion caught with earned resources and its official moves');
  await exportCheckpoint('natural-acquariva-search-backup.json');
}
