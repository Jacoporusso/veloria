import { expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import bruno from '../../../content/trainers/r10_bruno.trainer.json' with { type: 'json' };
import maya from '../../../content/trainers/r10_maya.trainer.json' with { type: 'json' };
import speciesData from '../../../content/battle/species.v1.json' with { type: 'json' };
import type { NaturalJourneyContext } from './natural-journey-context';

const trainers = { bruno, maya };
type Placement = { x: number; y: number; properties?: Array<{ name: string; value: unknown }> };

/** Earn the route trainer's XP/reward once, preserving losses and spent items. */
export async function runAcquarivaRouteTraining(context: NaturalJourneyContext): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = context;
  const key = process.env.PLAYTEST_ACQUARIVA_TRAINER as keyof typeof trainers;
  expect(Object.keys(trainers)).toContain(key);
  const trainer = trainers[key];
  expect((await observe()).mapId).toBe('veloria/acquariva');
  const initial = (await observe()).save;
  expect(initial.badges).toHaveLength(5);
  expect(initial.flags).toContain('q_acquariva_report');
  if (initial.flags.includes(trainer.battleOnceFlag)) {
    await record(`${trainer.name} already defeated: no repeat reward requested`);
    await exportCheckpoint(`natural-${key}-attempt-backup.json`); return;
  }
  async function rest() {
    await interact(8, 13); await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  }
  await rest();
  const lead = initial.party.find(member => [96, 97].includes(member.speciesId));
  expect(lead, 'The earned psychic companion must be in the party').toBeTruthy();
  const name = (speciesData.species as Record<string, { name: string }>)[lead!.speciesId].name;
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la squadra' }).click();
  const team = page.getByRole('dialog', { name: 'Squadra', exact: true });
  await team.locator('.pokemon-select').filter({ hasText: name }).click();
  const first = team.getByRole('button', { name: '↑ Metti in testa', exact: true });
  if (await first.isVisible()) await first.click();
  await expect.poll(async () => (await observe()).save.party[0].instanceId).toBe(lead!.instanceId);
  await page.keyboard.press('Escape');
  await walk(0, 16);
  expect((await observe()).mapId).toBe('veloria/r10_sentiero_canne');
  const tiled = JSON.parse(await readFile(new URL('../../../public/tilemaps/r10_sentiero_canne.tmj', import.meta.url), 'utf8')) as { layers: Array<{ objects?: Placement[] }> };
  const placement = tiled.layers.flatMap(layer => layer.objects ?? []).find(object => object.properties?.some(property => property.name === 'trainerId' && property.value === trainer.id));
  expect(placement, 'Use the actual authored trainer position').toBeTruthy();
  await walk(placement!.x / 32, placement!.y / 32 + 1);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap(); await settle();
  await page.getByRole('button', { name: 'SFIDA', exact: true }).click(); await settle();
  await record(`${trainer.name} earned route-training attempt`);
  const after = (await observe()).save;
  const won = after.flags.includes(trainer.battleOnceFlag);
  expect(after.player.money).toBe(initial.player.money + (won ? trainer.rewardMoney : 0));
  expect(after.badges).toEqual(initial.badges);
  await record(won ? `${trainer.name} reward earned once` : `${trainer.name} loss preserved for preparation review`);
  await walk(39, 5);
  expect((await observe()).mapId).toBe('veloria/acquariva');
  await rest();
  expect((await observe()).save.party.every(member => member.hp === member.maxHp && !member.status)).toBe(true);
  await record('Earned route-training result retained after returning to the free Center');
  await exportCheckpoint(`natural-${key}-attempt-backup.json`);
}
