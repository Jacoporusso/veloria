import { expect, type Page } from '@playwright/test';
import { buyFromShop } from '../../e2e/helpers/shop';

/** Attempt the fifth gym with the actually earned Gen I party and UI services. */
export async function runNereaAttempt(args: {
  page: Page; walk(x: number, y: number): Promise<void>; interact(x: number, y: number): Promise<void>;
  settle(): Promise<void>; observe(): Promise<any>; record(label: string): Promise<void>;
  challenge(x: number, y: number, label: string): Promise<void>;
  exportCheckpoint(filename: string): Promise<void>;
}): Promise<void> {
  const { page, walk, interact, settle, observe, record, challenge, exportCheckpoint } = args;
  const later = page.getByRole('button', { name: 'NON ORA', exact: true });
  let state = await observe();
  expect(state.save.party.every((member: any) => member.speciesId >= 1 && member.speciesId <= 151),
    'The Gen I checkpoint must contain only earned Kanto species').toBe(true);

  if (state.mapId === 'veloria/gym05_portolume') { await walk(15, 23); state = await observe(); }
  if (state.mapId !== 'veloria/gym05_portolume') {
    if (state.mapId === 'veloria/r08_costa_turbine') {
      await walk(39, 11);
      state = await observe();
    }
    expect(state.mapId).toBe('veloria/portolume');
    expect(state.save.badges).toHaveLength(4);
    expect(state.save.flags).toContain('q_portolume_tide_report');
    await interact(8, 14);
    await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
    state = await observe();
    expect(state.save.party.every((member: any) => member.hp === member.maxHp && !member.status)).toBe(true);
    await record('Earned Gen I party rested before the coastal attempt');
    await exportCheckpoint('natural-nerea-rested-backup.json');
    const violaAlreadyWon = state.save.flags.includes('trainer_r08_viola_defeated');
    // Viola is optional in the game. A direct attempt must not manufacture her
    // reward or force a rematch merely to satisfy the driver's chosen route.
    if (violaAlreadyWon || process.env.PLAYTEST_DIRECT_NEREA === '1') {
      await record(violaAlreadyWon ? 'Proceeding after the earned Viola victory' : 'Proceeding directly to Nerea without the optional Viola reward');
      await interact(8, 14);
      await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
      await settle();
      await walk(18, 6);
    } else {
      const initialMoney = state.save.player.money;
      let supplyCost = 0;
      if (process.env.PLAYTEST_SKIP_SUPPLIES !== '1') {
        await interact(14, 14);
        await buyFromShop(page, 'Superpozione');
        supplyCost += 700;
        expect((await observe()).save.player.money).toBe(initialMoney - supplyCost);
        await record('Bought a Super Potion with earned coastal checkpoint money');
        if (process.env.PLAYTEST_EXTRA_POTION === '1') {
          await interact(14, 14);
          await buyFromShop(page, 'Pozione');
          supplyCost += 200;
          expect((await observe()).save.player.money).toBe(initialMoney - supplyCost);
          await record('Bought one additional Potion with earned preparation money');
        }
      } else await record('Attempt uses the earned team without purchasing supplies');

      await walk(0, 17);
      await expect.poll(async () => (await observe()).mapId).toBe('veloria/r08_costa_turbine');
      await challenge(20, 11, 'Viola natural preparation attempt');
      if (await later.isVisible()) await later.click();
      state = await observe();
      if (!state.save.flags.includes('trainer_r08_viola_defeated')) {
        await record('Viola not defeated: preserve the real result for preparation review');
        await exportCheckpoint('natural-viola-attempt-backup.json');
        expect(state.save.flags, 'This chosen preparation route stops after losing the optional Viola challenge; preserve the loss before preparing again').toContain('trainer_r08_viola_defeated');
        return;
      }
      expect(state.save.player.money).toBe(initialMoney - supplyCost + 1050);
      await walk(39, 11);
      await expect.poll(async () => (await observe()).mapId).toBe('veloria/portolume');
      await interact(8, 14);
      await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
      await settle();
      await interact(14, 14);
      await buyFromShop(page, 'Superpozione');
      await interact(14, 14);
      await buyFromShop(page, 'Pozione', 2);
      await record('Viola reward funded gym supplies and Center rest');
      await walk(18, 6);
      await expect.poll(async () => (await observe()).mapId).toBe('veloria/gym05_portolume');
    }
  }

  expect((await observe()).mapId).toBe('veloria/gym05_portolume');
  for (const [x, y, flag] of [[8, 17, 'gym05_basin_balanced'], [24, 10, 'gym05_sluice_open'], [8, 4, 'gym05_tide_stable']] as const) {
    if ((await observe()).save.flags.includes(flag)) continue;
    await walk(x, y + 1);
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
    await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
    await settle();
    expect((await observe()).save.flags).toContain(flag);
  }
  await record('Nerea sluices completed with the earned Gen I party');

  await exportCheckpoint('natural-nerea-prebattle-backup.json');
  const beforeGym = (await observe()).save;
  await walk(16, 4);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  await settle();
  await page.getByRole('button', { name: 'SFIDA', exact: true }).click();
  await settle();
  await record('Nerea natural attempt completed');
  if (await later.isVisible()) await later.click();

  const result = (await observe()).save;
  if (result.flags.includes('badge_marea_awarded')) {
    expect(result.badges).toHaveLength(5);
    expect(result.player.money).toBe(beforeGym.player.money + 1400);
    await record('Fifth medal earned naturally');
  } else {
    expect(result.badges).toHaveLength(4);
    await record('Nerea not defeated: preserve the loss and remaining resources');
  }
  await exportCheckpoint('natural-nerea-attempt-backup.json');
  expect(result.flags, 'Preserve the actual defeat checkpoint before reporting the incomplete fifth medal').toContain('badge_marea_awarded');
}
