export type CardinalDirection = 'up' | 'down' | 'left' | 'right';

export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

export type GridMoveResult =
  | { readonly moved: true; readonly position: GridPoint }
  | { readonly moved: false; readonly reason: 'outside-map' | 'blocked'; readonly position: GridPoint };

const DELTAS: Readonly<Record<CardinalDirection, GridPoint>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function adjacentGridPoint(position: GridPoint, direction: CardinalDirection): GridPoint {
  const delta = DELTAS[direction];
  return { x: position.x + delta.x, y: position.y + delta.y };
}

export function isInsideGrid(position: GridPoint, width: number, height: number): boolean {
  return Number.isInteger(position.x) && Number.isInteger(position.y) &&
    Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 &&
    position.x >= 0 && position.y >= 0 && position.x < width && position.y < height;
}

export function isGridTileOpen(position: GridPoint, width: number, height: number, blockedTiles: ReadonlySet<string>): boolean {
  return isInsideGrid(position, width, height) && !blockedTiles.has(`${position.x},${position.y}`);
}

/** Pure tile movement rule shared by every Tiled map; collision keys use `x,y`. */
export function tryGridMove(
  position: GridPoint,
  direction: CardinalDirection,
  width: number,
  height: number,
  blockedTiles: ReadonlySet<string>,
): GridMoveResult {
  const destination = adjacentGridPoint(position, direction);
  if (!isInsideGrid(destination, width, height)) return { moved: false, reason: 'outside-map', position };
  if (!isGridTileOpen(destination, width, height, blockedTiles)) return { moved: false, reason: 'blocked', position };
  return { moved: true, position: destination };
}
