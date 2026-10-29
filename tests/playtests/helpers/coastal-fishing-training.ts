import { expect } from '@playwright/test';
import type { NaturalJourneyContext } from './natural-journey-context';

const CITY = 'veloria/portolume';
const COAST = 'veloria/r08_costa_turbine';

/** Bounded training with the earned rod, real fishing encounters and ordinary battle XP. */
export async function runCoastalFishingTraining(context: NaturalJourneyContext): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = context;
  const targetLevel = Number(process.env.PLAYTEST_COAST_TRAIN_LEVEL ?? '27');
  const maxCasts = Number(process.env.PLAYTEST_COAST_TRAIN_CASTS ?? '40');
  const maxMinutes = Number(process.env.PLAYTEST_COAST_TRAIN_MINUTES ?? '10');
  expect(Number.isInteger(targetLevel) && targetLevel >= 20 && targetLevel <= 35).toBe(true);
  expect(Number.isInteger(maxCasts) && maxCasts >= 1 && maxCasts <= 80).toBe(true);
  expect(Number.isFinite(maxMinutes) && maxMinutes >= 1 && maxMinutes <= 12).toBe(true);
  const startedAt = Date.now();
  const initial = (await observe()).save;
  expect(initial.badges).toHaveLength(4);
  expect(initial.inventory['old-rod']).toBeGreaterThan(0);
  const companion = initial.party.find(member => member.speciesId === 102);
  expect(companion, 'Train the actually captured Exeggcute').toBeTruthy();
  const current = async () => (await observe()).save.party.find(member => member.instanceId === companion!.instanceId)!;

  async function rest(): Promise<void> {
    if ((await observe()).mapId === 'veloria/gym05_portolume') await walk(15, 23);
    if ((await observe()).mapId === COAST) await walk(39, 11);
    expect((await observe()).mapId).toBe(CITY);
    await interact(8, 14);
    await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
    await settle();
    expect((await current()).hp).toBe((await current()).maxHp);
  }

  await rest();
  if ((await observe()).save.party[0].instanceId !== companion!.instanceId) {
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Apri la squadra' }).click();
    const team = page.getByRole('dialog', { name: 'Squadra', exact: true });
    await team.locator('.pokemon-select').filter({ hasText: 'Exeggcute' }).click();
    await team.getByRole('button', { name: '↑ Metti in testa', exact: true }).click();
    await page.keyboard.press('Escape');
  }
  await exportCheckpoint('natural-coastal-training-start-backup.json');
  let completedCasts = 0;
  // Leave time for an ordinary Center visit and UI export before Playwright's
  // outer timeout. The target assertion still fails if training is incomplete.
  for (let cast = 0; cast < maxCasts && (await current()).level < targetLevel
    && Date.now() - startedAt < maxMinutes * 60_000; cast++) {
    if ((await observe()).mapId === CITY) await walk(0, 17);
    expect((await observe()).mapId).toBe(COAST);
    // The fishing marker is on the shore, with water immediately south. The
    // generic NPC helper approaches from two tiles below, which is water here.
    await walk(21, 14);
    await page.getByRole('button', { name: 'Vai in basso', exact: true }).tap();
    await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
    await settle();
    await page.getByRole('button', { name: 'PESCA', exact: true }).click();
    await settle();
    completedCasts++;
    const member = await current();
    if (member.hp < member.maxHp * .65 || member.status || member.moves.every(move => move.pp < 3)) await rest();
    if ((cast + 1) % 5 === 0) {
      await record(`Coastal fishing training after ${cast + 1} real casts: level ${member.level}, XP ${member.experience}`);
      await exportCheckpoint('natural-coastal-training-progress-backup.json');
    }
  }
  await rest();
  const final = (await observe()).save;
  expect(final.player.money).toBe(initial.player.money);
  expect(final.inventory).toEqual(initial.inventory);
  expect(final.badges).toEqual(initial.badges);
  expect(final.storage).toEqual(initial.storage);
  expect(final.party.map(member => member.instanceId)).toEqual([
    companion!.instanceId, ...initial.party.filter(member => member.instanceId !== companion!.instanceId).map(member => member.instanceId),
  ]);
  await record(`Coastal training terminal checkpoint after ${completedCasts} real casts: earned level ${(await current()).level}, requested ${targetLevel}`);
  await exportCheckpoint('natural-coastal-training-backup.json');
  expect((await current()).level, 'Preserve earned progress before reporting an unmet training target').toBeGreaterThanOrEqual(targetLevel);
}
