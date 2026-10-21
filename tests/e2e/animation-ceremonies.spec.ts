import { expect, test, type Page } from '@playwright/test';

test.use({ hasTouch: true, deviceScaleFactor: 2 });

/** The capture receipt comes from the deterministic battle engine, not a synthetic success event. */
async function mount(page: Page, reduced = false) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export {};' }));
  await page.goto('/');
  await page.evaluate(async reduced => {
    const { showEvolutionCelebration } = await import('/src/game/ui/EvolutionCelebration.ts' as string);
    const { BattleCelebration } = await import('/src/game/ui/BattleCelebration.ts' as string);
    const { createBattleCreature } = await import('/src/core/battle/create-creature.ts' as string);
    const { createBattleState, resolveBattleTurn } = await import('/src/core/battle/engine.ts' as string);
    const { battleSpecies, battleMoves, veloriaBattleRules } = await import('/src/game/battle/catalog.ts' as string);
    document.body.innerHTML = '<button id="show-evolution">Evoluzione</button><button id="show-capture">Cattura</button>';
    const rules = { ...veloriaBattleRules, captureItems: { 'poke-ball': { baseChance: 1 } } };
    const own = createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId: 4, level: 16, instanceId: 'animation-own' });
    const wild = createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId: 7, level: 8, instanceId: 'animation-wild' });
    const initial = createBattleState({ battleId: 'ceremony', battleType: 'wild', seed: 17, rules, playerTeam: [own], opponentTeam: [wild] });
    const result = resolveBattleTurn(initial, { player: { kind: 'attemptCapture', itemId: 'poke-ball', captureInstanceId: 'animation-caught' }, opponent: { kind: 'useMove', moveSlot: 0 } }, battleMoves, rules);
    if (result.state.outcome.kind !== 'captured') throw new Error('Guaranteed engine capture did not succeed');
    const fixture = (window as any).ceremonyFixture = { state: result.state, events: result.events,
      original: JSON.stringify(result), evolutionClosed: 0, captureClosed: 0 };
    document.querySelector('#show-evolution')!.addEventListener('click', async () => {
      await showEvolutionCelebration({ fromSpeciesId: 4, toSpeciesId: 5, fromName: 'Charmander', toName: 'Charmeleon', level: 16, reducedAnimations: reduced });
      fixture.evolutionClosed++;
    });
    document.querySelector('#show-capture')!.addEventListener('click', () => {
      new BattleCelebration(fixture.state, fixture.events, battleMoves, undefined, () => fixture.captureClosed++, reduced, true);
    });
  }, reduced);
  return errors;
}

async function unchanged(page: Page) {
  expect(await page.evaluate(() => {
    const f = (window as any).ceremonyFixture;
    return JSON.stringify({ state: f.state, events: f.events }) === f.original;
  })).toBe(true);
}

for (const [orientation, width, height] of [['portrait', 390, 844], ['landscape', 844, 390]] as const) {
  test(`full evolution has moving orbits and a skippable reveal in ${orientation}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    const errors = await mount(page);
    await page.getByRole('button', { name: 'Evoluzione', exact: true }).tap();
    const overlay = page.locator('.evolution-celebration');
    const orbit = page.locator('.evolution-celebration__orbit').first();
    await expect(overlay).toHaveClass(/is-transforming/);
    const movement = await orbit.evaluate(async el => {
      const before = getComputedStyle(el).transform;
      const running = el.getAnimations().some(animation => animation.playState === 'running');
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      return { before, after: getComputedStyle(el).transform, running };
    });
    expect(movement.running).toBe(true);
    expect(movement.after).not.toBe(movement.before);
    await expect(page.locator('.evolution-celebration__spark')).toHaveCount(12);
    await expect(page.locator('.evolution-celebration__after')).toHaveCSS('opacity', '1');
    await page.screenshot({ path: testInfo.outputPath(`evolution-silhouette-${orientation}.png`) });
    await page.getByRole('button', { name: 'Salta animazione', exact: true }).tap();
    const dialog = page.getByRole('dialog', { name: 'Ora è Charmeleon!' });
    await expect(dialog).toBeVisible();
    const button = dialog.getByRole('button', { name: 'Continua', exact: true });
    const bounds = await button.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
    await button.tap();
    await expect(overlay).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as any).ceremonyFixture.evolutionClosed)).toBe(1);
    await expect(page.locator('#show-evolution')).toBeFocused();
    await unchanged(page);
    expect(errors).toEqual([]);
  });
}

test('capture animates the resolved receipt, automatically reveals and can also skip without duplicate dismissal', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await mount(page);
  await page.getByRole('button', { name: 'Cattura', exact: true }).tap();
  const overlay = page.locator('.battle-celebration');
  await expect(overlay).toHaveClass(/is-capture-revealing/);
  expect(await page.locator('.battle-capture-sphere').evaluate(el => el.getAnimations().some(animation => animation.playState === 'running'))).toBe(true);
  await expect(page.locator('.battle-capture-particle')).toHaveCount(10);
  await page.screenshot({ path: testInfo.outputPath('capture-reveal-animation.png') });
  const dialog = page.getByRole('dialog', { name: 'Squirtle catturato!' });
  await expect(dialog.getByRole('button', { name: 'Continua', exact: true })).toBeVisible({ timeout: 5000 });
  await expect(overlay).toHaveClass(/is-capture-revealed/);
  await dialog.getByText('Vedi Pokémon', { exact: true }).tap();
  await expect(dialog.getByRole('heading', { name: 'Le sue mosse' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Continua', exact: true }).tap();
  await page.getByRole('button', { name: 'Cattura', exact: true }).tap();
  await page.getByRole('button', { name: 'Mostra Pokémon', exact: true }).tap();
  await page.getByRole('button', { name: 'Continua', exact: true }).tap();
  await expect(overlay).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).ceremonyFixture.captureClosed)).toBe(2);
  await unchanged(page);
  expect(errors).toEqual([]);
});

test('reduced motion shows both final forms immediately with no active decorative animations', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = await mount(page, true);
  await page.getByRole('button', { name: 'Evoluzione', exact: true }).tap();
  const evolution = page.getByRole('dialog', { name: 'Ora è Charmeleon!' });
  await expect(evolution).toBeVisible();
  expect(await evolution.evaluate(el => el.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0);
  await evolution.getByRole('button', { name: 'Continua', exact: true }).tap();
  await page.getByRole('button', { name: 'Cattura', exact: true }).tap();
  const capture = page.getByRole('dialog', { name: 'Squirtle catturato!' });
  await expect(capture.getByRole('button', { name: 'Continua', exact: true })).toBeVisible();
  expect(await capture.evaluate(el => el.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0);
  await capture.getByRole('button', { name: 'Continua', exact: true }).tap();
  await expect(page.locator('.battle-celebration,.evolution-celebration')).toHaveCount(0);
  await unchanged(page);
  expect(errors).toEqual([]);
});
