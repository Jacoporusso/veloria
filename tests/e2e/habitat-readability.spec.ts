import { expect, test } from '@playwright/test';

for (const [mapId, viewport] of [
  ['veloria/r01_sentiero_alba', { width: 390, height: 844 }],
  ['veloria/d01_bosco_veli', { width: 844, height: 390 }],
  ['veloria/r09_dune_salmastre', { width: 390, height: 844 }],
  ['veloria/r13_tornanti_bianchi', { width: 844, height: 390 }],
] as const) {
  test(`encounter signs and consultable guide in ${mapId}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.route('**/src/main.ts', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\nwindow.__habitatGame=game;' });
    });
    await page.goto(`/?previewMap=${mapId}`);
    await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
    const proof = await page.evaluate(() => {
      const scene = (window as any).__habitatGame.scene.getScene('world');
      const zones = scene.renderedMap.triggers.filter((t: any) => t.kind === 'encounter-zone');
      const markers = scene.mapLayer.list.filter((child: any) => child.name === 'encounter-habitat-marker');
      return { zones: zones.map((z: any) => z.id), markers: markers.map((m: any) => m.getData('triggerId')) };
    });
    expect(proof.zones.length).toBeGreaterThan(0); expect(proof.markers).toEqual(proof.zones);
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Mostra i comandi' }).click();
    await expect(page.locator('#dialogue-speaker')).toHaveText('Come si gioca');
    // The first tap reveals typewriter text; the following tap advances the guide.
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
    await expect(page.locator('#dialogue-text')).toContainText('tre foglie');
    await page.screenshot({ path: info.outputPath('habitat-guide.png') });
  });
}
