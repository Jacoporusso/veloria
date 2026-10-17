import { expect, test, type Page } from '@playwright/test';

type FixtureKind = 'super-effective' | 'immune' | 'gym-beginner' | 'sparse-capture';

async function mountBattle(page: Page, fixtureKind: FixtureKind): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  // Use the real scene and battle reducer in an isolated page; never read or write a save.
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export {};' }));
  await page.goto('/');
  await page.evaluate(async (kind: FixtureKind) => {
    const sceneSource = await (await fetch('/src/game/scenes/BattleScene.ts')).text();
    const phaserUrl = sceneSource.match(/["']([^"']*\/node_modules\/\.vite\/deps\/phaser\.js[^"']*)["']/)?.[1];
    if (!phaserUrl) throw new Error('Phaser dependency URL missing from the dev module.');
    const { default: Phaser } = await import(phaserUrl);
    const { BattleScene } = await import('/src/game/scenes/BattleScene.ts' as string);
    const { preloadCreatureArt } = await import('/src/game/battle/creature-art.ts' as string);
    const { battleSpecies, battleMoves, veloriaBattleRules } = await import('/src/game/battle/catalog.ts' as string);
    const { getOpponentPolicy } = await import('/src/game/battle/opponent-policies.ts' as string);
    const { createBattleCreature } = await import('/src/core/battle/create-creature.ts' as string);
    const { createBattleState } = await import('/src/core/battle/engine.ts' as string);

    document.body.innerHTML = '<div id="battle-rules-fixture" style="width:100vw;height:100vh"></div>';
    document.body.style.margin = '0';
    const creature = (speciesId: number, instanceId: string, moveIds?: string[]) => createBattleCreature({
      species: battleSpecies,
      moves: battleMoves,
      speciesId,
      level: 8,
      instanceId,
      ...(moveIds ? { moveIds } : {}),
    });

    const effectivenessPair = kind === 'immune' ? 194 : 7;
    const player = kind === 'gym-beginner'
      ? creature(1, 'test-player-bulbasaur', ['tackle', 'growl'])
      : creature(179, 'test-player-mareep', ['thunder-shock', 'growl']);
    const opponent = kind === 'gym-beginner'
      ? creature(161, 'test-opponent-sentret', ['tackle', 'defense-curl'])
      : creature(effectivenessPair, kind === 'immune' ? 'test-opponent-wooper' : 'test-opponent-squirtle');
    const state = createBattleState({
      battleId: `battle-rules-${kind}`,
      battleType: kind === 'gym-beginner' ? 'trainer' : 'wild',
      seed: 321,
      rules: veloriaBattleRules,
      playerTeam: [player],
      opponentTeam: [opponent],
    });

    class Fixture extends Phaser.Scene {
      constructor() { super('fixture'); }
      preload() {
        preloadCreatureArt(this);
        this.load.image('qa-forest', '/assets/battle/veloria-battle-forest-v1.png');
      }
      create() {
        this.scene.start('battle', {
          state,
          moveCatalog: battleMoves,
          rules: veloriaBattleRules,
          arenaTextureKey: 'qa-forest',
          opponentPolicy: kind === 'gym-beginner' ? getOpponentPolicy('gym_beginner') : getOpponentPolicy('wild'),
          reducedAnimations: true,
          ...(kind === 'sparse-capture' ? { inventory: { 'poke-ball': 1 } } : {}),
          onComplete: () => undefined,
        });
      }
    }

    (window as any).battleRulesFixture = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: 'battle-rules-fixture',
      audio: { noAudio: true },
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      scene: [Fixture, BattleScene],
    });
  }, fixtureKind);

  await expect.poll(() => page.evaluate(() => Boolean((window as any).battleRulesFixture?.scene.isActive('battle')))).toBe(true);
  return errors;
}

async function chooseFirstMove(page: Page): Promise<void> {
  await page.keyboard.press('Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moves');
  await page.keyboard.press('Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('message');
}

async function advanceMessages(page: Page): Promise<void> {
  for (let index = 0; index < 16; index += 1) {
    const mode = await page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode);
    if (mode !== 'message') break;
    await page.keyboard.press('Enter', { delay: 40 });
  }
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('menu');
}

test('battle UI describes an electric hit as super effective against Squirtle', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await mountBattle(page, 'super-effective');

  await chooseFirstMove(page); // Mareep's catalog Thunder Shock.
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.eventLog.some((event: any) => event.type === 'damageApplied' && event.effectiveness > 1)
      && scene.pendingMessages.some((message: any) => message.text === 'Un colpo efficace!');
  })).toBe(true);
  expect(errors).toEqual([]);
});

test('battle UI describes electric immunity against Wooper', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await mountBattle(page, 'immune');

  await chooseFirstMove(page); // Mareep's catalog Thunder Shock.
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    const target = scene.state.opponent.creatures[scene.state.opponent.activeIndex];
    return {
      targetTypes: target.types,
      moves: scene.eventLog.filter((event: any) => event.type === 'moveUsed' && event.side === 'player').map((event: any) => event.moveId),
      effectiveness: scene.eventLog.filter((event: any) => event.type === 'damageApplied').map((event: any) => event.effectiveness),
      messages: scene.pendingMessages.map((message: any) => message.text),
    };
  })).toMatchObject({
    targetTypes: ['water', 'ground'],
    moves: ['thunder-shock'],
    effectiveness: [0],
    messages: expect.arrayContaining(['L’attacco non ha effetto.']),
  });
  expect(errors).toEqual([]);
});

test('gym beginner policy uses Defense Curl on turn zero, then Tackle on turn one', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await mountBattle(page, 'gym-beginner');

  await chooseFirstMove(page); // Bulbasaur uses catalog Tackle; the opponent selects its move through the scene policy.
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.eventLog.some((event: any) => event.type === 'moveUsed' && event.side === 'opponent' && event.moveId === 'defense-curl')
      && scene.state.opponent.creatures[scene.state.opponent.activeIndex].statStages?.defense === 1
      && scene.pendingMessages.some((message: any) => message.text === 'la Difesa di Sentret sale.');
  })).toBe(true);
  await advanceMessages(page);

  await chooseFirstMove(page);
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    const opponentMoves = scene.eventLog
      .filter((event: any) => event.type === 'moveUsed' && event.side === 'opponent')
      .map((event: any) => event.moveId);
    return scene.state.turn === 2 && opponentMoves.join(',') === 'defense-curl,tackle';
  })).toBe(true);
  expect(errors).toEqual([]);
});

test('keyboard reaches capture with bag and party disabled', async ({ page }) => {
  const errors = await mountBattle(page, 'sparse-capture');
  await page.keyboard.press('ArrowDown', { delay: 40 });
  await page.keyboard.press('ArrowRight', { delay: 40 });
  await page.keyboard.press('Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('captures');
  await page.keyboard.press('Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.eventLog.some((event: any) => event.type === 'captureAttempted') && scene.remainingInventory['poke-ball'] === 0;
  })).toBe(true);
  expect(errors).toEqual([]);
});
