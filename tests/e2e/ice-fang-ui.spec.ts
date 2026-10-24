import { expect, test } from '@playwright/test';

for (const [width, height] of [[390, 844], [844, 390]]) {
  test(`Ice Fang details expose independent effects and immunity at ${width}x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
      import '/src/style.css';
      import '/src/settings.css';
      import { PokemonPanel } from '/src/game/ui/PokemonPanel.ts';
      import { newGameSave } from '/src/persistence/save-store.ts';
      const save = newGameSave();
      save.flags.push('pokedex_seen_221');
      window.iceFangFixtureSave = save;
      window.iceFangBefore = JSON.stringify(save);
      new PokemonPanel().render(save, 'dex');
      document.querySelector('#pokedex-panel').hidden = false;
      document.querySelector('#game-loading').hidden = true;
    ` }));
    await page.goto('/');
    const panel = page.getByRole('dialog', { name: 'Pokédex', exact: true });
    await panel.getByRole('button', { name: /Piloswine/ }).click();
    const card = panel.locator('.pokemon-move').filter({ hasText: /Gelodenti · Livello 28/ });
    await expect(card).toContainText('Potenza 65');
    await expect(card).toContainText('indipendenti');
    await expect(card).toContainText('Ghiaccio sono immuni al gelo');
    await expect(card).toContainText('Possono comunque tentennare');
    expect((await card.innerText()).match(/10%/g)).toHaveLength(2);
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`ice-fang-details-${width}.png`) });
    const box = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    expect(await page.evaluate(() => JSON.stringify((window as any).iceFangFixtureSave) === (window as any).iceFangBefore)).toBe(true);
  });
}
