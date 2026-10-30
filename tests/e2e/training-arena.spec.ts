import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { fightWithTouch } from './helpers/battle-touch';
import { buyFromShop } from './helpers/shop';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import league from '../../content/challenges/veloria_league.sequence.json' with { type: 'json' };

const TRAINING_BUTTON = 'Apri allenamenti della Lega';
const PENDING_PREFIX = 'training_attempt_pending_';
const PAID_PREFIX = 'training_attempt_paid_';
const TIERS = [
  { level: 30, reward: 500 },
  { level: 40, reward: 800 },
  { level: 50, reward: 1200 },
  { level: 60, reward: 1800 },
  { level: 70, reward: 2500 },
  { level: 80, reward: 3200 },
] as const;

async function installGameHook(page: Page) {
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch({ maxRetries: 2 });
    await route.fulfill({ response, body: `${await response.text()}\n globalThis.__trainingGame=game;` });
  });
}

async function seedTrainingSave(page: Page, options: {
  visited?: boolean;
  activeLeague?: boolean;
  noHp?: boolean;
  outsideLeague?: boolean;
} = {}) {
  await page.goto('/');
  await enterGame(page);
  const save = await readBrowserSave(page);
  const flags = new Set([
    ...save.flags.filter(flag => !flag.startsWith('challenge_velorialeague_') && !flag.startsWith('training_attempt_')),
    'q_starter_selected',
    'intro_completed',
    'tutorial_habitat_seen',
    'prologue_complete_seen',
    'q_resonance_restored',
  ]);
  if (options.visited) {
    flags.add('q_league_visited');
    flags.add('q_league_orientation');
  }
  if (options.activeLeague) flags.add('challenge_velorialeague_active');
  save.flags = [...flags];
  save.player = {
    ...save.player,
    mapId: options.outsideLeague ? 'veloria/r16_cammino_equilibrio' : 'veloria/league_forecourt',
    spawnPointId: options.outsideLeague ? 'from_concordia' : 'league_checkpoint',
    x: options.outsideLeague ? 20 : 20,
    y: options.outsideLeague ? 10 : 8,
    money: 0,
  };
  save.inventory.potion = 0;
  if (options.activeLeague) {
    save.badges = [...league.requiredBadgeIds];
    save.player = { ...save.player, mapId: 'veloria/league_council01', spawnPointId: 'from_entry', x: 16, y: 8 };
  }

  // A controlled, high-level integration party makes training battles short and
  // isolates the arena's persistence/reward behavior from level balance.
  const creature = createBattleCreature({
    species: species.species as any,
    moves: moves.moves as any,
    speciesId: 150,
    level: 80,
    instanceId: 'training-arena-player',
    moveIds: ['psychic'],
  });
  save.party = Array.from({ length: 3 }, (_, index) => ({
    instanceId: `training-arena-player-${index}`,
    speciesId: creature.speciesId,
    level: creature.level,
    experience: 0,
    hp: options.noHp ? 0 : creature.stats.maxHp,
    maxHp: creature.stats.maxHp,
    moves: creature.moves.map(move => ({ id: move.moveId, pp: move.pp })),
  }));
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  await page.getByRole('button', { name: 'Salva la partita', exact: true }).click();
}

function serviceDialog(page: Page) {
  return page.locator('#dialogue-box').filter({ hasText: 'Allenamenti della Lega' });
}

function tierButton(page: Page, level: number, reward: number) {
  return page.getByRole('button', { name: `LIVELLO ${level} · ${reward} MONETE`, exact: true });
}

async function openService(page: Page) {
  if (await page.locator('#exploration-menu').isHidden()) {
    await page.getByRole('button', { name: 'Apri menu di gioco', exact: true }).click();
  }
  await page.getByRole('button', { name: TRAINING_BUTTON, exact: true }).click();
  await expect(serviceDialog(page)).toBeVisible();
}

async function openTrainingMenu(page: Page) {
  if (await page.locator('#exploration-menu').isHidden()) {
    await page.getByRole('button', { name: 'Apri menu di gioco', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: TRAINING_BUTTON, exact: true })).toBeVisible();
  await page.getByRole('button', { name: TRAINING_BUTTON, exact: true }).click();
}

async function chooseAndStart(page: Page, level: number, reward: number) {
  await tierButton(page, level, reward).click();
  const confirmation = page.locator('#dialogue-box').filter({ hasText: 'INIZIA ALLENAMENTO' });
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText(`${reward} monete`);
  await confirmation.getByRole('button', { name: 'INIZIA ALLENAMENTO', exact: true }).click();
  await expect.poll(async () => (await readBrowserSave(page)).flags.filter(flag => flag.startsWith(PENDING_PREFIX)).length).toBe(1);
}

async function finishBattle(page: Page) {
  await fightWithTouch(page, '__trainingGame', { 150: 'Psichico' });
  const receipt = page.getByRole('dialog').filter({ hasText: 'Allenatore dell’Arena' });
  await expect(receipt).toBeVisible({ timeout: 20_000 });
  await receipt.getByRole('button', { name: 'Continua', exact: true }).click();
  await expect(receipt).toBeHidden();
}

function storyFlags(flags: string[]) {
  return flags.filter(flag => !flag.startsWith(PENDING_PREFIX) && !flag.startsWith(PAID_PREFIX) && !flag.startsWith('pokedex_seen_'));
}

test('League training menu unlocks after a League visit and exposes every tier and reward', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installGameHook(page);
  await seedTrainingSave(page, { visited: true, outsideLeague: true });

  await page.getByRole('button', { name: 'Apri menu di gioco', exact: true }).click();
  await expect(page.getByRole('button', { name: TRAINING_BUTTON, exact: true })).toBeVisible();
  await openService(page);
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    const box = await serviceDialog(page).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({ path: info.outputPath(`training-menu-${viewport.width}.png`) });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const tier of TIERS) {
    await expect(tierButton(page, tier.level, tier.reward)).toBeVisible();
    await tierButton(page, tier.level, tier.reward).click();
    const confirmation = page.locator('#dialogue-box').filter({ hasText: 'INIZIA ALLENAMENTO' });
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText(`${tier.reward} monete`);
    await expect(confirmation.getByRole('button', { name: 'CAMBIA LIVELLO', exact: true })).toBeVisible();
    await expect(confirmation.getByRole('button', { name: 'NON ORA', exact: true })).toBeVisible();
    await confirmation.getByRole('button', { name: 'CAMBIA LIVELLO', exact: true }).click();
    await expect(serviceDialog(page)).toBeVisible();
  }
  await tierButton(page, 30, 500).click();
  await page.locator('#dialogue-box').getByRole('button', { name: 'NON ORA', exact: true }).click();
  expect((await readBrowserSave(page)).flags.some(flag => flag.startsWith(PENDING_PREFIX))).toBe(false);
});

test('two training victories each pay once, preserve battle progress, and leave League story flags unchanged', async ({ page }) => {
  test.setTimeout(process.env.CI ? 240_000 : 150_000);
  await page.setViewportSize({ width: 844, height: 390 });
  await installGameHook(page);
  await seedTrainingSave(page, { visited: true });
  const before = await readBrowserSave(page);
  const beforeStory = storyFlags(before.flags);

  for (let win = 1; win <= 2; win++) {
    await openService(page);
    await chooseAndStart(page, 30, 500);
    const started = await readBrowserSave(page);
    const pending = started.flags.find(flag => flag.startsWith(PENDING_PREFIX));
    expect(pending).toBeTruthy();
    await finishBattle(page);

    const won = await readBrowserSave(page);
    expect(won.player.money).toBe(win * 500);
    expect(won.flags).toContain(`${PAID_PREFIX}${pending!.slice(PENDING_PREFIX.length)}`);
    expect(won.flags.some(flag => flag.startsWith(PENDING_PREFIX))).toBe(false);
    expect(storyFlags(won.flags)).toEqual(beforeStory);
    expect(won.party.some((member, index) => member.experience > 0 || member.moves[0].pp < started.party[index].moves[0].pp)).toBe(true);

    await page.reload();
    await enterGame(page);
    const afterReload = await readBrowserSave(page);
    expect(afterReload.player.money).toBe(win * 500);
    expect(afterReload.party.map(member => ({ experience: member.experience, moves: member.moves })))
      .toEqual(won.party.map(member => ({ experience: member.experience, moves: member.moves })));
    expect(storyFlags(afterReload.flags)).toEqual(beforeStory);
  }

  // The existing forecourt market remains usable with earned training money.
  await walkTo(page, 'league_forecourt.tmj', 31, 15);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  await buyFromShop(page, 'Pozione');
  expect((await readBrowserSave(page)).inventory.potion).toBe(1);
});

test('a pending attempt is cleared on reload without reward or story progression', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installGameHook(page);
  await seedTrainingSave(page, { visited: true });
  const before = await readBrowserSave(page);
  const beforeStory = storyFlags(before.flags);
  await openService(page);
  await chooseAndStart(page, 30, 500);
  const pendingSave = await readBrowserSave(page);
  expect(pendingSave.player.money).toBe(0);
  await page.reload();
  await enterGame(page);
  await expect.poll(async () => (await readBrowserSave(page)).flags.some(flag => flag.startsWith(PENDING_PREFIX))).toBe(false);
  const recovered = await readBrowserSave(page);
  expect(recovered.player.money).toBe(0);
  expect(recovered.flags.some(flag => flag.startsWith(PENDING_PREFIX))).toBe(false);
  expect(recovered.flags.some(flag => flag.startsWith(PAID_PREFIX))).toBe(false);
  expect(storyFlags(recovered.flags)).toEqual(beforeStory);
});

test('training stays locked before the League and blocked during the championship or without usable HP', async ({ page }) => {
  await installGameHook(page);
  await seedTrainingSave(page, { outsideLeague: true });
  await openTrainingMenu(page);
  await expect(page.locator('#dialogue-box')).toContainText('Raggiungi il piazzale della Lega');
  for (let i = 0; i < 4 && await page.locator('#dialogue-box').isVisible(); i++) await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).click();
  await expect(page.locator('#dialogue-box')).toBeHidden();

  await seedTrainingSave(page, { visited: true, activeLeague: true });
  await openTrainingMenu(page);
  await expect(page.locator('#dialogue-box')).toContainText('Concludi o interrompi il tentativo della Lega');
  for (let i = 0; i < 4 && await page.locator('#dialogue-box').isVisible(); i++) await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).click();
  await expect(page.locator('#dialogue-box')).toBeHidden();

  await seedTrainingSave(page, { visited: true, noHp: true });
  await openService(page);
  await tierButton(page, 30, 500).click();
  await page.locator('#dialogue-box').filter({ hasText: 'INIZIA ALLENAMENTO' })
    .getByRole('button', { name: 'INIZIA ALLENAMENTO', exact: true }).click();
  await expect(page.locator('#toast')).toContainText('La squadra è esausta');
  const exhausted = await readBrowserSave(page);
  expect(exhausted.player.money).toBe(0);
  expect(exhausted.flags.some(flag => flag.startsWith(PENDING_PREFIX))).toBe(false);
});

test('failed durable save blocks training launch and retry does not duplicate an attempt', async ({ page }) => {
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (this === localStorage && key.startsWith('veloria-save') && sessionStorage.getItem('training-quota') === '1') throw new DOMException('Test quota', 'QuotaExceededError');
      return set.call(this, key, value);
    };
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(...args: Parameters<typeof put>) {
      if (this.name === 'saves' && sessionStorage.getItem('training-quota') === '1') throw new DOMException('Test quota', 'QuotaExceededError');
      return put.apply(this, args);
    };
  });
  await installGameHook(page); await seedTrainingSave(page, { visited: true });
  await openService(page); await tierButton(page, 30, 500).click();
  await page.evaluate(() => sessionStorage.setItem('training-quota', '1'));
  await page.getByRole('button', { name: 'INIZIA ALLENAMENTO', exact: true }).click();
  const retry = page.getByRole('button', { name: 'RIPROVA SALVATAGGIO', exact: true });
  await expect(retry).toBeVisible();
  await page.getByRole('button', { name: 'Annulla', exact: true }).click();
  await expect(retry).toBeVisible();
  expect(await page.evaluate(() => Boolean((window as any).__trainingGame.scene.isActive('battle')))).toBe(false);
  expect((await readBrowserSave(page)).flags.some(flag => flag.startsWith(PENDING_PREFIX))).toBe(false);
  await page.evaluate(() => sessionStorage.removeItem('training-quota'));
  await retry.click();
  await expect.poll(async () => (await readBrowserSave(page)).flags.filter(flag => flag.startsWith(PENDING_PREFIX)).length).toBe(1);
  await expect.poll(() => page.evaluate(() => (window as any).__trainingGame.scene.isActive('battle'))).toBe(true);
  await page.reload(); await enterGame(page);
  await expect.poll(async () => (await readBrowserSave(page)).flags.some(flag => flag.startsWith(PENDING_PREFIX))).toBe(false);
  expect((await readBrowserSave(page)).player.money).toBe(0);
});
