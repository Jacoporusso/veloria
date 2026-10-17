import type { GameSave, GameSaveV1 } from './save-types.ts';

export type SaveValidationResult =
  | { valid: true; version: 1 | 2 }
  | { valid: false; issues: string[] };

const MAX_LEVEL = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isDateTime(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) &&
    Number.isFinite(Date.parse(value));
}

function checkKeys(value: Record<string, unknown>, allowed: string[], path: string, issues: string[]): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) issues.push(`${path}.${key}: unknown property`);
  }
}

function validateCreature(value: unknown, path: string, issues: string[], allowStatus: boolean): void {
  if (!isRecord(value)) { issues.push(`${path}: expected an object`); return; }
  const creatureKeys = ['instanceId', 'speciesId', 'level', 'experience', 'hp', 'maxHp', 'moves'];
  if (allowStatus) creatureKeys.push('status');
  checkKeys(value, creatureKeys, path, issues);
  if (!nonEmptyString(value.instanceId)) issues.push(`${path}.instanceId: expected a non-empty string`);
  if (!isIntegerInRange(value.speciesId, 1, Number.MAX_SAFE_INTEGER)) issues.push(`${path}.speciesId: expected a positive integer`);
  if (!isIntegerInRange(value.level, 1, MAX_LEVEL)) issues.push(`${path}.level: expected an integer from 1 to ${MAX_LEVEL}`);
  if (!isIntegerInRange(value.experience, 0, Number.MAX_SAFE_INTEGER)) issues.push(`${path}.experience: expected a non-negative integer`);
  if (!isIntegerInRange(value.maxHp, 1, Number.MAX_SAFE_INTEGER)) issues.push(`${path}.maxHp: expected a positive integer`);
  if (!isIntegerInRange(value.hp, 0, Number.MAX_SAFE_INTEGER) || (isIntegerInRange(value.hp, 0, Number.MAX_SAFE_INTEGER) && isIntegerInRange(value.maxHp, 1, Number.MAX_SAFE_INTEGER) && value.hp > value.maxHp)) {
    issues.push(`${path}.hp: expected an integer from 0 to maxHp`);
  }
  if (!Array.isArray(value.moves)) { issues.push(`${path}.moves: expected an array`); return; }
  if (value.moves.length > 4) issues.push(`${path}.moves: at most 4 moves are allowed`);
  value.moves.forEach((move, index) => {
    const movePath = `${path}.moves[${index}]`;
    if (!isRecord(move)) { issues.push(`${movePath}: expected an object`); return; }
    checkKeys(move, ['id', 'pp'], movePath, issues);
    if (!nonEmptyString(move.id)) issues.push(`${movePath}.id: expected a non-empty string`);
    if (!isIntegerInRange(move.pp, 0, Number.MAX_SAFE_INTEGER)) issues.push(`${movePath}.pp: expected a non-negative integer`);
  });
  if (allowStatus && value.status !== undefined) validateStatus(value.status, `${path}.status`, issues);
}

function validateStatus(value: unknown, path: string, issues: string[]): void {
  if (!isRecord(value)) { issues.push(`${path}: expected an object`); return; }
  checkKeys(value, ['status', 'turnsRemaining'], path, issues);
  const allowed = ['burn', 'poison', 'paralysis', 'sleep', 'freeze'];
  if (typeof value.status !== 'string' || !allowed.includes(value.status)) {
    issues.push(`${path}.status: expected one of ${allowed.join(', ')}`);
    return;
  }
  const timed = value.status === 'sleep' || value.status === 'freeze';
  if (value.turnsRemaining !== undefined && !isIntegerInRange(value.turnsRemaining, 1, Number.MAX_SAFE_INTEGER)) {
    issues.push(`${path}.turnsRemaining: expected a positive integer`);
  }
  if (value.status === 'sleep' && value.turnsRemaining === undefined) {
    issues.push(`${path}.turnsRemaining: required while asleep`);
  }
  if (!timed && value.turnsRemaining !== undefined) {
    issues.push(`${path}.turnsRemaining: only sleep and freeze may have a duration`);
  }
}

function validate(value: unknown): SaveValidationResult {
  const issues: string[] = [];
  if (!isRecord(value)) return { valid: false, issues: ['$: expected an object'] };
  const version = value.schemaVersion;
  if (version !== 1 && version !== 2) {
    return { valid: false, issues: ['$.schemaVersion: supported versions are 1 and 2'] };
  }

  const baseKeys = ['schemaVersion', 'contentVersion', 'saveId', 'savedAt', 'player', 'party', 'storage', 'flags', 'badges', 'inventory', 'rngState'];
  checkKeys(value, version === 1 ? baseKeys : [...baseKeys, 'saveRevision'], '$', issues);
  if (!nonEmptyString(value.contentVersion)) issues.push('$.contentVersion: expected a non-empty string');
  if (!nonEmptyString(value.saveId)) issues.push('$.saveId: expected a non-empty string');
  if (!isDateTime(value.savedAt)) issues.push('$.savedAt: expected an ISO 8601 date-time');
  if (version === 2 && !isIntegerInRange(value.saveRevision, 1, Number.MAX_SAFE_INTEGER)) issues.push('$.saveRevision: expected a positive integer');
  if (!isIntegerInRange(value.rngState, 0, Number.MAX_SAFE_INTEGER)) issues.push('$.rngState: expected a non-negative integer');

  if (!isRecord(value.player)) {
    issues.push('$.player: expected an object');
  } else {
    checkKeys(value.player, ['name', 'mapId', 'spawnPointId', 'money', 'x', 'y'], '$.player', issues);
    for (const key of ['name', 'mapId', 'spawnPointId']) {
      if (!nonEmptyString(value.player[key])) issues.push(`$.player.${key}: expected a non-empty string`);
    }
    if (!isIntegerInRange(value.player.money, 0, Number.MAX_SAFE_INTEGER)) issues.push('$.player.money: expected a non-negative integer');
    for (const key of ['x', 'y']) {
      const coordinate = value.player[key];
      if (coordinate !== undefined && !isIntegerInRange(coordinate, 0, Number.MAX_SAFE_INTEGER)) issues.push(`$.player.${key}: expected a non-negative integer`);
      if (version === 2 && coordinate === undefined) issues.push(`$.player.${key}: required by schema version 2`);
    }
  }

  if (!Array.isArray(value.party)) {
    issues.push('$.party: expected an array');
  } else {
    if (value.party.length > 6) issues.push('$.party: at most 6 creatures are allowed');
    value.party.forEach((creature, index) => validateCreature(creature, `$.party[${index}]`, issues, version === 2));
  }

  if (!Array.isArray(value.storage)) {
    issues.push('$.storage: expected an array');
  } else {
    value.storage.forEach((creature, index) => {
      const path = `$.storage[${index}]`;
      if (!isRecord(creature)) { issues.push(`${path}: expected an object`); return; }
      if (!nonEmptyString(creature.instanceId)) issues.push(`${path}.instanceId: expected a non-empty string`);
      // The v1 schema explicitly allowed zero in storage. Preserve such legacy records during migration.
      if (!isIntegerInRange(creature.speciesId, 0, Number.MAX_SAFE_INTEGER)) issues.push(`${path}.speciesId: expected a non-negative integer`);
    });
  }

  for (const key of ['flags', 'badges'] as const) {
    const list = value[key];
    if (!Array.isArray(list)) { issues.push(`$.${key}: expected an array`); continue; }
    const seen = new Set<string>();
    list.forEach((item, index) => {
      if (!nonEmptyString(item)) issues.push(`$.${key}[${index}]: expected a non-empty string`);
      else if (seen.has(item)) issues.push(`$.${key}[${index}]: duplicate value ${item}`);
      else seen.add(item);
    });
  }

  if (!isRecord(value.inventory)) {
    issues.push('$.inventory: expected an object');
  } else {
    for (const [itemId, quantity] of Object.entries(value.inventory)) {
      if (!nonEmptyString(itemId)) issues.push('$.inventory: item IDs must be non-empty strings');
      if (!isIntegerInRange(quantity, 0, Number.MAX_SAFE_INTEGER)) issues.push(`$.inventory.${itemId}: expected a non-negative integer`);
    }
  }

  const instanceIds = new Set<string>();
  for (const [kind, list] of [['party', value.party], ['storage', value.storage]] as const) {
    if (!Array.isArray(list)) continue;
    list.forEach((creature, index) => {
      if (!isRecord(creature) || !nonEmptyString(creature.instanceId)) return;
      if (instanceIds.has(creature.instanceId)) issues.push(`$.${kind}[${index}].instanceId: duplicate creature instance ID`);
      instanceIds.add(creature.instanceId);
    });
  }

  return issues.length ? { valid: false, issues } : { valid: true, version };
}

export function validateSave(value: unknown): SaveValidationResult {
  return validate(value);
}

export function assertSaveV1(value: unknown): asserts value is GameSaveV1 {
  const result = validate(value);
  if (!result.valid || result.version !== 1) {
    throw new Error(`Invalid schema v1 save: ${result.valid ? 'expected schemaVersion 1' : result.issues.join('; ')}`);
  }
}

export function assertCurrentSave(value: unknown): asserts value is GameSave {
  const result = validate(value);
  if (!result.valid || result.version !== 2) {
    throw new Error(`Invalid current save: ${result.valid ? 'expected schemaVersion 2' : result.issues.join('; ')}`);
  }
}
