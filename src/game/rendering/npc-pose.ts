import Phaser from 'phaser';
import type { NpcIdleView } from '../../core/world/npc-idle-views.ts';
import { npcIdleTextureSize } from './npc-idle-texture-size.ts';

const mipmappedPoses = new WeakSet<Phaser.Textures.Texture>();

/** Full image height is authored; every pose keeps its own aspect ratio and ground anchor. */
export function applyNpcPose(sprite: Phaser.GameObjects.Image, pose: NpcIdleView): void {
  sprite.setTexture(pose.assetKey).setOrigin(pose.origin.x, pose.origin.y).setScale(pose.displaySize / sprite.height);
  // setFilter(LINEAR) would discard the minification filter prepared below.
  if (!mipmappedPoses.has(sprite.texture)) sprite.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
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
    const renderer = scene.game.renderer;
    const webgl = renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer;
    // WebGL1 requires power-of-two surfaces for mipmaps. The frame keeps the
    // exact image ratio: padding never changes the pose or its authored origin.
    canvas.width = webgl ? 2 ** Math.ceil(Math.log2(size.width)) : Math.ceil(size.width);
    canvas.height = webgl ? 2 ** Math.ceil(Math.log2(size.height)) : Math.ceil(size.height);
    const context = canvas.getContext('2d');
    if (!context) continue;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, size.width, size.height);
    scene.textures.remove(key);
    const compact = scene.textures.create(key, canvas, canvas.width, canvas.height);
    if (!compact) throw new Error(`Could not prepare NPC pose texture: ${key}`);
    compact.add('__BASE', 0, 0, 0, size.width, size.height);
    if (webgl) {
      const gl = renderer.gl;
      const surface = compact.source[0];
      // Phaser's wrapper also regenerates the levels on context restoration.
      if (surface.glTexture) {
        surface.glTexture.update(canvas, canvas.width, canvas.height, surface.flipY,
          gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR, gl.RGBA);
        mipmappedPoses.add(compact);
      }
    } else compact.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
