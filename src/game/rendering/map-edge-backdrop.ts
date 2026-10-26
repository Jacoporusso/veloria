import type Phaser from 'phaser';

const AMBIENCE_WIDTH = 256;
const AMBIENCE_HEIGHT = 64;

/** Sample only a narrow painted edge. Blurred colour fields cannot reproduce
 * buildings from the interior of the map when the camera needs extra room.
 * Derived textures live in memory and are reused across scene reloads.
 */
function edgeAmbience(scene: Phaser.Scene, sourceKey: string, edge: 'top' | 'bottom', worldWidth: number): string {
  const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const band = Math.min(source.height, Math.max(1, Math.ceil(24 * source.width / worldWidth)));
  const key = `__veloria-edge:${sourceKey}:${edge}:${band}`;
  if (scene.textures.exists(key)) return key;
  const sample = document.createElement('canvas');
  sample.width = 32; sample.height = 4;
  const sampleContext = sample.getContext('2d')!;
  sampleContext.drawImage(source, 0, edge === 'top' ? 0 : source.height - band,
    source.width, band, 0, 0, sample.width, sample.height);
  const texture = scene.textures.createCanvas(key, AMBIENCE_WIDTH, AMBIENCE_HEIGHT);
  if (!texture) throw new Error(`Could not create map edge texture: ${sourceKey}`);
  const context = texture.context;
  const colour = sampleContext.getImageData(16, 2, 1, 1).data;
  context.fillStyle = `rgb(${colour[0]}, ${colour[1]}, ${colour[2]})`;
  context.fillRect(0, 0, AMBIENCE_WIDTH, AMBIENCE_HEIGHT);
  context.save();
  context.imageSmoothingEnabled = true;
  // Downsampling already removes detail; blur adds a soft transition where supported.
  if ('filter' in context) context.filter = 'blur(12px)';
  context.drawImage(sample, -24, -24, AMBIENCE_WIDTH + 48, AMBIENCE_HEIGHT + 48);
  context.restore();
  texture.refresh();
  return key;
}

export function renderMapEdgeBackdrop(scene: Phaser.Scene, container: Phaser.GameObjects.Container,
  texture: string | Phaser.Textures.Texture, width: number, height: number, depth: number): void {
  for (const edge of ['top', 'bottom'] as const) {
    const painted = typeof texture === 'string';
    const key = painted ? edgeAmbience(scene, texture, edge, width) : texture;
    const image = scene.add.image(0, edge === 'top' ? 0 : height, key)
      .setOrigin(0, edge === 'top' ? 1 : 0).setDisplaySize(width, height)
      .setFlipY(true).setDepth(depth).setName('map-edge-backdrop')
      .setData('edgeBackdropMode', painted ? 'ambience' : 'terrain')
      .setData('edgeBackdropSource', typeof texture === 'string' ? texture : texture.key);
    // Backdrops remain behind world objects, including heads near the map boundary.
    container.addAt(image, 0);
  }
}
