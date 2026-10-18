import { expect, test } from '@playwright/test';

test.use({ deviceScaleFactor: 3, reducedMotion: 'reduce' });
for (const moveId of ['sonic-boom', 'thunder-wave']) test(`${moveId} shows its real effect and resolves against Wooper`, async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nglobalThis.__urbanGame = game;' });
  });
  await page.goto('/?previewMap=veloria/vetracielo');
  await expect(page.locator('#game-loading')).toBeHidden();
  await page.evaluate(async moveId => {
    const { battleSpecies, battleMoves, veloriaBattleRules } = await import('/src/game/battle/catalog.ts' as string);
    const { createBattleCreature } = await import('/src/core/battle/create-creature.ts' as string);
    const { createBattleState } = await import('/src/core/battle/engine.ts' as string);
    const player = createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId: moveId === 'sonic-boom' ? 100 : 81, level: 20, instanceId: 'urban-player', moveIds: [moveId] });
    const opponent = createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId: 194, level: 20, instanceId: 'urban-wooper', moveIds: ['water-gun'] });
    (window as any).__urbanInitialHp = opponent.hp;
    (window as any).__urbanGame.scene.keys.world.beginBattle(createBattleState({ battleId: 'urban-feedback', battleType: 'wild', seed: 321, rules: veloriaBattleRules, playerTeam: [player], opponentTeam: [opponent] }));
  }, moveId);
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).__urbanGame.scene.keys.battle;
    return Boolean(scene?.sys.isActive() && scene.ui?.list.length);
  })).toBe(true);
  async function tapLabel(prefix: string) {
    const point = await page.evaluate(prefix => {
      const scene = (window as any).__urbanGame.scene.keys.battle;
      const text = scene.ui.list.find((item: any) => item.type === 'Text' && item.text.startsWith(prefix));
      const bounds = text.getBounds(), rect = scene.game.canvas.getBoundingClientRect();
      return { x: rect.x + bounds.centerX * scene.scale.zoom, y: rect.y + bounds.centerY * scene.scale.zoom };
    }, prefix);
    await page.touchscreen.tap(point.x, point.y);
  }
  await tapLabel('LOTTA');
  const preview = await page.evaluate(() => {
    const scene = (window as any).__urbanGame.scene.keys.battle;
    return scene.movePreview.list.filter((item: any) => item.type === 'Text').map((item: any) => item.text).join('\n');
  });
  if (moveId === 'sonic-boom') {
    expect(preview).toContain('DANNO FISSO 20 HP');
    expect(preview).toContain('STIMA DANNI: 20 HP');
    expect(preview).not.toContain('POTENZA 0');
  } else expect(preview).toContain('NESSUN EFFETTO · IMMUNITÀ DI TIPO');
  await page.screenshot({ path: info.outputPath(`${moveId}-preview.png`) });
  await tapLabel(moveId === 'sonic-boom' ? 'Sonicboom' : 'Tuononda');
  await expect.poll(() => page.evaluate(() => (window as any).__urbanGame.scene.keys.battle.eventLog.some((event: any) => event.type === 'moveUsed'))).toBe(true);
  const result = await page.evaluate(() => {
    const scene = (window as any).__urbanGame.scene.keys.battle;
    return { events: scene.eventLog, opponent: scene.state.opponent.creatures[0], initialHp: (window as any).__urbanInitialHp, pp: scene.state.player.creatures[0].moves[0].pp };
  });
  if (moveId === 'sonic-boom') {
    expect(result.events).toContainEqual(expect.objectContaining({ type: 'damageApplied', sourceSide: 'player', moveId, amount: 20, critical: false }));
    expect(result.opponent.hp).toBe(result.initialHp - 20);
  } else {
    expect(result.events).toContainEqual(expect.objectContaining({ type: 'statusPrevented', side: 'opponent', reason: 'immune' }));
    expect(result.opponent.status).toBeUndefined();
  }
  expect(result.pp).toBe(19);
  expect(errors).toEqual([]);
});
