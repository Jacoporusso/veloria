import type { GameSave } from '../../persistence/save-types.ts';

export type PartyOrderResult =
  | { ok: true; save: GameSave }
  | { ok: false; reason: 'notFound' };

/** Moves a party creature to the lead slot without changing its saved state. */
export function moveCreatureToFirstSlot(save: GameSave, instanceId: string): PartyOrderResult {
  return moveCreatureToSlot(save, instanceId, 0);
}

/** Insert a member at the requested slot, retaining the relative order of the others. */
export function moveCreatureToSlot(save: GameSave, instanceId: string, targetIndex: number): PartyOrderResult {
  const index = save.party.findIndex(creature => creature.instanceId === instanceId);
  if (index < 0 || !Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= save.party.length) return { ok: false, reason: 'notFound' };
  if (index === targetIndex) return { ok: true, save };

  const creature = save.party[index]!;
  const party = save.party.filter((_, slot) => slot !== index);
  party.splice(targetIndex, 0, creature);
  return {
    ok: true,
    save: {
      ...save,
      party,
    },
  };
}
