import type { MapMetadata, MapSpawn, RegisteredMap } from './map-types';

function parseMetadata(input: unknown): MapMetadata {
  if (!input || typeof input !== 'object') throw new Error('MapDefinition must be an object.');
  const metadata = input as MapMetadata;
  if (!/^veloria\/[a-z0-9_]+$/.test(metadata.id) || !Number.isInteger(metadata.version) ||
      !metadata.displayName || !metadata.tiledAsset?.endsWith('.tmj') ||
      !Array.isArray(metadata.spawns) || !Array.isArray(metadata.connections)) {
    throw new Error('MapDefinition has invalid metadata or spawn data.');
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

const metadataList = Object.values(import.meta.glob<MapMetadata>('../../../content/maps/*.map.json', {
  eager: true,
  import: 'default',
})).map(parseMetadata);
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
