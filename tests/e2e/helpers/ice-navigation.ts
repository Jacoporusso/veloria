import { expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { collectMapCollision } from '../../../src/core/world/map-collision.ts';
import { collectIceTiles, iceSlideContinues } from '../../../src/core/world/ice-movement.ts';
import { tryGridMove, type CardinalDirection, type GridPoint } from '../../../src/core/world/grid-movement.ts';
import { readBrowserSave } from './world-navigation';

const labels = { up: 'Vai in alto', down: 'Vai in basso', left: 'Vai a sinistra', right: 'Vai a destra' };
type Step = { from: string; direction: CardinalDirection; point: GridPoint };

/** Plan complete slides, never walking through ice or leaving the map as a shortcut. */
export async function planIceRoute(page: Page, file: string, x: number, y: number): Promise<Step[]> {
  const map = JSON.parse(await readFile(new URL(`../../../public/tilemaps/${file}`, import.meta.url), 'utf8'));
  const save = await readBrowserSave(page);
  const blocked = collectMapCollision(map.layers.find((layer: any) => layer.name === 'collision').objects, map.width, map.height, save.flags);
  const ice = collectIceTiles(map.layers.find((layer: any) => layer.name === 'movement_surfaces').objects, map.width, map.height);
  const exits = map.layers.flatMap((layer: any) => layer.objects ?? []).filter((object: any) =>
    object.properties?.some((p: any) => p.name === 'kind' && p.value === 'map-exit'));
  const isExit = (point: GridPoint) => exits.some((o: any) => point.x * 32 >= o.x && point.x * 32 < o.x + o.width && point.y * 32 >= o.y && point.y * 32 < o.y + o.height);
  const start = { x: save.player.x!, y: save.player.y! }, key = (point: GridPoint) => `${point.x},${point.y}`;
  const queue = [start], seen = new Set([key(start)]), previous = new Map<string, Step>();
  for (let i = 0; i < queue.length && !seen.has(`${x},${y}`); i++) for (const direction of ['up', 'down', 'left', 'right'] as const) {
    const first = tryGridMove(queue[i], direction, map.width, map.height, blocked);
    if (!first.moved) continue;
    let point = first.position;
    while (iceSlideContinues(point, direction, map.width, map.height, blocked, ice)) point = tryGridMove(point, direction, map.width, map.height, blocked).position;
    if (isExit(point) || seen.has(key(point))) continue;
    seen.add(key(point)); queue.push(point); previous.set(key(point), { from: key(queue[i]), direction, point });
  }
  expect(seen.has(`${x},${y}`), `${file}: reachable ice landing ${x},${y}`).toBe(true);
  const route: Step[] = [];
  for (let cursor = `${x},${y}`; cursor !== key(start);) { const step = previous.get(cursor)!; route.push(step); cursor = step.from; }
  return route.reverse();
}

export async function walkIceTo(page: Page, file: string, x: number, y: number): Promise<void> {
  for (const step of await planIceRoute(page, file, x, y)) {
    await page.getByRole('button', { name: labels[step.direction], exact: true }).tap();
    await expect.poll(async () => { const save = await readBrowserSave(page); return { x: save.player.x, y: save.player.y }; },
      { intervals: [50, 100] }).toEqual(step.point);
  }
}
