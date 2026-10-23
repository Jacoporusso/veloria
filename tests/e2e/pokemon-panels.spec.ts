import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave } from './helpers/world-navigation';

for (const [width, height] of [[390, 844], [844, 390]]) {
  test(`Pokedex habitats guide the earned team without changing its save at ${width}x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    const backup = await readFile(new URL('../../docs/playtests/2026-10-23-natural-iris-recovery-backup-charmander.json', import.meta.url), 'utf8');
    await page.goto('/');
    await expect(page.locator('.start-screen')).toBeVisible();
    await page.evaluate(async text => {
      const { importSave } = await import('/src/persistence/save-backup.ts' as string);
      const { saveGame } = await import('/src/persistence/save-store.ts' as string);
      await saveGame(importSave(text));
    }, backup);
    await page.reload(); await enterGame(page);
    const before = await readBrowserSave(page);
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Apri il Pokédex' }).click();
    const panel = page.getByRole('dialog', { name: 'Pokédex', exact: true });
    await panel.getByRole('button', { name: /Wooper.*VISTO/ }).click();
    const habitats = panel.getByRole('region', { name: 'Dove incontrarlo' });
    await expect(habitats.getByRole('article').first()).not.toContainText('Da esplorare');
    const conduit = habitats.getByRole('article').filter({ hasText: 'Condotto Risonante' });
    await expect(conduit).toHaveCount(1);
    await expect(conduit).toContainText('Erba alta · Lv.18–21 · A ogni ora');
    await habitats.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`wooper-habitats-${width}.png`) });
    await panel.getByRole('button', { name: '← Tutte le specie viste', exact: true }).click();
    await panel.getByRole('button', { name: /Chinchou/ }).click();
    const coast = habitats.getByRole('article').filter({ hasText: 'Costa delle Turbine' }).filter({ hasText: 'Pesca' });
    await expect(coast).toHaveCount(1);
    await expect(coast).toContainText('Pesca · Lv.20–23 · A ogni ora');
    await expect(habitats.getByRole('article').filter({ hasText: 'Costa delle Turbine' }).filter({ hasText: 'Erba alta' })).toHaveCount(1);
    const after = await readBrowserSave(page);
    expect(after.party).toEqual(before.party);
    expect(after.inventory).toEqual(before.inventory);
    expect(after.rngState).toBe(before.rngState);
    expect(after.player.money).toBe(before.player.money);
    expect(after.flags).toEqual(before.flags);
  });
}

for (const [width, height] of [[390, 844], [844, 390]]) {
  test(`team lead selection persists without changing earned creatures at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const backup = await readFile(new URL('../../docs/playtests/2026-10-22-natural-portolume-backup-charmander.json', import.meta.url), 'utf8');
    await page.goto('/');
    await expect(page.locator('.start-screen')).toBeVisible();
    const before = await page.evaluate(async text => {
      const { importSave } = await import('/src/persistence/save-backup.ts' as string);
      const { saveGame } = await import('/src/persistence/save-store.ts' as string);
      const save = importSave(text);
      await saveGame(save);
      return save;
    }, backup);
    await page.reload();
    await enterGame(page);
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Apri la squadra' }).click();
    const panel = page.getByRole('dialog', { name: 'Squadra', exact: true });
    await panel.locator('.pokemon-select').nth(2).click();
    await panel.getByRole('button', { name: '↑ Metti in testa', exact: true }).click();
    await expect(panel.locator('.pokemon-select').first()).toContainText('Rattata');
    await expect(panel.locator('.pokemon-select').first()).toContainText('IN TESTA');
    await panel.locator('.pokemon-select').first().click();
    await expect(panel.getByRole('button', { name: '✓ Già in testa alla squadra' })).toBeDisabled();
    await page.reload();
    await enterGame(page);
    const after = await page.evaluate(async () => {
      const { loadSave } = await import('/src/persistence/save-store.ts' as string);
      return loadSave();
    });
    expect(after!.party).toEqual([before.party[2], before.party[0], before.party[1]]);
    for (const key of ['storage', 'inventory', 'rngState', 'badges'] as const) expect(after![key]).toEqual(before[key]);
    expect(after!.player.money).toBe(before.player.money);
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Apri il Pokédex' }).click();
    await page.locator('.pokemon-select').first().click();
    await expect(page.getByRole('button', { name: '↑ Metti in testa', exact: true })).toHaveCount(0);
  });
}

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
    for (const [id, name, requirement] of [
      [4, 'Charmander', 'Dal livello 16'], [10, 'Caterpie', 'Dal livello 7'], [12, 'Butterfree', 'Non ha ulteriori evoluzioni'],
      [82, 'Magneton', 'Aumenta di livello presso Mt. Coronet'], [208, 'Steelix', 'Non ha ulteriori evoluzioni'], [227, 'Skarmory', 'Non ha ulteriori evoluzioni'],
      [72, 'Tentacool', 'Dal livello 30'], [73, 'Tentacruel', 'Non ha ulteriori evoluzioni'],
      [98, 'Krabby', 'Dal livello 28'], [99, 'Kingler', 'Non ha ulteriori evoluzioni'],
      [170, 'Chinchou', 'Dal livello 27'], [171, 'Lanturn', 'Non ha ulteriori evoluzioni'],
      [79, 'Slowpoke', 'Dal livello 37'], [80, 'Slowbro', 'Non ha ulteriori evoluzioni'],
      [96, 'Drowzee', 'Dal livello 26'], [97, 'Hypno', 'Non ha ulteriori evoluzioni'],
      [177, 'Natu', 'Dal livello 25'], [178, 'Xatu', 'Non ha ulteriori evoluzioni'],
      [133, 'Eevee', 'amicizia alta'], [196, 'Espeon', 'Non ha ulteriori evoluzioni'],
    ] as const) {
      await page.goto(`/?species=${id}&view=${view}`);
      await page.getByRole('button', { name: new RegExp(name) }).click();
      const evolution = page.getByRole('region', { name: 'Evoluzione' });
      await expect(evolution).toContainText(requirement);
      await expect(evolution).not.toContainText('livello null');
      if (id === 82) await expect(evolution).toContainText('non ancora disponibile nel prototipo');
      if (id === 79) await expect(evolution).toContainText('Tramite scambio tenendo');
      if (id === 133) {
        await expect(evolution).toContainText('di giorno');
        await expect(evolution).toContainText('di notte');
        await expect(evolution).not.toContainText('Usa null');
        await expect(evolution).toContainText('roccia speciale');
      }
      if ([82, 208, 227, 72, 73, 98, 99, 170, 171].includes(id)) {
        const artUrl = await page.locator('.pokemon-detail .creature-portrait').evaluate(element => getComputedStyle(element).backgroundImage.slice(5, -2));
        await page.evaluate(async url => { const image = new Image(); image.src = url; await image.decode(); }, artUrl);
      }
      if ([10, 72, 98, 170].includes(id)) await expect(evolution).toContainText('Disponibile nel gioco');
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
