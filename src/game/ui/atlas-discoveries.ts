import { publicAssetUrl } from '../../core/assets/index.ts';
import { getMap } from '../maps/map-registry.ts';
import { specialEncounterCatalog } from '../maps/special-encounter-registry.ts';
import { battleSpecies, encounterCatalog } from '../battle/catalog.ts';
import { pokemonRewardsAt } from '../journey/pokemon-reward-guidance.ts';
import rewards from '../../../content/journey/pokemon-rewards.v1.json';
import { questCatalog } from '../quests/catalog.ts';
import { describeQuestMapTarget } from '../journey/quest-map-guidance.ts';
import { regionAtlas } from '../../core/world/region-atlas.ts';
import { legendaryResearchState } from '../../core/encounters/legendary-research.ts';
import { legendaryResearchForEncounter } from '../maps/legendary-research-registry.ts';

type ObjectData = { id: number; name?: string; x: number; y: number; width?: number; height?: number; properties?: { name: string; value: unknown }[] };
type TiledData = { width: number; height: number; tilewidth: number; tileheight: number; layers: { name: string; objects?: ObjectData[] }[] };
export type AtlasDiscovery = {
  id: string; kind: 'gift' | 'encounter' | 'fishing' | 'quest'; mapId: string; name: string; location: string;
  icon: string; x: number; y: number; objectName: string; precision?: 'area' | 'point'; researchId?: string; regionHint?: string;
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
  for (const encounter of Object.values(specialEncounterCatalog)) pending.push(loadAtlasTiled(encounter.mapId).then(async tiled => {
    const objects = tiled.layers.flatMap(layer => layer.objects ?? []);
    const research = legendaryResearchForEncounter(encounter.id);
    if (!research) {
      const object = objects.find(item => tiledProperties(item).specialEncounterId === encounter.id);
      return object ? [point(encounter.id, 'encounter', encounter.mapId, battleSpecies[encounter.speciesId].name, '✦', object)] : [];
    }

    const state = legendaryResearchState(research, flags);
    const area = regionAtlas.areas.find(item => item.mapIds.includes(encounter.mapId));
    const discoveries: AtlasDiscovery[] = [];
    if (state.status !== 'revealed' && area) {
      discoveries.push({ id: `${research.id}#area`, kind: 'encounter', mapId: encounter.mapId,
        name: 'Tracce di un Pokémon raro', location: area.name, icon: '…', x: area.x, y: area.y,
        objectName: 'Ricerca nella macrozona', precision: 'area', researchId: research.id, regionHint: research.regionHint });
    }
    if (state.status === 'revealed' || state.captured) {
      const object = objects.find(item => tiledProperties(item).specialEncounterId === encounter.id);
      if (object) discoveries.push(point(encounter.id, 'encounter', encounter.mapId,
        battleSpecies[encounter.speciesId].name, '✦', object));
    }

    const cluePoints = await Promise.all(research.clues.filter(clue => flags.includes(clue.flag)).map(async clue => {
      const clueMap = clue.mapId === encounter.mapId ? tiled : await loadAtlasTiled(clue.mapId);
      const clueObject = clueMap.layers.flatMap(layer => layer.objects ?? []).find(item => {
        const properties = tiledProperties(item);
        return properties.researchId === research.id && properties.researchClueId === clue.id;
      });
      return clueObject ? point(`${research.id}#${clue.id}`, 'encounter', clue.mapId, clue.title, '◆', clueObject) : undefined;
    }));
    discoveries.push(...cluePoints.filter((item): item is AtlasDiscovery => Boolean(item)));

    const quest = questCatalog.find(item => item.id === research.questId);
    const nextStep = quest?.steps.find(step => !flags.includes(step.setFlag) && step.requiresFlags.every(flag => flags.includes(flag)));
    if (state.status === 'ready' && nextStep?.trigger === research.puzzle.event) {
      const puzzleMap = research.puzzle.mapId === encounter.mapId ? tiled : await loadAtlasTiled(research.puzzle.mapId);
      const puzzleObject = puzzleMap.layers.flatMap(layer => layer.objects ?? []).find(item => {
        const properties = tiledProperties(item);
        return properties.researchId === research.id && !properties.researchClueId && properties.specialEncounterId !== research.encounterId;
      });
      if (puzzleObject) discoveries.push(point(`${research.id}#puzzle`, 'quest', research.puzzle.mapId,
        research.puzzle.title, '◆', puzzleObject));
    }
    return discoveries;
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
