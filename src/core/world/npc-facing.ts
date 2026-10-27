import type { CardinalDirection, GridPoint } from './grid-movement.ts';

/** Direction an NPC at `npc` should face to look toward `observer`. */
export function directionTowardObserver(npc: GridPoint, observer: GridPoint): CardinalDirection | undefined {
  if (![npc.x, npc.y, observer.x, observer.y].every(Number.isFinite)) {
    throw new Error('NPC facing coordinates must be finite.');
  }
  const dx = observer.x - npc.x;
  const dy = observer.y - npc.y;
  if (dx === 0 && dy === 0) return undefined;
  if (Math.abs(dy) >= Math.abs(dx)) return dy > 0 ? 'down' : 'up';
  return dx > 0 ? 'right' : 'left';
}
