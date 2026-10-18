import type { BattleState, MoveDefinition } from './types.ts';

export type MoveCatalog = Readonly<Record<string, MoveDefinition>>;

/** Replace one known move after a level-up without consuming a battle turn. */
export function replaceLearnedMove(
  state: BattleState,
  creatureId: string,
  moveId: string,
  slotIndex: number,
  maxMoves: number,
  catalog: MoveCatalog,
): BattleState {
  if (!Number.isInteger(maxMoves) || maxMoves < 1) throw new Error('Move limit must be a positive integer.');
  const creatureIndex = state.player.creatures.findIndex(creature => creature.instanceId === creatureId);
  if (creatureIndex < 0) throw new Error(`Unknown player creature: ${creatureId}.`);

  const creature = state.player.creatures[creatureIndex];
  if (creature.moves.length !== maxMoves) throw new Error(`${creature.name} does not have a full moveset.`);
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= creature.moves.length) {
    throw new Error(`Invalid move slot: ${slotIndex}.`);
  }
  if (creature.moves.some(slot => slot.moveId === moveId)) throw new Error(`${creature.name} already knows ${moveId}.`);

  const learnedMove = catalog[moveId];
  if (!learnedMove || learnedMove.id !== moveId || !Number.isInteger(learnedMove.maxPp) || learnedMove.maxPp < 1) {
    throw new Error(`Unknown or invalid learned move: ${moveId}.`);
  }

  const creatures = [...state.player.creatures];
  const moveSlots = [...creature.moves];
  moveSlots[slotIndex] = { moveId, pp: learnedMove.maxPp };
  creatures[creatureIndex] = { ...creature, moves: moveSlots };
  return { ...state, player: { ...state.player, creatures } };
}
