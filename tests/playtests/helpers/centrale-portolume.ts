import { expect, type Page } from '@playwright/test';

/**
 * Continue the earned fourth-gym save through the Centrale and Portolume field
 * quests using the same real movement, interaction, and touch controls as the
 * natural prologue driver.
 */
export async function runCentralePortolume(args: {
  page: Page;
  walk(tx: number, ty: number): Promise<void>;
  interact(x: number, y: number): Promise<void>;
  settle(): Promise<void>;
  observe(): Promise<any>;
  record(label: string): Promise<void>;
  exportCheckpoint(filename: string): Promise<void>;
}): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = args;
  const state = () => observe();
  const flags = async () => (await state()).save.flags as string[];
  const waitForFlag = async (flag: string) => expect.poll(async () => flags()).toContain(flag);
  const dialogue = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });

  let current = await state();
  expect(current.mapId).toBe('veloria/gym04_ferraluce');
  expect(current.save.flags).toContain('badge_acciaio_awarded');
  expect(current.save.badges).toContain('badge_acciaio');
  const initialMoney = current.save.player.money;
  const initialOldRod = current.save.inventory['old-rod'] ?? 0;
  await record('Earned fourth badge checkpoint');

  // The gym's southern doorway leads to Ferraluce. Rest before the field route.
  await walk(15, 23);
  await expect.poll(async () => (await state()).mapId).toBe('veloria/ferraluce');
  await walk(9, 23);
  await walk(9, 22);
  await dialogue.tap();
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
  await settle();
  await record('Ferraluce rested before Centrale');

  await walk(39, 25);
  await expect.poll(async () => (await state()).mapId).toBe('veloria/r07_condotto_risonante');
  await interact(20, 16);
  await waitForFlag('q_r07_measurement');
  await record('R07 sensor read');

  await walk(39, 11);
  await expect.poll(async () => (await state()).mapId).toBe('veloria/d03_centrale_risonante');
  await interact(8, 10);
  await waitForFlag('q_centrale_log');
  await interact(23, 10);
  await waitForFlag('q_centrale_isolated');
  await interact(15, 6);
  await waitForFlag('q_centrale_output');
  await record('Centrale log, isolation, and output verified');

  await walk(14, 23);
  await expect.poll(async () => (await state()).mapId).toBe('veloria/r07_condotto_risonante');
  await walk(0, 23);
  await expect.poll(async () => (await state()).mapId).toBe('veloria/ferraluce');
  const beforeIvoPotions = (await state()).save.inventory.potion ?? 0;
  await interact(20, 20);
  await waitForFlag('q_centrale_report');
  current = await state();
  expect(current.save.player.money).toBe(initialMoney + 300);
  expect(current.save.inventory.potion ?? 0).toBe(beforeIvoPotions + 2);
  await record('Ivo rewarded the Centrale report once');
  await interact(20, 20);
  current = await state();
  expect(current.save.player.money).toBe(initialMoney + 300);
  expect(current.save.inventory.potion ?? 0).toBe(beforeIvoPotions + 2);
  await record('Ivo repeat interaction did not duplicate reward');

  // Follow the authored coast exits; the natural driver resolves any real
  // encounters along the traversed path through settle().
  await walk(39, 22);
  await expect.poll(async () => (await state()).mapId).toBe('veloria/r08_costa_turbine');
  await walk(39, 11);
  await expect.poll(async () => (await state()).mapId).toBe('veloria/portolume');
  await waitForFlag('q_portolume_visited');
  await record('Portolume reached from the coast');

  // The tested approach to Marina is from the dock, then face down.
  await walk(22, 14);
  await page.getByRole('button', { name: 'Vai in basso', exact: true }).tap();
  await dialogue.tap();
  await settle();
  await expect.poll(async () => (await state()).save.inventory['old-rod'] ?? 0).toBe(initialOldRod + 1);
  await waitForFlag('q_portolume_orientation');
  await record('Marina granted the old rod');

  // Board the real ferry from the mainland dock and read the observatory gauge.
  await walk(25, 14);
  await page.getByRole('button', { name: 'Vai a destra', exact: true }).tap();
  await dialogue.tap();
  await page.getByRole('button', { name: 'Osservatorio delle maree', exact: true }).tap();
  await expect.poll(async () => (await state()).save.player.spawnPointId).toBe('dock_observatory');
  await settle();
  await interact(36, 7);
  await waitForFlag('q_portolume_tide_read');
  await record('Observatory tide gauge read');

  await walk(33, 10);
  await page.getByRole('button', { name: 'Vai a sinistra', exact: true }).tap();
  await dialogue.tap();
  await page.getByRole('button', { name: 'Molo di Portolume', exact: true }).tap();
  await expect.poll(async () => (await state()).save.player.spawnPointId).toBe('dock_mainland');
  await settle();
  const beforeMarinaPotions = (await state()).save.inventory.potion ?? 0;
  await walk(22, 14);
  await page.getByRole('button', { name: 'Vai in basso', exact: true }).tap();
  await dialogue.tap();
  await settle();
  await waitForFlag('q_portolume_tide_report');
  current = await state();
  expect(current.save.inventory['old-rod']).toBe(initialOldRod + 1);
  expect(current.save.player.money).toBe(initialMoney + 300);
  expect(current.save.inventory.potion ?? 0).toBe(beforeMarinaPotions + 2);
  await record('Marina received the tide report');

  // A repeat report remains idempotent. Then use the city's authored free Center.
  await walk(22, 14);
  await page.getByRole('button', { name: 'Vai in basso', exact: true }).tap();
  await dialogue.tap();
  await settle();
  current = await state();
  expect(current.save.inventory['old-rod']).toBe(initialOldRod + 1);
  expect(current.save.inventory.potion ?? 0).toBe(beforeMarinaPotions + 2);
  await walk(8, 16);
  await walk(8, 15);
  await dialogue.tap();
  const rest = page.getByRole('button', { name: 'RIPOSA', exact: true });
  await expect(rest).toBeVisible();
  await rest.click();
  await settle();
  expect((await state()).save.party.every((member: any) => member.hp === member.maxHp && !member.status)).toBe(true);
  await record('Portolume Center checked');

  // Save through the title screen, resume through the normal title UI, and
  // compare party/resources before exporting the final natural checkpoint.
  const beforeResume = await state();
  const preserved = {
    party: beforeResume.save.party,
    inventory: beforeResume.save.inventory,
    money: beforeResume.save.player.money,
    badges: beforeResume.save.badges,
  };
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Salva e torna al titolo' }).click();
  await page.getByRole('button', { name: 'Continua partita', exact: true }).click();
  await expect.poll(async () => Boolean(await state())).toBe(true);
  await waitForFlag('q_portolume_tide_report');
  current = await state();
  expect(current.save.party).toEqual(preserved.party);
  expect(current.save.inventory).toEqual(preserved.inventory);
  expect(current.save.player.money).toBe(preserved.money);
  expect(current.save.badges).toEqual(preserved.badges);
  await record('Portolume report survived title and resume');
  await exportCheckpoint('natural-portolume-backup.json');
}
