import atlasContent from '../../../content/region/veloria-atlas.v1.json' with { type: 'json' };
import type { GameSave } from '../../persistence/save-types.ts';

export type AtlasArea = {
  id: string; name: string; kind: string; x: number; y: number;
  mapIds: string[]; visitedFlags: string[]; description: string; gym?: number;
};
export const regionAtlas = atlasContent as { id: string; width: number; height: number; areas: AtlasArea[]; connections: string[][] };
const visitedPrefix = 'atlas_visited_';

export function areaForMap(mapId: string): AtlasArea | undefined {
  return regionAtlas.areas.find(area => area.mapIds.includes(mapId));
}

/** Recording is immutable, idempotent, and rejects maps absent from the atlas. */
export function recordAreaVisited(flags: readonly string[], mapId: string): string[] {
  if (!areaForMap(mapId)) return [...flags];
  const flag = `${visitedPrefix}${mapId}`;
  return flags.includes(flag) ? [...flags] : [...flags, flag];
}

export function visitedAreaIds(flags: readonly string[]): string[] {
  const known = new Set(flags);
  return regionAtlas.areas.filter(area => area.mapIds.length > 0 && (
    area.mapIds.some(mapId => known.has(`${visitedPrefix}${mapId}`)) ||
    area.visitedFlags.some(flag => known.has(flag))
  )).map(area => area.id);
}

export function deriveAtlasState(save: Pick<GameSave, 'player' | 'flags'>) {
  const current = areaForMap(save.player.mapId);
  const visited = new Set(visitedAreaIds(save.flags));
  if (current) visited.add(current.id);
  return {
    currentAreaId: current?.id,
    areas: regionAtlas.areas.map(area => ({ ...area,
      current: current?.id === area.id,
      visited: visited.has(area.id),
      available: area.mapIds.length > 0,
      status: current?.id === area.id ? 'Sei qui' : area.mapIds.length === 0 ? 'In preparazione' : visited.has(area.id) ? 'Visitato' : 'Da esplorare',
    })),
  };
}
