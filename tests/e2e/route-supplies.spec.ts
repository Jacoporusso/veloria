import { readFile } from 'node:fs/promises';
import { buyFromShop } from './helpers/shop';
import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave } from './helpers/world-navigation';

for (const [map, x, y, hyper] of [
  ['ferraluce', 30, 21, false],
  ['portolume', 14, 14, false],
  ['acquariva', 13, 14, false],
  ['passobrina', 14, 14, true],
  ['biancavetta', 14, 13, true],
] as const) {
  test(`${map} supplies offer usable medicine and preserve purchases after reload`, async ({ page }) => {
    await page.goto('/');
    await enterGame(page);
    const save = await readBrowserSave(page);
    save.flags = [...new Set([...save.flags, 'q_starter_selected', 'prologue_complete_seen'])];
    const metadata = JSON.parse(await readFile(new URL(`../../content/maps/${map}.map.json`, import.meta.url), 'utf8'));
    save.player = { ...save.player, mapId: `veloria/${map}`, spawnPointId: metadata.spawns[0].id, x, y: y + 1, money: 5000 };
    await seedBrowserSave(page, save);
    await page.reload();
    await enterGame(page);
    const confirm = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
    const purchases = [['super-potion', 'Superpozione', 700], ['paralyze-heal', 'Antiparalisi', 200],
      ...(hyper ? [['hyper-potion', 'Iperpozione', 1500]] : [])] as [string, string, number][];
    let spent = 0;
    for (const [id, label, price] of purchases) {
      await confirm.tap();
      await buyFromShop(page, label);
      spent += price;
      await expect.poll(async () => (await readBrowserSave(page)).inventory[id]).toBe((save.inventory[id] ?? 0) + 1);
      expect((await readBrowserSave(page)).player.money).toBe(5000 - spent);
    }
    await page.reload();
    await enterGame(page);
    expect((await readBrowserSave(page)).player.money).toBe(5000 - spent);
    for (const [id] of purchases) expect((await readBrowserSave(page)).inventory[id]).toBe((save.inventory[id] ?? 0) + 1);
  });
}
