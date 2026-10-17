import type { GameSave } from '../../persistence/save-types.ts';
import type { BattleMoveRegistry } from '../battle/create-creature.ts';

/** Healing service for Centers and rest points; returns JSON-safe creatures without major status. */
export function healParty(save: GameSave, moves: BattleMoveRegistry): GameSave {
  return {
    ...save,
    party: save.party.map(creature => {
      const healed = {
        ...creature,
        hp: creature.maxHp,
        moves: creature.moves.map(move => ({ id: move.id, pp: moves[move.id]?.maxPp ?? move.pp })),
      };
      delete healed.status;
      return healed;
    }),
  };
}
