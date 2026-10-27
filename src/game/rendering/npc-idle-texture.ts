import Phaser from 'phaser';
import type { NpcIdleViews } from '../../core/world/npc-idle-views.ts';
import { npcIdleTextureSize } from './npc-idle-texture-size.ts';

/** Before creating any actor, replace standalone idle images with static render surfaces.
 * The source files stay intact. Reusing their keys releases the large cached textures
 * and avoids allocating another set on every pose change or map refresh. */
export function prepareNpcIdleTextures(scene: Phaser.Scene, views: NpcIdleViews): void {
  for (const view of Object.values(views)) {
    const key = view.assetKey;
    if (!scene.textures.exists(key)) continue;
    const texture = scene.textures.get(key);
    if (texture.source.length !== 1 || texture.frameTotal !== 1) continue;
    const source = texture.getSourceImage();
    // Already prepared canvases, atlases and other texture kinds stay untouched.
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
    if (!compact) throw new Error(`Could not prepare NPC idle texture: ${key}`);
    compact.add('__BASE', 0, 0, 0, size.width, size.height);
    compact.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
