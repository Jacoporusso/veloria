import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave } from './helpers/world-navigation';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };

// Desktop mouse in a window where the responsive on-screen controls are visible.
test.use({ viewport: { width: 900, height: 800 }, isMobile: false, hasTouch: false });

const cases = [
  { name: 'Elia', map: 'borgofonte_lab', tiled: 'borgofonte_lab.tmj', npcId: 'prof_elia' },
  { name: 'Ada', map: 'd01_bosco_veli', tiled: 'd01_bosco_veli.tmj', npcId: 'forest_ranger_ada' },
] as const;

type MapObject = { x?: number; y?: number; width?: number; height?: number; name?: string; properties?: any };
const properties = (object: MapObject) => Array.isArray(object.properties)
  ? Object.fromEntries(object.properties.map((property: any) => [property.name, property.value]))
  : object.properties ?? {};
const flatten = (layers: any[]): any[] => layers.flatMap(layer => [layer, ...(layer.layers ? flatten(layer.layers) : [])]);
function tiles(object: MapObject): Set<string> {
  const x = object.x ?? 0, y = object.y ?? 0, width = object.width ?? 32, height = object.height ?? 32;
  const result = new Set<string>();
  for (let ty = Math.floor(y / 32); ty < Math.ceil((y + Math.max(1, height)) / 32); ty++)
    for (let tx = Math.floor(x / 32); tx < Math.ceil((x + Math.max(1, width)) / 32); tx++) result.add(`${tx},${ty}`);
  return result;
}
async function playerTile(page: Page) {
  return page.evaluate(() => {
    const world = (globalThis as any).desktopInteractionGame.scene.getScene('world');
    return { ...world.playerTile };
  });
}

for (const scenario of cases) {
  test(`desktop mouse controls move and interact with ${scenario.name}`, async ({ page }) => {
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch({ maxRetries: 2 });
      await route.fulfill({ response, body: `${await response.text()}\nglobalThis.desktopInteractionGame=game;` });
    });
    await page.goto('/');
    await enterGame(page);

    const metadata = JSON.parse(await readFile(new URL(`../../content/maps/${scenario.map}.map.json`, import.meta.url), 'utf8'));
    const tiled = JSON.parse(await readFile(new URL(`../../public/tilemaps/${scenario.tiled}`, import.meta.url), 'utf8'));
    const layers = flatten(tiled.layers);
    const objects = layers.filter(layer => layer.type === 'objectgroup').flatMap(layer => layer.objects ?? []) as MapObject[];
    const npc = objects.find(object => properties(object).kind === 'npc'
      && (properties(object).npcId ?? properties(object).id ?? object.name) === scenario.npcId);
    expect(npc, `${scenario.map}: NPC ${scenario.npcId}`).toBeTruthy();

    const save = await readBrowserSave(page);
    save.flags = [...new Set([...save.flags, 'intro_completed', 'prologue_complete_seen', 'q_starter_selected'])];
    const npcTiles = tiles(npc!);
    const blocked = collectMapCollision(
      layers.filter(layer => layer.name === 'collision').flatMap(layer => layer.objects ?? []),
      tiled.width, tiled.height, save.flags,
    );
    const approaches = [...npcTiles].flatMap(cell => {
      const [x, y] = cell.split(',').map(Number);
      return [
        { x, y: y - 1, direction: 'down' as const }, { x, y: y + 1, direction: 'up' as const },
        { x: x - 1, y, direction: 'right' as const }, { x: x + 1, y, direction: 'left' as const },
      ];
    });
    const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
    const approach = approaches.find(({ x, y, direction }) => {
      const [dx, dy] = delta[direction];
      const startX = x - dx, startY = y - dy;
      return x >= 0 && y >= 0 && x < tiled.width && y < tiled.height
        && startX >= 0 && startY >= 0 && startX < tiled.width && startY < tiled.height
        && !blocked.has(`${x},${y}`) && !npcTiles.has(`${x},${y}`)
        && !blocked.has(`${startX},${startY}`) && !npcTiles.has(`${startX},${startY}`);
    });
    expect(approach, `${scenario.map}/${scenario.npcId}: free orthogonal approach`).toBeTruthy();

    const starter = createBattleCreature({ species: species.species as any, moves: moves.moves as any,
      speciesId: 25, level: 5, instanceId: `desktop-${scenario.npcId}`, moveIds: ['thunder-shock'] });
    const [dx, dy] = delta[approach!.direction];
    const start = { x: approach!.x - dx, y: approach!.y - dy };
    save.player = { ...save.player, mapId: metadata.id, spawnPointId: metadata.spawns[0].id,
      x: start.x, y: start.y };
    save.party = [{ instanceId: starter.instanceId, speciesId: 25, level: 5, experience: 0,
      hp: starter.hp, maxHp: starter.stats.maxHp, moves: starter.moves.map(move => ({ id: move.moveId, pp: move.pp })) }];
    await seedBrowserSave(page, save);
    await page.reload();
    await enterGame(page);

    const before = await playerTile(page);
    expect(before).toEqual(start);
    const directionLabel = { up: 'Vai in alto', down: 'Vai in basso', left: 'Vai a sinistra', right: 'Vai a destra' }[approach!.direction];
    await page.getByRole('button', { name: directionLabel, exact: true }).click();
    await expect.poll(() => playerTile(page)).toEqual({ x: approach!.x, y: approach!.y });
    const moved = await playerTile(page);
    expect(moved).toEqual({ x: approach!.x, y: approach!.y });

    await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).click();
    await expect(page.locator('#dialogue-box')).toBeVisible();
  });
}
