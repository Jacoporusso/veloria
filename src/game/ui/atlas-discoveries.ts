import { publicAssetUrl } from '../../core/assets/index.ts';
import { getMap } from '../maps/map-registry.ts';
import { specialEncounterCatalog } from '../maps/special-encounter-registry.ts';
import { battleSpecies, encounterCatalog } from '../battle/catalog.ts';
import { pokemonRewardsAt } from '../journey/pokemon-reward-guidance.ts';
import rewards from '../../../content/journey/pokemon-rewards.v1.json';
import { questCatalog } from '../quests/catalog.ts';
import { describeQuestMapTarget } from '../journey/quest-map-guidance.ts';

type ObjectData = { id: number; name?: string; x: number; y: number; width?: number; height?: number; properties?: { name: string; value: unknown }[] };
type TiledData = { width: number; height: number; tilewidth: number; tileheight: number; layers: { name: string; objects?: ObjectData[] }[] };
export type AtlasDiscovery = {
  id: string; kind: 'gift' | 'encounter' | 'fishing' | 'quest'; mapId: string; name: string; location: string;
  icon: string; x: number; y: number; objectName: string;
};
export const tiledProperties = (object: ObjectData) => Object.fromEntries((object.properties ?? []).map(property => [property.name, property.value]));
const maps = new Map<string, Promise<TiledData>>();

export function loadAtlasTiled(mapId: string): Promise<TiledData> {
  let request = maps.get(mapId);
  if (!request) {
    request = fetch(publicAssetUrl(getMap(mapId).metadata.tiledAsset, import.meta.env.BASE_URL)).then(response => {
      if (!response.ok) throw new Error('La pianta del luogo non è disponibile.');
      return response.json() as Promise<TiledData>;
    }).catch(error => { maps.delete(mapId); throw error; });
    maps.set(mapId, request);
  }
  return request;
}

/** All points come from authored objects; region coordinates are never used as local positions. */
export async function loadAtlasDiscoveries(flags: readonly string[], currentMapId?: string): Promise<{ points: AtlasDiscovery[]; incomplete: boolean }> {
  const pending: Promise<AtlasDiscovery[]>[] = [];
  const gifts = pokemonRewardsAt(rewards.guides.map(guide => guide.mapId), flags);
  for (const reward of gifts) pending.push(loadAtlasTiled(reward.guide.mapId).then(tiled => {
    const object = tiled.layers.flatMap(layer => layer.objects ?? []).find(item => tiledProperties(item).npcId === reward.guide.npcId);
    return object ? [point(reward.guide.questId, 'gift', reward.guide.mapId, reward.name, '🎁', object)] : [];
  }));
  for (const encounter of Object.values(specialEncounterCatalog)) pending.push(loadAtlasTiled(encounter.mapId).then(tiled => {
    const object = tiled.layers.flatMap(layer => layer.objects ?? []).find(item => tiledProperties(item).specialEncounterId === encounter.id);
    return object ? [point(encounter.id, 'encounter', encounter.mapId, battleSpecies[encounter.speciesId].name, '✦', object)] : [];
  }));
  const fishingMaps = new Set(Object.values(encounterCatalog).filter(table => table.method === 'fishing').map(table => table.mapId));
  for (const mapId of fishingMaps) pending.push(loadAtlasTiled(mapId).then(tiled => tiled.layers.flatMap(layer => layer.objects ?? [])
    .filter(object => tiledProperties(object).kind === 'fishing-spot')
    .map(object => point(`fishing:${mapId}:${object.id}`, 'fishing', mapId, object.name ?? 'Punto pesca', '🎣', object))));
  // A missing map must not hide unrelated gifts, encounters or fishing spots.
  const results = await Promise.allSettled(pending);
  const discoveries = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  for (const quest of questCatalog) {
    for (const step of quest.steps) {
      const point = describeQuestMapTarget(quest, flags, currentMapId, step.setFlag);
      if (point) discoveries.push({ ...point, kind: 'quest', icon: '◆' });
    }
  }
  return { points: discoveries, incomplete: results.some(result => result.status === 'rejected') };
}

function point(id: string, kind: AtlasDiscovery['kind'], mapId: string, name: string, icon: string, object: ObjectData): AtlasDiscovery {
  return { id, kind, mapId, name, icon, location: getMap(mapId).metadata.displayName,
    x: object.x + (object.width ?? 32) / 2, y: object.y + (object.height ?? 32) / 2 + 19, objectName: object.name ?? name };
}

export function atlasBackground(mapId: string, tiled: TiledData): string | undefined {
  const metadata = getMap(mapId).metadata;
  const width = tiled.width * tiled.tilewidth, height = tiled.height * tiled.tileheight;
  const scenery = tiled.layers.flatMap(layer => layer.objects ?? [])
    .filter(object => tiledProperties(object).kind === 'scenery-image' && object.x === 0 && object.y === 0 && object.width === width && object.height === height)
    .sort((a, b) => Number(tiledProperties(b).renderDepth ?? -4) - Number(tiledProperties(a).renderDepth ?? -4))[0];
  const key = scenery ? tiledProperties(scenery).sprite : metadata.terrainBase?.assetKey;
  return metadata.renderAssets.find(asset => asset.kind === 'image' && asset.key === key)?.path;
}
