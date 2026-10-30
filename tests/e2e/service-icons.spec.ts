import { buyFromShop } from './helpers/shop';
import { tapBattleLabel } from './helpers/battle-touch';
import { expect, test } from '@playwright/test';

test.use({ deviceScaleFactor: 3, reducedMotion: 'reduce' });
test('healing and market show recognizable icons while their actions and names remain usable', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nglobalThis.__serviceIconGame = game;' });
  });
  await page.goto('/?previewMap=veloria/vetracielo');
  await expect(page.locator('#game-loading')).toBeHidden();
  await page.evaluate(() => {
    const scene = (window as any).__serviceIconGame.scene.keys.world;
    scene.save.party[0].hp = 1;
    scene.showHealingMenu('Centro Pokémon', true);
  });
  const rest = page.getByRole('button', { name: 'RIPOSA', exact: true });
  await expect(rest.locator('svg.service-option__icon--rest')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.getByRole('button', { name: 'DEPOSITO', exact: true }).locator('svg')).toBeVisible();
  for (const [width, height] of [[360, 780], [844, 390]]) {
    await page.setViewportSize({ width, height });
    const bounds = await rest.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
    await page.screenshot({ path: info.outputPath(`rest-${width}.png`) });
  }
  await rest.click();
  expect(await page.evaluate(() => {
    const party = (window as any).__serviceIconGame.scene.keys.world.save.party;
    return party.every((creature: any) => creature.hp === creature.maxHp);
  })).toBe(true);
  await page.evaluate(() => {
    const scene = (window as any).__serviceIconGame.scene.keys.world;
    scene.save.player.money = 500;
    scene.showShopMenu('Mercato', 'veloria/vetracielo_shop');
  });
  for (const kind of ['potion', 'antidote', 'pokeball']) await expect(page.locator(`.service-option__icon--${kind}`)).toBeVisible();
  const previous = await page.evaluate(() => (window as any).__serviceIconGame.scene.keys.world.save.inventory.potion ?? 0);
  await page.screenshot({ path: info.outputPath('market-icons.png') });
  await buyFromShop(page, 'Pozione');
  expect(await page.evaluate(() => (window as any).__serviceIconGame.scene.keys.world.save.inventory.potion)).toBe(previous + 1);
  expect(await page.evaluate(() => (window as any).__serviceIconGame.scene.keys.world.save.player.money)).toBe(300);
  expect(errors).toEqual([]);
});

test('real battle bag shows Italian names, quantities and recovery effects', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nglobalThis.__bagGame = game;' });
  });
  await page.goto('/?previewMap=veloria/borgofonte_lab');
  await expect(page.locator('#game-loading')).toBeHidden();
  await page.evaluate(() => {
    const world = (window as any).__bagGame.scene.keys.world;
    world.save.inventory = { potion: 2, 'super-potion': 1, antidote: 1, 'poke-ball': 3 };
    world.save.party[0].hp = 1;
    world.startWildBattle(16, 5);
  });
  const labels = () => page.evaluate(() => (window as any).__bagGame.scene.keys.battle.ui.list
    .filter((item: any) => item.type === 'Text').map((item: any) => item.text));
  await tapBattleLabel(page, '__bagGame', 'CATTURA');
  await expect.poll(labels).toContain('SFERA · ×3\nCattura ~25%');
  await tapBattleLabel(page, '__bagGame', 'BORSA');
  for (const [width, height] of [[390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await expect.poll(labels).toContain('POZIONE · ×2\n♥ +20 HP');
    await expect.poll(labels).toContain('SUPERPOZIONE · ×1\n♥ +50 HP');
    await expect.poll(labels).toContain('ANTIDOTO · ×1\n✚ Cura veleno');
    await page.screenshot({ path: info.outputPath(`battle-bag-${width}.png`) });
  }
  await tapBattleLabel(page, '__bagGame', 'POZIONE');
  await expect.poll(() => page.evaluate(() => (window as any).__bagGame.scene.keys.battle.remainingInventory.potion)).toBe(1);
  expect(errors).toEqual([]);
});
