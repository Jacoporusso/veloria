import Phaser from 'phaser';
import appearances from '../../../content/characters/appearances.v2.json';
import { validateNpcIdleViews, type NpcIdleView, type NpcIdleViews } from '../../core/world/npc-idle-views.ts';
import { directionTowardObserver } from '../../core/world/npc-facing.ts';
import type { GridPoint } from '../../core/world/grid-movement.ts';
import type { MapInteractable } from '../maps/map-types.ts';

const catalog = appearances as unknown as {
  assets: { key: string }[];
  profiles: { id: string; idleViews?: unknown }[];
};
const assetKeys = new Set(catalog.assets.map(asset => asset.key));
const viewsByAppearance = new Map<string, NpcIdleViews>();
for (const profile of catalog.profiles) {
  if (profile.idleViews !== undefined) {
    viewsByAppearance.set(profile.id, validateNpcIdleViews(profile.idleViews, assetKeys));
  }
}

export function npcIdleViews(appearanceId: unknown): NpcIdleViews | undefined {
  return typeof appearanceId === 'string' ? viewsByAppearance.get(appearanceId) : undefined;
}

/** displaySize is the full image height; keep the source aspect ratio and authored foot anchor. */
export function applyNpcIdleView(sprite: Phaser.GameObjects.Image, view: NpcIdleView): void {
  sprite.setTexture(view.assetKey).setOrigin(view.origin.x, view.origin.y)
    .setScale(view.displaySize / sprite.height);
  sprite.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
}

/** A cosmetic pose change only: world foot anchor, collision and save state stay put. */
export function faceNpcTowardObserver(layer: Phaser.GameObjects.Container, item: MapInteractable, observer: GridPoint): void {
  const views = npcIdleViews(item.properties.characterAppearanceId);
  if (!views) return;
  const direction = directionTowardObserver({
    x: Math.floor((item.x + item.width / 2) / 32),
    y: Math.floor((item.y + item.height / 2) / 32),
  }, observer);
  if (!direction) return;
  const sprite = layer.list.find((child): child is Phaser.GameObjects.Image =>
    child instanceof Phaser.GameObjects.Image && child.name === 'npc-sprite' && child.getData('npcId') === item.properties.npcId);
  if (!sprite) return;
  const view = views[direction];
  applyNpcIdleView(sprite, view);
  sprite.setData('npcFacing', direction);
}
