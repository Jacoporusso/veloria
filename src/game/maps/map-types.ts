export type MapSpawn = { id: string; x: number; y: number; facing: 'up' | 'down' | 'left' | 'right' };
export type MapConnection = { toMapId: string; viaSpawnId: string; targetSpawnId: string; requiresFlags: string[] };
export type MapTrigger = {
  id: string;
  kind?: string;
  x: number; y: number; width: number; height: number;
  destinationMapId?: string; destinationSpawnId?: string; requiredFlag?: string; message?: string; failureMessage?: string; questEvent?: string;
  exitDirection?: string;
  encounterTableId?: string; encounterChance?: number;
};
export type MapInteractable = {
  id: string; kind: string; name: string; x: number; y: number; width: number; height: number;
  properties: Record<string, unknown>;
};
export type MapRenderAsset =
  | { kind: 'image'; key: string; path: string; atlas?: { columns: number; rows: number } }
  | { kind: 'tileset'; key: string; path: string; tiledName: string; tileWidth: number; tileHeight: number };
export type MapTerrainBase = { assetKey: string; tilesetName: string; tileIndex: number };
export type MapAmbientArea = { x: number; y: number; width: number; height: number };
export type MapAmbientEffect = {
  kind: 'fireflies';
  count: number;
  area: MapAmbientArea;
  colors: string[];
} | {
  kind: 'petals';
  count: number;
  area: MapAmbientArea;
  colors: string[];
} | {
  kind: 'water-shimmer';
  count: number;
  area: MapAmbientArea;
  colors: string[];
} | {
  kind: 'grass-sway';
  tuftsPerArea: number;
  triggerIds: string[];
  colors: string[];
};
export type MapMetadata = {
  id: string;
  version: 1 | 2;
  displayName: string;
  biomeId: string;
  tiledAsset: string;
  battleBackgroundKey?: string;
  renderAssets: MapRenderAsset[];
  terrainBase?: MapTerrainBase;
  ambientEffects?: MapAmbientEffect[];
  spawns: MapSpawn[];
  connections: MapConnection[];
  encounterTableIds: string[];
  npcRefs: string[];
  scriptRefs: string[];
  musicId: string;
};

export type RegisteredMap = { metadata: MapMetadata };
