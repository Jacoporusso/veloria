import type { CreatureSave, GameSave, StoredCreatureSave } from '../../persistence/save-types.ts';

export type PartyStorageResult =
  | { ok: true; save: GameSave }
  | { ok: false; reason: 'notFound' | 'lastPartyMember' | 'partyFull' | 'invalidStoredCreature' };

/** Moves complete creature records between party and box without recalculating stats or PP. */
export function moveCreatureToStorage(save: GameSave, instanceId: string): PartyStorageResult {
  const creature = save.party.find(item => item.instanceId === instanceId);
  if (!creature) return { ok: false, reason: 'notFound' };
  if (save.party.length <= 1) return { ok: false, reason: 'lastPartyMember' };
  return {
    ok: true,
    save: {
      ...save,
      party: save.party.filter(item => item.instanceId !== instanceId),
      storage: [...save.storage, toStoredCreature(creature)],
    },
  };
}

export function withdrawCreatureFromStorage(save: GameSave, instanceId: string): PartyStorageResult {
  if (save.party.length >= 6) return { ok: false, reason: 'partyFull' };
  const stored = save.storage.find(item => item.instanceId === instanceId);
  if (!stored) return { ok: false, reason: 'notFound' };
  const creature = toPartyCreature(stored);
  if (!creature) return { ok: false, reason: 'invalidStoredCreature' };
  return {
    ok: true,
    save: {
      ...save,
      party: [...save.party, creature],
      storage: save.storage.filter(item => item.instanceId !== instanceId),
    },
  };
}

function toStoredCreature(creature: CreatureSave): StoredCreatureSave {
  return { ...creature };
}

/** Validate the whole selection before committing a simultaneous box/party exchange. */
export function transferSelectedCreatures(save: GameSave, depositIds: readonly string[], withdrawIds: readonly string[]): PartyStorageResult {
  const deposits = new Set(depositIds), withdrawals = new Set(withdrawIds);
  if (deposits.size !== depositIds.length || withdrawals.size !== withdrawIds.length ||
      [...deposits].some(id => !save.party.some(creature => creature.instanceId === id)) ||
      [...withdrawals].some(id => !save.storage.some(creature => creature.instanceId === id))) return { ok: false, reason: 'notFound' };
  const finalCount = save.party.length - deposits.size + withdrawals.size;
  if (finalCount < 1) return { ok: false, reason: 'lastPartyMember' };
  if (finalCount > 6) return { ok: false, reason: 'partyFull' };
  const incoming = save.storage.filter(creature => withdrawals.has(creature.instanceId)).map(toPartyCreature);
  if (incoming.some(creature => !creature)) return { ok: false, reason: 'invalidStoredCreature' };
  if (!deposits.size && !withdrawals.size) return { ok: true, save };
  return { ok: true, save: { ...save,
    party: [...save.party.filter(creature => !deposits.has(creature.instanceId)), ...incoming as CreatureSave[]],
    storage: [...save.storage.filter(creature => !withdrawals.has(creature.instanceId)),
      ...save.party.filter(creature => deposits.has(creature.instanceId)).map(toStoredCreature)],
  } };
}

function toPartyCreature(stored: StoredCreatureSave): CreatureSave | undefined {
  if (!Number.isInteger(stored.speciesId) || stored.speciesId < 1 ||
      !Number.isInteger(stored.level) || (stored.level as number) < 1 ||
      !Number.isInteger(stored.experience) || (stored.experience as number) < 0 ||
      !Number.isInteger(stored.hp) || (stored.hp as number) < 0 ||
      !Number.isInteger(stored.maxHp) || (stored.maxHp as number) < 1 ||
      (stored.hp as number) > (stored.maxHp as number) || !Array.isArray(stored.moves)) return undefined;
  const moves = stored.moves.flatMap(move => {
    if (!move || typeof move !== 'object') return [];
    const value = move as Record<string, unknown>;
    return typeof value.id === 'string' && Number.isInteger(value.pp) && (value.pp as number) >= 0
      ? [{ id: value.id, pp: value.pp as number }]
      : [];
  });
  if (moves.length !== stored.moves.length || moves.length > 4) return undefined;
  const creature: CreatureSave = {
    instanceId: stored.instanceId,
    speciesId: stored.speciesId,
    level: stored.level as number,
    experience: stored.experience as number,
    hp: stored.hp as number,
    maxHp: stored.maxHp as number,
    moves,
  };
  const status = stored.status;
  if (status && typeof status === 'object') {
    const value = status as Record<string, unknown>;
    if (['burn', 'poison', 'paralysis', 'sleep', 'freeze'].includes(String(value.status)) &&
        (value.turnsRemaining === undefined || (Number.isInteger(value.turnsRemaining) && (value.turnsRemaining as number) > 0))) {
      creature.status = value.turnsRemaining === undefined
        ? { status: value.status as NonNullable<CreatureSave['status']>['status'] }
        : { status: value.status as NonNullable<CreatureSave['status']>['status'], turnsRemaining: value.turnsRemaining as number };
    }
  }
  return creature;
}
