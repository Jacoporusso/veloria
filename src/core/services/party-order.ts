import type { GameSave } from '../../persistence/save-types.ts';

export type PartyOrderResult =
  | { ok: true; save: GameSave }
  | { ok: false; reason: 'notFound' };

/** Moves a party creature to the lead slot without changing its saved state. */
export function moveCreatureToFirstSlot(save: GameSave, instanceId: string): PartyOrderResult {
  const index = save.party.findIndex(creature => creature.instanceId === instanceId);
  if (index < 0) return { ok: false, reason: 'notFound' };
  if (index === 0) return { ok: true, save };

  const creature = save.party[index]!;
  return {
    ok: true,
    save: {
      ...save,
      party: [creature, ...save.party.slice(0, index), ...save.party.slice(index + 1)],
    },
  };
}
