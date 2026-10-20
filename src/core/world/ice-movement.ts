import { isInsideGrid, tryGridMove, type CardinalDirection, type GridPoint } from './grid-movement.ts';

export interface MovementSurfaceObject {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly properties?: unknown;
  readonly rotation?: number;
  readonly ellipse?: unknown;
  readonly polygon?: unknown;
  readonly polyline?: unknown;
  readonly point?: unknown;
}

/** Optional Tiled movement_surfaces layer, in world pixels on the 32px grid. */
export function collectIceTiles(objects: readonly MovementSurfaceObject[], width: number, height: number): Set<string> {
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
    throw new Error('Movement surface map dimensions must be positive integers.');
  }
  const tiles = new Set<string>();
  for (const object of objects) {
    if ((object.rotation ?? 0) !== 0 || ['ellipse','polygon','polyline','point'].some(shape=>shape in object)) {
      throw new Error('Movement surfaces must be unrotated rectangles.');
    }
    const properties = Array.isArray(object.properties)
      ? Object.fromEntries(object.properties.map(property => [property.name, property.value]))
      : object.properties as Record<string, unknown> | undefined;
    if (properties?.surface !== 'ice') throw new Error('Movement surfaces must declare surface=ice.');
    const x = object.x ?? NaN, y = object.y ?? NaN, w = object.width ?? NaN, h = object.height ?? NaN;
    if (![x, y, w, h].every(value => Number.isInteger(value / 32)) ||
        w <= 0 || h <= 0 || !isInsideGrid({ x: x / 32, y: y / 32 }, width, height) ||
        x + w > width * 32 || y + h > height * 32) {
      throw new Error('Movement surfaces must be positive, grid-aligned rectangles inside the map.');
    }
    for (let row = y / 32; row < (y + h) / 32; row++) {
      for (let column = x / 32; column < (x + w) / 32; column++) tiles.add(`${column},${row}`);
    }
  }
  return tiles;
}

/** Continue straight on ice, including the step onto dry ground; walls stop momentum. */
export function iceSlideContinues(position: GridPoint, direction: CardinalDirection, width: number, height: number,
  blocked: ReadonlySet<string>, ice: ReadonlySet<string>): boolean {
  return ice.has(`${position.x},${position.y}`) && tryGridMove(position, direction, width, height, blocked).moved;
}
