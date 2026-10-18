import { expect, test } from '@playwright/test';

for (const [width, height] of [[390, 844], [844, 390], [320, 568]]) {
  test(`team and dex have strategy detail at ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/?previewMap=veloria/borgofonte_lab');
    await expect(page.locator('#game-loading')).toBeHidden();
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Apri la squadra' }).click();
    const panel = page.getByRole('dialog', { name: 'Squadra' });
    await expect(panel).toBeVisible();
    await expect(page.locator('#pokedex-summary')).toContainText('1/6');
    await panel.getByRole('button', { name: /Pikachu/ }).click();
    await expect(panel).toContainText('HP 19/19');
    await expect(panel.getByRole('region', { name: 'Evoluzione' })).toContainText('Pikachu → Raichu');
    await expect(panel.getByRole('region', { name: 'Evoluzione' })).toContainText('Pietratuono');
    await expect(panel.getByRole('region', { name: 'Evoluzione' })).toContainText('non dipende dal livello');
    await expect(panel).toContainText('Statistiche base della specie');
    await expect(panel).toContainText('Riduce Attacco dell’avversario');
    await expect(panel).toContainText('Fisica');
    await panel.getByRole('heading', { name: 'Affinità difensive' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('pokemon-strategy.png') });
    await panel.getByRole('heading', { name: 'Mosse attuali' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('pokemon-moves.png') });
    const bounds = await panel.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
    await panel.getByRole('button', { name: '← Squadra' }).click();
    await expect(panel.getByRole('button', { name: /Pikachu/ })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#menu-button')).toBeFocused();
    await page.locator('#menu-button').click();
    await page.getByRole('button', { name: 'Apri il Pokédex' }).click();
    await expect(page.locator('#pokedex-summary')).toContainText('1 viste · 1 catturate');
    await page.getByRole('dialog', { name: 'Pokédex' }).getByRole('button', { name: /Pikachu/ }).click();
    await expect(page.getByRole('region', { name: 'Evoluzione' })).toContainText('Pietratuono');
    await expect(page.locator('.pokemon-detail')).toContainText('Apprendimento per livello');
    expect(errors).toEqual([]);
  });
}

test('seen but uncaught species can be studied without joining the team', async ({ page }) => {
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
    import '/src/style.css';
    import '/src/settings.css';
    import { PokemonPanel } from '/src/game/ui/PokemonPanel.ts';
    import { newGameSave } from '/src/persistence/save-store.ts';
    import { selectStarter } from '/src/core/party/select-starter.ts';
    const save = selectStarter(newGameSave(), 4, 'fixture-starter');
    save.flags.push('pokedex_seen_7');
    const panel = new PokemonPanel();
    panel.render(save, 'dex');
    document.querySelector('#pokedex-panel').hidden = false;
    document.querySelector('#game-loading').hidden = true;
  ` }));
  await page.goto('/');
  await expect(page.locator('#pokedex-summary')).toContainText('2 viste · 1 catturate');
  await expect(page.locator('#pokedex-list .pokemon-select')).toHaveCount(2);
  await page.getByRole('button', { name: /Squirtle.*VISTO/ }).click();
  await expect(page.getByRole('region', { name: 'Evoluzione' })).toContainText('Squirtle → Wartortle');
  await expect(page.getByRole('region', { name: 'Evoluzione' })).toContainText('Dal livello 16');
  await expect(page.getByRole('region', { name: 'Evoluzione' })).toContainText('Disponibile nel gioco');
  await expect(page.locator('.pokemon-detail')).toContainText('Bolla');
  await expect(page.locator('.pokemon-detail')).toContainText('Riduce Velocità dell’avversario');
  await expect(page.locator('.pokemon-detail')).toContainText('10%');
  await expect(page.locator('.pokemon-detail')).toContainText('ERBA ×2');
  await expect(page.locator('.pokemon-detail')).toContainText('ELETTRO ×2');
});

test('both panels show level evolutions and final forms near the top of the detail', async ({ page }, testInfo) => {
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
    import '/src/style.css';
    import '/src/settings.css';
    import { PokemonPanel } from '/src/game/ui/PokemonPanel.ts';
    import { newGameSave } from '/src/persistence/save-store.ts';
    import { createBattleCreature } from '/src/core/battle/create-creature.ts';
    import { battleSpecies, battleMoves } from '/src/game/battle/catalog.ts';
    const query = new URLSearchParams(location.search);
    const creature = createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId: Number(query.get('species')), level: 5, instanceId: 'fixture' });
    const save = newGameSave();
    save.party = [{ instanceId: creature.instanceId, speciesId: creature.speciesId, level: 5, experience: 0, hp: creature.hp, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
    new PokemonPanel().render(save, query.get('view'));
    document.querySelector('#pokedex-panel').hidden = false;
    document.querySelector('#game-loading').hidden = true;
  ` }));
  for (const view of ['team', 'dex']) {
    for (const [id, name, requirement] of [[4, 'Charmander', 'Dal livello 16'], [10, 'Caterpie', 'Dal livello 7'], [12, 'Butterfree', 'Non ha ulteriori evoluzioni']] as const) {
      await page.goto(`/?species=${id}&view=${view}`);
      await page.getByRole('button', { name: new RegExp(name) }).click();
      const evolution = page.getByRole('region', { name: 'Evoluzione' });
      await expect(evolution).toContainText(requirement);
      if (id === 10) await expect(evolution).toContainText('Disponibile nel gioco');
      if (id === 4) {
        await expect(evolution).toContainText('Charmeleon');
        await evolution.scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath(`evolution-${view}.png`) });
      }
      const sectionOrder = await page.locator('.pokemon-detail').evaluate(body => {
        const children = [...body.children];
        return children.indexOf(body.querySelector('.pokemon-evolution')!) < children.findIndex(child => child.textContent === 'Affinità difensive');
      });
      expect(sectionOrder).toBe(true);
    }
  }
});
