export const NPC_IDLE_TEXTURE_MAX_SIDE = 512;

/** Keep the exact source ratio and never enlarge or round a dimension independently. */
export function npcIdleTextureSize(width: number, height: number, maxSide = NPC_IDLE_TEXTURE_MAX_SIDE): { width: number; height: number } {
  if (![width, height, maxSide].every(value => Number.isSafeInteger(value) && value > 0)) {
    throw new Error('NPC texture dimensions and limit must be positive safe integers.');
  }
  if (Math.max(width, height) <= maxSide) return { width, height };
  let a = width, b = height;
  while (b) [a, b] = [b, a % b];
  const unitWidth = width / a, unitHeight = height / a;
  const multiple = Math.floor(maxSide / Math.max(unitWidth, unitHeight));
  // An unusual coprime image may not fit an exact integer ratio under the cap.
  // Preserve it rather than distorting the artwork.
  return multiple ? { width: unitWidth * multiple, height: unitHeight * multiple } : { width, height };
}
