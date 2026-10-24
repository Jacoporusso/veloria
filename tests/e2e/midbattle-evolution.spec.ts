import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave } from './helpers/world-navigation';
import { tapBattleLabel } from './helpers/battle-touch';
import mira from '../../content/trainers/gym01_mira.trainer.json' with { type: 'json' };
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import { prototypeBattleRules, experienceForDefeat } from '../../src/core/battle/rules.ts';

test.use({ reducedMotion: 'reduce' });

for (const [width, height, late] of [[390, 844, false], [844, 390, false], [390, 844, true]] as const) {
test(`Charmeleon evolves between gym opponents and celebrates once at ${width}x${height}${late ? " on final opponent" : ""}`, async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width, height });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch({ maxRetries: 2 });
    await route.fulfill({ response, body: `${await response.text()}\nglobalThis.__midEvolutionGame = game;` });
  });
  await page.goto('/'); await enterGame(page);
  // Isolated integration setup, not an earned campaign checkpoint.
  const first = mira.team[0];
  const firstXp = experienceForDefeat((speciesData.species as any)[first.speciesId].experienceYield, first.level, true, prototypeBattleRules.experienceRewards);
  await page.evaluate(async ({ late, firstXp }) => {
    const { createBattleCreature } = await import('/src/core/battle/create-creature.ts' as string);
    const { experienceToNextLevel } = await import('/src/core/battle/progression.ts' as string);
    const { battleSpecies, battleMoves, veloriaBattleRules } = await import('/src/game/battle/catalog.ts' as string);
    const { loadSave, saveGame } = await import('/src/persistence/save-store.ts' as string);
    const save = await loadSave();
    const creature = createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId: 5, level: 35,
      experience: experienceToNextLevel(35, veloriaBattleRules.experienceCurves[battleSpecies[5].growthCurveId]) - (late ? firstXp : 0) - 1,
      instanceId: 'midbattle-charmeleon', moveIds: ['ember'] });
    save.player = { ...save.player, mapId: 'veloria/gym01_brumalta', spawnPointId: 'from_city', x: 14, y: 3 };
    save.party = [{ instanceId: creature.instanceId, speciesId: 5, level: 35, experience: creature.experience,
      hp: creature.hp, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
    save.flags = [...new Set([...save.flags, 'q_starter_selected', 'q_brumalta_visited', 'gym01_puzzle_solved', 'prologue_complete_seen'])];
    save.rngState = 0x12345678;
    await saveGame(save);
  }, { late, firstXp });
  await page.reload(); await enterGame(page);
  await page.evaluate(() => {
    (window as any).__evolutionCeremonies = 0;
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
      if (node instanceof HTMLElement && node.matches('.evolution-celebration')) (window as any).__evolutionCeremonies++;
    }))).observe(document.body, { childList: true, subtree: true });
  });
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  for (let step = 0; step < 12 && !await page.getByRole('button', { name: 'SFIDA', exact: true }).isVisible(); step++) {
    await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  }
  await page.getByRole('button', { name: 'SFIDA', exact: true }).click();
  await tapBattleLabel(page, '__midEvolutionGame', 'Braciere');
  if (late) {
    await expect.poll(() => page.evaluate(() => (window as any).__midEvolutionGame.scene.keys.battle.mode)).toBe('menu');
    expect(await page.evaluate(() => (window as any).__evolutionCeremonies)).toBe(0);
    await tapBattleLabel(page, '__midEvolutionGame', 'Braciere');
  }
  const ceremony = page.locator('.evolution-celebration');
  await expect(ceremony).toBeVisible({ timeout: 20_000 });
  await expect(ceremony).toContainText('Ora è Charizard!');
  const between = await page.evaluate(() => {
    const scene = (window as any).__midEvolutionGame.scene.keys.battle;
    return { outcome: scene.state.outcome.kind, opponent: scene.state.opponent.activeIndex,
      player: scene.state.player.creatures[0].speciesId, level: scene.state.player.creatures[0].level };
  });
  expect(between).toEqual({ outcome: late ? 'won' : 'ongoing', opponent: late ? 1 : 0, player: 6, level: 36 });
  await page.screenshot({ path: info.outputPath('gym-midbattle-evolution.png') });
  await ceremony.getByRole('button', { name: 'Continua', exact: true }).click();
  await expect.poll(async () => {
    const mode = await page.evaluate(() => {
      const scene = (window as any).__midEvolutionGame.scene.keys.battle;
      return scene.terminalShown ? 'terminal' : scene.mode === 'message' && scene.pendingMessages[0]?.event?.type === 'moveLearned' ? 'learned' : scene.mode;
    });
    if (mode === 'learned') await tapBattleLabel(page, '__midEvolutionGame', 'Continua');
    return mode;
  }, { timeout: 20_000 }).toBe(late ? 'terminal' : 'menu');
  if (!late) {
    const resumed = await page.evaluate(() => {
      const scene = (window as any).__midEvolutionGame.scene.keys.battle;
      return { opponent: scene.state.opponent.activeIndex, species: scene.state.player.creatures[0].speciesId,
        moves: scene.state.player.creatures[0].moves.map(slot => slot.moveId), key: scene.actors.player.list.find(child => child.type === 'Image').texture.key };
    });
    expect(resumed.opponent).toBe(1); expect(resumed.species).toBe(6);
    expect(resumed.moves).toContain('wing-attack');
    expect(resumed.key).toBe('pokeapi-starter-finals-6-v1');
    await tapBattleLabel(page, '__midEvolutionGame', 'Braciere');
  }
  await expect(page.locator('.battle-celebration')).toBeVisible({ timeout: 20_000 });
  expect(await page.evaluate(() => (window as any).__evolutionCeremonies)).toBe(1);
  await expect(ceremony).toHaveCount(0);
  const stored = await readBrowserSave(page);
  expect(stored.party[0].speciesId).toBe(6); expect(stored.party[0].level).toBe(36);
  expect(stored.party[0].instanceId).toBe('midbattle-charmeleon');
  expect(stored.flags.some(flag => flag.startsWith('presentation/evolution/'))).toBe(false);
  expect(stored.badges).toContain('badge_aurora');
  await page.getByRole('button', { name: 'Continua', exact: true }).click();
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).party[0].speciesId).toBe(6);
  expect(errors).toEqual([]);
});

}
