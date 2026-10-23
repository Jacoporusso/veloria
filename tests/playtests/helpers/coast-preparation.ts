import { expect, type Page } from '@playwright/test';
import { buyFromShop } from '../../e2e/helpers/shop';

/** Earn a coastal companion from the actual checkpoint, without replacing RNG, party or resources. */
export async function runCoastPreparation(args: {
  page: Page; walk(x: number, y: number): Promise<void>; interact(x: number, y: number): Promise<void>;
  settle(): Promise<void>; observe(): Promise<any>; record(label: string): Promise<void>;
  exportCheckpoint(filename: string): Promise<void>;
}): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = args;
  expect(['veloria/portolume', 'veloria/r08_costa_turbine']).toContain((await observe()).mapId);
  const initial = (await observe()).save;
  expect(initial.badges).toHaveLength(4);
  expect(initial.inventory['old-rod']).toBe(1);
  const action = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
  if (!initial.party.some((member: any) => member.speciesId === 170)) {
    expect((await observe()).mapId).toBe('veloria/portolume');
    await interact(14, 14);
    await buyFromShop(page, 'Sfera', 4);
    expect((await observe()).save.player.money).toBe(initial.player.money - 600);
    await record('Bought four capture balls with earned money');
  }

  async function rest() {
    const cancelFishing = page.getByRole('button', { name: 'NON PESCARE', exact: true });
    if (await cancelFishing.isVisible()) await cancelFishing.click();
    if ((await observe()).mapId === 'veloria/r08_costa_turbine') {
      await walk(39, 11);
      await expect.poll(async () => (await observe()).mapId).toBe('veloria/portolume');
    }
    expect((await observe()).mapId).toBe('veloria/portolume');
    await interact(8, 14);
    await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
    await settle();
    expect((await observe()).save.party.every((member: any) => member.hp === member.maxHp && !member.status)).toBe(true);
  }
  async function fish() {
    if ((await observe()).mapId === 'veloria/portolume') {
      await walk(0, 17);
      await expect.poll(async () => (await observe()).mapId).toBe('veloria/r08_costa_turbine');
    }
    await walk(21, 13);
    await page.getByRole('button', { name: 'Vai in basso', exact: true }).tap();
    await action.tap();
    await page.getByRole('button', { name: 'PESCA', exact: true }).click();
    await expect.poll(async () => page.evaluate(() => !(window as any).__naturalGame.scene.keys.world.fishingActive)).toBe(true);
    await settle();
    const cancelFishing = page.getByRole('button', { name: 'NON PESCARE', exact: true });
    if (await cancelFishing.isVisible()) await cancelFishing.click();
  }
  for (let cast = 0; cast < 16; cast++) {
    const state = (await observe()).save;
    if (state.party.some((member: any) => member.speciesId === 170)) break;
    expect(state.inventory['poke-ball'], 'Capture supplies are finite; never grant more balls').toBeGreaterThan(0);
    await fish();
    await record(`Coastal search cast ${cast + 1}`);
    if (!(await observe()).save.party.some((member: any) => member.speciesId === 170)) await rest();
  }
  const caught = (await observe()).save.party.find((member: any) => member.speciesId === 170);
  expect(caught, 'Chinchou must actually be caught within the recorded search budget').toBeTruthy();
  await record('Chinchou caught using real battle commands');
  await rest();
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la squadra' }).click();
  const team = page.getByRole('dialog', { name: 'Squadra', exact: true });
  await team.locator('.pokemon-select').filter({ hasText: 'Chinchou' }).click();
  await team.getByRole('button', { name: '↑ Metti in testa', exact: true }).click();
  await expect.poll(async () => (await observe()).save.party[0].instanceId).toBe(caught.instanceId);
  await page.keyboard.press('Escape');
  await record('Caught companion leads the party through the real Team menu');
  for (let battle = 0; battle < 3; battle++) {
    await fish();
    await record(`Coastal training cast ${battle + 1}`);
    await rest();
  }
  await record('Coastal companion preparation checkpoint');
  await exportCheckpoint('natural-coastal-companion-backup.json');
}
