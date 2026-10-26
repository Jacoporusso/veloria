import { expect, test } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave } from './helpers/world-navigation';

test('all 151 regional official artworks decode on their first offline visit', async ({ page, context }) => {
  test.setTimeout(120_000);
  const records = new Map<number, string>();
  for (const file of (await readdir('assets')).filter(file => /^pokeapi-.*-artwork-v1\.json$/.test(file))) {
    const manifest = JSON.parse(await readFile(`assets/${file}`, 'utf8'));
    for (const artwork of manifest.artworks) if (String(artwork.speciesId) in species.species) records.set(artwork.speciesId, artwork.path);
  }
  expect([...records.keys()].sort((a, b) => a - b)).toEqual(Array.from({ length: 151 }, (_, index) => index + 1));
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 45_000 });
  const before = await readBrowserSave(page);
  const failures: string[] = []; page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true);
  await page.reload(); await enterGame(page);
  const decoded = await page.evaluate(async paths => {
    const results: { width: number; height: number }[] = [];
    for (let index = 0; index < paths.length; index += 12) {
      results.push(...await Promise.all(paths.slice(index, index + 12).map(async path => {
        const image = new Image(); image.src = new URL(path, location.href).href;
        await image.decode(); return { width: image.naturalWidth, height: image.naturalHeight };
      })));
    }
    return results;
  }, [...records.values()]);
  expect(decoded).toHaveLength(151);
  for (const image of decoded) { expect(image.width).toBeGreaterThan(100); expect(image.height).toBeGreaterThan(100); }
  const after = await readBrowserSave(page);
  for (const key of ['party', 'storage', 'inventory', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
  expect(failures).toEqual([]);
});
