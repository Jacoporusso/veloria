import { expect, test, type Page } from '@playwright/test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import magneticRouter from '../../content/puzzles/gym04_magnetic.v1.json' with { type: 'json' };
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import { journeyMilestones } from '../../src/game/journey/progress.ts';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 3, reducedMotion: 'reduce' });

const viewports = [
  { name: 'portrait', width: 390, height: 844 },
  { name: 'landscape', width: 844, height: 390 },
] as const;

type Checkpoint = {
  name: string;
  mapId: string;
  milestoneFlag: string;
  resultFlag: string;
  x: number;
  y: number;
  expectedSpeaker?: string;
  router?: boolean;
};

const checkpoints: Checkpoint[] = [
  { name: 'Gym02 garden source', mapId: 'veloria/gym02_petalora', milestoneFlag: 'gym02_water_source_open', resultFlag: 'gym02_water_source_open', x: 5, y: 23, expectedSpeaker: 'Sorgente del giardino' },
  { name: 'Gym03 garden line', mapId: 'veloria/gym03_vetracielo', milestoneFlag: 'gym03_line_gardens_active', resultFlag: 'gym03_line_gardens_active', x: 7, y: 25, expectedSpeaker: 'Linea Giardini' },
  { name: 'Gym04 magnetic field', mapId: 'veloria/gym04_ferraluce', milestoneFlag: 'gym04_magnetic_aligned', resultFlag: 'router_gym04magnetic_field_west', x: 20, y: 10, expectedSpeaker: 'Campo', router: true },
];

async function seedCheckpoint(page: Page, checkpoint: Checkpoint) {
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nglobalThis.__highDensityGame = game;` });
  });
  await page.goto('/');
  await page.setViewportSize({ width: 390, height: 844 });
  await enterGame(page);
  await expect.poll(async () => (await readBrowserSave(page))?.flags).toContain('intro_completed');

  const save = await readBrowserSave(page);
  const targetIndex = journeyMilestones.findIndex(step => step.flag === checkpoint.milestoneFlag);
  if (targetIndex < 0) throw new Error(`Missing milestone for ${checkpoint.milestoneFlag}`);
  const flags = journeyMilestones.slice(0, targetIndex).map(step => step.flag);
  const creature = createBattleCreature({
    species: speciesData.species as any,
    moves: moveData.moves as any,
    speciesId: 194,
    level: 24,
    instanceId: `high-density-${checkpoint.milestoneFlag}`,
    moveIds: ['mud-shot', 'water-gun', 'slam'],
  });
  save.flags = [...new Set([...save.flags.filter(flag => flag === 'intro_completed'), ...flags])];
  save.badges = flags.includes('badge_circuito_awarded')
    ? ['badge_aurora', 'badge_corolla', 'badge_circuito']
    : flags.includes('badge_corolla_awarded') ? ['badge_aurora', 'badge_corolla'] : ['badge_aurora'];
  save.player = { ...save.player, mapId: checkpoint.mapId, spawnPointId: 'from_city', x: checkpoint.x, y: checkpoint.y, money: 500 };
  save.party = [{
    instanceId: creature.instanceId,
    speciesId: creature.speciesId,
    level: creature.level,
    experience: 0,
    hp: creature.hp,
    maxHp: creature.stats.maxHp,
    moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })),
  }];
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  await expect(page.locator('#current-location')).toBeVisible();
}

async function expectCanvasDensity(page: Page) {
  await expect.poll(() => page.locator('#game canvas').evaluate(canvas => {
    const bounds = canvas.getBoundingClientRect();
    return { x: canvas.width / bounds.width, y: canvas.height / bounds.height };
  }), { timeout: 15_000 }).toEqual(expect.objectContaining({ x: expect.closeTo(3, 1), y: expect.closeTo(3, 1) }));
}

async function expectTouchable(locator: ReturnType<Page['getByRole']>, width: number, height: number) {
  const bounds = await locator.boundingBox();
  expect(bounds, 'control has a visible hit area').not.toBeNull();
  expect.soft(bounds!.width, 'touch target width is at least 44 CSS pixels').toBeGreaterThanOrEqual(44);
  expect.soft(bounds!.height, 'touch target height is at least 44 CSS pixels').toBeGreaterThanOrEqual(44);
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
}

async function touchAction(page: Page, width: number, height: number) {
  const action = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
  await expect(action).toBeVisible();
  await expectTouchable(action, width, height);
  await action.tap();
}

function nextMilestoneTitle(flag: string) {
  const index = journeyMilestones.findIndex(step => step.flag === flag);
  return journeyMilestones.slice(index + 1).find(step => !('optional' in step && step.optional))?.title;
}

for (const checkpoint of checkpoints) {
  for (const viewport of viewports) {
    test(`${checkpoint.name}: DPR3 touch control in ${viewport.name} and after rotation`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await seedCheckpoint(page, checkpoint);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await expectCanvasDensity(page);

      const up = page.getByRole('button', { name: 'Vai in alto', exact: true });
      await expect(up).toBeVisible();
      await expectTouchable(up, viewport.width, viewport.height);
      await up.tap();
      await expect.poll(async () => {
        const player = (await readBrowserSave(page)).player;
        return `${player.mapId}:${player.x},${player.y}`;
      }).toBe(`${checkpoint.mapId}:${checkpoint.x},${checkpoint.y - 1}`);

      await touchAction(page, viewport.width, viewport.height);
      if (checkpoint.router) {
        await expect(page.locator('#dialogue-text')).toContainText('Direzione:');
        const rotate = page.getByRole('button', { name: 'RUOTA', exact: true });
        await expect(rotate).toBeVisible();
        await expectTouchable(rotate, viewport.width, viewport.height);
        await rotate.tap();
        await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(checkpoint.resultFlag);
        await expect(page.locator('#dialogue-text')).toContainText('Direzione:');
      } else {
        await expect(page.locator('#dialogue-speaker')).toHaveText(checkpoint.expectedSpeaker!);
        await expect(page.locator('#dialogue-box')).toBeVisible();
        for (let tap = 0; tap < 4 && await page.locator('#dialogue-box').isVisible(); tap++) {
          await touchAction(page, viewport.width, viewport.height);
        }
        await expect(page.locator('#dialogue-box')).toBeHidden();
        await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(checkpoint.resultFlag);
        await expect(page.locator('.journey-heading')).toContainText(nextMilestoneTitle(checkpoint.resultFlag)!);
      }

      const rotated = viewport.name === 'portrait' ? viewports[1] : viewports[0];
      await page.setViewportSize({ width: rotated.width, height: rotated.height });
      await expectCanvasDensity(page);
      if (checkpoint.router) {
        await expectTouchable(page.getByRole('button', { name: 'RUOTA', exact: true }), rotated.width, rotated.height);
      } else {
        await expectTouchable(page.getByRole('button', { name: 'Conferma e interagisci', exact: true }), rotated.width, rotated.height);
      }

      await page.reload();
      await enterGame(page);
      await expectCanvasDensity(page);
      await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(checkpoint.resultFlag);
      if (checkpoint.router) {
        await expect(page.locator('#dialogue-text')).toBeHidden();
        await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
        await expect.poll(async () => {
          const player = (await readBrowserSave(page)).player;
          return `${player.x},${player.y}`;
        }).toBe(`${checkpoint.x},${checkpoint.y - 1}`);
        await touchAction(page, rotated.width, rotated.height);
        await expect(page.locator('#dialogue-text')).toContainText('Direzione:');
        await expect(page.locator('#dialogue-text')).toContainText(/ovest/i);
      } else {
        await expect(page.locator('#dialogue-box')).toBeHidden();
        await expect(page.locator('.journey-heading')).toContainText(nextMilestoneTitle(checkpoint.resultFlag)!);
      }
    });
  }
}
