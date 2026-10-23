import { expect, test, type Page } from '@playwright/test';

async function mountEvolution(page: Page, speciesId: number) {
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export {};' }));
  await page.goto('/');
  await page.evaluate(async speciesId => {
    await import('/src/style.css' as string);
    const source = await (await fetch('/src/game/scenes/BattleScene.ts')).text();
    const phaserUrl = source.match(/["']([^"']*\/node_modules\/\.vite\/deps\/phaser\.js[^"']*)["']/)![1];
    const { default: Phaser } = await import(phaserUrl);
    const { BattleScene } = await import('/src/game/scenes/BattleScene.ts' as string);
    const { createBattleCreature } = await import('/src/core/battle/create-creature.ts' as string);
    const { experienceToNextLevel } = await import('/src/core/battle/progression.ts' as string);
    const { newGameSave, saveGame } = await import('/src/persistence/save-store.ts' as string);
    const { createWildBattle, mergeBattlePlayerState } = await import('/src/game/battle/create-battle-state.ts' as string);
    const { battleSpecies, battleMoves, veloriaBattleRules } = await import('/src/game/battle/catalog.ts' as string);
    const level = veloriaBattleRules.evolutions[speciesId][0].minimumLevel - 1;
    const player = createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId, level, instanceId: `starter-${speciesId}`,
      experience: experienceToNextLevel(level, veloriaBattleRules.experienceCurves[battleSpecies[speciesId].growthCurveId]) - 1 });
    const save = newGameSave();
    // This isolated fixture verifies evolution/art/persistence, not hit probability.
    // New adventures remain random; a controlled battle cursor keeps this gate repeatable.
    save.rngState = 0x12345678;
    save.flags.push('q_starter_selected');
    save.party = [{ instanceId: player.instanceId, speciesId, level, experience: player.experience, hp: player.hp, maxHp: player.stats.maxHp,
      moves: player.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
    await saveGame(save);
    const prepared = createWildBattle({ save, speciesId: 10, level: 3, registries: { species: battleSpecies, moves: battleMoves }, rules: veloriaBattleRules, battleId: 'evolution-fixture' });
    const state = { ...prepared, opponent: { ...prepared.opponent, creatures: [{ ...prepared.opponent.creatures[0], hp: 1 }] } };
    (window as any).evolutionCompletions = 0;
    (window as any).evolutionMove = player.moves.map(slot => battleMoves[slot.moveId]).find(move => move.power > 0).name;
    const scene = new BattleScene();
    (window as any).evolutionGame = new Phaser.Game({ type: Phaser.CANVAS, parent: 'game', audio: { noAudio: true },
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: [] });
    (window as any).evolutionGame.scene.add('battle', scene, true, { state, rules: veloriaBattleRules, moveCatalog: battleMoves, reducedAnimations: true,
      onComplete: (state: any) => { (window as any).evolutionCompletions++; (window as any).evolutionSavePromise = saveGame(mergeBattlePlayerState(save, state)); },
      onDismiss: () => scene.scene.stop(),
    });
    document.querySelector<HTMLElement>('#game-loading')!.hidden = true;
  }, speciesId);
  await expect.poll(() => page.evaluate(() => Boolean((window as any).evolutionGame?.scene.keys.battle?.ui?.list.length))).toBe(true);
}

async function tapText(page: Page, text: string) {
  const point = await page.evaluate(text => {
    const scene = (window as any).evolutionGame.scene.keys.battle;
    const label = scene.ui.list.find((entry: any) => entry.type === 'Text' && entry.text === text);
    const bounds = label.getBounds();
    return { x: bounds.centerX, y: bounds.centerY };
  }, text);
  await page.touchscreen.tap(point.x, point.y);
}

for (const [fromId, toId, name, threshold, artGroup = 'evolution'] of [[81, 82, 'Magneton', 30, 'urban'], [220, 221, 'Piloswine', 33, 'mountain'], [17, 18, 'Pidgeot', 36], [43, 44, 'Gloom', 21], [60, 61, 'Poliwhirl', 25], [69, 70, 'Weepinbell', 21], [100, 101, 'Electrode', 30], [167, 168, 'Ariados', 22], [1, 2, 'Ivysaur', 16], [4, 5, 'Charmeleon', 16], [7, 8, 'Wartortle', 16], [16, 17, 'Pidgeotto', 18], [19, 20, 'Raticate', 20], [161, 162, 'Furret', 15], [163, 164, 'Noctowl', 20], [179, 180, 'Flaaffy', 15], [194, 195, 'Quagsire', 20], [2, 3, 'Venusaur', 32, 'starter-finals'], [5, 6, 'Charizard', 36, 'starter-finals'], [8, 9, 'Blastoise', 36, 'starter-finals'], [180, 181, 'Ampharos', 30, 'starter-finals']] as const) {
  test(`${name} evolves in a real battle and survives IndexedDB reload with artwork`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await mountEvolution(page, fromId);
    await page.keyboard.press('Enter', { delay: 40 });
    await tapText(page, await page.evaluate(() => (window as any).evolutionMove));
    await expect.poll(() => page.evaluate(() => (window as any).evolutionGame.scene.keys.battle.state.player.creatures[0].speciesId)).toBe(toId);
    for (let action = 0; action < 20; action++) {
      await expect.poll(() => page.evaluate(() => {
        const scene = (window as any).evolutionGame.scene.keys.battle;
        return scene.mode === 'learning' || scene.mode === 'message' && scene.pendingMessages[0]?.event?.type === 'moveLearned'
          || scene.terminalShown || Boolean(document.querySelector('.evolution-celebration'));
      })).toBe(true);
      if (await page.evaluate(() => (window as any).evolutionGame.scene.keys.battle.terminalShown)) break;
      const ceremony = page.locator('.evolution-celebration');
      if (await ceremony.count()) {
        await expect(ceremony).toBeVisible();
        await expect(ceremony).toContainText(`Ora è ${name}!`);
        await ceremony.getByRole('button', { name: 'Continua', exact: true }).click();
      } else if (await page.evaluate(() => (window as any).evolutionGame.scene.keys.battle.mode === 'message')) {
        // Automatic learning now waits for the player to acknowledge its information card.
        await tapText(page, 'Continua');
      } else {
        await tapText(page, 'Tieni le mosse');
      }
    }
    await expect.poll(() => page.evaluate(() => (window as any).evolutionGame.scene.keys.battle.terminalShown)).toBe(true);
    await expect(page.locator('.battle-celebration')).toBeVisible();
    const observed = await page.evaluate(async () => {
      await (window as any).evolutionSavePromise;
      const scene = (window as any).evolutionGame.scene.keys.battle;
      const image = scene.actors.player.list.find((child: any) => child.type === 'Image');
      return { completions: (window as any).evolutionCompletions, artwork: image.texture.key,
        events: scene.eventLog.filter((event: any) => event.type === 'creatureEvolved').length, creature: scene.state.player.creatures[0] };
    });
    expect(observed.completions).toBe(1);
    expect(observed.events).toBe(1);
    expect(observed.artwork).toBe(`pokeapi-${artGroup}-${toId}-v1`);
    await page.getByRole('button', { name: 'Continua', exact: true }).click();
    await page.reload();
    const stored = await page.evaluate(async () => {
      await import('/src/style.css' as string); await import('/src/settings.css' as string);
      const { loadSave } = await import('/src/persistence/save-store.ts' as string);
      const { PokemonPanel } = await import('/src/game/ui/PokemonPanel.ts' as string);
      const save = await loadSave();
      new PokemonPanel().render(save, 'team');
      document.querySelector<HTMLElement>('#pokedex-panel')!.hidden = false;
      document.querySelector<HTMLElement>('#game-loading')!.hidden = true;
      return save.party[0];
    });
    expect(stored.speciesId).toBe(toId);
    expect(stored.level).toBe(threshold);
    expect(stored.instanceId).toBe(`starter-${fromId}`);
    expect(stored.hp).toBe(observed.creature.hp);
    expect(stored.moves).toEqual(observed.creature.moves.map((slot: any) => ({ id: slot.moveId, pp: slot.pp })));
    await page.getByRole('button', { name: new RegExp(name) }).click();
    await expect(page.locator('.pokemon-hero')).toContainText(name);
    await expect(page.locator('.pokemon-hero .creature-portrait')).toHaveCSS('background-image', new RegExp(`pokeapi-${artGroup}-${toId}-v1.webp`));
    await page.screenshot({ path: testInfo.outputPath('evolved-creature.png') });
    expect(errors).toEqual([]);
  });
}
