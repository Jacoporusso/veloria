import type Phaser from 'phaser';

export type TilesetFrame = { x: number; y: number; width: number; height: number };

/** Blend each frame's opposite borders so generated terrain remains continuous when tiled. */
export function blendTilesetFrameEdges(
  pixels: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  frames: readonly TilesetFrame[],
  blendSize = 48,
): void {
  for (const frame of frames) {
    if (frame.x < 0 || frame.y < 0 || frame.x + frame.width > imageWidth || frame.y + frame.height > imageHeight) {
      throw new Error('Tileset frame is outside its source image.');
    }
    blendHorizontalEdges(pixels, imageWidth, frame, blendSize);
    blendVerticalEdges(pixels, imageWidth, frame, blendSize);
  }
}

/** Fill the one-pixel Tiled gutters with each cell's own edge to prevent linear-filter bleed. */
export function extrudeTilesetFrameGutters(
  pixels: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  frames: readonly TilesetFrame[],
  columns: number,
  margin: number,
  spacing: number,
): void {
  frames.forEach((frame, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const hasLeftGutter = column === 0 ? margin >= 1 : spacing >= 2;
    const hasRightGutter = column === columns - 1 ? margin >= 1 : spacing >= 2;
    const hasTopGutter = row === 0 ? margin >= 1 : spacing >= 2;
    const hasBottomGutter = index + columns >= frames.length ? margin >= 1 : spacing >= 2;
    const left = frame.x, right = frame.x + frame.width - 1;
    const top = frame.y, bottom = frame.y + frame.height - 1;
    if (hasLeftGutter && left > 0) for (let y = top; y <= bottom; y++) copyPixel(pixels, imageWidth, left, y, left - 1, y);
    if (hasRightGutter && right + 1 < imageWidth) for (let y = top; y <= bottom; y++) copyPixel(pixels, imageWidth, right, y, right + 1, y);
    if (hasTopGutter && top > 0) for (let x = left; x <= right; x++) copyPixel(pixels, imageWidth, x, top, x, top - 1);
    if (hasBottomGutter && bottom + 1 < imageHeight) for (let x = left; x <= right; x++) copyPixel(pixels, imageWidth, x, bottom, x, bottom + 1);
    if (hasLeftGutter && hasTopGutter && left > 0 && top > 0) copyPixel(pixels, imageWidth, left, top, left - 1, top - 1);
    if (hasRightGutter && hasTopGutter && right + 1 < imageWidth && top > 0) copyPixel(pixels, imageWidth, right, top, right + 1, top - 1);
    if (hasLeftGutter && hasBottomGutter && left > 0 && bottom + 1 < imageHeight) copyPixel(pixels, imageWidth, left, bottom, left - 1, bottom + 1);
    if (hasRightGutter && hasBottomGutter && right + 1 < imageWidth && bottom + 1 < imageHeight) copyPixel(pixels, imageWidth, right, bottom, right + 1, bottom + 1);
  });
}

function copyPixel(pixels: Uint8ClampedArray, imageWidth: number, fromX: number, fromY: number, toX: number, toY: number): void {
  const from = (fromY * imageWidth + fromX) * 4;
  const to = (toY * imageWidth + toX) * 4;
  pixels.set(pixels.subarray(from, from + 4), to);
}

function blendHorizontalEdges(pixels: Uint8ClampedArray, imageWidth: number, frame: TilesetFrame, requestedSize: number): void {
  const size = Math.min(Math.max(1, Math.floor(requestedSize)), Math.floor(frame.width / 2));
  const channelCount = size * 4;
  const leftSamples = new Uint8ClampedArray(channelCount);
  const rightSamples = new Uint8ClampedArray(channelCount);
  for (let y = frame.y; y < frame.y + frame.height; y++) {
    for (let depth = 0; depth < size; depth++) {
      const left = ((y * imageWidth) + frame.x + depth) * 4;
      const right = ((y * imageWidth) + frame.x + frame.width - 1 - depth) * 4;
      leftSamples.set(pixels.subarray(left, left + 4), depth * 4);
      rightSamples.set(pixels.subarray(right, right + 4), depth * 4);
    }
    writeBlendedPair(pixels, leftSamples, rightSamples, size, 'left', 'right', (depth, channel, side) =>
      ((y * imageWidth) + frame.x + (side === 'left' ? depth : frame.width - 1 - depth)) * 4 + channel);
  }
}

function blendVerticalEdges(pixels: Uint8ClampedArray, imageWidth: number, frame: TilesetFrame, requestedSize: number): void {
  const size = Math.min(Math.max(1, Math.floor(requestedSize)), Math.floor(frame.height / 2));
  const channelCount = size * 4;
  const topSamples = new Uint8ClampedArray(channelCount);
  const bottomSamples = new Uint8ClampedArray(channelCount);
  for (let x = frame.x; x < frame.x + frame.width; x++) {
    for (let depth = 0; depth < size; depth++) {
      const top = (((frame.y + depth) * imageWidth) + x) * 4;
      const bottom = (((frame.y + frame.height - 1 - depth) * imageWidth) + x) * 4;
      topSamples.set(pixels.subarray(top, top + 4), depth * 4);
      bottomSamples.set(pixels.subarray(bottom, bottom + 4), depth * 4);
    }
    writeBlendedPair(pixels, topSamples, bottomSamples, size, 'top', 'bottom', (depth, channel, side) =>
      (((side === 'top' ? frame.y + depth : frame.y + frame.height - 1 - depth) * imageWidth) + x) * 4 + channel);
  }
}

type EdgeSide = 'left' | 'right' | 'top' | 'bottom';
function writeBlendedPair(
  destination: Uint8ClampedArray,
  first: Uint8ClampedArray,
  second: Uint8ClampedArray,
  size: number,
  firstSide: EdgeSide,
  secondSide: EdgeSide,
  indexOf: (depth: number, channel: number, side: EdgeSide) => number,
): void {
  for (let channel = 0; channel < 4; channel++) {
    const seamValue = (first[channel] + second[channel]) / 2;
    for (let depth = 0; depth < size; depth++) {
      const progress = size === 1 ? 0 : depth / (size - 1);
      const firstValue = first[depth * 4 + channel] * progress + seamValue * (1 - progress);
      const secondValue = second[depth * 4 + channel] * progress + seamValue * (1 - progress);
      destination[indexOf(depth, channel, firstSide)] = firstValue;
      destination[indexOf(depth, channel, secondSide)] = secondValue;
    }
  }
}

/** Create a shared canvas-backed tileset with seamless frame edges for the map renderer. */
export function ensureSeamlessTilesetTexture(
  scene: Phaser.Scene,
  sourceKey: string,
  columns: number,
  total: number,
  tileWidth: number,
  tileHeight: number,
  margin: number,
  spacing: number,
): string {
  if (!Number.isInteger(columns) || columns < 1 || !Number.isInteger(total) || total < 1 ||
      !Number.isInteger(tileWidth) || tileWidth < 1 || !Number.isInteger(tileHeight) || tileHeight < 1 ||
      !Number.isInteger(margin) || margin < 0 || !Number.isInteger(spacing) || spacing < 0) {
    throw new Error(`Tileset ${sourceKey} has invalid Tiled frame geometry.`);
  }
  const key = `${sourceKey}-seamless`;
  if (scene.textures.exists(key)) return key;

  const source = scene.textures.get(sourceKey).getSourceImage() as CanvasImageSource & { width: number; height: number };
  const texture = scene.textures.createCanvas(key, source.width, source.height);
  if (!texture) throw new Error(`Unable to create seamless terrain texture ${key}.`);
  texture.context.drawImage(source, 0, 0);
  const imageData = texture.context.getImageData(0, 0, source.width, source.height);
  const frames = Array.from({ length: total }, (_, index) => ({
    x: margin + (index % columns) * (tileWidth + spacing),
    y: margin + Math.floor(index / columns) * (tileHeight + spacing),
    width: tileWidth,
    height: tileHeight,
  }));
  blendTilesetFrameEdges(imageData.data, source.width, source.height, frames);
  extrudeTilesetFrameGutters(
    imageData.data, source.width, source.height, frames, columns, margin, spacing,
  );
  texture.context.putImageData(imageData, 0, 0);
  texture.refresh();
  return key;
}
