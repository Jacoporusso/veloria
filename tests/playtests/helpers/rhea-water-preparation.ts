import { expect } from '@playwright/test';
import speciesData from '../../../content/battle/species.v1.json' with { type: 'json' };
import itemsData from '../../../content/items/items.v1.json' with { type: 'json' };
import bankPatch from '../../../content/encounters/r05_bank_patch.encounter.json' with { type: 'json' };
import railPatch from '../../../content/encounters/r05_rail_patch.encounter.json' with { type: 'json' };
import { buyFromShop } from '../../e2e/helpers/shop';
import type { NaturalJourneyContext } from './natural-journey-context';

const PSYDUCK_ID = 54;
const CHARMELEON_ID = 5;
const TARGET_LEVEL = 22;
const HUNT_TILES = [[29, 10], [30, 10]] as const;
const TRAIN_TILES = [[9, 8], [10, 8]] as const;
const CENTER_MAP = 'veloria/vetracielo';
const R05_MAP = 'veloria/r05_viadotto_ciliegi';
const R06_MAP = 'veloria/r06_anello_magnetico';
const FERRALUCE_MAP = 'veloria/ferraluce';

type Member = { instanceId: string; speciesId: number; level: number; experience: number; hp: number; maxHp: number; status?: unknown; moves: Array<{ id: string; pp: number }> };

/** Earn Psyduck through normal encounters, export a catch checkpoint, then train via policy-approved KOs. */
export async function runRheaWaterPreparation(context: NaturalJourneyContext): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = context;
  const initial = (await observe()).save;
  expect((await observe()).mapId).toBe(FERRALUCE_MAP);
  expect(initial.flags).toContain('q_ferraluce_report');
  expect(initial.badges).toContain('badge_circuito');
  const originalCharmeleon = initial.party.find((member: Member) => member.speciesId === CHARMELEON_ID);
  expect(originalCharmeleon, 'The real starter Charmeleon must be preserved').toBeTruthy();
  const nameOf = (speciesId: number) => (speciesData.species as Record<string, { name: string }>)[String(speciesId)].name;
  const ballPrice = (itemsData.items as Record<string, { price: number }>)['poke-ball'].price;

  async function setLeader(member: Member): Promise<void> {
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Apri la squadra' }).click();
    const team = page.getByRole('dialog', { name: 'Squadra', exact: true });
    await team.locator('.pokemon-select').filter({ hasText: nameOf(member.speciesId) }).click();
    const leadButton = team.getByRole('button', { name: '↑ Metti in testa', exact: true });
    if (await leadButton.isVisible()) await leadButton.click();
    await expect.poll(async () => (await observe()).save.party[0].instanceId).toBe(member.instanceId);
    await page.keyboard.press('Escape');
  }

  async function healAtVetracielo(): Promise<void> {
    const current = (await observe()).mapId;
    if (current === R05_MAP) {
      await walk(45, 6);
      expect((await observe()).mapId).toBe(CENTER_MAP);
    } else if (current === R06_MAP) {
      await walk(0, 15);
      expect((await observe()).mapId).toBe(CENTER_MAP);
    } else if (current === FERRALUCE_MAP) {
      await walk(0, 25);
      expect((await observe()).mapId).toBe(R06_MAP);
      await walk(0, 15);
      expect((await observe()).mapId).toBe(CENTER_MAP);
    }
    expect((await observe()).mapId).toBe(CENTER_MAP);
    await interact(15, 20);
    await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
    await settle();
    expect((await observe()).save.party.every((member: Member) => member.hp === member.maxHp && !member.status)).toBe(true);
  }

  async function enterRailPatch(): Promise<void> {
    if ((await observe()).mapId === CENTER_MAP) {
      await walk(0, 25);
      expect((await observe()).mapId).toBe(R05_MAP);
    }
    expect((await observe()).mapId).toBe(R05_MAP);
    await walk(TRAIN_TILES[0][0], TRAIN_TILES[0][1]);
  }

  async function returnToFerraluce(): Promise<void> {
    if ((await observe()).mapId === R05_MAP) {
      await walk(45, 6);
      expect((await observe()).mapId).toBe(CENTER_MAP);
    }
    if ((await observe()).mapId === CENTER_MAP) {
      await walk(39, 25);
      expect((await observe()).mapId).toBe(R06_MAP);
    }
    if ((await observe()).mapId === R06_MAP) {
      await walk(39, 25);
      expect((await observe()).mapId).toBe(FERRALUCE_MAP);
    }
    expect((await observe()).mapId).toBe(FERRALUCE_MAP);
  }

  expect(Object.values(bankPatch.timeBands).every(entries => entries.some(entry => entry.speciesId === PSYDUCK_ID))).toBe(true);
  expect(Object.values(railPatch.timeBands).every(entries => entries.some(entry => [95, 27, 58, 66, 100, 81].includes(entry.speciesId)))).toBe(true);
  // Tiled's encounter trigger is x=8..11, y=7..9. Collision objects do not overlap either selected tile.
  const psyduckAlreadyOwned = initial.party.some((member: Member) => member.speciesId === PSYDUCK_ID);
  let psyduck = initial.party.find((member: Member) => member.speciesId === PSYDUCK_ID) as Member | undefined;

  if (!psyduckAlreadyOwned) {
    const balls = initial.inventory['poke-ball'] ?? 0;
    const affordable = Math.min(Math.max(0, 4 - balls), Math.floor(initial.player.money / ballPrice));
    if (affordable > 0) {
      await interact(30, 21);
      await buyFromShop(page, 'Sfera', affordable);
      await settle();
      await record(`Bought ${affordable} affordable Sfera using earned money`);
    }
    expect((await observe()).save.inventory['poke-ball'] ?? 0, 'No Sfera are granted; catch requires real inventory').toBeGreaterThan(0);
    const paras = initial.party.find((member: Member) => member.speciesId === 46);
    expect(paras, 'Paras is required as the natural catch lead').toBeTruthy();
    expect(initial.party.length).toBeLessThan(6, 'The caught Psyduck must fit in the active party');
    await walk(0, 25);
    expect((await observe()).mapId).toBe(R06_MAP);
    await walk(0, 15);
    expect((await observe()).mapId).toBe(CENTER_MAP);
    await walk(0, 25);
    expect((await observe()).mapId).toBe(R05_MAP);
    await setLeader(paras!);
    await walk(HUNT_TILES[0][0], HUNT_TILES[0][1]);
    expect((await observe()).mapId).toBe(R05_MAP);
    const huntLimit = 360;
    for (let step = 0; step < huntLimit; step++) {
      const save = (await observe()).save;
      psyduck = save.party.find((member: Member) => member.speciesId === PSYDUCK_ID);
      if (psyduck || (save.inventory['poke-ball'] ?? 0) <= 0) break;
      const [x, y] = HUNT_TILES[step % HUNT_TILES.length];
      await walk(x, y);
      if ((step + 1) % 40 === 0) await record(`Natural R05 Psyduck search: ${step + 1} steps`);
    }
    psyduck = (await observe()).save.party.find((member: Member) => member.speciesId === PSYDUCK_ID);
    expect(psyduck, 'Psyduck must be caught through the normal R05 battle controls').toBeTruthy();
    expect((await observe()).save.flags).toContain('pokedex_caught_54');
    await record('Psyduck caught naturally in R05 Sponde del Viadotto');
  }

  expect(psyduck).toBeTruthy();
  await setLeader(originalCharmeleon!);
  if ((await observe()).mapId === R05_MAP) await walk(45, 6);
  if ((await observe()).mapId === FERRALUCE_MAP) {
    await walk(0, 25);
    expect((await observe()).mapId).toBe(R06_MAP);
    await walk(0, 15);
  }
  if ((await observe()).mapId === R06_MAP) await walk(0, 15);
  expect((await observe()).mapId).toBe(CENTER_MAP);
  await healAtVetracielo();
  const caughtCheckpoint = (await observe()).save;
  expect(caughtCheckpoint.party.some((member: Member) => member.instanceId === psyduck!.instanceId)).toBe(true);
  expect(caughtCheckpoint.party[0].instanceId).toBe(originalCharmeleon!.instanceId);
  await record('Psyduck captured checkpoint: healed in Vetracielo, Charmeleon restored as overworld lead');
  await exportCheckpoint('natural-rhea-water-captured-backup.json');

  const maxRounds = Math.min(60, Math.max(1, Number(process.env.PLAYTEST_RHEA_TRAINING_ROUNDS ?? '40')));
  expect(Number.isInteger(maxRounds)).toBe(true);
  const maxStepsPerRound = 80;
  let noProgressRounds = 0;
  for (let round = 0; round < maxRounds; round++) {
    const before = (await observe()).save.party.find((member: Member) => member.instanceId === psyduck!.instanceId)!;
    if (before.level >= TARGET_LEVEL) break;
    if ((await observe()).mapId !== R05_MAP) {
      if ((await observe()).mapId !== CENTER_MAP) await healAtVetracielo();
      await enterRailPatch();
    }
    const lead = (await observe()).save.party[0];
    expect(lead.instanceId).toBe(originalCharmeleon!.instanceId);
    for (let step = 0; step < maxStepsPerRound; step++) {
      const now = (await observe()).save.party.find((member: Member) => member.instanceId === psyduck!.instanceId)!;
      if (now.level >= TARGET_LEVEL || now.hp <= 0 || now.hp < now.maxHp * 0.65) break;
      const [x, y] = TRAIN_TILES[(step + round) % TRAIN_TILES.length];
      await walk(x, y);
    }
    const after = (await observe()).save.party.find((member: Member) => member.instanceId === psyduck!.instanceId)!;
    const gainedXp = after.experience > before.experience;
    noProgressRounds = gainedXp || after.level > before.level ? 0 : noProgressRounds + 1;
    await record(`R05 Rail Patch training round ${round + 1}: Psyduck Lv.${after.level}, XP ${after.experience - before.experience}, HP ${after.hp}/${after.maxHp}`);

    await healAtVetracielo();
    const rested = (await observe()).save.party.find((member: Member) => member.instanceId === psyduck!.instanceId)!;
    expect((await observe()).save.party[0].instanceId).toBe(originalCharmeleon!.instanceId);
    await exportCheckpoint(`natural-rhea-water-training-round-${round + 1}-backup.json`);
    if (noProgressRounds >= 3) {
      await record('Training paused after three consecutive rounds without real Psyduck XP; checkpoint preserved for resume');
      break;
    }
    if (rested.level >= TARGET_LEVEL) break;
    if (round + 1 < maxRounds) await enterRailPatch();
  }

  await returnToFerraluce();
  await interact(9, 21);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
  await settle();
  const atFerraluce = (await observe()).save;
  const finalPsyduck = atFerraluce.party.find((member: Member) => member.instanceId === psyduck!.instanceId)!;
  if (atFerraluce.party[0].instanceId !== originalCharmeleon!.instanceId) await setLeader(originalCharmeleon!);
  const ready = (await observe()).save;
  expect(ready.badges).toEqual(initial.badges);
  for (const flag of initial.flags) expect(ready.flags).toContain(flag);
  expect(ready.player.mapId).toBe(FERRALUCE_MAP);
  expect(ready.party[0].instanceId).toBe(originalCharmeleon!.instanceId);
  expect(ready.party.some((member: Member) => member.instanceId === psyduck!.instanceId)).toBe(true);
  await record(`Rhea preparation terminal checkpoint: Psyduck Lv.${finalPsyduck.level}; earned XP retained`);
  await exportCheckpoint('natural-rhea-water-companion-ready-backup.json');
  expect(finalPsyduck.level, 'Preparation must stop as a visible failure if earned training did not reach Rhea level 22').toBeGreaterThanOrEqual(TARGET_LEVEL);
  expect(finalPsyduck.moves.some(move => move.id === 'water-pulse'), 'Water Pulse must be learned through its actual level-up prompt').toBe(true);
}
