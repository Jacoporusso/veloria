/** Cover even a small room on any display, while keeping outdoor exploration readable. */
export function worldCameraZoom(viewport: { width: number; height: number }, map: { width: number; height: number }): number {
  return Math.max(1, Math.min(1.25, viewport.width / 800), viewport.width / Math.max(1, map.width), viewport.height / Math.max(1, map.height));
}
