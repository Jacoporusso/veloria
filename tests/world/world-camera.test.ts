import test from 'node:test';
import assert from 'node:assert/strict';
import { worldCameraZoom } from '../../src/game/rendering/world-camera.ts';

test('small rooms cover phone and desktop viewports in either orientation', () => {
  const map = { width: 768, height: 512 };
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1920, height: 1080 }]) {
    const zoom = worldCameraZoom(viewport, map);
    assert.ok(map.width * zoom >= viewport.width);
    assert.ok(map.height * zoom >= viewport.height);
  }
});
test('expanding a map retains readable outdoor exploration rather than fitting the entire region', () => {
  const zoom = worldCameraZoom({ width: 390, height: 844 }, { width: 4096, height: 4096 });
  assert.equal(zoom, 1);
});
