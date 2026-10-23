import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave } from './helpers/world-navigation';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };

const npcCases = [
  ['forest_ranger_ada', 'd01_bosco_veli'],
  ['ferraluce_ivo', 'ferraluce'],
  ['ferraluce_care', 'ferraluce'],
  ['ferraluce_shop', 'ferraluce'],
  ['mira', 'gym01_brumalta'],
  ['dalia_gym', 'gym02_petalora'],
  ['nerea_gym', 'gym05_portolume'],
  ['petalora_ivo', 'petalora'],
  ['portolume_captain', 'portolume'],
  ['r03_path_guide', 'r03_terrazze_muschio'],
  ['nila_r04', 'r04_salita_petali'],
  ['oren_r05', 'r05_viadotto_ciliegi'],
  ['radicelmo_keeper', 'radicelmo'],
  ['vetracielo_lea', 'vetracielo'],
] as const;

type Obj = { x?: number; y?: number; width?: number; height?: number; name?: string; properties?: any };
const props = (object: Obj) => Array.isArray(object.properties)
  ? Object.fromEntries(object.properties.map((p: any) => [p.name, p.value]))
  : object.properties ?? {};
function flatten(layers: any[]): any[] {
  return layers.flatMap(layer => [layer, ...(Array.isArray(layer.layers) ? flatten(layer.layers) : [])]);
}
function footprint(object: Obj): Set<string> {
  const x = object.x ?? 0, y = object.y ?? 0, width = object.width ?? 32, height = object.height ?? 32;
  const cells = new Set<string>();
  for (let ty = Math.floor(y / 32); ty < Math.ceil((y + Math.max(1, height)) / 32); ty++)
    for (let tx = Math.floor(x / 32); tx < Math.ceil((x + Math.max(1, width)) / 32); tx++) cells.add(`${tx},${ty}`);
  return cells;
}

async function worldTile(page: Page) {
  return page.evaluate(() => {
    const game = (globalThis as any).npcCollisionGame;
    const world = game.scene.getScene('world');
    return { ...world.playerTile };
  });
}

for (const [npcId, mapName] of npcCases) {
  test(`${npcId} blocks movement and can be interacted with after reload`, async ({ page }) => {
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch({ maxRetries: 2 });
      await route.fulfill({ response, body: `${await response.text()}\nglobalThis.npcCollisionGame=game;` });
    });
    await page.goto('/');
    await enterGame(page);

    const metadata = JSON.parse(await readFile(new URL(`../../content/maps/${mapName}.map.json`, import.meta.url), 'utf8'));
    const tiled = JSON.parse(await readFile(new URL(`../../public/${metadata.tiledAsset}`, import.meta.url), 'utf8'));
    const layers = flatten(tiled.layers);
    const objects = layers.filter(layer => layer.type === 'objectgroup').flatMap(layer => layer.objects ?? []) as Obj[];
    const npc = objects.find(object => props(object).kind === 'npc' && (props(object).npcId ?? props(object).id ?? object.name) === npcId);
    expect(npc, `${mapName}: authored NPC ${npcId}`).toBeTruthy();

    const save = await readBrowserSave(page);
    save.flags = [...new Set([...save.flags, 'intro_completed', 'prologue_complete_seen', 'q_starter_selected'])];
    const startCells = footprint(npc!);
    const blocked = collectMapCollision(
      layers.filter(layer => layer.name === 'collision').flatMap(layer => layer.objects ?? []),
      tiled.width, tiled.height, save.flags,
    );
    const candidates = [...startCells].flatMap(cell => {
      const [x, y] = cell.split(',').map(Number);
      return [{ x: x + 1, y, direction: 'left' as const }, { x: x - 1, y, direction: 'right' as const },
        { x, y: y + 1, direction: 'up' as const }, { x, y: y - 1, direction: 'down' as const }];
    });
    const approach = candidates.find(({ x, y }) => x >= 0 && y >= 0 && x < tiled.width && y < tiled.height
      && !blocked.has(`${x},${y}`) && !startCells.has(`${x},${y}`));
    expect(approach, `${mapName}/${npcId}: free orthogonal approach tile`).toBeTruthy();

    const pikachu = createBattleCreature({ species: species.species as any, moves: moves.moves as any,
      speciesId: 25, level: 5, instanceId: `npc-collision-${npcId}`, moveIds: ['thunder-shock'] });
    save.player = { ...save.player, mapId: metadata.id, spawnPointId: metadata.spawns[0].id,
      x: approach!.x, y: approach!.y };
    save.party = [{ instanceId: pikachu.instanceId, speciesId: 25, level: 5, experience: 0,
      hp: pikachu.hp, maxHp: pikachu.stats.maxHp, moves: pikachu.moves.map(move => ({ id: move.moveId, pp: move.pp })) }];
    await seedBrowserSave(page, save);
    await page.reload();
    await enterGame(page);

    await expect(page.locator('#game')).not.toHaveAttribute('aria-busy', 'true');
    const before = await worldTile(page);
    expect(before).toEqual({ x: approach!.x, y: approach!.y });
    const directionName = { up: 'Vai in alto', down: 'Vai in basso', left: 'Vai a sinistra', right: 'Vai a destra' }[approach!.direction];
    await page.getByRole('button', { name: directionName, exact: true }).tap();
    await expect.poll(() => worldTile(page)).toEqual(before);
    expect(await readBrowserSave(page)).toMatchObject({ player: { mapId: metadata.id, x: before.x, y: before.y } });

    await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
    await expect(page.locator(props(npc!).shopId ? '.management-dialog' : '#dialogue-box')).toBeVisible();
  });
}
