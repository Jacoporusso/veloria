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
      const save = importSave(text);
      save.party = save.party.filter(member => member.speciesId <= 151);
      save.storage = save.storage.filter(member => member.speciesId <= 151);
      save.flags = save.flags.filter(flag => !/^pokedex_(seen|caught)_\d+$/.test(flag) || Number(flag.split('_').at(-1)) <= 151);
      save.flags = [...new Set([...save.flags, 'pokedex_seen_104', 'pokedex_seen_98', 'pokedex_seen_83'])];
      await saveGame(save);
    }, backup);
    await page.reload(); await enterGame(page);
    const before = await readBrowserSave(page);
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Apri il Pokédex' }).click();
    const panel = page.getByRole('dialog', { name: 'Pokédex', exact: true });
    await panel.getByRole('button', { name: /Cubone.*VISTO/ }).click();
    const habitats = panel.getByRole('region', { name: 'Dove incontrarlo' });
    await expect(habitats.getByRole('article').first()).not.toContainText('Da esplorare');
    const conduit = habitats.getByRole('article').filter({ hasText: 'Condotto Risonante' });
    await expect(conduit).toHaveCount(1);
    await expect(conduit).toContainText('Muschio occidentale');
    await expect(conduit).toContainText('Erba alta · Lv.18–21 · A ogni ora');
    await habitats.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`cubone-habitats-${width}.png`) });
    await panel.getByRole('button', { name: '← Tutte le specie viste', exact: true }).click();
    await panel.getByRole('button', { name: /Krabby/ }).click();
    const coast = habitats.getByRole('article').filter({ hasText: 'Costa delle Turbine' }).filter({ hasText: 'Pesca' });
    await expect(coast).toHaveCount(1);
    await expect(coast).toContainText('Postazione di pesca dalla riva');
    await expect(coast).toContainText('Pesca · Lv.20–23 · A ogni ora');
    const viaductHabitat = habitats.getByRole('article').filter({ hasText: 'Viadotto dei Ciliegi' }).filter({ hasText: 'Sottobosco' });
    await expect(viaductHabitat).toHaveCount(1);
    await expect(viaductHabitat).toContainText('Sponde del Viadotto, lato est');
    await expect(viaductHabitat).toContainText('Sottobosco · Lv.12–14 · A ogni ora');
    await panel.getByRole('button', { name: '← Tutte le specie viste', exact: true }).click();
    await panel.getByRole('button', { name: /Farfetch’d/ }).click();
    const viaduct = habitats.getByRole('article').filter({ hasText: 'Viadotto dei Ciliegi' });
    await expect(viaduct).toHaveCount(1);
    await expect(viaduct).toContainText('Ciliegi e belvedere · Lv.11–13 · A ogni ora');
    await expect(viaduct).toContainText('Sponde del Viadotto, lato est · Lv.12–14 · A ogni ora');
    await viaduct.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`pikachu-microhabitats-${width}.png`) });
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
      [82, 'Magneton', 'Questa evoluzione appartiene a una generazione successiva a quella di Veloria.'], [95, 'Onix', 'Questa evoluzione appartiene a una generazione successiva a quella di Veloria.'], [142, 'Aerodactyl', 'Non ha ulteriori evoluzioni'],
      [72, 'Tentacool', 'Dal livello 30'], [73, 'Tentacruel', 'Non ha ulteriori evoluzioni'],
      [98, 'Krabby', 'Dal livello 28'], [99, 'Kingler', 'Non ha ulteriori evoluzioni'],
      [138, 'Omanyte', 'Dal livello 40'], [139, 'Omastar', 'Non ha ulteriori evoluzioni'],
      [79, 'Slowpoke', 'Dal livello 37'], [80, 'Slowbro', 'Non ha ulteriori evoluzioni'],
      [96, 'Drowzee', 'Dal livello 26'], [97, 'Hypno', 'Non ha ulteriori evoluzioni'],
      [147, 'Dratini', 'Dal livello 30'], [148, 'Dragonair', 'Dal livello 55'], [149, 'Dragonite', 'Non ha ulteriori evoluzioni'],
      [133, 'Eevee', 'Usa Pietrafocaia'], [135, 'Jolteon', 'Non ha ulteriori evoluzioni'],
    ] as const) {
      await page.goto(`/?species=${id}&view=${view}`);
      await page.getByRole('button', { name: new RegExp(name) }).click();
      const evolution = page.getByRole('region', { name: 'Evoluzione' });
      await expect(evolution).toContainText(requirement);
      await expect(evolution).not.toContainText('livello null');
      if (id === 82) await expect(evolution).not.toContainText('Disponibile nel gioco');
      if (id === 95) await expect(evolution).not.toContainText('Disponibile nel gioco');


      if (id === 133) {
        await expect(evolution).toContainText('Pietrafocaia');
        await expect(evolution).toContainText('Pietraidrica');
        await expect(evolution).toContainText('Pietratuono');
      }
      if ([82, 95, 142, 72, 73, 98, 99, 138, 139].includes(id)) {
        const artUrl = await page.locator('.pokemon-detail .creature-portrait').evaluate(element => getComputedStyle(element).backgroundImage.slice(5, -2));
        await page.evaluate(async url => { const image = new Image(); image.src = url; await image.decode(); }, artUrl);
      }
      if ([10, 72, 98, 138].includes(id)) await expect(evolution).toContainText('Disponibile nel gioco');
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

for (const [width, height] of [[390, 844], [844, 390]]) {
  test(`caught history remains visible after evolution and reload at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
      import '/src/style.css';
      import '/src/settings.css';
      import { PokemonPanel } from '/src/game/ui/PokemonPanel.ts';
      import { newGameSave, loadSave, saveGame } from '/src/persistence/save-store.ts';
      import { selectStarter } from '/src/core/party/select-starter.ts';
      import { queueEvolutionReceipts } from '/src/core/services/item-evolution.ts';
      let save = await loadSave();
      if (!save) {
        save = selectStarter(newGameSave(), 4, 'history-starter');
        save.party[0].speciesId = 5;
        save = queueEvolutionReceipts(save, [{ creatureId: 'history-starter', fromSpeciesId: 4, toSpeciesId: 5, level: 16 }]);
        save.flags = save.flags.filter(flag => !flag.startsWith('presentation/'));
        save.flags.push('pokedex_seen_7');
        await saveGame(save);
      }
      new PokemonPanel().render(save, 'dex');
      document.querySelector('#pokedex-panel').hidden = false;
      document.querySelector('#game-loading').hidden = true;
    ` })) ;
    for (let load = 0; load < 2; load++) {
      if (load === 0) await page.goto('/'); else await page.reload();
      await expect(page.locator('#pokedex-summary')).toContainText('3 viste · 2 catturate');
      await expect(page.getByRole('button', { name: /Charmander.*CATTURATO/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Charmeleon.*CATTURATO/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Squirtle.*VISTO/ })).toBeVisible();
      const save = await readBrowserSave(page);
      expect(save.party.map(creature => creature.speciesId)).toEqual([5]);
      expect(save.flags.filter(flag => flag.startsWith('presentation/'))).toEqual([]);
    }
  });
}

for (const [width, height] of [[390, 844], [844, 390]]) {
  test(`evolution recovery guidance follows owned level and HP at ${width}x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
      import '/src/style.css';
      import '/src/settings.css';
      import { PokemonPanel } from '/src/game/ui/PokemonPanel.ts';
      import { newGameSave } from '/src/persistence/save-store.ts';
      import { createBattleCreature } from '/src/core/battle/create-creature.ts';
      import { battleSpecies, battleMoves } from '/src/game/battle/catalog.ts';
      const save = newGameSave();
      save.party = [[96, 25, false], [96, 31, true], [5, 36, false], [25, 20, false]].map(([speciesId, level, fainted], index) => {
        const creature = createBattleCreature({ species: battleSpecies, moves: battleMoves, speciesId, level, instanceId: 'guide-' + index });
        return { instanceId: creature.instanceId, speciesId, level, experience: 0, hp: fainted ? 0 : creature.hp,
          maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) };
      });
      globalThis.__guidanceSave = save;
      globalThis.__guidanceBefore = JSON.stringify(save);
      const panel = new PokemonPanel();
      panel.render(save, 'team');
      document.querySelector('#pokedex-panel').hidden = false;
      document.querySelector('#game-loading').hidden = true;
    ` }));
    await page.goto('/');
    const panel = page.getByRole('dialog', { name: 'Squadra', exact: true });
    const evolution = panel.getByRole('region', { name: 'Evoluzione' });
    await panel.locator('.pokemon-select').filter({ hasText: 'Lv.25' }).click();
    await expect(evolution).toContainText('Dal livello 26');
    await expect(evolution).not.toContainText('Soglia raggiunta');
    await expect(evolution).toContainText('durante la lotta');
    await panel.getByRole('button', { name: '← Squadra', exact: true }).click();
    await panel.locator('.pokemon-select').filter({ hasText: 'Lv.31' }).click();
    await expect(evolution).toContainText('Drowzee → Hypno');
    await expect(evolution).toContainText('Soglia raggiunta');
    await expect(evolution).toContainText('Curalo, poi');
    await expect(evolution).toContainText('Non serve un altro livello');
    await evolution.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`drowzee-recovery-${width}.png`) });
    await panel.getByRole('button', { name: '← Squadra', exact: true }).click();
    await panel.locator('.pokemon-select').filter({ hasText: 'Charmeleon' }).click();
    await expect(evolution).toContainText('Soglia raggiunta');
    await expect(evolution).not.toContainText('Curalo');
    await panel.getByRole('button', { name: '← Squadra', exact: true }).click();
    await panel.locator('.pokemon-select').filter({ hasText: 'Pikachu' }).click();
    await expect(evolution).toContainText('Pietratuono');
    await expect(evolution).not.toContainText('Soglia raggiunta');
    expect(await page.evaluate(() => JSON.stringify((window as any).__guidanceSave) === (window as any).__guidanceBefore)).toBe(true);
  });
}
