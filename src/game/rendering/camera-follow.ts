/** Phaser compares a following target and its dead zone in world units, not backing pixels. */
export function worldFollowDeadzone(viewport: { width: number; height: number }, logicalZoom: number): { width: number; height: number } {
  const zoom = Number.isFinite(logicalZoom) && logicalZoom > 0 ? logicalZoom : 1;
  return {
    width: Math.min(96, viewport.width * .24) / zoom,
    height: Math.min(56, viewport.height * .18) / zoom,
  };
}
