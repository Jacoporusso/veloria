import { expect, test, type Page } from '@playwright/test';

test.use({ hasTouch: true, deviceScaleFactor: 2 });

/** Isolated DOM fixture using the real chooser, immutable service and presentation.
 * Persistence failure is injected at the caller boundary; no save is written by this fixture.
 */
async function mount(page: Page, failFirstSave = false, waterStone = false) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export {};' }));
  await page.goto('/');
  await page.evaluate(async ({ failFirst, waterStone }) => {
    const { chooseItemEvolution } = await import('/src/game/ui/ItemEvolutionMenu.ts' as string);
    const { applyItemEvolution, pendingEvolutionReceipts, evolutionReceiptFlag } = await import('/src/core/services/item-evolution.ts' as string);
    const { ensureSavedProgress } = await import('/src/game/ui/SaveRetryDialog.ts' as string);
    const { showEvolutionCelebration } = await import('/src/game/ui/EvolutionCelebration.ts' as string);
    const { battleSpecies, battleMoves, itemEvolutionRules } = await import('/src/game/battle/catalog.ts' as string);
    const { calculateStats } = await import('/src/core/battle/create-creature.ts' as string);
    const { createCreaturePortrait } = await import('/src/game/battle/creature-art.ts' as string);
    document.body.innerHTML = '<button id="open-item">Usa Pietratuono</button><div id="art-fixture" hidden></div>';
    const fixture = (window as any).itemFixture = { attempts: 0, applications: 0, finished: 0, cancelled: 0, durable: null, decodedArt: [] as number[] };
    const maxHp = calculateStats(battleSpecies[25].baseStats, 20).maxHp;
    fixture.save = {
      schemaVersion: 2, saveRevision: 1, contentVersion: 'fixture', saveId: 'item-fixture', savedAt: '2026-10-20T00:00:00Z',
      player: { name: 'Ada', mapId: 'veloria/borgofonte', spawnPointId: 'from_home', x: 1, y: 1, money: 700 },
      party: [{ instanceId: 'pikachu', speciesId: 25, level: 20, experience: 3180, hp: maxHp - 7, maxHp,
        moves: [{ id: 'thunder-shock', pp: 7 }, { id: 'quick-attack', pp: 13 }], status: { status: 'sleep', turnsRemaining: 2 } }],
      storage: [], flags: [], badges: [], inventory: { 'thunder-stone': 2 }, rngState: 17,
    };
    fixture.original = structuredClone(fixture.save);
    if (waterStone) {
      const creature = fixture.save.party[0];
      creature.speciesId = 61;
      creature.level = 25;
      creature.experience = 11735;
      creature.maxHp = calculateStats(battleSpecies[61].baseStats, 25).maxHp;
      creature.hp = creature.maxHp - 7;
      creature.moves = [{ id: 'water-gun', pp: 9 }, { id: 'hypnosis', pp: 4 }];
      fixture.save.inventory = { 'water-stone': 1 };
      fixture.original = structuredClone(fixture.save);
      document.querySelector('#open-item')!.textContent = 'Usa Pietraidrica';
    }
    const itemId = waterStone ? 'water-stone' : 'thunder-stone';
    for (const id of [26, 62, 134, 135, 136]) {
      const portrait = createCreaturePortrait(id);
      document.querySelector('#art-fixture')!.append(portrait);
      const url = portrait.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
      if (!url || portrait.classList.contains('creature-portrait-pending')) throw new Error(`Missing item-evolution art ${id}`);
      const image = new Image(); image.src = url; await image.decode();
      if (image.naturalWidth < 1) throw new Error(`Empty item-evolution art ${id}`);
      fixture.decodedArt.push(id);
    }
    document.querySelector('#open-item')!.addEventListener('click', async () => {
      const selected = await chooseItemEvolution({ save: fixture.save, itemId, rules: itemEvolutionRules, species: battleSpecies, moves: battleMoves, itemName: waterStone ? 'Pietraidrica' : 'Pietratuono' });
      if (selected === null) { fixture.cancelled++; return; }
      fixture.applications++;
      const result = applyItemEvolution(fixture.save, itemId, selected, itemEvolutionRules, battleSpecies);
      if (!result.ok) throw new Error(result.reason);
      fixture.save = result.save;
      const saved = await ensureSavedProgress(async () => {
        fixture.attempts++;
        if (failFirst && fixture.attempts === 1) return false;
        fixture.durable = structuredClone(fixture.save);
        return true;
      });
      if (!saved) return;
      for (const receipt of pendingEvolutionReceipts(fixture.save)) {
        await showEvolutionCelebration({ ...receipt, fromName: battleSpecies[receipt.fromSpeciesId].name, toName: battleSpecies[receipt.toSpeciesId].name, reducedAnimations: true });
        fixture.save = { ...fixture.save, flags: fixture.save.flags.filter((flag: string) => flag !== evolutionReceiptFlag(receipt)) };
      }
      fixture.finished++;
    });
  }, { failFirst: failFirstSave, waterStone });
  return errors;
}

test('Poliwhirl Water Stone preview, cancellation and ceremony preserve earned moves', async ({ page }) => {
  const errors = await mount(page, false, true);
  const open = page.getByRole('button', { name: 'Usa Pietraidrica' });
  await open.tap();
  const chooser = page.getByRole('dialog', { name: 'Pietraidrica', exact: true });
  await chooser.getByRole('button', { name: /Poliwhirl/ }).tap();
  await expect(chooser).toContainText('Poliwrath');
  await chooser.getByRole('button', { name: 'Indietro', exact: true }).tap();
  await chooser.getByRole('button', { name: 'Annulla', exact: true }).tap();
  expect(await page.evaluate(() => JSON.stringify((window as any).itemFixture.save) === JSON.stringify((window as any).itemFixture.original))).toBe(true);
  await open.tap();
  await chooser.getByRole('button', { name: /Poliwhirl/ }).tap();
  await chooser.getByRole('button', { name: 'Evolvi in Poliwrath' }).tap();
  const ceremony = page.getByRole('dialog', { name: 'Ora è Poliwrath!' });
  await expect(ceremony).toBeVisible();
  await ceremony.getByRole('button', { name: 'Continua', exact: true }).tap();
  await expect.poll(() => page.evaluate(() => (window as any).itemFixture.finished)).toBe(1);
  const state = await page.evaluate(() => (window as any).itemFixture);
  expect(state.applications).toBe(1);
  expect(state.durable.party[0].speciesId).toBe(62);
  expect(state.durable.inventory['water-stone'] ?? 0).toBe(0);
  expect(state.durable.party[0].moves).toEqual(state.original.party[0].moves);
  expect(state.decodedArt).toContain(62);
  expect(errors).toEqual([]);
});

for (const [orientation, width, height] of [['portrait', 390, 844], ['landscape', 844, 390]] as const) {
  test(`item evolution preview and cancellation preserve all progress in ${orientation}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = await mount(page);
    await expect.poll(() => page.evaluate(() => (window as any).itemFixture.decodedArt)).toEqual([26, 62, 134, 135, 136]);
    await page.getByRole('button', { name: 'Usa Pietratuono' }).tap();
    const dialog = page.getByRole('dialog', { name: 'Pietratuono', exact: true });
    await dialog.getByRole('button', { name: /Pikachu/ }).tap();
    await expect(dialog).toContainText('Raichu');
    await expect(dialog).toContainText('PP 7/30');
    await expect(dialog).toContainText('Mosse che conserva');
    const button = dialog.getByRole('button', { name: 'Evolvi in Raichu' });
    const bounds = await button.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
    await dialog.getByRole('button', { name: 'Indietro', exact: true }).tap();
    await dialog.getByRole('button', { name: 'Annulla', exact: true }).tap();
    await expect.poll(() => page.evaluate(() => (window as any).itemFixture.cancelled)).toBe(1);
    const unchanged = await page.evaluate(() => {
      const f = (window as any).itemFixture;
      return { unchanged: JSON.stringify(f.save) === JSON.stringify(f.original), applications: f.applications, attempts: f.attempts };
    });
    expect(unchanged).toEqual({ unchanged: true, applications: 0, attempts: 0 });
    expect(errors).toEqual([]);
  });

  test(`confirmed stone evolution and reduced ceremony in ${orientation}${orientation === 'landscape' ? ' recover from save failure' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const failure = orientation === 'landscape';
    const errors = await mount(page, failure);
    await page.getByRole('button', { name: 'Usa Pietratuono' }).tap();
    const chooser = page.getByRole('dialog', { name: 'Pietratuono', exact: true });
    await chooser.getByRole('button', { name: /Pikachu/ }).tap();
    await chooser.getByRole('button', { name: 'Evolvi in Raichu' }).tap();
    if (failure) {
      const retry = page.getByRole('dialog', { name: 'Salvataggio da completare' });
      await expect(retry).toBeVisible();
      await expect(page.locator('.evolution-celebration')).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(retry).toBeVisible();
      await retry.getByRole('button', { name: 'Riprova salvataggio' }).tap();
    }
    const ceremony = page.getByRole('dialog', { name: 'Ora è Raichu!' });
    await expect(ceremony).toBeVisible();
    await expect(ceremony).toContainText('Livello 20');
    await expect(ceremony.getByRole('button', { name: 'Continua', exact: true })).toBeEnabled();
    await ceremony.getByRole('button', { name: 'Continua', exact: true }).tap();
    await expect(ceremony).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as any).itemFixture.finished)).toBe(1);
    const result = await page.evaluate(() => {
      const f = (window as any).itemFixture;
      return { applications: f.applications, attempts: f.attempts, original: f.original, saved: f.durable, current: f.save };
    });
    expect(result.applications).toBe(1);
    expect(result.attempts).toBe(failure ? 2 : 1);
    expect(result.saved.inventory['thunder-stone']).toBe(1);
    expect(result.saved.party[0].speciesId).toBe(26);
    for (const key of ['instanceId', 'level', 'experience', 'moves', 'status']) expect(result.saved.party[0][key]).toEqual(result.original.party[0][key]);
    expect(result.saved.party[0].maxHp - result.saved.party[0].hp).toBe(7);
    expect(result.original.inventory['thunder-stone']).toBe(2);
    expect(result.current.flags.some((flag: string) => flag.startsWith('presentation/evolution/'))).toBe(false);
    expect(errors).toEqual([]);
  });
}
