import test from 'node:test';
import assert from 'node:assert/strict';
import { blendTilesetFrameEdges, extrudeTilesetFrameGutters } from '../../src/game/rendering/seamless-tileset.ts';

test('terrain atlas frame edges are blended to identical opposite borders', () => {
  const width = 6, height = 6;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      pixels[offset] = x * 35;
      pixels[offset + 1] = y * 35;
      pixels[offset + 2] = x * 10 + y * 10;
      pixels[offset + 3] = 255;
    }
  }

  blendTilesetFrameEdges(pixels, width, height, [{ x: 1, y: 1, width: 4, height: 4 }], 2);

  for (let y = 1; y < 5; y++) {
    const left = (y * width + 1) * 4;
    const right = (y * width + 4) * 4;
    assert.deepEqual([...pixels.subarray(left, left + 4)], [...pixels.subarray(right, right + 4)]);
  }
  for (let x = 1; x < 5; x++) {
    const top = (1 * width + x) * 4;
    const bottom = (4 * width + x) * 4;
    assert.deepEqual([...pixels.subarray(top, top + 4)], [...pixels.subarray(bottom, bottom + 4)]);
  }
  assert.equal(pixels[0], 0, 'pixels outside atlas frames remain untouched');
});

test('invalid tileset frame geometry is rejected before touching the image', () => {
  const pixels = new Uint8ClampedArray(4 * 4 * 4);
  assert.throws(() => blendTilesetFrameEdges(pixels, 4, 4, [{ x: 3, y: 0, width: 2, height: 2 }]), /outside its source image/);
});

test('Tiled spacing receives duplicated frame edges for clean linear sampling', () => {
  const width = 10, height = 10;
  const pixels = new Uint8ClampedArray(width * height * 4);
  const frames = [
    { x: 1, y: 1, width: 3, height: 3 }, { x: 6, y: 1, width: 3, height: 3 },
    { x: 1, y: 6, width: 3, height: 3 }, { x: 6, y: 6, width: 3, height: 3 },
  ];
  frames.forEach((frame, index) => {
    for (let y = frame.y; y < frame.y + frame.height; y++) {
      for (let x = frame.x; x < frame.x + frame.width; x++) {
        pixels[(y * width + x) * 4] = (index + 1) * 40;
        pixels[(y * width + x) * 4 + 3] = 255;
      }
    }
  });

  extrudeTilesetFrameGutters(pixels, width, height, frames, 2, 1, 2);

  assert.equal(pixels[(1 * width + 0) * 4], 40, 'outer margin copies the first frame edge');
  assert.equal(pixels[(1 * width + 4) * 4], 40, 'right spacing pixel copies the first frame edge');
  assert.equal(pixels[(1 * width + 5) * 4], 80, 'left spacing pixel copies the next frame edge');
  assert.equal(pixels[(0 * width + 1) * 4], 40, 'top margin copies the first frame edge');
  assert.equal(pixels[(4 * width + 1) * 4], 40, 'bottom spacing pixel copies the upper frame edge');
  assert.equal(pixels[(5 * width + 1) * 4], 120, 'top spacing pixel copies the lower frame edge');
});
