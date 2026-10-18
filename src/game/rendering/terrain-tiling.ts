export type TerrainTileFlip = { flipX: boolean; flipY: boolean };

function coordinateNoise(mapId: string, x: number, y: number): number {
  let hash = 2166136261;
  for (let index = 0; index < mapId.length; index++) {
    hash = Math.imul(hash ^ mapId.charCodeAt(index), 16777619);
  }
  hash = Math.imul(hash ^ x, 16777619);
  hash = Math.imul(hash ^ y, 16777619);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0xffffffff;
}

/**
 * Stable coordinate hashes vary repeated terrain without a visible checkerboard.
 * The renderer blends each atlas frame's opposite edges before applying these
 * reflections, so neighboring cells stay seamless with independent choices.
 */
export function getTerrainTileFlip(mapId: string, x: number, y: number): TerrainTileFlip {
  const hash = Math.floor(coordinateNoise(mapId, x, y) * 0xffffffff);

  return { flipX: (hash & 1) !== 0, flipY: (hash & 2) !== 0 };
}
