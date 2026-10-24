import { expect } from '@playwright/test';
import speciesData from '../../../content/battle/species.v1.json' with { type: 'json' };
import type { NaturalJourneyContext } from './natural-journey-context';

/** Train an earned companion through ordinary encounters, retaining every outcome. */
export async function runAcquarivaWildTraining(context: NaturalJourneyContext): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = context;
  const speciesId = Number(process.env.PLAYTEST_ACQUARIVA_TRAIN_SPECIES);
  expect([96, 133]).toContain(speciesId);
  const targetLevel = speciesId === 96 ? 30 : 29;
  const initial = (await observe()).save;
  expect((await observe()).mapId).toBe('veloria/acquariva');
  expect(initial.badges).toHaveLength(5);
  const companion = initial.party.find(member => member.speciesId === speciesId);
  expect(companion).toBeTruthy();
  const name = (speciesData.species as Record<string, { name: string }>)[speciesId].name;
  const current = async () => (await observe()).save.party.find(member => member.instanceId === companion!.instanceId)!;
  async function rest() {
    await interact(8, 13);
    await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  }
  await rest();
  for (let round = 0; round < 10 && (await current()).level < targetLevel; round++) {
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Apri la squadra' }).click();
    const team = page.getByRole('dialog', { name: 'Squadra', exact: true });
    await team.locator('.pokemon-select').filter({ hasText: name }).click();
    const lead = team.getByRole('button', { name: '↑ Metti in testa', exact: true });
    if (await lead.isVisible()) await lead.click();
    await page.keyboard.press('Escape');
    expect((await observe()).save.party[0].instanceId).toBe(companion!.instanceId);
    await walk(0, 16);
    expect((await observe()).mapId).toBe('veloria/r10_sentiero_canne');
    await walk(33, 12);
    for (let step = 0; step < 40; step++) {
      const own = await current();
      if (own.level >= targetLevel || own.hp < own.maxHp * .6 || own.moves.every(slot => slot.pp < 3)) break;
      await walk(33, step % 2 === 0 ? 13 : 12);
    }
    await record(`Earned ${name} training round ${round + 1}`);
    await walk(39, 5);
    expect((await observe()).mapId).toBe('veloria/acquariva');
    await rest();
  }
  const final = (await observe()).save;
  expect(final.player.money).toBe(initial.player.money);
  expect(final.inventory).toEqual(initial.inventory);
  expect(final.badges).toEqual(initial.badges);
  expect(final.storage).toEqual(initial.storage);
  await record((await current()).level >= targetLevel ? `${name} earned target level ${targetLevel}` : `${name} training budget retained without granting missing XP`);
  await exportCheckpoint('natural-acquariva-training-backup.json');
}
