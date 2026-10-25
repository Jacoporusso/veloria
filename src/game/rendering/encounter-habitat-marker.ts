import type { MapTrigger } from '../maps/map-types.ts';

const TILE_SIZE = 32;
export type EncounterHabitatMarker = { x: number; y: number; triggerId: string };
export type EncounterHabitatCell = EncounterHabitatMarker;

/** Canonical three-leaf silhouette shared with the world-design prototype. */
export const ENCOUNTER_HABITAT_LEAF_PATH = 'M11 22C2 20 1 13 2 7c6 1 9 5 9 10C7 9 10 3 13 1c4 6 4 11 1 16 2-6 5-8 9-8 0 8-4 12-12 13Z';

/** The habitat legend uses the canonical leaf directly, without a badge or extra leaf marks. */
export const ENCOUNTER_HABITAT_SYMBOL = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" style="vertical-align:middle;margin-right:8px"><path d="${ENCOUNTER_HABITAT_LEAF_PATH}" fill="#c9f5c1"/></svg>`;

function encounterCells(trigger: Pick<MapTrigger, 'id' | 'kind' | 'x' | 'y' | 'width' | 'height'>, occupied: ReadonlySet<string>): EncounterHabitatCell[] {
  if (trigger.kind !== 'encounter-zone' || trigger.width <= 0 || trigger.height <= 0) return [];
  const left = Math.floor(trigger.x / TILE_SIZE);
  const top = Math.floor(trigger.y / TILE_SIZE);
  const right = Math.ceil((trigger.x + trigger.width) / TILE_SIZE);
  const bottom = Math.ceil((trigger.y + trigger.height) / TILE_SIZE);
  const cells: EncounterHabitatCell[] = [];
  for (let ty = top; ty < bottom; ty++) for (let tx = left; tx < right; tx++) {
    const x = tx * TILE_SIZE + TILE_SIZE / 2;
    const y = ty * TILE_SIZE + TILE_SIZE / 2;
    if (x < trigger.x || x >= trigger.x + trigger.width || y < trigger.y || y >= trigger.y + trigger.height) continue;
    if (occupied.has(`${tx},${ty}`)) continue;
    cells.push({ x, y, triggerId: trigger.id });
  }
  return cells;
}

/** Returns every walkable tile center inside each authored encounter patch. */
export function createEncounterHabitatCells(
  triggers: readonly Pick<MapTrigger, 'id' | 'kind' | 'x' | 'y' | 'width' | 'height'>[],
  occupied: ReadonlySet<string> = new Set(),
): EncounterHabitatCell[] {
  return triggers.flatMap(trigger => encounterCells(trigger, occupied));
}

/** One marker per patch, centered on its middle open tile or the nearest open tile. */
export function createEncounterHabitatMarkers(
  triggers: readonly Pick<MapTrigger, 'id' | 'kind' | 'x' | 'y' | 'width' | 'height'>[],
  occupied: ReadonlySet<string> = new Set(),
): EncounterHabitatMarker[] {
  return triggers.flatMap(trigger => {
    const cells = encounterCells(trigger, occupied);
    if (cells.length === 0) return [];
    const cx = trigger.x + trigger.width / 2;
    const cy = trigger.y + trigger.height / 2;
    cells.sort((a, b) => (a.x - cx) ** 2 + (a.y - cy) ** 2 - ((b.x - cx) ** 2 + (b.y - cy) ** 2));
    return [cells[0]!];
  });
}
