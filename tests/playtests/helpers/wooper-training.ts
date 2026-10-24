import { expect, type Page } from '@playwright/test';

/** Grow the caught companion through normal wild battles and free Centers. */
export async function runWooperTraining(args: {
  page: Page; walk(x: number, y: number): Promise<void>; interact(x: number, y: number): Promise<void>;
  settle(): Promise<void>; observe(): Promise<any>; record(label: string): Promise<void>;
  exportCheckpoint(filename: string): Promise<void>;
}): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = args;
  const initial = (await observe()).save;
  const targetLevel = Number(process.env.PLAYTEST_TRAIN_TARGET ?? '20');
  expect(Number.isInteger(targetLevel) && targetLevel >= 20 && targetLevel <= 28).toBe(true);
  if ((await observe()).mapId === 'veloria/gym05_portolume') await walk(15, 23);
  expect((await observe()).mapId).toBe('veloria/portolume');
  const companion = initial.party.find((member: any) => member.speciesId === 194 || member.speciesId === 195);
  expect(companion).toBeTruthy(); expect(initial.badges).toHaveLength(4);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la squadra' }).click();
  const team = page.getByRole('dialog', { name: 'Squadra', exact: true });
  await team.locator('.pokemon-select').filter({ hasText: companion.speciesId === 194 ? 'Wooper' : 'Quagsire' }).click();
  const lead = team.getByRole('button', { name: '↑ Metti in testa', exact: true });
  if (await lead.isVisible()) await lead.click();
  await expect.poll(async () => (await observe()).save.party[0].instanceId).toBe(companion.instanceId);
  await page.keyboard.press('Escape');
  await walk(0, 17);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/r08_costa_turbine');
  await walk(0, 21);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/ferraluce');
  async function rest() {
    await interact(9, 21); await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
    expect((await observe()).save.party.every((member: any) => member.hp === member.maxHp && !member.status)).toBe(true);
  }
  await rest();
  for (let round = 0; round < 8 && (await observe()).save.party[0].level < targetLevel; round++) {
    await walk(0, 25);
    await expect.poll(async () => (await observe()).mapId).toBe('veloria/r06_anello_magnetico');
    await walk(29, 4);
    for (let step = 0; step < 80; step++) {
      const own = (await observe()).save.party[0];
      if (own.level >= targetLevel || own.hp < own.maxHp * 0.55 || own.moves.every((slot: any) => slot.pp < 3)) break;
      await walk(29, step % 2 === 0 ? 5 : 4);
    }
    await record(`Earned companion training round ${round + 1}`);
    await walk(39, 24);
    await expect.poll(async () => (await observe()).mapId).toBe('veloria/ferraluce');
    await rest();
  }
  await walk(39, 21);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/r08_costa_turbine');
  await walk(39, 11);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/portolume');
  await interact(8, 14); await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  const final = (await observe()).save;
  expect(final.player.money).toBe(initial.player.money);
  expect(final.inventory).toEqual(initial.inventory);
  expect(final.badges).toEqual(initial.badges);
  expect(final.party[0].instanceId).toBe(companion.instanceId);
  await record(final.party[0].level >= targetLevel ? `Companion reached level ${targetLevel} through earned encounters` : 'Training budget retained without granting missing XP');
  await exportCheckpoint('natural-wooper-training-backup.json');
}
