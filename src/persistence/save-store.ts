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

export async function loadSave(): Promise<GameSave | null> {
  let db: IDBDatabase | null = null;
  try {
    db = await openDatabase();
  } catch {
    // If IndexedDB is unavailable, use the legacy local storage fallback below.
  }
  if (db) {
    let slots: { main: unknown; backup: unknown; mainChecksum: unknown; backupChecksum: unknown };
    try {
      slots = await readSlots(db);
    } finally {
      db.close();
    }
    const mainResult = normalizeStoredSave(slots.main, slots.mainChecksum);
    if (mainResult.save) {
      if (mainResult.sourceVersion === 1) {
        try {
          const upgraded = await openDatabase();
          try { await persistMigration(upgraded, slots.main, mainResult.save); }
          finally { upgraded.close(); }
        } catch {
          // The validated migrated value remains usable; the original v1 is still safely stored.
        }
      }
      if (mainResult.sourceVersion !== 1 && slots.mainChecksum === undefined && slots.main !== undefined) {
        try {
          const upgraded = await openDatabase();
          try { await persistChecksum(upgraded, SLOT, slots.main); }
          finally { upgraded.close(); }
        } catch { /* A valid legacy record remains usable if storage cannot be upgraded. */ }
      }
      return mainResult.save;
    }
    const backupResult = normalizeStoredSave(slots.backup, slots.backupChecksum);
    if (backupResult.save) {
      try {
        const recoveryDb = await openDatabase();
        try { await persistRecovery(recoveryDb, backupResult.save, slots.backup, slots.backupChecksum); }
        finally { recoveryDb.close(); }
      } catch { /* The verified backup remains usable in memory if the repair write fails. */ }
      return backupResult.save;
    }
    if (slots.main !== undefined || slots.backup !== undefined) {
      throw new Error(`No valid save found. ${mainResult.error ?? backupResult.error ?? 'The stored records are invalid.'}`);
    }
  }
  let raw: string | null;
  let backup: string | null;
  try {
    raw = localStorage.getItem(FALLBACK_KEY);
    backup = localStorage.getItem(FALLBACK_BACKUP_KEY);
  } catch {
    // Storage can be disabled in private browsing; there is no readable record to preserve.
    return null;
  }
  let mainValue: unknown;
  let backupValue: unknown;
  try {
    mainValue = raw === null ? undefined : JSON.parse(raw);
    backupValue = backup === null ? undefined : JSON.parse(backup);
  } catch {
    throw new Error('The stored save is unreadable or incompatible; it was left untouched. Export a backup or restore the previous save before starting a new game.');
  }
  const mainResult = normalizeStoredSave(mainValue);
  if (mainResult.save) {
    if (mainResult.sourceVersion === 1) {
      localStorage.setItem(FALLBACK_BACKUP_KEY, raw!);
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(mainResult.save));
    }
    return mainResult.save;
  }
  const backupResult = normalizeStoredSave(backupValue);
  if (backupResult.save) return backupResult.save;
  if (raw !== null || backup !== null) {
    throw new Error(`The stored save is invalid and was left untouched. ${mainResult.error ?? backupResult.error ?? 'Export a backup or restore the previous save before starting a new game.'}`);
  }
  return null;
}

export async function saveGame(save: GameSave): Promise<void> {
  assertCurrentSave(save);
  const nextSave = structuredClone(save);
  nextSave.savedAt = new Date().toISOString();
  try {
    const db = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const previous = store.get(SLOT);
        const previousChecksum = store.get(checksumSlot(SLOT));
        let previousRead = false;
        let checksumRead = false;
        let previousValue: unknown;
        let previousChecksumValue: unknown;
        const commit = () => {
          if (!previousRead || !checksumRead) return;
          const previousSave = normalizeStoredSave(previousValue, previousChecksumValue).save;
          if (previousSave && previousValue !== undefined) {
            store.put(previousValue, BACKUP_SLOT);
            store.put(checksumJson(previousValue), checksumSlot(BACKUP_SLOT));
          }
          nextSave.saveRevision = Math.max(nextSave.saveRevision, previousSave?.saveRevision ?? 0) + 1;
          store.put(nextSave, SLOT);
          store.put(checksumJson(nextSave), checksumSlot(SLOT));
        };
        previous.onsuccess = () => { previousValue = previous.result; previousRead = true; commit(); };
        previousChecksum.onsuccess = () => { previousChecksumValue = previousChecksum.result; checksumRead = true; commit(); };
        previous.onerror = () => reject(previous.error);
        previousChecksum.onerror = () => reject(previousChecksum.error);
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error);
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  } catch {
    const previous = localStorage.getItem(FALLBACK_KEY);
    if (previous !== null) localStorage.setItem(FALLBACK_BACKUP_KEY, previous);
    if (previous !== null) {
      try {
        const previousSave = normalizeStoredSave(JSON.parse(previous)).save;
        nextSave.saveRevision = Math.max(nextSave.saveRevision, previousSave?.saveRevision ?? 0) + 1;
      } catch {
        nextSave.saveRevision += 1;
      }
    }
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
