import type { BattleCreature } from './types.ts';
import type { MoveCatalog } from './engine.ts';

export const EMERGENCY_MOVE_ID = 'struggle';
export const EMERGENCY_MOVE_NAME = 'Scontro d’emergenza';
export function hasUsableBattleMove(creature: BattleCreature, catalog: MoveCatalog): boolean {
  return creature.moves.some(slot => slot.pp > 0 && Boolean(catalog[slot.moveId]));
}
