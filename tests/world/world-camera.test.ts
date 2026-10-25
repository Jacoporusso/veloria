import test from 'node:test';
import assert from 'node:assert/strict';
import { worldCameraBounds, worldCameraZoom } from '../../src/game/rendering/world-camera.ts';

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

test('camera edges reserve consistent CSS space for the HUD and touch controls at every zoom', () => {
  const map = { width: 1024, height: 640 };
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    for (const zoom of [1, 1.25, 2]) {
      const bounds = worldCameraBounds(viewport, map, zoom);
      assert.equal(bounds.width, map.width);
      assert.equal(-bounds.y * zoom, viewport.height > viewport.width ? 128 : 112);
      assert.ok(Math.abs((bounds.y + bounds.height - map.height) * zoom - 112) < .0001);
    }
  }
});
