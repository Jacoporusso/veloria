import { migrateSave } from './save-migrations.ts';
import type { GameSave } from './save-types.ts';
import { checksumJson } from './save-integrity.ts';

const BACKUP_FORMAT = 'veloria-save-backup';
const BACKUP_FORMAT_VERSION = 1;

type BackupPayload = {
  format: typeof BACKUP_FORMAT;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  exportedAt: string;
  save: GameSave;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Produces a portable JSON document. Passing exportedAt explicitly keeps the function deterministic. */
export function exportSave(save: unknown, exportedAt: string): string {
  if (!Number.isFinite(Date.parse(exportedAt))) throw new Error('exportedAt must be a valid date-time.');
  const payload: BackupPayload = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt,
    save: migrateSave(save),
  };
  return JSON.stringify({ ...payload, checksum: checksumJson(payload) }, null, 2);
}

/** Accepts a versioned backup envelope or a legacy raw v1/v2 save document. */
export function importSave(json: string): GameSave {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Backup is not valid JSON.');
  }
  if (!isRecord(parsed)) throw new Error('Backup must contain a JSON object.');

  if (parsed.format !== BACKUP_FORMAT) return migrateSave(parsed);
  if (parsed.formatVersion !== BACKUP_FORMAT_VERSION) throw new Error(`Unsupported backup format version: ${String(parsed.formatVersion)}.`);
  if (typeof parsed.exportedAt !== 'string' || !Number.isFinite(Date.parse(parsed.exportedAt))) throw new Error('Backup exportedAt is invalid.');
  if (typeof parsed.checksum !== 'string') throw new Error('Backup checksum is missing.');

  const payload: BackupPayload = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: parsed.exportedAt,
    save: parsed.save as GameSave,
  };
  if (checksumJson(payload) !== parsed.checksum) throw new Error('Backup checksum does not match its contents.');
  return migrateSave(parsed.save);
}
