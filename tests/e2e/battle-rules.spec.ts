import { expect, test, type Page } from '@playwright/test';
import moveRegistry from '../../content/battle/moves.v1.json' with { type: 'json' };

type FixtureKind = 'super-effective' | 'immune' | 'gym-beginner' | 'sparse-capture' | 'evolution' | 'move-learning' | 'auto-learning' | 'leech-seed' | 'forced-player-switch' | 'forced-opponent-switch';

test.afterEach(async ({page},info)=>{
  if(info.status===info.expectedStatus)return;
  const state=await page.evaluate(()=>{
    const scene=(window as any).battleRulesFixture?.scene.getScene('battle');
    return scene?{mode:scene.mode,selection:scene.selectionIndex,learning:scene.pendingMoveLearning,
      events:scene.eventLog,moves:scene.state.player.creatures[0].moves}:null;
  });
  await info.attach('battle-state',{body:JSON.stringify(state,null,2),contentType:'application/json'});
});

// Phaser queues DOM key events until its frame; flush them before observing or sending another command.
async function pressBattleKey(page: Page, key: string, options?: { delay?: number }): Promise<void> {
  await page.keyboard.press(key, options);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

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

    const effectivenessPair = kind === 'immune' ? 74 : 7;
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
        ? creature(25, 'test-player-pikachu', ['thunder-shock', 'growl', 'tackle', 'scratch'])
        : creature(25, 'test-player-pikachu', ['thunder-shock', 'growl']);
    const baseOpponent = kind.startsWith('forced-')
      ? creature(19, 'test-opponent-rattata', ['quick-attack'], 8)
      : kind === 'leech-seed'
      ? creature(7, 'test-opponent-squirtle', ['withdraw'], 10)
      : kind === 'evolution'
      ? creature(10, 'test-opponent-caterpie', ['tackle'], 3)
      : kind === 'gym-beginner'
      ? creature(74, 'test-opponent-geodude', ['tackle', 'defense-curl'])
      : creature(effectivenessPair, kind === 'immune' ? 'test-opponent-geodude' : 'test-opponent-squirtle');
    const opponent = kind === 'forced-opponent-switch'
      ? { ...baseOpponent, hp: 1, experienceYield: 0 }
      : kind === 'evolution'
      ? { ...baseOpponent, level: 7, hp: 1, experienceYield: 218, stats: { ...baseOpponent.stats, speed: 1 } }
      : ['move-learning', 'auto-learning'].includes(kind)
        ? { ...baseOpponent, hp: 1, experienceYield: 900, stats: { ...baseOpponent.stats, speed: 1 } }
      : baseOpponent;
    const rules = ['move-learning', 'auto-learning'].includes(kind)
      ? {
        ...veloriaBattleRules,
        levelUpMoves: {
          ...veloriaBattleRules.levelUpMoves,
          25: [
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
      opponentTeam: [opponent, ...(kind === 'forced-opponent-switch' ? [creature(16, 'test-opponent-reserve', ['quick-attack'], 13)] : [])],
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
  await pressBattleKey(page, 'Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moves');
  await pressBattleKey(page, 'Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('message');
}

async function advanceMessages(page: Page): Promise<void> {
  for (let index = 0; index < 16; index += 1) {
    const mode = await page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode);
    if (mode !== 'message') break;
    await pressBattleKey(page, 'Enter', { delay: 40 });
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

  await chooseFirstMove(page); // Pikachu's catalog Thunder Shock.
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.eventLog.some((event: any) => event.type === 'damageApplied' && event.effectiveness > 1)
      && scene.pendingMessages.some((message: any) => message.text.startsWith('Super efficace!'));
  })).toBe(true);
  expect(errors).toEqual([]);
});

test('battle UI describes electric immunity against Geodude', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await mountBattle(page, 'immune');

  await chooseFirstMove(page); // Pikachu's catalog Thunder Shock.
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
    targetTypes: ['rock', 'ground'],
    moves: ['thunder-shock'],
    effectiveness: [0],
    messages: expect.arrayContaining(['Nessun effetto: il bersaglio è immune.']),
  });
  expect(errors).toEqual([]);
});

test('move cards explain their values and the turn resolves without a continue click', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await mountBattle(page, 'super-effective');

  await pressBattleKey(page, 'Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moves');
  const cards = await page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    const zones = scene.ui.list.filter((child: any) => child.name === 'battle-move-use');
    const bounds = zones.map((zone: any) => zone.getBounds());
    const labels = scene.ui.list.filter((item: any) => item.type === 'Text' && bounds.some((card: any) => {
      const label = item.getBounds();
      return label.left >= card.left && label.right <= card.right && label.top >= card.top && label.bottom <= card.bottom;
    })).map((item: any) => item.text).join('\n');
    return { count: zones.length, labels, models: zones.map((zone: any) => JSON.stringify(zone.getData?.('presentation') ?? {})).join('\n') };
  });
  expect(cards.count).toBe(2);
  expect(cards.models).toContain('"powerLabel":"40"');
  expect(`${cards.labels}\n${cards.models}`).not.toContain('Danno stimato:');

  const tapZone = async (name: string, moveName?: string) => {
    const point = await page.evaluate(({ name, moveName }) => {
      const scene = (window as any).battleRulesFixture.scene.getScene('battle');
      const zone = scene.ui.list.find((item: any) => item.name === name &&
        (moveName === undefined || item.getData?.('moveName') === moveName));
      if (!zone) throw new Error(`Missing battle zone ${name}${moveName ? ` for ${moveName}` : ''}`);
      const bounds = zone.getBounds(), canvas = scene.game.canvas.getBoundingClientRect();
      return { x: canvas.x + bounds.centerX * scene.scale.zoom, y: canvas.y + bounds.centerY * scene.scale.zoom };
    }, { name, moveName });
    await page.touchscreen.tap(point.x, point.y);
  };
  const detailText = async () => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.ui.list.filter((item: any) => item.type === 'Text').map((item: any) => item.text).join(' ');
  });
  await tapZone('battle-move-details', 'Tuonoshock');
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moveDetails');
  let details = await detailText();
  expect(details).toContain('Precisione base:');
  expect(details).toContain('PP');
  expect(details).toMatch(/paralisi.*10% di probabilità/);
  expect(details).toContain('Danno stimato:');
  expect(details).toContain('↑ Super efficace ×2');
  await page.screenshot({ path: testInfo.outputPath('battle-damage-details.png') });
  await pressBattleKey(page, 'Escape', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moves');
  await tapZone('battle-move-details', 'Ruggito');
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moveDetails');
  details = await detailText();
  expect(details).toContain('Riduce Attacco dell’avversario di 1 grado');
  await pressBattleKey(page, 'Escape', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moves');

  await pressBattleKey(page, 'Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('message');
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode), { timeout: 8000 }).toBe('menu');
  expect(errors).toEqual([]);
});

test('touching the battle message skips its timer without changing the resolved turn',async({page})=>{
  const errors=await mountBattle(page,'super-effective');
  await pressBattleKey(page, 'Enter');await pressBattleKey(page, 'Enter');
  await expect.poll(()=>page.evaluate(()=>(window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('message');
  const before=await page.evaluate(()=>{
    const scene=(window as any).battleRulesFixture.scene.getScene('battle');
    scene.messageTimer?.remove(false);scene.messageTimer=undefined;
    const zone=scene.ui.list.find((item:any)=>item.name==='battle-message-skip');
    if(!zone)throw new Error('Missing battle-message-skip zone');
    const bounds=zone.getBounds(),canvas=scene.game.canvas.getBoundingClientRect();
    return{state:JSON.stringify(scene.state),count:scene.pendingMessages.length,text:scene.pendingMessages[0]?.text,
      x:canvas.x+bounds.centerX*scene.scale.zoom,y:canvas.y+bounds.centerY*scene.scale.zoom};
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
      && scene.pendingMessages.some((message: any) => message.text === 'la Difesa di Geodude sale.');
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

test('battle reveals evolution through a ceremony before showing the new sprite', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await mountBattle(page, 'evolution');
  // Exercise the actual timed reveal rather than the fixture's usual reduced animation preference.
  await page.evaluate(() => { (window as any).battleRulesFixture.scene.getScene('battle').reducedAnimations = false; });
  await chooseFirstMove(page);
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    const image = scene.actors.player.list.find((child: any) => child.type === 'Image');
    return {
      speciesId: scene.state.player.creatures[0].speciesId,
      terminalEvolution: scene.eventLog.some((event: any) => event.type === 'creatureEvolved' && event.toSpeciesId === 11),
      evolutionQueued: scene.pendingMessages.some((message: any) => message.event?.type === 'creatureEvolved'),
      spriteTexture: image?.texture?.key, spriteFrame: image?.frame?.name,
    };
  })).toEqual({ speciesId: 11, terminalEvolution: true, evolutionQueued: true, spriteTexture: 'pokeapi-gen1-10-v1', spriteFrame: '__BASE' });
  const visibleLabels = await page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.ui.list.filter((child: any) => child.type === 'Text' && child.visible).map((child: any) => child.text).join(' ');
  });
  expect(visibleLabels).not.toContain('Metapod');
  for (let index = 0; index < 20 && !await page.locator('.evolution-celebration').count(); index++) {
    await pressBattleKey(page, 'Enter', { delay: 40 });
  }
  const ceremony = page.getByRole('dialog', { name: 'Sta succedendo qualcosa…' });
  await expect(ceremony).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.battle-celebration')).toHaveCount(0);
  const skip = ceremony.getByRole('button', { name: 'Salta animazione', exact: true });
  await expect(skip).toBeEnabled({ timeout: 3000 });
  await skip.click();
  const revealed = page.getByRole('dialog', { name: 'Ora è Metapod!' });
  await expect(revealed).toBeVisible();
  await expect(revealed).toContainText('Caterpie si è evoluto in Metapod');
  await revealed.getByRole('button', { name: 'Continua', exact: true }).click();
  await expect(page.locator('.evolution-celebration')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return { mode: scene.mode, event: scene.pendingMessages[0]?.event?.type, move: scene.pendingMessages[0]?.event?.moveId };
  })).toEqual({ mode: 'message', event: 'moveLearned', move: 'harden' });
  // The learned-move card now follows the reveal, even for the final opponent.
  await pressBattleKey(page, 'Enter', { delay: 40 });
  await expect(page.locator('.battle-celebration')).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    const image = scene.actors.player.list.find((child: any) => child.type === 'Image');
    return { frame: image?.frame?.name, completions: (window as any).battleCompletionCount };
  })).toEqual({ frame: '__BASE', completions: 1 });
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
  await pressBattleKey(page, 'ArrowDown', {delay:40});
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').selectionIndex)).toBe(2);
  // Rotation must retain the selected move slot before confirmation.
  for (const size of [{width:844,height:390},{width:390,height:844}]) {
    await page.setViewportSize(size);
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').viewport.width)).toBe(size.width);
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').selectionIndex)).toBe(2);
  }
  await pressBattleKey(page, 'Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return {moves:scene.state.player.creatures[0].moves.map((slot:any)=>slot.moveId),
      replacements:scene.eventLog.filter((event:any)=>event.type==='moveReplaced').map((event:any)=>({from:event.previousMoveId,to:event.moveId}))};
  })).toEqual({moves:['thunder-shock','growl','quick-attack','scratch'],replacements:[{from:'tackle',to:'quick-attack'}]});
  expect(await page.evaluate(() => (window as any).battleCompletionCount)).toBe(0);

  await advanceToMoveLearning(page);
  // The fifth option is on row three, first column: keep the current moveset.
  await pressBattleKey(page, 'ArrowDown', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').selectionIndex)).toBe(2);
  await pressBattleKey(page, 'ArrowDown', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').selectionIndex)).toBe(4);
  await pressBattleKey(page, 'Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    return scene.eventLog.some((event: any) => event.type === 'moveLearningDeclined' && event.moveId === 'gust')
      && scene.state.player.creatures[0].moves.every((slot: any) => slot.moveId !== 'gust');
  })).toBe(true);
  expect(await page.evaluate(() => (window as any).battleCompletionCount)).toBe(0);

  for (let index = 0; index < 8 && await page.evaluate(() => (window as any).battleCompletionCount === 0); index += 1) {
    await pressBattleKey(page, 'Enter', { delay: 40 });
  }
  await expect.poll(() => page.evaluate(() => (window as any).battleCompletionCount)).toBe(1);
  expect(errors).toEqual([]);
});

test('keyboard reaches capture with bag and party disabled', async ({ page }) => {
  const errors = await mountBattle(page, 'sparse-capture');
  await pressBattleKey(page, 'ArrowRight', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').selectionIndex)).toBe(1);
  await pressBattleKey(page, 'Enter', { delay: 40 });
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('captures');
  await pressBattleKey(page, 'Enter', { delay: 40 });
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
  await pressBattleKey(page, 'Enter', { delay: 40 });
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
  await pressBattleKey(page, 'Enter', { delay: 40 });
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
  expect(await page.evaluate(() => (window as any).battleSeenSpecies)).toEqual([19, 16]);
  expect(errors).toEqual([]);
});

for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 568, height: 320 }]) {
  test(`move strategy inspection uses touch and keyboard without consuming a turn ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors = await mountBattle(page, 'super-effective');
    await pressBattleKey(page, 'Enter');
    const before = await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.getScene('battle').state));
    // Inspect Growl through its per-card details zone.
    const tapDetails = async (moveName: string) => {
      const point = await page.evaluate((moveName) => {
        const scene = (window as any).battleRulesFixture.scene.getScene('battle');
        const item = scene.ui.list.find((entry: any) => entry.name === 'battle-move-details' && entry.getData?.('moveName') === moveName);
        if (!item) throw new Error(`Missing details zone for ${moveName}`);
        const bounds = item.getBounds(), canvas = scene.game.canvas.getBoundingClientRect();
        return { x: canvas.x + bounds.centerX * scene.scale.zoom, y: canvas.y + bounds.centerY * scene.scale.zoom };
      }, moveName);
      await page.touchscreen.tap(point.x, point.y);
    };
    await tapDetails('Ruggito');
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moveDetails');
    expect(await page.evaluate(() => {
      const scene = (window as any).battleRulesFixture.scene.getScene('battle');
      const use = scene.ui.list.find((item: any) => item.type === 'Text' && item.text === 'USA Ruggito');
      if (!use) throw new Error('Missing move use button in details');
      return Math.abs(use.getBounds().centerY - (scene.scale.height - 94)) <= 12;
    })).toBe(true);
    const pages = await page.evaluate(() => {
      const scene = (window as any).battleRulesFixture.scene.getScene('battle');
      const result = [];
      for (let index = 0; index < scene.detailPageCount; index++) {
        scene.detailPage = index; scene.render();
        const texts = scene.ui.list.filter((entry: any) => entry.type === 'Text');
        result.push({ text: texts.map((item: any) => item.text).join('\n'), outside: texts.filter((item: any) => { const b = item.getBounds(); return b.left < 0 || b.right > innerWidth || b.bottom > innerHeight; }).map((item: any) => item.text), state: JSON.stringify(scene.state) });
      }
      return result;
    });
    expect(pages.map(item => item.text).join(' ').replace(/\s+/g, ' ')).toContain('Riduce Attacco dell’avversario di 1 grado');
    for (const layout of pages) { expect(layout.outside).toEqual([]); expect(layout.state).toBe(before); }
    await page.screenshot({ path: testInfo.outputPath('move-strategy-details.png') });
    await pressBattleKey(page, 'ArrowLeft', { delay: 40 });
    await pressBattleKey(page, 'Escape', { delay: 40 });
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moves');
    await tapDetails('Ruggito');
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moveDetails');
    await pressBattleKey(page, 'Escape', { delay: 40 });
    expect(await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.getScene('battle').state))).toBe(before);
    const catalogLayouts = await page.evaluate(async () => {
      const { describeMoveEffects } = await import('/src/game/battle/move-description.ts' as string);
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
        scene.detailPage = 0;
        scene.render();
        const pages: string[] = [];
        const overflow: string[] = [];
        let overlapsClose = false;
        for (let page = 0; page < scene.detailPageCount; page++) {
          scene.detailPage = page; scene.render();
          const texts = scene.ui.list.filter((item: any) => item.type === 'Text');
          // The named content block remains independent of navigation and heading fonts.
          const description = texts.find((item: any) => item.name === 'battle-move-description');
          if (!description) throw new Error(`Missing description for ${move.id}, page ${page}`);
          pages.push(description.text);
          overflow.push(...texts.filter((item: any) => { const b = item.getBounds(); return b.left < 0 || b.right > innerWidth || b.bottom > innerHeight; }).map((item: any) => item.text));
          overlapsClose ||= description.getBounds().bottom >= innerHeight - 62;
        }
        const text = pages.join(' ').replace(/\s+/g, ' ');
        if (!text.includes('Precisione base:') || !text.includes('PP: 0/')) throw new Error(`Missing move values for ${move.id}`);
        for (const effect of describeMoveEffects(move)) {
          if (!text.includes(effect.replace(/\s+/g, ' '))) throw new Error(`Missing effect for ${move.id}: ${effect}`);
        }
        result.push({ id: move.id, overflow, overlapsClose });
      }
      scene.state = original;
      return result;
    });
    expect(catalogLayouts.map(item => item.id).sort()).toEqual(Object.keys(moveRegistry.moves).sort());
    expect(catalogLayouts.filter(item => item.overflow.length || item.overlapsClose)).toEqual([]);
    expect(errors).toEqual([]);
  });
}


for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`battle tabs switch from captures to moves without a turn and remain touch-sized at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mountBattle(page, 'sparse-capture');
    const before = await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.getScene('battle').state));
    const tabTarget = async (name: 'battle-tab-captures' | 'battle-tab-moves') => page.evaluate(name => {
      const s = (window as any).battleRulesFixture.scene.getScene('battle');
      const zone = s.ui.list.find((item: any) => item.name === name);
      if (!zone) throw new Error(`Missing ${name}`);
      const bounds = zone.getBounds(), canvas = s.game.canvas.getBoundingClientRect();
      return { x: canvas.x + bounds.centerX * s.scale.zoom, y: canvas.y + bounds.centerY * s.scale.zoom,
        width: bounds.width * s.scale.zoom, height: bounds.height * s.scale.zoom };
    }, name);
    const captures = await tabTarget('battle-tab-captures');
    expect(captures.width).toBeGreaterThanOrEqual(44);
    expect(captures.height).toBeGreaterThanOrEqual(44);
    await page.touchscreen.tap(captures.x, captures.y);
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('captures');
    const moves = await tabTarget('battle-tab-moves');
    expect(moves.width).toBeGreaterThanOrEqual(44);
    expect(moves.height).toBeGreaterThanOrEqual(44);
    await page.touchscreen.tap(moves.x, moves.y);
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moves');
    expect(await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.getScene('battle').state))).toBe(before);
  });
}

/** Pause only presentation timers: the reducer has already resolved the real commands. */
async function holdBattleMessage(page: Page) {
  await page.evaluate(() => {
    const scene = (window as any).battleRulesFixture.scene.getScene('battle');
    scene.messageTimer?.remove(false); scene.messageTimer = undefined;
  });
}

async function showResolvedEvent(page: Page, type: string, side?: string) {
  for (let index = 0; index < 20; index++) {
    await holdBattleMessage(page);
    const current = await page.evaluate(() => {
      const scene = (window as any).battleRulesFixture.scene.getScene('battle');
      return { mode: scene.mode, event: scene.pendingMessages[0]?.event, remaining: scene.pendingMessages.length };
    });
    if (current.event?.type === type && (!side || current.event.side === side || current.event.sourceSide === side)) return;
    if (current.mode !== 'message') throw new Error(`Reached ${current.mode} before ${type}`);
    await pressBattleKey(page, 'Enter', { delay: 20 });
    // Phaser consumes keyboard events on its next frame: observe advancement before queuing another skip.
    await expect.poll(() => page.evaluate(() => {
      const scene = (window as any).battleRulesFixture.scene.getScene('battle');
      return scene.pendingMessages.length;
    })).not.toBe(current.remaining);
  }
  throw new Error(`Resolved event ${type} was not presented`);
}

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  for (const effect of ['electric', 'immune', 'growl'] as const) {
    test(`resolved ${effect} effects survive inspection and clean up on resize ${viewport.width}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      const errors = await mountBattle(page, effect === 'immune' ? 'immune' : 'super-effective');
      const initial = await page.evaluate(() => {
        const scene = (window as any).battleRulesFixture.scene.getScene('battle');
        scene.reducedAnimations = false;
        return structuredClone(scene.state);
      });
      await pressBattleKey(page, 'Enter', { delay: 20 });
      await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('moves');
      if (effect === 'growl') await pressBattleKey(page, 'ArrowRight', { delay: 20 });
      await pressBattleKey(page, 'Enter', { delay: 20 });
      await holdBattleMessage(page);
      const resolved = await page.evaluate(() => {
        const scene = (window as any).battleRulesFixture.scene.getScene('battle');
        return { state: structuredClone(scene.state), json: JSON.stringify(scene.state), events: structuredClone(scene.eventLog) };
      });
      expect(resolved.state.turn).toBe(1);
      const slot = effect === 'growl' ? 1 : 0;
      expect(resolved.state.player.creatures[0].moves[slot].pp).toBe(initial.player.creatures[0].moves[slot].pp - 1);
      await showResolvedEvent(page, 'moveUsed', 'player');
      const cast = effect === 'growl' ? 'battle-vfx-cast-normal' : 'battle-vfx-cast-electric';
      expect(await page.evaluate(name => {
        const scene = (window as any).battleRulesFixture.scene.getScene('battle');
        return scene.ui.list.filter((item: any) => item.name === name).length;
      }, cast)).toBe(1);
      const oldCast = await page.evaluate(name => {
        const scene = (window as any).battleRulesFixture.scene.getScene('battle');
        (window as any).effectOldLayer = scene.ui.list.find((item: any) => item.name === name);
        return scene.ui.list.length;
      }, cast);
      // Rotation cancels the currently presented effect; it must never replay a command.
      const opposite = viewport.width < viewport.height ? { width: 844, height: 390 } : { width: 390, height: 844 };
      for (const size of [opposite, viewport, opposite, viewport]) {
        await page.setViewportSize(size);
        await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').viewport.width)).toBe(size.width);
        await holdBattleMessage(page);
        expect(await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.getScene('battle').state))).toBe(resolved.json);
        expect(await page.evaluate(() => {
          const scene = (window as any).battleRulesFixture.scene.getScene('battle');
          return scene.ui.list.filter((item: any) => item.name?.startsWith('battle-vfx-')).length;
        })).toBe(0);
      }
      expect(await page.evaluate(() => (window as any).effectOldLayer.scene == null)).toBe(true);
      expect(await page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').ui.list.length)).toBeLessThanOrEqual(oldCast);
      if (effect === 'growl') {
        const stage = resolved.events.find((event: any) => event.type === 'statStageChanged' && event.side === 'opponent');
        expect(stage).toMatchObject({ stat: 'attack', change: -1 });
        await showResolvedEvent(page, 'statStageChanged', 'opponent');
        expect(await page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').ui.list.some((item: any) => item.name === 'battle-vfx-aura-down'))).toBe(true);
      } else {
        const damage = resolved.events.find((event: any) => event.type === 'damageApplied' && event.sourceSide === 'player');
        expect(damage).toBeTruthy();
        expect(damage.effectiveness).toBe(effect === 'immune' ? 0 : 2);
        if (effect === 'immune') expect(damage.amount).toBe(0);
        else expect(damage.amount).toBeGreaterThan(0);
        if (effect === 'immune') expect(resolved.state.opponent.creatures[0].hp).toBe(initial.opponent.creatures[0].hp);
        await showResolvedEvent(page, 'damageApplied', 'player');
        const layers = await page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').ui.list.map((item: any) => item.name).filter(Boolean));
        expect(layers).toContain(effect === 'immune' ? 'battle-vfx-immune' : 'battle-vfx-impact');
        expect(layers).not.toContain(effect === 'immune' ? 'battle-vfx-impact' : 'battle-vfx-immune');
      }
      await page.screenshot({ path: testInfo.outputPath(`${effect}-effect-${viewport.width}.png`) });
      // Skip all remaining real messages. Neither visual effects nor skip may spend another PP or turn.
      for (let index = 0; index < 20; index++) {
        await holdBattleMessage(page);
        if (await page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode !== 'message')) break;
        await pressBattleKey(page, 'Enter', { delay: 20 });
      }
      await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('menu');
      expect(await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.getScene('battle').state))).toBe(resolved.json);
      expect(await page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').ui.list.filter((item: any) => item.name?.startsWith('battle-vfx-')).length)).toBe(0);
      expect(errors).toEqual([]);
    });
  }
}

for (const viewport of [{ width: 390, height: 844 }, { width: 568, height: 320 }]) {
  test(`individual inspection handles exhausted PP and detail use resolves one turn at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = await mountBattle(page, 'super-effective');
    const tap = async (name: string, moveName?: string) => {
      const point = await page.evaluate(({ name, moveName }) => {
        const scene = (window as any).battleRulesFixture.scene.getScene('battle');
        const target = scene.ui.list.find((item: any) => item.name === name && (!moveName || item.getData?.('moveName') === moveName));
        const b = target.getBounds(), c = scene.game.canvas.getBoundingClientRect();
        return { x: c.x + b.centerX * scene.scale.zoom, y: c.y + b.centerY * scene.scale.zoom };
      }, { name, moveName });
      await page.touchscreen.tap(point.x, point.y);
    };
    const before = await page.evaluate(() => {
      const scene = (window as any).battleRulesFixture.scene.getScene('battle');
      scene.state.player.creatures[0].moves[0].pp = 0; scene.render();
      return JSON.stringify(scene.state);
    });
    await tap('battle-move-details', 'Tuonoshock');
    expect(await page.evaluate(() => {
      const scene = (window as any).battleRulesFixture.scene.getScene('battle');
      return { mode: scene.mode, selectable: scene.selectableButtons.length, state: JSON.stringify(scene.state) };
    })).toEqual({ mode: 'moveDetails', selectable: 0, state: before });
    await pressBattleKey(page, 'Escape');
    await tap('battle-tab-flee');
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.getScene('battle').mode)).toBe('flee');
    await pressBattleKey(page, 'Escape');
    expect(await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.getScene('battle').state))).toBe(before);
    await tap('battle-move-details', 'Ruggito');
    const use = await page.evaluate(() => {
      const scene = (window as any).battleRulesFixture.scene.getScene('battle');
      const text = scene.ui.list.find((item: any) => item.type === 'Text' && item.text === 'USA Ruggito');
      const b = text.getBounds(), c = scene.game.canvas.getBoundingClientRect();
      return { x: c.x + b.centerX * scene.scale.zoom, y: c.y + b.centerY * scene.scale.zoom };
    });
    await page.touchscreen.tap(use.x, use.y);
    await holdBattleMessage(page);
    const resolved = await page.evaluate(() => {
      const scene = (window as any).battleRulesFixture.scene.getScene('battle');
      return { turn: scene.state.turn, pp: scene.state.player.creatures[0].moves.map((slot: any) => slot.pp),
        stage: scene.state.opponent.creatures[0].statStages.attack,
        disabled: scene.ui.list.filter((item: any) => /^battle-tab-(moves|items|captures|party|flee)$/.test(item.name)).every((item: any) => !item.input?.enabled),
        state: JSON.stringify(scene.state) };
    });
    expect(resolved).toMatchObject({ turn: 1, pp: [0, 39], stage: -1, disabled: true });
    await tap('battle-tab-moves');
    expect(await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.getScene('battle').state))).toBe(resolved.state);
    expect(errors).toEqual([]);
  });
}


for (const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:667,height:320}]) {
  test(`learning compares five battle cards and inspects without replacing at ${size.width}x${size.height}`, async ({page}, info) => {
    await page.setViewportSize(size);
    const errors = await mountBattle(page, 'move-learning');
    await chooseFirstMove(page); await advanceToMoveLearning(page);
    const before = await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.keys.battle.state));
    const cards = await page.evaluate(() => (window as any).battleRulesFixture.scene.keys.battle.ui.list
      .filter((item:any) => item.name === 'battle-move-use').map((item:any) => ({...item.getBounds(), name:item.getData('moveName'), card:item.getData('presentation')})));
    expect(cards).toHaveLength(5);
    for (const card of cards) {
      expect(card.x).toBeGreaterThanOrEqual(0); expect(card.y).toBeGreaterThanOrEqual(0);
      expect(card.x + card.width).toBeLessThanOrEqual(size.width); expect(card.y + card.height).toBeLessThanOrEqual(size.height - (size.width > size.height ? 12 : 60));
      expect(card.card.typeLabel).toBeTruthy(); expect(card.card.ppLabel).toContain('PP');
    }
    await page.screenshot({path:info.outputPath('learning-comparison.png')});
    await pressBattleKey(page, 'ArrowDown',{delay:40});
    await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.keys.battle.selectionIndex)).toBe(2);
    for (const name of [moveRegistry.moves['quick-attack'].name, moveRegistry.moves.growl.name]) {
      await tapLearningZone(page, 'battle-move-details', name);
      await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.keys.battle.mode)).toBe('moveDetails');
      const pages = await page.evaluate(() => (window as any).battleRulesFixture.scene.keys.battle.detailPageCount);
      let text = '';
      for (let index=0; index<pages; index++) {
        text += await page.evaluate(() => (window as any).battleRulesFixture.scene.keys.battle.ui.list.find((item:any)=>item.name==='battle-move-description').text);
        if(index+1<pages) await tapLearningZone(page,'move-details-page');
      }
      expect(text).toMatch(name === moveRegistry.moves.growl.name ? /Riduce Attacco/ : /Priorità/);
      await tapLearningZone(page,'move-details-back');
      await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.keys.battle.mode)).toBe('learning');
      expect(await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.keys.battle.state))).toBe(before);
      expect(await page.evaluate(() => (window as any).battleRulesFixture.scene.keys.battle.selectionIndex)).toBe(2);
    }
    await tapLearningZone(page,'battle-move-use',moveRegistry.moves.tackle.name);
    expect(await page.evaluate(() => (window as any).battleRulesFixture.scene.keys.battle.state.player.creatures[0].moves[2].moveId)).toBe('quick-attack');
    expect(errors).toEqual([]);
  });
}

test('automatic learning shows the new battle card and keeps details read-only', async ({page}) => {
  await mountBattle(page,'auto-learning'); await chooseFirstMove(page);
  await holdBattleMessage(page);
  for(let i=0;i<30;i++) {
    const ready=await page.evaluate(() => { const s=(window as any).battleRulesFixture.scene.keys.battle; return s.learningEvent()?.type==='moveLearned' && s.ui.list.some((x:any)=>x.name==='battle-move-use'); });
    if(ready)break;
    await pressBattleKey(page, 'Enter',{delay:40});
    await page.waitForTimeout(100); await holdBattleMessage(page);
  }
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.keys.battle.learningEvent()?.moveId)).toBe('quick-attack');
  await pressBattleKey(page, 'i',{delay:40});
  await expect.poll(() => page.evaluate(() => (window as any).battleRulesFixture.scene.keys.battle.mode)).toBe('moveDetails');
  const before=await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.keys.battle.state));
  await tapLearningZone(page,'move-details-back');
  expect(await page.evaluate(() => (window as any).battleRulesFixture.scene.keys.battle.mode)).toBe('message');
  expect(await page.evaluate(() => JSON.stringify((window as any).battleRulesFixture.scene.keys.battle.state))).toBe(before);
  await pressBattleKey(page, 'Enter',{delay:40});
  expect(await page.evaluate(() => (window as any).battleRulesFixture.scene.keys.battle.eventLog.filter((e:any)=>e.type==='moveReplaced').length)).toBe(0);
});

async function tapLearningZone(page:Page,name:string,moveName?:string) {
  const point=await page.evaluate(({name,moveName})=>{
    const s=(window as any).battleRulesFixture.scene.keys.battle;
    const z=s.ui.list.find((x:any)=>x.name===name && (!moveName || x.getData('moveName')===moveName));
    if(!z)throw Error('Missing '+name+' '+moveName);
    const b=z.getBounds(),r=s.game.canvas.getBoundingClientRect();return{x:r.x+b.centerX*s.scale.zoom,y:r.y+b.centerY*s.scale.zoom};
  },{name,moveName});
  await page.touchscreen.tap(point.x,point.y);
}
