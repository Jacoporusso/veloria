import { CURRENT_SAVE_SCHEMA_VERSION, type GameSave, type GameSaveV1 } from './save-types.ts';
import { assertCurrentSave, assertSaveV1, validateSave } from './save-validation.ts';

type SaveMigration = (save: GameSaveV1) => GameSave;

/** v1 -> v2 adds a monotonically increasing revision and makes optional v1 coordinates explicit. */
export const migrateV1ToV2: SaveMigration = (save) => ({
  ...structuredClone(save),
  schemaVersion: 2,
  saveRevision: 1,
  player: { ...save.player, x: save.player.x ?? 0, y: save.player.y ?? 0 },
});

const migrations: Record<number, SaveMigration> = {
  1: migrateV1ToV2,
};

/** Validates before migration and returns a detached current-schema save. */
export function migrateSave(value: unknown): GameSave {
  let current: unknown = structuredClone(value);
  const initial = validateSave(current);
  if (!initial.valid) throw new Error(`Invalid save: ${initial.issues.join('; ')}`);

  let version = initial.version;
  while (version < CURRENT_SAVE_SCHEMA_VERSION) {
    const migrate = migrations[version];
    if (!migrate) throw new Error(`No migration registered from save schema v${version}.`);
    if (version === 1) {
      assertSaveV1(current);
      current = migrate(current);
    } else {
      throw new Error(`Unsupported migration source schema v${version}.`);
    }
    version += 1;
  }

  assertCurrentSave(current);
  return current;
}
