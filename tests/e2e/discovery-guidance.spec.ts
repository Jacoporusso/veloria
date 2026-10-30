import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';
import legendaryResearch from '../../content/encounters/legendary-research.v1.json' with { type: 'json' };

async function seedAt(page: Page, mapName: string, flags: string[], withoutOldRod = false) {
  const save = await page.evaluate(async ({ name, flags, withoutOldRod }) => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
    let current = await loadSave();
    if (current.party.length === 0) current = selectStarter(current, 4, 'discovery-guidance-bulbasaur') ?? current;
    const map = await (await fetch(`/content/maps/${name}.map.json`)).json();
    const spawn = map.spawns[0];
    current.player = { ...current.player, mapId: map.id, spawnPointId: spawn.id, x: spawn.x, y: spawn.y };
    current.flags = [...new Set([...current.flags.filter((flag: string) => !flag.startsWith('q_league_')), ...flags])];
    if (withoutOldRod) delete current.inventory['old-rod'];
    return current;
  }, { name: mapName, flags, withoutOldRod });
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  return save.player;
}

async function openJournal(page: Page) {
  await page.locator('.journey-trigger').click();
  return page.getByRole('dialog', { name: 'Il tuo viaggio' });
}

async function openAtlas(page: Page) {
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la mappa di Veloria' }).click();
  return page.getByRole('dialog', { name: 'Esplora Veloria' });
}

test('Journal guidance locates Snorlax and leaves the player in Acquariva', async ({ page }) => {
  await page.goto('/');
  await enterGame(page);
  const before = await seedAt(page, 'acquariva', ['q_acquariva_report', 'badge_riflesso_awarded']);

  const journal = await openJournal(page);
  const snorlaxRow = journal.locator('.journey-quest').filter({ hasText: 'Snorlax' });
  await expect(snorlaxRow.locator('.journey-quest-state')).toHaveText('Da raggiungere');
  await expect(page.getByText('Un incontro con Mew', { exact: true })).toHaveCount(0);
  await snorlaxRow.getByRole('button', { name: 'Mostra Snorlax sulla mappa' }).click();

  const atlas = page.getByRole('dialog', { name: 'Esplora Veloria' });
  await expect(atlas).toBeVisible();
  await expect(atlas.locator('.region-map-select')).toHaveValue('r12');
  await expect(atlas.locator('.region-map-details')).toContainText('Valle del Vento');
  const encounter = atlas.getByRole('region', { name: 'Incontro con Snorlax' });
  await expect(encounter).toContainText('Snorlax');
  await expect(encounter).toContainText('Da raggiungere');
  await expect(encounter).toContainText('Acquariva');
  await expect(encounter).toContainText('radura orientale');
  expect((await readBrowserSave(page)).player).toEqual(before);

  await atlas.getByRole('button', { name: 'Chiudi ×' }).click();
  await expect(atlas).toBeHidden();
  await expect(page.locator('.journey-trigger')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Vai in basso', exact: true })).toBeVisible();
  await expect(page.locator('#action-a')).toBeVisible();
});

test('Atlas keeps Zapdos in its macrozone until revealed, then shows its exact point and capture state', async ({ page }) => {
  await page.goto('/');
  await enterGame(page);
  const zapdosResearch = legendaryResearch.researches.find(research => research.encounterId === 'veloria/special_zapdos')!;

  const phases = [
    { flags: [], kind: 'macrozone' as const },
    { flags: ['q_league_completed', 'q_league_epilogue_seen'], kind: 'macrozone' as const },
    { flags: ['q_league_completed', 'q_league_epilogue_seen', 'q_research_zapdos_revealed'], kind: 'exact' as const, status: 'Da raggiungere' },
    { flags: ['q_league_completed', 'q_league_epilogue_seen', 'q_research_zapdos_revealed', 'q_special_zapdos_caught'], kind: 'exact' as const, status: 'Catturato ✓' },
  ];
  for (const [index, phase] of phases.entries()) {
    await seedAt(page, 'ferraluce', phase.flags);
    const atlas = await openAtlas(page);
    await atlas.locator('.region-map-select').selectOption('centrale');
    if (phase.kind === 'macrozone') {
      const research = atlas.getByRole('region', { name: 'Indagine in una macrozona' });
      await expect(research).toContainText('Tracce di una presenza rara');
      await expect(research.locator('.region-map-state')).toHaveText('0/3 indizi raccolti');
      await expect(research).toContainText(zapdosResearch.regionHint);
      await expect(atlas.getByRole('region', { name: 'Incontro con Zapdos' })).toHaveCount(0);
      await expect(atlas.getByRole('button', { name: 'Mostra la macrozona di ricerca' })).toBeVisible();
    } else {
      const encounter = atlas.getByRole('region', { name: 'Incontro con Zapdos' });
      await expect(encounter.locator('.region-map-state')).toHaveText(phase.status);
      if (phase.status === 'Da raggiungere') await expect(encounter).toContainText('Centrale Risonante');
      await expect(encounter.getByRole('button', { name: 'Mostra il punto di Zapdos', exact: true })).toBeVisible();
      await expect(atlas.getByRole('region', { name: 'Indagine in una macrozona' })).toHaveCount(0);
    }
    if (index < phases.length - 1) {
      await atlas.getByRole('button', { name: 'Chiudi ×' }).click();
      await expect(atlas).toBeHidden();
    }
  }
});

test('fishing spots appear on the coastal routes and Atlas explains the rod requirement', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 150_000 : 90_000);
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nwindow.__discoveryGame = game;' });
  });
  await page.goto('/');
  await enterGame(page);

  const fishingMaps = [
    { map: 'r08_costa_turbine', area: 'r08', label: 'Costa delle Turbine' },
    { map: 'r09_dune_salmastre', area: 'r09', label: 'Dune Salmastre' },
    { map: 'd04_delta_specchi', area: 'delta', label: 'Delta degli Specchi' },
  ];
  for (const location of fishingMaps) {
    await seedAt(page, location.map, ['tutorial_habitat_seen'], true);
    const spots = await page.evaluate(() => {
      const layer = (window as any).__discoveryGame.scene.keys.world.mapLayer;
      const markers = layer.list.filter((item: any) => item.name === 'fishing-spot-marker');
      const labels = layer.list.filter((item: any) => item.name === 'fishing-spot-label');
      return { markerCount: markers.length, labelCount: labels.length, text: labels.map((item: any) => item.text).join(' ') };
    });
    expect(spots.markerCount, `${location.map} has one fishing marker`).toBe(1);
    expect(spots.labelCount, `${location.map} has one fishing label`).toBe(1);
    expect(spots.text).toContain('PESCA');
    if (location.map === 'r08_costa_turbine') {
      await walkTo(page, 'r08_costa_turbine.tmj', 20, 14, { avoidEncounters: true });
      await expect(page.locator('#interaction-prompt')).toContainText('🎣 Pesca dalla riva');
      await page.screenshot({ path: info.outputPath('fishing-marker-on-shore.png') });
    }

    const atlas = await openAtlas(page);
    await atlas.locator('.region-map-select').selectOption(location.area);
    await expect(atlas.locator('.region-map-details h3')).toHaveText(location.label);
    const guide = atlas.getByRole('region', { name: 'Punti pesca' });
    await expect(guide).toContainText('Canna da pesca');
    await expect(guide).toContainText('Capitana Marina a Portolume');
    await atlas.getByRole('button', { name: 'Chiudi ×' }).click();
    await expect(atlas).toBeHidden();
  }
});
