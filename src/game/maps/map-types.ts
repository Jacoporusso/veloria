export type MapSpawn = { id: string; x: number; y: number; facing: 'up' | 'down' | 'left' | 'right' };
export type MapConnection = { toMapId: string; viaSpawnId: string; targetSpawnId: string; requiresFlags: string[] };
export type MapTrigger = {
  id: string;
  kind?: string;
  x: number; y: number; width: number; height: number;
  destinationMapId?: string; destinationSpawnId?: string; requiredFlag?: string; message?: string;
};
export type MapInteractable = {
  id: string; kind: string; name: string; x: number; y: number; width: number; height: number;
  properties: Record<string, unknown>;
};
export type MapMetadata = {
  id: string;
  version: number;
  displayName: string;
  biomeId: string;
  tiledAsset: string;
  spawns: MapSpawn[];
  connections: MapConnection[];
  encounterTableIds: string[];
  npcRefs: string[];
  scriptRefs: string[];
  musicId: string;
};

export type RegisteredMap = { metadata: MapMetadata };
