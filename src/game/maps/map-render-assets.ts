import type { MapMetadata, MapRenderAsset } from './map-types';

/** Collect assets referenced by maps, sharing identical Phaser textures across maps. */
export function resolveMapRenderAssets(maps: readonly Pick<MapMetadata, 'id' | 'renderAssets'>[]): MapRenderAsset[] {
  const assetsByKey = new Map<string, MapRenderAsset>();
  for (const map of maps) {
    const tiledNames = new Set<string>();
    const localKeys = new Set<string>();
    for (const asset of map.renderAssets) {
      if (!asset.key || !asset.path.startsWith('assets/') || asset.path.startsWith('/') || asset.path.split('/').includes('..')) {
        throw new Error(`Map ${map.id} has an invalid render asset reference.`);
      }
      if (localKeys.has(asset.key)) throw new Error(`Map ${map.id} repeats render asset key ${asset.key}.`);
      localKeys.add(asset.key);
      if (asset.kind === 'tileset') {
        if (!asset.tiledName || !Number.isInteger(asset.tileWidth) || asset.tileWidth < 1 ||
            !Number.isInteger(asset.tileHeight) || asset.tileHeight < 1 || tiledNames.has(asset.tiledName)) {
          throw new Error(`Map ${map.id} has an invalid or duplicate Tiled tileset reference.`);
        }
        tiledNames.add(asset.tiledName);
      }
      if (asset.kind === 'image' && asset.atlas &&
          (!Number.isInteger(asset.atlas.columns) || asset.atlas.columns < 1 || !Number.isInteger(asset.atlas.rows) || asset.atlas.rows < 1)) {
        throw new Error(`Map ${map.id} has invalid atlas dimensions for ${asset.key}.`);
      }
      const registered = assetsByKey.get(asset.key);
      if (registered && !sameAsset(registered, asset)) {
        throw new Error(`Render asset key ${asset.key} is mapped to conflicting definitions.`);
      }
      assetsByKey.set(asset.key, asset);
    }
    if (tiledNames.size === 0) throw new Error(`Map ${map.id} must declare at least one tileset.`);
  }
  return [...assetsByKey.values()];
}

function sameAsset(left: MapRenderAsset, right: MapRenderAsset): boolean {
  if (left.kind !== right.kind || left.key !== right.key || left.path !== right.path) return false;
  if (left.kind === 'image' || right.kind === 'image') {
    if (left.kind !== 'image' || right.kind !== 'image') return false;
    return JSON.stringify(left.atlas ?? null) === JSON.stringify(right.atlas ?? null);
  }
  return left.tiledName === right.tiledName && left.tileWidth === right.tileWidth && left.tileHeight === right.tileHeight;
}
