import { expect, test } from '@playwright/test';

for (const [width, height] of [[320, 568], [844, 390]]) {
  test('exhausted teams can use the emergency move at ' + width + 'x' + height, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export {};' }));
    await page.goto('/');
    await page.evaluate(async () => {
      const source = await (await fetch('/src/game/scenes/BattleScene.ts')).text();
      const phaserUrl = source.match(/["']([^"']*\/node_modules\/\.vite\/deps\/phaser\.js[^"']*)["']/)?.[1];
      if (!phaserUrl) throw new Error('Missing Phaser module URL');
      const { default: Phaser } = await import(phaserUrl);
      const { BattleScene } = await import('/src/game/scenes/BattleScene.ts' as string);
      const { preloadCreatureArt } = await import('/src/game/battle/creature-art.ts' as string);
      const { battleSpecies, battleMoves, veloriaBattleRules } = await import('/src/game/battle/catalog.ts' as string);
      const { createBattleCreature } = await import('/src/core/battle/create-creature.ts' as string);
      const { createBattleState } = await import('/src/core/battle/engine.ts' as string);
      document.body.innerHTML = '<div id="emergency-fixture" style="width:100vw;height:100vh"></div>';
      document.body.style.margin = '0';
      const exhausted = (speciesId: number, instanceId: string) => {
        const creature = createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId, level: 8, instanceId });
        return { ...creature, moves: creature.moves.map((slot: any) => ({ ...slot, pp: 0 })) };
      };
      const state = createBattleState({ battleId: 'exhausted-teams', battleType: 'trainer', seed: 321,
        rules: veloriaBattleRules, playerTeam: [exhausted(1, 'player')], opponentTeam: [exhausted(161, 'opponent')] });
      class Fixture extends Phaser.Scene {
        constructor() { super('fixture'); }
        preload() { preloadCreatureArt(this); }
        create() { this.scene.start('battle', { state, moveCatalog: battleMoves, rules: veloriaBattleRules,
          reducedAnimations: true, onComplete: () => undefined }); }
      }
      (window as any).emergencyFixture = new Phaser.Game({ type: Phaser.CANVAS, parent: 'emergency-fixture',
        audio: { noAudio: true }, scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: [Fixture, BattleScene] });
    });
    await expect.poll(() => page.evaluate(() => Boolean((window as any).emergencyFixture?.scene.isActive('battle')))).toBe(true);
    await page.keyboard.press('Enter', { delay: 40 });
    await expect.poll(() => page.evaluate(() => (window as any).emergencyFixture.scene.getScene('battle').mode)).toBe('moves');
    const label = await page.evaluate(() => {
      const scene = (window as any).emergencyFixture.scene.getScene('battle');
      const title = scene.ui.list.find((item: any) => item.type === 'Text' && item.text.includes('SCONTRO D’EMERGENZA'));
      const detail = scene.ui.list.find((item: any) => item.type === 'Text' && item.text.includes('Senza PP · causa contraccolpo'));
      const bounds = (item: any) => ({ x: item.getBounds().x, right: item.getBounds().right, y: item.getBounds().y, bottom: item.getBounds().bottom });
      return title && detail ? { title: title.text, detail: detail.text, titleBounds: bounds(title), detailBounds: bounds(detail) } : null;
    });
    expect(label?.title).toContain('SCONTRO D’EMERGENZA');
    expect(label?.detail).toContain('Senza PP · causa contraccolpo');
    for (const bounds of [label!.titleBounds, label!.detailBounds]) {
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(width);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.bottom).toBeLessThanOrEqual(height);
    }
    await page.screenshot({ path: testInfo.outputPath('emergency-command.png') });
    const slotCount = await page.evaluate(() => {
      const scene = (window as any).emergencyFixture.scene.getScene('battle');
      return [...scene.state.player.creatures, ...scene.state.opponent.creatures].reduce((sum: number, creature: any) => sum + creature.moves.length, 0);
    });
    await page.keyboard.press('Enter', { delay: 40 });
    await expect.poll(() => page.evaluate(() => {
      const scene = (window as any).emergencyFixture.scene.getScene('battle');
      return { turn: scene.state.turn,
        uses: scene.eventLog.filter((event: any) => event.type === 'moveUsed' && event.moveId === 'struggle').length,
        recoil: scene.eventLog.filter((event: any) => event.type === 'recoilApplied').length,
        pp: [...scene.state.player.creatures, ...scene.state.opponent.creatures].flatMap((creature: any) => creature.moves.map((slot: any) => slot.pp)) };
    })).toEqual({ turn: 1, uses: 2, recoil: 2, pp: Array(slotCount).fill(0) });
    expect(errors).toEqual([]);
  });
}
