import type { MapMetadata, MapRenderAsset, MapSpawn, RegisteredMap } from './map-types';
import { resolveMapRenderAssets } from './map-render-assets';

const legacyV1RenderAssets: MapRenderAsset[] = [
  { kind: 'tileset', key: 'veloria-ground', path: 'assets/tilesets/veloria-ground-v1.png', tiledName: 'veloria_terrain', tileWidth: 32, tileHeight: 32 },
  { kind: 'image', key: 'borgofonte-house', path: 'assets/sprites/borgofonte-house-01.png' },
  { kind: 'image', key: 'borgofonte-tree', path: 'assets/sprites/borgofonte-tree-01.png' },
  { kind: 'image', key: 'veloria-bosco-ancient-tree-v1', path: 'assets/sprites/veloria-bosco-ancient-tree-v1.png' },
];

function parseMetadata(input: unknown): MapMetadata {
  if (!input || typeof input !== 'object') throw new Error('MapDefinition must be an object.');
  const source = input as Omit<MapMetadata, 'renderAssets'> & { renderAssets?: MapRenderAsset[] };
  if (!/^veloria\/[a-z0-9_]+$/.test(source.id) || ![1, 2].includes(source.version) ||
      !source.displayName || !source.tiledAsset?.endsWith('.tmj') ||
      !Array.isArray(source.spawns) || !Array.isArray(source.connections)) {
    throw new Error('MapDefinition has invalid metadata or spawn data.');
  }
  if (source.version === 1 && source.renderAssets !== undefined) throw new Error(`MapDefinition v1 ${source.id} cannot declare renderAssets; use version 2.`);
  if (source.version === 2 && !Array.isArray(source.renderAssets)) throw new Error(`MapDefinition v2 ${source.id} must declare renderAssets.`);
  if (source.ambientEffects !== undefined) validateAmbientEffects(source.id, source.ambientEffects);
  const metadata = { ...source, renderAssets: source.version === 1 ? legacyV1RenderAssets : source.renderAssets! } as MapMetadata;
  if (metadata.battleBackgroundKey !== undefined &&
      !metadata.renderAssets.some(asset => asset.key === metadata.battleBackgroundKey && asset.kind === 'image')) {
    throw new Error(`MapDefinition ${metadata.id} battleBackgroundKey must reference a declared image asset.`);
  }
  const spawnIds = new Set<string>();
  for (const spawn of metadata.spawns) {
    if (!spawn.id || spawnIds.has(spawn.id) || !Number.isInteger(spawn.x) || !Number.isInteger(spawn.y)) {
      throw new Error(`MapDefinition ${metadata.id} has a malformed or duplicate spawn.`);
    }
    spawnIds.add(spawn.id);
  }
  for (const connection of metadata.connections) {
    if (!spawnIds.has(connection.viaSpawnId)) throw new Error(`Connection in ${metadata.id} references a missing local spawn.`);
  }
  return metadata;
}

function validateAmbientEffects(mapId: string, effects: unknown): void {
  if (!Array.isArray(effects)) throw new Error(`MapDefinition ${mapId} ambientEffects must be an array.`);
  for (const rawEffect of effects) {
    if (!rawEffect || typeof rawEffect !== 'object') throw new Error(`MapDefinition ${mapId} has a malformed ambient effect.`);
    const effect = rawEffect as Record<string, unknown>;
    const colors = effect.colors;
    const validColors = Array.isArray(colors) && colors.length > 0 && colors.every(color => typeof color === 'string' && /^#[\da-f]{6}$/i.test(color));
    const area = effect.area as Record<string, unknown> | undefined;
    const validFireflies = effect.kind === 'fireflies' && Number.isInteger(effect.count) && Number(effect.count) >= 1 && Number(effect.count) <= 64 &&
      !!area && ['x', 'y', 'width', 'height'].every(key => Number.isInteger(area[key])) &&
      Number(area.x) >= 0 && Number(area.y) >= 0 && Number(area.width) > 0 && Number(area.height) > 0;
    const validWaterShimmer = effect.kind === 'water-shimmer' && Number.isInteger(effect.count) && Number(effect.count) >= 1 && Number(effect.count) <= 64 &&
      !!area && ['x', 'y', 'width', 'height'].every(key => Number.isInteger(area[key])) &&
      Number(area.x) >= 0 && Number(area.y) >= 0 && Number(area.width) > 0 && Number(area.height) > 0;
    const triggerIds = effect.triggerIds;
    const validGrassSway = effect.kind === 'grass-sway' && Number.isInteger(effect.tuftsPerArea) &&
      Number(effect.tuftsPerArea) >= 1 && Number(effect.tuftsPerArea) <= 16 && Array.isArray(triggerIds) &&
      triggerIds.length > 0 && triggerIds.every(id => typeof id === 'string' && id.length > 0) &&
      new Set(triggerIds).size === triggerIds.length;
    if ((!validFireflies && !validWaterShimmer && !validGrassSway) || !validColors) {
      throw new Error(`MapDefinition ${mapId} has a malformed ambient effect.`);
    }
  }
}

const metadataList = Object.values(import.meta.glob<MapMetadata>('../../../content/maps/*.map.json', {
  eager: true,
  import: 'default',
})).map(parseMetadata);
resolveMapRenderAssets(metadataList);
const registry = new Map<string, RegisteredMap>();
for (const metadata of metadataList) {
  if (registry.has(metadata.id)) throw new Error(`Duplicate map ID: ${metadata.id}.`);
  registry.set(metadata.id, { metadata });
}

for (const map of registry.values()) for (const connection of map.metadata.connections) {
  const target = registry.get(connection.toMapId);
  if (target && !target.metadata.spawns.some(spawn => spawn.id === connection.targetSpawnId)) {
    throw new Error(`${map.metadata.id} connects to a missing spawn in ${connection.toMapId}.`);
  }
}

export function getMap(mapId: string): RegisteredMap {
  const map = registry.get(mapId);
  if (!map) throw new Error(`Map not found: ${mapId}`);
  return map;
}

export function getSpawn(map: RegisteredMap, spawnId: string): MapSpawn {
  const spawn = map.metadata.spawns.find(item => item.id === spawnId);
  if (!spawn) throw new Error(`Spawn ${spawnId} not found in ${map.metadata.id}.`);
  return spawn;
}

export function listMaps(): RegisteredMap[] {
  return [...registry.values()];
}

export function getMapKey(map: RegisteredMap): string {
  return map.metadata.id.replaceAll('/', '-');
}
