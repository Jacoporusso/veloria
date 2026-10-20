import { expect, test, type Page } from '@playwright/test';
import moveRegistry from '../../content/battle/moves.v1.json' with { type: 'json' };

type FixtureKind = 'super-effective' | 'immune' | 'gym-beginner' | 'sparse-capture' | 'evolution' | 'move-learning' | 'leech-seed' | 'forced-player-switch' | 'forced-opponent-switch';

test.afterEach(async ({page},info)=>{
  if(info.status===info.expectedStatus)return;
  const state=await page.evaluate(()=>{
    const scene=(window as any).battleRulesFixture?.scene.getScene('battle');
    return scene?{mode:scene.mode,selection:scene.selectionIndex,learning:scene.pendingMoveLearning,
      events:scene.eventLog,moves:scene.state.player.creatures[0].moves}:null;
  });
  await info.attach('battle-state',{body:JSON.stringify(state,null,2),contentType:'application/json'});
});

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
    (window as any).battleCompletionCount = 0;
    (window as any).battleSeenSpecies = [];
    const creature = (speciesId: number, instanceId: string, moveIds?: string[], level = 8) => createBattleCreature({
      species: battleSpecies,
      moves: battleMoves,
      speciesId,
      level,
      instanceId,
      ...(moveIds ? { moveIds } : {}),
    });

    const effectivenessPair = kind === 'immune' ? 194 : 7;
    const player = kind === 'forced-player-switch'
      ? { ...creature(25, 'test-player-pikachu', ['thunder-shock'], 8), hp: 1 }
      : kind === 'forced-opponent-switch'
      ? creature(25, 'test-player-pikachu', ['quick-attack'], 13)
      : kind === 'leech-seed'
      ? { ...creature(1, 'test-player-bulbasaur', ['leech-seed', 'tackle'], 7), hp: 10 }
      : kind === 'evolution'
      ? creature(10, 'test-player-caterpie', ['tackle'], 5)
      : kind === 'gym-beginner'
      ? creature(1, 'test-player-bulbasaur', ['tackle', 'growl'])
      : kind === 'move-learning'
        ? creature(179, 'test-player-mareep', ['thunder-shock', 'growl', 'tackle', 'scratch'])
        : creature(179, 'test-player-mareep', ['thunder-shock', 'growl']);
    const baseOpponent = kind.startsWith('forced-')
      ? creature(19, 'test-opponent-rattata', ['quick-attack'], 8)
      : kind === 'leech-seed'
      ? creature(7, 'test-opponent-squirtle', ['withdraw'], 10)
      : kind === 'evolution'
      ? creature(10, 'test-opponent-caterpie', ['tackle'], 3)
      : kind === 'gym-beginner'
      ? creature(161, 'test-opponent-sentret', ['tackle', 'defense-curl'])
      : creature(effectivenessPair, kind === 'immune' ? 'test-opponent-wooper' : 'test-opponent-squirtle');
    const opponent = kind === 'forced-opponent-switch'
      ? { ...baseOpponent, hp: 1, experienceYield: 0 }
      : kind === 'evolution'
      ? { ...baseOpponent, level: 7, hp: 1, experienceYield: 218, stats: { ...baseOpponent.stats, speed: 1 } }
      : kind === 'move-learning'
        ? { ...baseOpponent, hp: 1, experienceYield: 900, stats: { ...baseOpponent.stats, speed: 1 } }
      : baseOpponent;
    const rules = kind === 'move-learning'
      ? {
        ...veloriaBattleRules,
        levelUpMoves: {
          ...veloriaBattleRules.levelUpMoves,
          179: [
            { level: 9, moveId: 'quick-attack', maxPp: battleMoves['quick-attack'].maxPp },
            { level: 10, moveId: 'gust', maxPp: battleMoves.gust.maxPp },
          ],
        },
      }
      : veloriaBattleRules;
    const state = createBattleState({
      battleId: `battle-rules-${kind}`,
      battleType: kind === 'gym-beginner' || kind.startsWith('forced-') ? 'trainer' : 'wild',
      seed: 321,
      rules,
      playerTeam: [player, ...(kind === 'forced-player-switch' ? [creature(7, 'test-player-reserve', ['tackle'], 8)] : [])],
      opponentTeam: [opponent, ...(kind === 'forced-opponent-switch' ? [creature(161, 'test-opponent-reserve', ['quick-attack'], 8)] : [])],
    });

    class Fixture extends Phaser.Scene {
      constructor() { super('fixture'); }
      preload() {
        preloadCreatureArt(this);
        this.load.image('qa-forest', '/assets/battle/veloria-battle-forest-v1.webp');
      }
      create() {
        this.scene.start('battle', {
          state,
          moveCatalog: battleMoves,
          rules,
          arenaTextureKey: 'qa-forest',
          opponentPolicy: kind === 'gym-beginner' ? getOpponentPolicy('gym_beginner') : getOpponentPolicy('wild'),
          reducedAnimations: true,
          onSpeciesSeen: (speciesId: number) => { (window as any).battleSeenSpecies.push(speciesId); },
          ...(kind === 'sparse-capture' ? { inventory: { 'poke-ball': 1 } } : {}),
          onComplete: () => { (window as any).battleCompletionCount = ((window as any).battleCompletionCount ?? 0) + 1; },
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
    const {observeGameSize}=await import('/src/game/rendering/game-size.ts' as string);
    observeGameSize((window as any).battleRulesFixture,document.querySelector<HTMLElement>('#battle-rules-fixture')!);
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

async function advanceToMoveLearning(page: Page): Promise<void> {
  // Message timers advance normally. A queued skip could otherwise become a
  // confirmation after the scene opens the move choice between two frames.
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode), {timeout:30_000}).toBe('learning');
}

test('battle UI describes an electric hit as super effective against Squirtle', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await mountBattle(page, 'super-effective');

  await chooseFirstMove(page); // Mareep's catalog Thunder Shock.
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.eventLog.some((event: any) => event.type === 'damageApplied' && event.effectiveness > 1)
      && scene.pendingMessages.some((message: any) => message.text.startsWith('Super efficace!'));
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
      effectiveness: scene.eventLog.filter((event: any) => event.type === 'damageApplied' && event.sourceSide === 'player').map((event: any) => event.effectiveness),
      messages: scene.pendingMessages.map((message: any) => message.text),
    };
  })).toMatchObject({
    targetTypes: ['water', 'ground'],
    moves: ['thunder-shock'],
    effectiveness: [0],
    messages: expect.arrayContaining(['Nessun effetto: il bersaglio è immune.']),
  });
  expect(errors).toEqual([]);
});

test('move cards explain their values and the turn resolves without a continue click', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await mountBattle(page, 'super-effective');

  await page.keyboard.press('Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.mode === 'moves' && scene.ui.list
      .filter((child: any) => child.type === 'Container')
      .flatMap((container: any) => container.list.filter((item: any) => item.type === 'Text').map((item: any) => item.text))
      .join(' ');
  })).toContain('POTENZA');
  const moveDetails = await page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.ui.list
      .filter((child: any) => child.type === 'Container')
      .flatMap((container: any) => container.list.filter((item: any) => item.type === 'Text').map((item: any) => item.text))
      .join(' ');
  });
  expect(moveDetails).toContain('PRECISIONE');
  expect(moveDetails).toContain('PP');
  expect(moveDetails).toContain('PARALISI 10%');
  expect(moveDetails).toContain('STIMA DANNI:');
  expect(moveDetails).toContain('TIPO +50%');
  await page.screenshot({ path: testInfo.outputPath('battle-damage-forecast.png') });
  await page.keyboard.press('ArrowRight', { delay: 40 });
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.movePreview.list.filter((item: any) => item.type === 'Text').map((item: any) => item.text).join(' ');
  })).toContain('ATT. AVV. -1');
  await page.keyboard.press('ArrowLeft', { delay: 40 });

  await page.keyboard.press('Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('message');
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode), { timeout: 8000 }).toBe('menu');
  expect(errors).toEqual([]);
});

test('touching the battle message skips its timer without changing the resolved turn',async({page})=>{
  const errors=await mountBattle(page,'super-effective');
  await page.keyboard.press('Enter');await page.keyboard.press('Enter');
  await expect.poll(()=>page.evaluate(()=>(window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('message');
  const before=await page.evaluate(()=>{
    const scene=(window as any).battleRulesFixture.scene.getScene('battle');
    scene.messageTimer?.remove(false);scene.messageTimer=undefined;
    const canvas=scene.game.canvas.getBoundingClientRect();
    return{state:JSON.stringify(scene.state),count:scene.pendingMessages.length,text:scene.pendingMessages[0]?.text,
      x:canvas.x+canvas.width/2,y:canvas.y+(scene.viewport.height-scene.commandHeight()-51)*scene.scale.zoom};
  });
  await page.touchscreen.tap(before.x,before.y);
  await expect.poll(()=>page.evaluate(previous=>{
    const scene=(window as any).battleRulesFixture.scene.getScene('battle');
    return scene.mode!=='message'||scene.pendingMessages.length!==previous.count||scene.pendingMessages[0]?.text!==previous.text;
  },before)).toBe(true);
  expect(await page.evaluate(()=>JSON.stringify((window as any).battleRulesFixture.scene.getScene('battle').state))).toBe(before.state);
  await expect.poll(()=>page.evaluate(()=>(window as any).battleRulesFixture.scene.getScene('battle').mode),{timeout:8000}).toBe('menu');
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

test('battle presents the evolved species and its registered sprite frame', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await mountBattle(page, 'evolution');

  await chooseFirstMove(page); // Caterpie defeats the low-HP wild encounter and reaches level 7.
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    const actor = scene.actors.player;
    const image = actor.list.find((child: any) => child.type === 'Image');
    return {
      speciesId: scene.state.player.creatures[0].speciesId,
      evolvedMessage: scene.pendingMessages.some((message: any) => message.text === 'Caterpie si è evoluta in Metapod!'),
      spriteTexture: image?.texture?.key,
      spriteFrame: image?.frame?.name,
    };
  })).toEqual({
    speciesId: 11,
    evolvedMessage: true,
    spriteTexture: 'veloria-creatures-3-v1',
    spriteFrame: 'species-11',
  });
  expect(errors).toEqual([]);
});

test('level-up move choice supports replacement and decline in sequence before completing a terminal battle', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await mountBattle(page, 'move-learning');

  await chooseFirstMove(page);
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.eventLog.filter((event: any) => event.type === 'moveLearningSkipped').map((event: any) => event.moveId);
  })).toEqual(['quick-attack', 'gust']);
  await advanceToMoveLearning(page);
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').moveLearningPrompt())).toContain('Attacco Rapido');

  // Move to row two, first column: replace Tackle with Quick Attack.
  await page.keyboard.press('ArrowDown', {delay:40});
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').selectionIndex)).toBe(2);
  // Rotation must retain the selected move slot before confirmation.
  for (const size of [{width:844,height:390},{width:390,height:844}]) {
    await page.setViewportSize(size);
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').viewport.width)).toBe(size.width);
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').selectionIndex)).toBe(2);
  }
  await page.keyboard.press('Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return {moves:scene.state.player.creatures[0].moves.map((slot:any)=>slot.moveId),
      replacements:scene.eventLog.filter((event:any)=>event.type==='moveReplaced').map((event:any)=>({from:event.previousMoveId,to:event.moveId}))};
  })).toEqual({moves:['thunder-shock','growl','quick-attack','scratch'],replacements:[{from:'tackle',to:'quick-attack'}]});
  expect(await page.evaluate(() => (window as any).battleCompletionCount)).toBe(0);

  await advanceToMoveLearning(page);
  // The fifth option is on row three, first column: keep the current moveset.
  await page.keyboard.press('ArrowDown', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').selectionIndex)).toBe(2);
  await page.keyboard.press('ArrowDown', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').selectionIndex)).toBe(4);
  await page.keyboard.press('Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.eventLog.some((event: any) => event.type === 'moveLearningDeclined' && event.moveId === 'gust')
      && scene.state.player.creatures[0].moves.every((slot: any) => slot.moveId !== 'gust');
  })).toBe(true);
  expect(await page.evaluate(() => (window as any).battleCompletionCount)).toBe(0);

  for (let index = 0; index < 8 && await page.evaluate(() => (window as any).battleCompletionCount === 0); index += 1) {
    await page.keyboard.press('Enter', { delay: 40 });
  }
  await expect.poll(() => page.evaluate(() => (window as any).battleCompletionCount)).toBe(1);
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

test('Leech Seed presents residual damage and healing then returns to move selection', async ({ page }, testInfo) => {
  const errors = await mountBattle(page, 'leech-seed');
  await chooseFirstMove(page);
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.eventLog.some((event: any) => event.type === 'leechSeedApplied')
      && scene.eventLog.some((event: any) => event.type === 'leechSeedTick')
      && scene.eventLog.some((event: any) => event.type === 'healingApplied');
  })).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode), { timeout: 10000 }).toBe('menu');
  expect(await page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    const labels = scene.ui.list.filter((child: any) => child.type === 'Text').map((child: any) => child.text);
    return ['player', 'opponent'].every(side => {
      const creature = scene.state[side].creatures[0];
      return labels.includes(`${creature.hp}/${creature.stats.maxHp}`);
    }) && labels.some((label: string) => label.includes('PARASSISEME'));
  })).toBe(true);
  await page.keyboard.press('Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moves');
  await page.screenshot({ path: testInfo.outputPath('leech-seed-moves.png') });
  expect(errors).toEqual([]);
});

test('player forced replacement enters at full HP without giving the opponent another attack', async ({ page }) => {
  const errors = await mountBattle(page, 'forced-player-switch');
  await chooseFirstMove(page);
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode), { timeout: 12000 }).toBe('party');
  const before = await page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return { turn: scene.state.turn, pp: scene.state.opponent.creatures[0].moves[0].pp, hp: scene.state.player.creatures[1].hp };
  });
  await page.keyboard.press('Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode), { timeout: 8000 }).toBe('menu');
  expect(await page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return { turn: scene.state.turn, pp: scene.state.opponent.creatures[0].moves[0].pp, hp: scene.state.player.creatures[1].hp };
  })).toEqual(before);
  expect(errors).toEqual([]);
});

test('opponent replacement is automatic after KO and does not consume the next player move', async ({ page }) => {
  const errors = await mountBattle(page, 'forced-opponent-switch');
  expect(await page.evaluate(() => (window as any).battleSeenSpecies)).toEqual([19]);
  await chooseFirstMove(page);
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.mode === 'menu' && scene.state.opponent.activeIndex === 1;
  }), { timeout: 12000 }).toBe(true);
  expect(await page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return { turn: scene.state.turn, pp: scene.state.player.creatures[0].moves[0].pp,
      opponentMoves: scene.eventLog.filter((event: any) => event.type === 'moveUsed' && event.side === 'opponent').length,
      switches: scene.eventLog.filter((event: any) => event.type === 'creatureSwitched').length };
  })).toEqual({ turn: 1, pp: 29, opponentMoves: 0, switches: 1 });
  expect(await page.evaluate(() => (window as any).battleSeenSpecies)).toEqual([19, 161]);
  expect(errors).toEqual([]);
});

for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
  test(`move strategy inspection uses touch and keyboard without consuming a turn ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors = await mountBattle(page, 'super-effective');
    await page.keyboard.press('Enter');
    const before = await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.getScene('battle').state));
    // Tap the visible details link, then inspect Growl by tapping its slot.
    const tapText = async (text: string) => {
      const point = await page.evaluate((label) => {
        const scene = (window as any).battleRulesFixture.scene.getScene('battle');
        const item = scene.ui.list.find((entry: any) => entry.type === 'Text' && entry.text.includes(label));
        const bounds = item.getBounds();
        return { x: bounds.centerX, y: bounds.centerY };
      }, text);
      await page.touchscreen.tap(point.x, point.y);
    };
    await tapText('DETTAGLI MOSSE');
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moveDetails');
    await tapText('Ruggito');
    const layout = await page.evaluate(() => {
      const scene = (window as any).battleRulesFixture.scene.getScene('battle');
      const texts = scene.ui.list.filter((entry: any) => entry.type === 'Text');
      return { text: texts.map((item: any) => item.text).join('\n'), outside: texts.filter((item: any) => { const b = item.getBounds(); return b.left < 0 || b.right > innerWidth || b.bottom > innerHeight; }).map((item: any) => item.text), state: JSON.stringify(scene.state) };
    });
    expect(layout.text).toContain('Riduce Attacco dell’avversario di 1 grado');
    expect(layout.outside).toEqual([]);
    expect(layout.state).toBe(before);
    await page.screenshot({ path: testInfo.outputPath('move-strategy-details.png') });
    await page.keyboard.press('ArrowLeft', { delay: 40 });
    await page.keyboard.press('Escape', { delay: 40 });
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moves');
    await page.keyboard.press('i', { delay: 40 });
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moveDetails');
    await page.keyboard.press('Escape', { delay: 40 });
    expect(await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.getScene('battle').state))).toBe(before);
    const catalogLayouts = await page.evaluate(() => {
      const scene = (window as any).battleRulesFixture.scene.getScene('battle');
      const original = scene.state;
      const result: Array<{ id: string; overflow: string[]; overlapsClose: boolean }> = [];
      for (const move of Object.values(scene.moveCatalog) as any[]) {
        const player = original.player.creatures[original.player.activeIndex];
        // Four real slots exercise the most crowded portrait selector layout, with exhausted PP inspectable.
        const inspected = { ...player, moves: Array.from({ length: 4 }, () => ({ moveId: move.id, pp: 0 })) };
        scene.state = { ...original, player: { ...original.player, creatures: original.player.creatures.map((item: any, index: number) => index === original.player.activeIndex ? inspected : item) } };
        scene.mode = 'moveDetails';
        scene.detailMoveIndex = 0;
        scene.render();
        const texts = scene.ui.list.filter((item: any) => item.type === 'Text');
        const description = texts.find((item: any) => item.text.includes('Precisione'));
        result.push({ id: move.id, overflow: texts.filter((item: any) => { const b = item.getBounds(); return b.left < 0 || b.right > innerWidth || b.bottom > innerHeight; }).map((item: any) => item.text), overlapsClose: description.getBounds().bottom >= innerHeight - 62 });
      }
      scene.state = original;
      return result;
    });
    expect(catalogLayouts.map(item => item.id).sort()).toEqual(Object.keys(moveRegistry.moves).sort());
    expect(catalogLayouts.filter(item => item.overflow.length || item.overlapsClose)).toEqual([]);
    expect(errors).toEqual([]);
  });
}
