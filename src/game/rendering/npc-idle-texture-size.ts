export const NPC_IDLE_TEXTURE_MAX_SIDE = 512;

/** Keep the source ratio and never enlarge or round a dimension independently. */
export function npcIdleTextureSize(width: number, height: number, maxSide = NPC_IDLE_TEXTURE_MAX_SIDE): { width: number; height: number } {
  if (![width, height, maxSide].every(value => Number.isSafeInteger(value) && value > 0)) {
    throw new Error('NPC texture dimensions and limit must be positive safe integers.');
  }
  if (Math.max(width, height) <= maxSide) return { width, height };
  let a = width, b = height;
  while (b) [a, b] = [b, a % b];
  const unitWidth = width / a, unitHeight = height / a;
  const multiple = Math.floor(maxSide / Math.max(unitWidth, unitHeight));
  if (multiple) return { width: unitWidth * multiple, height: unitHeight * multiple };
  // Phaser frames and drawImage accept fractional dimensions. Keep an unusual
  // ratio inside the budget instead of retaining a full-resolution texture;
  // only the backing canvas is rounded up, never the authored image frame.
  return width >= height
    ? { width: maxSide, height: height / width * maxSide }
    : { width: width / height * maxSide, height: maxSide };
}
