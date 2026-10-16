export type CreatureSave = {
  instanceId: string;
  speciesId: number;
  level: number;
  experience: number;
  hp: number;
  maxHp: number;
  moves: { id: string; pp: number }[];
};

export type GameSave = {
  schemaVersion: 1;
  contentVersion: string;
  saveId: string;
  savedAt: string;
  player: { name: string; mapId: string; spawnPointId: string; money: number; x: number; y: number };
  party: CreatureSave[];
  storage: { instanceId: string; speciesId: number }[];
  flags: string[];
  badges: string[];
  inventory: Record<string, number>;
  rngState: number;
};

const DB_NAME = 'veloria-save';
const STORE_NAME = 'saves';
const SLOT = 'main';
const FALLBACK_KEY = 'veloria-save-v1';

function isSave(value: unknown): value is GameSave {
  if (!value || typeof value !== 'object') return false;
  const save = value as Partial<GameSave>;
  return save.schemaVersion === 1 && typeof save.saveId === 'string' &&
    typeof save.player?.mapId === 'string' && Number.isFinite(save.player?.x) && Number.isFinite(save.player?.y) &&
    Array.isArray(save.party) && save.party.length <= 6 && Array.isArray(save.flags) &&
    Array.isArray(save.badges) && Array.isArray(save.storage) && typeof save.inventory === 'object';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadSave(): Promise<GameSave | null> {
  try {
    const db = await openDatabase();
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(SLOT);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (isSave(value)) return value;
  } catch {
    // Private browsing or a browser without IndexedDB uses the local fallback.
  }
  try {
    const value: unknown = JSON.parse(localStorage.getItem(FALLBACK_KEY) ?? 'null');
    return isSave(value) ? value : null;
  } catch {
    return null;
  }
}

export async function saveGame(save: GameSave): Promise<void> {
  save.savedAt = new Date().toISOString();
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const request = transaction.objectStore(STORE_NAME).put(save, SLOT);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();
  } catch {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(save));
  }
}

export function newGameSave(): GameSave {
  return {
    schemaVersion: 1,
    contentVersion: 'veloria-content-0.3',
    saveId: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    player: { name: 'Allenatore', mapId: 'veloria/borgofonte', spawnPointId: 'start', money: 300, x: 20, y: 20 },
    party: [], storage: [], flags: ['q_prologue_started'], badges: [], inventory: { potion: 2, 'poke-ball': 5 }, rngState: 1234567,
  };
}
