import test from 'node:test';
import assert from 'node:assert/strict';
import { worldFollowDeadzone } from '../../src/game/rendering/camera-follow.ts';
import { worldCameraZoom } from '../../src/game/rendering/world-camera.ts';
import { renderDensity } from '../../src/game/rendering/display-density.ts';

test('follow dead zone stays inside the visible world at native density and room-cover zoom', () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 320, height: 568 }, { width: 3840, height: 2160 }]) {
    for (const map of [{ width: 384, height: 320 }, { width: 960, height: 960 }, { width: 4096, height: 4096 }]) {
      const logicalZoom = worldCameraZoom(viewport, map);
      const zone = worldFollowDeadzone(viewport, logicalZoom);
      for (const dpr of [1, 2, 3, 4]) {
        const density = renderDensity(dpr, viewport.width, viewport.height);
        const cameraZoom = logicalZoom * density;
        const visibleWorld = { width: viewport.width * density / cameraZoom, height: viewport.height * density / cameraZoom };
        assert.ok(zone.width <= visibleWorld.width * .24 + 1e-8);
        assert.ok(zone.height <= visibleWorld.height * .18 + 1e-8);
        assert.ok(zone.width * cameraZoom / density <= 96 + 1e-8);
      }
    }
  }
});
