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

test('camera padding stays inside the decorative edge backdrop and keeps HUD clearance', () => {
  for (const map of [{ width: 1024, height: 640 }, { width: 1280, height: 960 }, { width: 768, height: 512 }]) {
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1920, height: 1080 }]) {
      const zoom = worldCameraZoom(viewport, map);
      const bounds = worldCameraBounds(viewport, map, zoom);
      assert.equal(bounds.x, 0);
      assert.equal(bounds.width, map.width);
      assert.equal(-bounds.y * zoom, viewport.height > viewport.width ? 128 : 112);
      assert.ok(bounds.y >= -map.height, 'reflected top scenery covers the complete camera padding');
      assert.ok(bounds.y + bounds.height <= map.height * 2, 'reflected bottom scenery covers the complete camera padding');
      assert.ok(viewport.width / zoom <= bounds.width + 0.0001);
      assert.ok(viewport.height / zoom <= bounds.height + 0.0001);
    }
  }
});
