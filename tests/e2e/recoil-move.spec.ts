import { expect, test, type Page } from '@playwright/test';

for (const [width, height] of [[390, 844], [844, 390]]) {
  test(`Riduttore exposes recoil, applies it and saves HP/PP at ${width}x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export {};' }));
    await page.goto('/');
    // Legal Bulbasaur level-15 move; the one-HP opponent setup isolates recoil/persistence.
    await page.evaluate(async () => {
      const source = await (await fetch('/src/game/scenes/BattleScene.ts')).text();
      const phaserUrl = source.match(/["']([^"']*\/node_modules\/\.vite\/deps\/phaser\.js[^"']*)["']/)?.[1];
      if (!phaserUrl) throw new Error('Missing Phaser module');
      const { default: Phaser } = await import(phaserUrl);
      const { BattleScene } = await import('/src/game/scenes/BattleScene.ts' as string);
      const { preloadCreatureArt } = await import('/src/game/battle/creature-art.ts' as string);
      const { battleSpecies, battleMoves, veloriaBattleRules } = await import('/src/game/battle/catalog.ts' as string);
      const { createBattleCreature } = await import('/src/core/battle/create-creature.ts' as string);
      const { createBattleState } = await import('/src/core/battle/engine.ts' as string);
      const { newGameSave, saveGame } = await import('/src/persistence/save-store.ts' as string);
      const { mergeBattlePlayerState } = await import('/src/game/battle/create-battle-state.ts' as string);
      const player = createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId: 1, level: 15,
        instanceId: 'recoil-player', moveIds: ['take-down'] });
      const opponent = { ...createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId: 16, level: 3,
        instanceId: 'recoil-target', moveIds: ['tackle'] }), hp: 1 };
      const save = newGameSave();
      save.flags.push('q_starter_selected');
      save.party = [{ instanceId: player.instanceId, speciesId: player.speciesId, level: player.level, experience: 0,
        hp: player.hp, maxHp: player.stats.maxHp, moves: [{ id: 'take-down', pp: battleMoves['take-down'].maxPp }] }];
      await saveGame(save);
      const state = createBattleState({ battleId: 'recoil-presentation', battleType: 'wild', seed: 17,
        rules: veloriaBattleRules, playerTeam: [player], opponentTeam: [opponent] });
      (window as any).recoilInitial = { hp: player.hp, pp: player.moves[0].pp };
      document.body.innerHTML = '<div id="recoil-fixture" style="width:100vw;height:100vh"></div>';
      document.body.style.margin = '0';
      class Fixture extends Phaser.Scene {
        constructor() { super('fixture'); }
        preload() { preloadCreatureArt(this); }
        create() { this.scene.start('battle', { state, rules: veloriaBattleRules, moveCatalog: battleMoves, reducedAnimations: true,
          onComplete: (result: any) => { (window as any).recoilSave = saveGame(mergeBattlePlayerState(save, result)); } }); }
      }
      (window as any).recoilGame = new Phaser.Game({ type: Phaser.CANVAS, parent: 'recoil-fixture', audio: { noAudio: true },
        scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: [Fixture, BattleScene] });
    });
    await expect.poll(() => page.evaluate(() => Boolean((window as any).recoilGame?.scene.keys.battle?.ui?.list.length))).toBe(true);
    await page.keyboard.press('Enter', { delay: 40 });
    const card = await page.evaluate(() => (window as any).recoilGame.scene.keys.battle.ui.list
      .find((item: any) => item.name === 'battle-move-use').getData('presentation'));
    expect(card.name).toBe('Riduttore');
    expect(card.riskLabel).toContain('Contraccolpo 25%');
    expect(card.accessibleLabel).toContain('25% dei danni inflitti');
    await tapZone(page, 'battle-move-details');
    const paragraphs: string[] = [];
    const count = await page.evaluate(() => (window as any).recoilGame.scene.keys.battle.detailPageCount);
    for (let index = 0; index < count; index++) {
      const visible = await page.evaluate(() => {
        const scene = (window as any).recoilGame.scene.keys.battle;
        const label = scene.ui.list.find((item: any) => item.name === 'battle-move-description');
        const bounds = label.getBounds();
        return { text: label.text, bottom: bounds.bottom, height: scene.scale.height };
      });
      expect(visible.bottom).toBeLessThanOrEqual(visible.height - 100);
      paragraphs.push(visible.text);
      if (index + 1 < count) await tapZone(page, 'move-details-page');
    }
    expect(paragraphs.join(' ')).toContain('25% dei danni inflitti');
    expect(paragraphs.join(' ')).toContain('KO');
    await tapZone(page, 'move-details-back');
    await page.screenshot({ path: info.outputPath('recoil-card.png') });
    await tapZone(page, 'battle-move-use');
    await expect.poll(() => page.evaluate(() => (window as any).recoilGame.scene.keys.battle.terminalShown)).toBe(true);
    const observed = await page.evaluate(async () => {
      await (window as any).recoilSave;
      const scene = (window as any).recoilGame.scene.keys.battle;
      return { creature: scene.state.player.creatures[0], events: scene.eventLog, initial: (window as any).recoilInitial };
    });
    expect(observed.events).toContainEqual(expect.objectContaining({ type: 'recoilApplied', side: 'player', moveId: 'take-down', amount: 1 }));
    expect(observed.creature.hp).toBe(observed.initial.hp - 1);
    expect(observed.creature.moves[0].pp).toBe(observed.initial.pp - 1);
    await page.reload();
    const saved = await page.evaluate(async () => {
      const { loadSave } = await import('/src/persistence/save-store.ts' as string);
      return (await loadSave()).party[0];
    });
    expect(saved.hp).toBe(observed.creature.hp);
    expect(saved.moves[0]).toEqual({ id: 'take-down', pp: observed.initial.pp - 1 });
    expect(errors).toEqual([]);
  });
}

async function tapZone(page: Page, name: string) {
  const point = await page.evaluate(name => {
    const scene = (window as any).recoilGame.scene.keys.battle;
    const zone = scene.ui.list.find((item: any) => item.name === name);
    if (!zone) throw new Error(`Missing battle target: ${name}`);
    const bounds = zone.getBounds(), rect = scene.game.canvas.getBoundingClientRect();
    return { x: rect.x + bounds.centerX * scene.scale.zoom, y: rect.y + bounds.centerY * scene.scale.zoom };
  }, name);
  await page.touchscreen.tap(point.x, point.y);
}
