/**
 * Safe localStorage access helpers.
 *
 * Every function is a no-op (or returns the fallback) when there is no
 * `window`, so they can be called from code that also runs on the server.
 */

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readString(key: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Storage full or unavailable
  }
}

export function readJSON<T>(key: string, fallback: T | null = null): T | null {
  const raw = readString(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    writeString(key, JSON.stringify(value));
  } catch {
    // Value not serializable
  }
}

export function removeKey(key: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore
  }
}

export function hasKey(key: string): boolean {
  return readString(key) !== null;
}

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Store a value alongside the time it was written. */
export function writeTimestampedJSON(key: string, value: object): void {
  writeJSON(key, { ...value, timestamp: Date.now() });
}

/** Read a value written by `writeTimestampedJSON`, ignoring stale entries. */
export function readFreshJSON<T>(key: string, maxAgeMs: number = ONE_DAY_MS): T | null {
  const entry = readJSON<T & { timestamp?: number }>(key);
  if (!entry || typeof entry.timestamp !== 'number') return null;
  return Date.now() - entry.timestamp < maxAgeMs ? entry : null;
}

export function keysWithPrefix(prefix: string): string[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    return Object.keys(storage).filter((key) => key.startsWith(prefix));
  } catch {
    return [];
  }
}
