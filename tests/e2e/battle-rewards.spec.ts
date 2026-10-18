import { expect, test, type Page } from '@playwright/test';
test.use({deviceScaleFactor: 2});

async function mount(page: Page, kind: 'capture' | 'box' | 'failed' | 'trainer', reduced: boolean) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export {};' }));
  await page.goto('/');
  await page.evaluate(async ({ kind, reduced }) => {
    await import('/src/style.css' as string);
    const source = await (await fetch('/src/game/scenes/BattleScene.ts')).text();
    const url = source.match(/["']([^"']*\/node_modules\/\.vite\/deps\/phaser\.js[^"']*)["']/)![1];
    const { default: Phaser } = await import(url);
    const { BattleScene } = await import('/src/game/scenes/BattleScene.ts' as string);
    const { observeGameSize } = await import('/src/game/rendering/game-size.ts' as string);
    const { createBattleCreature } = await import('/src/core/battle/create-creature.ts' as string);
    const { createBattleState } = await import('/src/core/battle/engine.ts' as string);
    const { battleSpecies, battleMoves, veloriaBattleRules } = await import('/src/game/battle/catalog.ts' as string);
    document.body.innerHTML = '<div id="reward-fixture" style="width:100vw;height:100vh"></div>';
    const creature = (speciesId: number, id: string) => createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId, level: 8, instanceId: id });
    const player = creature(179, 'own');
    const opponent = { ...creature(7, 'wild'), hp: 1, experienceYield: 0 };
    const rules = kind === 'failed' ? { ...veloriaBattleRules, captureItems: { 'poke-ball': { baseChance: 0 } } } : veloriaBattleRules;
    const state = createBattleState({ battleId: 'rewards', battleType: kind === 'trainer' ? 'trainer' : 'wild', seed: 1, rules,
      playerTeam: kind === 'box' ? Array.from({ length: 6 }, (_, index) => ({ ...player, instanceId: `own-${index}` })) : [player], opponentTeam: [opponent] });
    (window as any).rewardCompletions = 0;
    (window as any).rewardDismissals = 0;
    const scene = new BattleScene();
    (window as any).rewardGame = new Phaser.Game({ type: Phaser.CANVAS, parent: 'reward-fixture', audio: { noAudio: true },
      scale: { mode: Phaser.Scale.NONE, width: '100%', height: '100%' }, scene: [] });
    observeGameSize((window as any).rewardGame, document.querySelector<HTMLElement>('#reward-fixture')!, true);
    (window as any).rewardGame.scene.add('battle', scene, true, { state, rules, moveCatalog: battleMoves, inventory: { 'poke-ball': 1 }, reducedAnimations: reduced,
      victoryPresentation: kind === 'trainer' ? () => ({ trainerName: 'Sera', rewardMoney: 100, feedback: 'Ogni incontro insegna qualcosa!' }) : undefined,
      onComplete: () => { (window as any).rewardCompletions++; },
      onDismiss: () => { (window as any).rewardDismissals++; scene.scene.stop(); },
    });
  }, { kind, reduced });
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).rewardGame?.scene.keys.battle;
    return Boolean(scene?.ui?.list.length && scene.mode === 'menu');
  })).toBe(true);
  expect(errors).toEqual([]);
  return errors;
}

async function tapLabel(page: Page, label: string) {
  const point = await page.evaluate(label => {
    const scene = (window as any).rewardGame.scene.keys.battle;
    const text = scene.ui.list.find((item: any) => item.type === 'Text' && item.text.startsWith(label));
    const bounds = text.getBounds();
    return { x: bounds.centerX * scene.scale.zoom, y: bounds.centerY * scene.scale.zoom };
  }, label);
  await page.touchscreen.tap(point.x, point.y);
}

for (const [kind, reduced, width, height] of [['capture', false, 390, 844], ['box', true, 844, 390]] as const) {
  test(`capture animation and creature receipt: ${kind}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    const errors = await mount(page, kind, reduced);
    await tapLabel(page, 'CATTURA');
    await tapLabel(page, 'POKE-BALL');
    await expect.poll(() => page.evaluate(() => (window as any).rewardGame.scene.keys.battle.ui.list.some((item: any) => item.name === 'capture-sphere'))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('capture-sphere.png') });
    const dialog = page.getByRole('dialog', { name: 'Squirtle catturato!' });
    await expect(dialog).toBeVisible({ timeout: 12_000 });
    await expect(dialog).toContainText('ACQUA · Livello 8');
    await expect(dialog).toContainText(kind === 'box' ? 'ti aspetta nel box' : 'Aggiunto alla tua squadra');
    await expect(dialog).toContainText('Bolla');
    await expect(dialog.locator('.creature-portrait')).toBeVisible();
    const closeBounds = await dialog.getByRole('button', { name: 'Continua', exact: true }).boundingBox();
    expect(closeBounds!.y + closeBounds!.height).toBeLessThanOrEqual(height - 10);
    if (width > height) {
      const skillsFit = await dialog.locator('.battle-celebration-content').evaluate(contents => {
        const last = contents.querySelector('.battle-capture-moves')!.getBoundingClientRect();
        return last.bottom <= contents.getBoundingClientRect().bottom;
      });
      expect(skillsFit).toBe(true);
    }
    if (reduced) expect(await dialog.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    await page.screenshot({ path: testInfo.outputPath('capture-receipt.png'), animations: 'disabled' });
    await dialog.getByRole('button', { name: 'Continua', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => [(window as any).rewardCompletions, (window as any).rewardDismissals])).toEqual([1, 1]);
    expect(errors).toEqual([]);
  });
}

test('failed capture returns to combat without a success banner', async ({ page }) => {
  await mount(page, 'failed', true);
  await tapLabel(page, 'CATTURA'); await tapLabel(page, 'POKE-BALL');
  await expect.poll(() => page.evaluate(() => (window as any).rewardGame.scene.keys.battle.eventLog.some((event: any) => event.type === 'captureFailed'))).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).rewardGame.scene.keys.battle.mode)).toBe('menu');
  await expect(page.locator('.battle-celebration')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).rewardCompletions)).toBe(0);
});

test('trainer victory celebrates rewards and feedback without granting them again', async ({ page }, testInfo) => {
  await mount(page, 'trainer', true);
  await page.keyboard.press('Enter', { delay: 40 }); await page.keyboard.press('Enter', { delay: 40 });
  const dialog = page.getByRole('dialog', { name: 'Hai vinto contro Sera!' });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(dialog).toContainText('+100 monete');
  await expect(dialog).toContainText('Ogni incontro insegna qualcosa');
  await page.screenshot({ path: testInfo.outputPath('trainer-receipt.png') });
  await page.keyboard.press('Enter', { delay: 40 });
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => [(window as any).rewardCompletions, (window as any).rewardDismissals])).toEqual([1, 1]);
});
