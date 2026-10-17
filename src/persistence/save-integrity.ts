/** Stable serialization used to detect accidental save-record corruption. */
export function stableStringify(value: unknown, ancestors = new Set<object>()): string {
  if (value === null || typeof value !== 'object') {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error('Save data contains a non-JSON value.');
    return encoded;
  }
  if (ancestors.has(value)) throw new Error('Save data contains a circular value.');
  ancestors.add(value);
  if (Array.isArray(value)) {
    const encoded = `[${value.map(item => stableStringify(item, ancestors)).join(',')}]`;
    ancestors.delete(value);
    return encoded;
  }
  const record = value as Record<string, unknown>;
  // Optional undefined object fields are omitted by JSON export; hash the same representation.
  const keys = Object.keys(record).filter(key => record[key] !== undefined).sort();
  const encoded = `{${keys.map(key => `${JSON.stringify(key)}:${stableStringify(record[key], ancestors)}`).join(',')}}`;
  ancestors.delete(value);
  return encoded;
}

/** Accidental-corruption detection only; this is deliberately not cryptographic. */
export function checksumJson(value: unknown): string {
  const serialized = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function verifyChecksum(value: unknown, expected: unknown): boolean {
  return typeof expected === 'string' && checksumJson(value) === expected;
}
