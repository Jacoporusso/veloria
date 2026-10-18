import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMapRenderAssets } from '../../src/game/maps/map-render-assets.ts';

test('map render assets are deduplicated across maps by identical texture key and definition', () => {
  const sharedGround = { kind: 'tileset' as const, key: 'ground-rural', path: 'assets/tilesets/rural.png', tiledName: 'rural', tileWidth: 32, tileHeight: 32 };
  const forest = { kind: 'tileset' as const, key: 'ground-forest', path: 'assets/tilesets/forest.png', tiledName: 'forest', tileWidth: 32, tileHeight: 32 };
  const propAtlas = { kind: 'image' as const, key: 'props', path: 'assets/sprites/props.png', atlas: { columns: 2, rows: 2 } };
  const assets = resolveMapRenderAssets([
    { id: 'veloria/village', renderAssets: [sharedGround, propAtlas] },
    { id: 'veloria/forest', renderAssets: [sharedGround, forest, propAtlas] },
  ]);
  assert.deepEqual(assets.map(asset => asset.key), ['ground-rural', 'props', 'ground-forest']);
});

test('map render assets reject conflicting keys, traversal paths and duplicate tileset names', () => {
  const asset = { kind: 'image' as const, key: 'forest', path: 'assets/forest.png' };
  const groundA = { kind: 'tileset' as const, key: 'ground-a', path: 'assets/ground-a.png', tiledName: 'ground-a', tileWidth: 32, tileHeight: 32 };
  const groundB = { kind: 'tileset' as const, key: 'ground-b', path: 'assets/ground-b.png', tiledName: 'ground-b', tileWidth: 32, tileHeight: 32 };
  assert.throws(() => resolveMapRenderAssets([
    { id: 'veloria/a', renderAssets: [groundA, asset] },
    { id: 'veloria/b', renderAssets: [groundB, { ...asset, path: 'assets/other.png' }] },
  ]), /conflicting definitions/);
  assert.throws(() => resolveMapRenderAssets([{ id: 'veloria/a', renderAssets: [{ ...asset, path: '../forest.png' }] }]), /invalid render asset/);
  assert.throws(() => resolveMapRenderAssets([{ id: 'veloria/a', renderAssets: [{ ...asset, atlas: { columns: 0, rows: 2 } }] }]), /invalid atlas dimensions/);
  assert.throws(() => resolveMapRenderAssets([
    { id: 'veloria/a', renderAssets: [groundA, { ...asset, atlas: { columns: 2, rows: 2 } }] },
    { id: 'veloria/b', renderAssets: [groundB, { ...asset, atlas: { columns: 3, rows: 2 } }] },
  ]), /conflicting definitions/);
  const tileset = { kind: 'tileset' as const, key: 'ground', path: 'assets/ground.png', tiledName: 'terrain', tileWidth: 32, tileHeight: 32 };
  assert.throws(() => resolveMapRenderAssets([{ id: 'veloria/a', renderAssets: [tileset, { ...tileset, key: 'ground-2' }] }]), /duplicate Tiled tileset/);
});
