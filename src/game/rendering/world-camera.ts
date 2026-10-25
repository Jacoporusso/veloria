/** Cover even a small room on any display, while keeping outdoor exploration readable. */
export function worldCameraZoom(viewport: { width: number; height: number }, map: { width: number; height: number }): number {
  return Math.max(1, Math.min(1.25, viewport.width / 800), viewport.width / Math.max(1, map.width), viewport.height / Math.max(1, map.height));
}

/** Let edge actors move below the HUD and above touch controls when followed. */
export function worldCameraBounds(viewport: { width: number; height: number }, map: { width: number; height: number }, logicalZoom: number) {
  const top = (viewport.height > viewport.width ? 128 : 112) / logicalZoom;
  const bottom = 112 / logicalZoom;
  return { x: 0, y: -top, width: map.width, height: map.height + top + bottom };
}
