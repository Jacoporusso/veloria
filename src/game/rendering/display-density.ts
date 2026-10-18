/** Native phone density, bounded to a 4K framebuffer on larger displays. */
export function renderDensity(devicePixelRatio: number, width = 0, height = 0): number {
  const requested = Number.isFinite(devicePixelRatio) ? Math.min(3, Math.max(1, devicePixelRatio)) : 1;
  const area = width * height;
  const budget = Number.isFinite(area) && area > 0 ? Math.sqrt(3840 * 2160 / area) : 3;
  return Math.max(1, Math.min(requested, budget));
}
