export interface MapCollisionObject {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly properties?: unknown;
}

function gateFlag(object: MapCollisionObject): string | undefined {
  const properties = object.properties;
  const value = Array.isArray(properties)
    ? properties.find(property => property?.name === 'blocksUntilFlag')?.value
    : properties && typeof properties === 'object'
      ? (properties as Record<string, unknown>).blocksUntilFlag
      : undefined;
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim()) throw new Error('Collision blocksUntilFlag must be a non-empty flag.');
  return value;
}

/** Tiled owns geometry; a completed local gate removes only its own footprint. */
export function collectMapCollision(objects: readonly MapCollisionObject[], width: number, height: number, flags: readonly string[]): Set<string> {
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
    throw new Error('Collision map dimensions must be positive integers.');
  }
  const occupied = new Set<string>();
  const knownFlags = new Set(flags);
  for (const object of objects) {
    const unlockFlag = gateFlag(object);
    const x = object.x ?? 0, y = object.y ?? 0;
    const w = object.width ?? 32, h = object.height ?? 32;
    if (![x, y, w, h].every(Number.isFinite)) throw new Error('Collision rectangles must have finite bounds.');
    if (unlockFlag && knownFlags.has(unlockFlag)) continue;
    const left = Math.max(0, Math.floor(x / 32));
    const top = Math.max(0, Math.floor(y / 32));
    const right = Math.min(width, Math.ceil((x + Math.max(1, w)) / 32));
    const bottom = Math.min(height, Math.ceil((y + Math.max(1, h)) / 32));
    for (let row = top; row < bottom; row++) for (let column = left; column < right; column++) {
      occupied.add(`${column},${row}`);
    }
  }
  return occupied;
}
