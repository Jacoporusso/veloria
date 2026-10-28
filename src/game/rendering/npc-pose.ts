import Phaser from 'phaser';
import type { NpcIdleView } from '../../core/world/npc-idle-views.ts';
import { npcIdleTextureSize } from './npc-idle-texture-size.ts';

/** Full image height is authored; every pose keeps its own aspect ratio and ground anchor. */
export function applyNpcPose(sprite: Phaser.GameObjects.Image, pose: NpcIdleView): void {
  sprite.setTexture(pose.assetKey).setOrigin(pose.origin.x, pose.origin.y).setScale(pose.displaySize / sprite.height);
  sprite.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
}

/** Compact standalone pose surfaces once, before actors exist; raw files remain untouched. */
export function prepareNpcPoseTextures(scene: Phaser.Scene, poses: Iterable<NpcIdleView>): void {
  for (const pose of poses) {
    const key = pose.assetKey;
    if (!scene.textures.exists(key)) continue;
    const texture = scene.textures.get(key);
    if (texture.source.length !== 1 || texture.frameTotal !== 1) continue;
    const source = texture.getSourceImage();
    if (!(source instanceof HTMLImageElement)) continue;
    const size = npcIdleTextureSize(source.naturalWidth, source.naturalHeight);
    if (size.width === source.naturalWidth && size.height === source.naturalHeight) continue;
    const canvas = document.createElement('canvas');
    canvas.width = size.width; canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) continue;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, size.width, size.height);
    scene.textures.remove(key);
    const compact = scene.textures.create(key, canvas, size.width, size.height);
    if (!compact) throw new Error(`Could not prepare NPC pose texture: ${key}`);
    compact.add('__BASE', 0, 0, 0, size.width, size.height);
    compact.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
