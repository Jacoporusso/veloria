import { expect, test } from '@playwright/test';

test('Pidgey and the complete creature catalog render in portrait and landscape battles', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  // Isolated real renderer fixture; no interaction with the user's save or production boot.
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export {};' }));
  await page.goto('/');
  await page.evaluate(async () => {
    const source = await (await fetch('/src/game/scenes/BattleScene.ts')).text();
    const phaserUrl = source.match(/["']([^"']*\/node_modules\/\.vite\/deps\/phaser\.js[^"']*)["']/)?.[1];
    if (!phaserUrl) throw new Error('Phaser dependency URL missing from the dev module.');
    const { default: Phaser } = await import(phaserUrl);
    const { BattleScene } = await import('/src/game/scenes/BattleScene.ts' as string);
    const { observeGameSize } = await import('/src/game/rendering/game-size.ts' as string);
    const { preloadCreatureArt, createCreatureImage } = await import('/src/game/battle/creature-art.ts' as string);
    const { battleSpecies, battleMoves, veloriaBattleRules } = await import('/src/game/battle/catalog.ts' as string);
    const { createBattleCreature } = await import('/src/core/battle/create-creature.ts' as string);
    const { createBattleState } = await import('/src/core/battle/engine.ts' as string);
    document.body.innerHTML = '<div id="artwork-fixture" style="width:100vw;height:100vh"></div>';
    document.body.style.margin = '0';
    const creature = (speciesId: number, instanceId: string) => createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId, level: 8, instanceId });
    const state = createBattleState({ battleId: 'pidgey-artwork', battleType: 'wild', seed: 25, rules: veloriaBattleRules, playerTeam: [creature(4, 'own-charmander')], opponentTeam: [creature(16, 'wild-pidgey')] });
    class Fixture extends Phaser.Scene {
      constructor() { super('artwork-fixture'); }
      preload() {
        preloadCreatureArt(this);
        this.load.image('qa-forest', '/assets/battle/veloria-battle-forest-v1.png');
      }
      create() {
        (window as any).artworkCatalogResults = Object.keys(battleSpecies).map(id => {
          const image = createCreatureImage(this, Number(id), 0, 0);
          const result = { speciesId: Number(id), rendered: Boolean(image), width: image?.width ?? 0, height: image?.height ?? 0, texture: image?.texture.key };
          image?.destroy();
          return result;
        });
        this.scene.start('battle', { state, moveCatalog: battleMoves, rules: veloriaBattleRules, arenaTextureKey: 'qa-forest', reducedAnimations: true, inventory: { potion: 2, 'poke-ball': 3 }, onComplete: () => undefined });
      }
    }
    (window as any).artworkFixture = new Phaser.Game({ type: Phaser.CANVAS, parent: 'artwork-fixture', audio: { noAudio: true }, scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: [Fixture, BattleScene] });
    observeGameSize((window as any).artworkFixture, document.querySelector<HTMLElement>('#artwork-fixture')!);
  });
  await expect.poll(() => page.evaluate(() => Boolean((window as any).artworkFixture?.scene.isActive('battle')))).toBe(true);
  const coverage = await page.evaluate(() => (window as any).artworkCatalogResults as Array<{ speciesId: number; rendered: boolean; width: number; height: number }>);
  expect(coverage).toHaveLength(20);
  expect(coverage.filter(entry => !entry.rendered || entry.width <= 0 || entry.height <= 0)).toEqual([]);
  for (const [width, height] of [[390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await expect.poll(() => page.evaluate(() => ({ width: (window as any).artworkFixture.scale.width, height: (window as any).artworkFixture.scale.height }))).toEqual({ width, height });
    await expect.poll(() => page.evaluate(() => {
      const scene = (window as any).artworkFixture.scene.getScene('battle');
      return ['player', 'opponent'].map(side => {
        const image = scene.actors[side]?.list.find((child: any) => child.type === 'Image');
        if (!image) return null;
        return { key: image.texture.key, visible: image.visible, width: image.displayWidth > 0, height: image.displayHeight > 0 };
      });
    })).toEqual([
      { key: 'pokeapi-starter-4-v1', visible: true, width: true, height: true },
      { key: 'pokeapi-route-16-v1', visible: true, width: true, height: true },
    ]);
    await page.screenshot({ path: testInfo.outputPath('pidgey-battle-' + width + 'x' + height + '.png') });
  }
  expect(errors).toEqual([]);
});
