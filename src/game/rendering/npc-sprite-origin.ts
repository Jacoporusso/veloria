/** Authored foot anchors keep differently posed illustrations on the same tile.
 * They affect presentation only; collision and interaction stay owned by Tiled.
 */
export function npcSpriteOrigin(properties: Readonly<Record<string, unknown>>): { x: number; y: number } {
  const x = properties.spriteOriginX, y = properties.spriteOriginY;
  if (x === undefined && y === undefined) return { x: .5, y: 1 };
  if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
    throw new Error('NPC sprite origins must be an explicit pair between 0 and 1.');
  }
  return { x, y };
}
