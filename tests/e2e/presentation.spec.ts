import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';

test('journey journal shows real progress and returns focus without moving the player', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await enterGame(page);
  const journal = page.getByRole('button', { name: 'Apri diario del viaggio' });
  await expect(journal).toContainText('Un compagno di viaggio');
  await journal.click();
  await expect(page.getByRole('dialog', { name: 'Il tuo viaggio' })).toBeVisible();
  const summaryCount = page.locator('.journey-summary .journey-stat').first().locator('strong');
  await expect(summaryCount).toHaveText(await journal.locator('.journey-count').innerText());
  await expect(page.locator('.journey-next h3')).toHaveText(await journal.locator('.journey-heading').innerText());
  await page.keyboard.press('Tab');
  await expect(page.locator('.journey-contents')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.journey-close')).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('journey-mobile.png') });
  await page.keyboard.press('Escape', { delay: 40 });
  await expect(page.getByRole('dialog', { name: 'Il tuo viaggio' })).toBeHidden();
  await expect(journal).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('world-modernized-mobile.png') });
});

for (const [width, height] of [[390, 844], [320, 568], [844, 390]]) {
test(`illustrated battle remains usable at ${width}x${height}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  // Isolated presentation fixture: uses the real battle scene/core, never the user's save.
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export {};' }));
  await page.goto('/');
  await page.evaluate(async () => {
    // Use Vite's exact optimized dependency URL; two Phaser copies break Scene instanceof.
    const sceneSource = await (await fetch('/src/game/scenes/BattleScene.ts')).text();
    const phaserUrl = sceneSource.match(/["']([^"']*\/node_modules\/\.vite\/deps\/phaser\.js[^"']*)["']/)?.[1];
    if (!phaserUrl) throw new Error('Phaser dependency URL missing from the dev module.');
    const { default: Phaser } = await import(phaserUrl);
    const { BattleScene } = await import('/src/game/scenes/BattleScene.ts' as string);
    const { preloadCreatureArt } = await import('/src/game/battle/creature-art.ts' as string);
    const { battleSpecies, battleMoves, veloriaBattleRules } = await import('/src/game/battle/catalog.ts' as string);
    const { createBattleCreature } = await import('/src/core/battle/create-creature.ts' as string);
    const { createBattleState } = await import('/src/core/battle/engine.ts' as string);
    document.body.innerHTML = '<div id="battle-fixture" style="width:100vw;height:100vh"></div>';
    document.body.style.margin = '0';
    const creature = (speciesId: number, instanceId: string) => createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId, level: 8, instanceId });
    const state = createBattleState({ battleId: 'presentation', battleType: 'wild', seed: 25, rules: veloriaBattleRules, playerTeam: [creature(179, 'own-mareep')], opponentTeam: [creature(10, 'wild-caterpie')] });
    class Fixture extends Phaser.Scene {
      constructor() { super('fixture'); }
      preload() {
        preloadCreatureArt(this);
        this.load.image('qa-forest', '/assets/battle/veloria-battle-forest-v1.webp');
      }
      create() {
        this.scene.start('battle', { state, moveCatalog: battleMoves, rules: veloriaBattleRules, arenaTextureKey: 'qa-forest', inventory: { potion: 2, 'poke-ball': 3 }, onComplete: () => undefined });
      }
    }
    (window as any).battleFixture = new Phaser.Game({ type: Phaser.CANVAS, parent: 'battle-fixture', audio: { noAudio: true }, scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: [Fixture, BattleScene] });
    const {observeGameSize}=await import('/src/game/rendering/game-size.ts' as string);
    observeGameSize((window as any).battleFixture,document.querySelector<HTMLElement>('#battle-fixture')!);
  });
  await expect.poll(async () => ({ active: await page.evaluate(() => Boolean((window as any).battleFixture?.scene.isActive('battle'))), errors })).toEqual({ active: true, errors: [] });
  {
    await expect.poll(() => page.evaluate(() => (window as any).battleFixture.scale.width)).toBe(width);
    const actors = await page.evaluate(() => {
      const scene = (window as any).battleFixture.scene.getScene('battle');
      return Object.values(scene.actors).map((actor: any) => actor.list.some((child: any) => child.type === 'Image' && child.texture.key.startsWith('veloria-creatures-')));
    });
    expect(actors).toEqual([true, true]);
    await page.screenshot({ path: testInfo.outputPath(`battle-${width}x${height}.png`) });
  }
  if (width !== 390) {
    await page.keyboard.press('Enter', { delay: 40 });
    await expect.poll(() => page.evaluate(() => (window as any).battleFixture.scene.getScene('battle').mode)).toBe('moves');
    const overflow = await page.evaluate(() => {
      const scene = (window as any).battleFixture.scene.getScene('battle');
      const top = scene.scale.height - scene.commandHeight();
      // Compare labels to the real interactive card rectangles, independent of
      // how many rows the responsive layout chooses.
      const cards = scene.ui.list.filter((child: any) => child.type === 'Graphics' && child.input?.hitArea)
        .map((child: any) => child.input.hitArea);
      return scene.ui.list.filter((child: any) => child.type === 'Text' && child.y >= top && !child.text.includes('INDIETRO') && !child.text.includes('DETTAGLI MOSSE'))
        .filter((child: any) => {
          const bounds = child.getBounds();
          return !cards.some((card: any) => bounds.left >= card.x && bounds.right <= card.right
            && bounds.top >= card.y && bounds.bottom <= card.bottom);
        }).map((child: any) => child.text);
    });
    expect(overflow).toEqual([]);
    const footer = await page.evaluate(() => {
      const scene = (window as any).battleFixture.scene.getScene('battle');
      const text = scene.ui.list.find((child: any) => child.type === 'Text' && child.text.includes('DETTAGLI MOSSE'));
      const bounds = text.getBounds();
      return { inside: bounds.left >= 14 && bounds.right <= innerWidth - 14 && bounds.bottom <= innerHeight, belowCards: bounds.top >= innerHeight - 47 };
    });
    expect(footer).toEqual({ inside: true, belowCards: true });
    await page.screenshot({ path: testInfo.outputPath(`battle-moves-${width}x${height}.png`) });
    expect(errors).toEqual([]);
    return;
  }
  await page.keyboard.press('ArrowDown', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleFixture.scene.getScene('battle').selectionIndex)).toBe(1);
  await page.keyboard.press('Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleFixture.scene.getScene('battle').mode)).toBe('items');
  await page.keyboard.press('Escape', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleFixture.scene.getScene('battle').mode)).toBe('menu');
  await page.waitForTimeout(180);
  await page.touchscreen.tap(100, 844 - 144); // Lotta.
  await page.screenshot({ path: testInfo.outputPath('battle-moves-mobile.png') });
  await page.touchscreen.tap(100, 844 - 140); // Tuonoshock.
  await expect.poll(() => page.evaluate(() => (window as any).battleFixture.scene.getScene('battle').mode)).toBe('message');
  await page.touchscreen.tap(195, 844 - 132);
  await page.waitForTimeout(180);
  await page.screenshot({ path: testInfo.outputPath('battle-impact-mobile.png') });
  await expect.poll(() => page.evaluate(() => (window as any).battleFixture.scene.getScene('battle').mode), {timeout:15_000}).toBe('menu');
  await page.keyboard.press('Enter', { delay: 50 }); // Lotta.
  await expect.poll(() => page.evaluate(() => (window as any).battleFixture.scene.getScene('battle').mode)).toBe('moves');
  await page.keyboard.press('ArrowRight', {delay:40}); // Growl, second slot.
  await expect.poll(() => page.evaluate(() => (window as any).battleFixture.scene.getScene('battle').selectionIndex)).toBe(1);
  await page.keyboard.press('Enter', { delay: 50 });
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleFixture.scene.getScene('battle');
    return scene.state.opponent.creatures[scene.state.opponent.activeIndex].statStages?.attack;
  })).toBe(-1);
  await expect.poll(() => page.evaluate(() => (window as any).battleFixture.scene.getScene('battle').pendingMessages.some((message: any) => message.text.includes('Attacco') && message.text.includes('scende')))).toBe(true);
  expect(errors).toEqual([]);
});
}
