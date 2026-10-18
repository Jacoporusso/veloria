import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDensity } from '../../src/game/rendering/display-density.ts';

test('phone portrait and landscape preserve native 3x definition', () => {
  assert.equal(renderDensity(3, 390, 844), 3);
  assert.equal(renderDensity(3, 844, 390), 3);
  assert.equal(renderDensity(2, 390, 844), 2);
  assert.equal(renderDensity(Number.NaN), 1);
});

test('large displays keep the framebuffer within the 4K pixel budget', () => {
  for (const [width, height] of [[1920, 1080], [2560, 1440], [3840, 2160]]) {
    const density = renderDensity(3, width, height);
    assert.ok(width * height * density ** 2 <= 3840 * 2160 + 1);
    assert.ok(density >= 1);
  }
});
