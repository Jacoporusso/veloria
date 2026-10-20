import { migrateSave } from './save-migrations.ts';
import { assertCurrentSave, validateSave } from './save-validation.ts';
import type { GameSave } from './save-types.ts';
import { contentManifest } from '../core/content/index.ts';
import { checksumJson, verifyChecksum } from './save-integrity.ts';

export type { CreatureSave, GameSave, GameSaveV1, StoredCreatureSave } from './save-types.ts';

const DB_NAME = 'veloria-save';
const STORE_NAME = 'saves';
const SLOT = 'main';
const BACKUP_SLOT = 'backup-previous';
const checksumSlot = (slot: string) => `checksum:${slot}`;
const FALLBACK_KEY = 'veloria-save-v1';
const FALLBACK_BACKUP_KEY = 'veloria-save-v1-backup';

export function createUniqueId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof crypto.getRandomValues === 'function') crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

type SaveCandidate = { source: 'idbMain' | 'idbBackup' | 'localMain' | 'localBackup'; value: unknown; normalized: NormalizedStoredSave };

function newestCandidate(candidates: readonly SaveCandidate[]): SaveCandidate | undefined {
  const priority = { idbMain: 0, localMain: 1, idbBackup: 2, localBackup: 3 };
  return candidates.filter(candidate => candidate.normalized.save).sort((a, b) =>
    b.normalized.save!.saveRevision - a.normalized.save!.saveRevision || priority[a.source] - priority[b.source])[0];
}

/** Read each legacy slot independently: a malformed backup must not hide a valid main. */
function readFallbackCandidates(): { candidates: SaveCandidate[]; hasData: boolean } {
  const candidates: SaveCandidate[] = [];
  let hasData = false;
  for (const [key, source] of [[FALLBACK_KEY, 'localMain'], [FALLBACK_BACKUP_KEY, 'localBackup']] as const) {
    let raw: string | null;
    try { raw = localStorage.getItem(key); } catch { continue; }
    if (raw === null) continue;
    hasData = true;
    try {
      const value: unknown = JSON.parse(raw);
      candidates.push({ source, value, normalized: normalizeStoredSave(value) });
    } catch {
      candidates.push({ source, value: undefined, normalized: { error: 'The local save is unreadable.' } });
    }
  }
  return { candidates, hasData };
}

export async function loadSave(): Promise<GameSave | null> {
  const fallback = readFallbackCandidates();
  const candidates: SaveCandidate[] = [];
  let slots: Awaited<ReturnType<typeof readSlots>> | undefined;
  let db: IDBDatabase | undefined;
  try {
    db = await openDatabase();
    slots = await readSlots(db);
    candidates.push({ source: 'idbMain', value: slots.main, normalized: normalizeStoredSave(slots.main, slots.mainChecksum) });
  } catch { /* Readable local records remain authoritative when IndexedDB is unavailable. */ }
  finally { db?.close(); }
  // Stable ties prefer IndexedDB main, then local main, then previous backups.
  candidates.push(...fallback.candidates.filter(candidate => candidate.source === 'localMain'));
  if (slots) candidates.push({ source: 'idbBackup', value: slots.backup, normalized: normalizeStoredSave(slots.backup, slots.backupChecksum) });
  candidates.push(...fallback.candidates.filter(candidate => candidate.source === 'localBackup'));
  const selected = newestCandidate(candidates);
  if (selected) {
    const normalized = selected.normalized, save = normalized.save!;
    if (selected.source === 'idbMain' || selected.source === 'idbBackup') {
      let repair: IDBDatabase | undefined;
      try {
        if (selected.source === 'idbBackup') {
          repair = await openDatabase();
          await persistRecovery(repair, save, slots!.backup, slots!.backupChecksum);
        } else if (normalized.sourceVersion === 1) {
          repair = await openDatabase();
          await persistMigration(repair, selected.value, save);
        } else if (slots!.mainChecksum === undefined) {
          repair = await openDatabase();
          await persistChecksum(repair, SLOT, selected.value);
        }
      } catch { /* A validated selected record remains usable even when repair cannot be written. */ }
      finally { repair?.close(); }
    } else if (selected.source === 'localMain' && normalized.sourceVersion === 1) {
      try {
        localStorage.setItem(FALLBACK_BACKUP_KEY, JSON.stringify(selected.value));
        localStorage.setItem(FALLBACK_KEY, JSON.stringify(save));
      } catch { /* Migration is already valid in memory; preserve any readable original. */ }
    }
    return save;
  }
  if (fallback.hasData || slots && (slots.main !== undefined || slots.backup !== undefined)) {
    throw new Error(`No valid save found; stored records were left untouched. ${candidates.find(candidate => candidate.normalized.error)?.normalized.error ?? 'The stored records are invalid.'}`);
  }
  return null;
}

export async function saveGame(save: GameSave): Promise<void> {
  assertCurrentSave(save);
  const nextSave = structuredClone(save);
  nextSave.savedAt = new Date().toISOString();
  let fallback = readFallbackCandidates();
  let previousCandidate = newestCandidate(fallback.candidates);
  let observedRevision = Math.max(save.saveRevision, previousCandidate?.normalized.save?.saveRevision ?? 0);
  const stamp = () => {
    if (observedRevision >= Number.MAX_SAFE_INTEGER) throw new Error('Save revision exhausted.');
    nextSave.saveRevision = observedRevision + 1;
  };
  try {
    const db = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const values: Record<string, unknown> = {};
        let remaining = 4;
        const commit = () => {
          if (remaining !== 0) return;
          const stored = [
            { source: 'idbMain' as const, value: values[SLOT], normalized: normalizeStoredSave(values[SLOT], values[checksumSlot(SLOT)]) },
            { source: 'idbBackup' as const, value: values[BACKUP_SLOT], normalized: normalizeStoredSave(values[BACKUP_SLOT], values[checksumSlot(BACKUP_SLOT)]) },
          ];
          previousCandidate = newestCandidate([...stored, ...fallback.candidates]);
          observedRevision = Math.max(observedRevision, previousCandidate?.normalized.save?.saveRevision ?? 0);
          try {
            // Stamp BEFORE the first backup put: synchronous quota errors must
            // not lose the revision we just observed in the readable IDB main.
            stamp();
            if (previousCandidate) {
              store.put(previousCandidate.value, BACKUP_SLOT);
              store.put(checksumJson(previousCandidate.value), checksumSlot(BACKUP_SLOT));
            }
            store.put(nextSave, SLOT);
            store.put(checksumJson(nextSave), checksumSlot(SLOT));
          } catch (error) {
            try { transaction.abort(); } catch { /* Transaction may already be aborted. */ }
            reject(error);
          }
        };
        for (const key of [SLOT, checksumSlot(SLOT), BACKUP_SLOT, checksumSlot(BACKUP_SLOT)]) {
          const request = store.get(key);
          request.onsuccess = () => { values[key] = request.result; remaining--; commit(); };
          request.onerror = () => reject(request.error);
        }
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error);
        transaction.onerror = () => reject(transaction.error);
      });
    } finally { db.close(); }
  } catch {
    fallback = readFallbackCandidates();
    previousCandidate = newestCandidate([...(previousCandidate ? [previousCandidate] : []), ...fallback.candidates]);
    observedRevision = Math.max(observedRevision, previousCandidate?.normalized.save?.saveRevision ?? 0);
    stamp();
    if (previousCandidate) {
      try { localStorage.setItem(FALLBACK_BACKUP_KEY, JSON.stringify(previousCandidate.value)); }
      catch { /* A backup quota failure must not prevent a successful main write. */ }
    }
    // Failure here rejects saveGame: both stores failed, so callers must retry.
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(nextSave));
  }
}

type NormalizedStoredSave = { save?: GameSave; sourceVersion?: number; error?: string };

function normalizeStoredSave(value: unknown, expectedChecksum?: unknown): NormalizedStoredSave {
  if (value === undefined || value === null) return {};
  if (expectedChecksum !== undefined && !verifyChecksum(value, expectedChecksum)) {
    return { error: 'Stored save checksum does not match its contents.' };
  }
  const validation = validateSave(value);
  if (!validation.valid) return { error: validation.issues.join('; ') };
  try {
    return { save: migrateSave(value), sourceVersion: validation.version };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function readSlots(db: IDBDatabase): Promise<{ main: unknown; backup: unknown; mainChecksum: unknown; backupChecksum: unknown }> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const main = store.get(SLOT);
    const backup = store.get(BACKUP_SLOT);
    const mainChecksum = store.get(checksumSlot(SLOT));
    const backupChecksum = store.get(checksumSlot(BACKUP_SLOT));
    let mainValue: unknown;
    let backupValue: unknown;
    let mainChecksumValue: unknown;
    let backupChecksumValue: unknown;
    let mainDone = false;
    let backupDone = false;
    let mainChecksumDone = false;
    let backupChecksumDone = false;
    const completeIfReady = () => {
      if (mainDone && backupDone && mainChecksumDone && backupChecksumDone) resolve({ main: mainValue, backup: backupValue, mainChecksum: mainChecksumValue, backupChecksum: backupChecksumValue });
    };
    main.onsuccess = () => { mainValue = main.result; mainDone = true; completeIfReady(); };
    backup.onsuccess = () => { backupValue = backup.result; backupDone = true; completeIfReady(); };
    mainChecksum.onsuccess = () => { mainChecksumValue = mainChecksum.result; mainChecksumDone = true; completeIfReady(); };
    backupChecksum.onsuccess = () => { backupChecksumValue = backupChecksum.result; backupChecksumDone = true; completeIfReady(); };
    main.onerror = () => reject(main.error);
    backup.onerror = () => reject(backup.error);
    mainChecksum.onerror = () => reject(mainChecksum.error);
    backupChecksum.onerror = () => reject(backupChecksum.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function persistMigration(db: IDBDatabase, original: unknown, migrated: GameSave): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(original, BACKUP_SLOT);
    store.put(checksumJson(original), checksumSlot(BACKUP_SLOT));
    store.put(migrated, SLOT);
    store.put(checksumJson(migrated), checksumSlot(SLOT));
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

function persistChecksum(db: IDBDatabase, slot: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(checksumJson(value), checksumSlot(slot));
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

function persistRecovery(db: IDBDatabase, recovered: GameSave, backup: unknown, backupChecksum: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(recovered, SLOT);
    store.put(checksumJson(recovered), checksumSlot(SLOT));
    if (backup !== undefined && backupChecksum === undefined) store.put(checksumJson(backup), checksumSlot(BACKUP_SLOT));
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

export function newGameSave(): GameSave {
  return {
    schemaVersion: 2,
    saveRevision: 1,
    contentVersion: contentManifest.contentVersion,
    saveId: createUniqueId(),
    savedAt: new Date().toISOString(),
    player: { name: 'Allenatore', mapId: 'veloria/borgofonte', spawnPointId: 'start', money: 300, x: 20, y: 20 },
    party: [], storage: [], flags: ['q_prologue_started'], badges: [], inventory: { potion: 2, 'poke-ball': 5 }, rngState: 1234567,
  };
}
