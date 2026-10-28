import type { CardinalDirection } from './grid-movement.ts';

export interface NpcIdleView {
  readonly assetKey: string;
  readonly origin: Readonly<{ x: number; y: number }>;
  /** Full source image height in world pixels; rendering preserves its aspect ratio. */
  readonly displaySize: number;
}

export type NpcIdleViews = Readonly<Record<CardinalDirection, NpcIdleView>>;

export const NPC_DIRECTIONS: readonly CardinalDirection[] = ['up', 'down', 'left', 'right'];
const VIEW_FIELDS = ['assetKey', 'displaySize', 'origin'];
const ORIGIN_FIELDS = ['x', 'y'];

/** Validate and copy per-direction idle views without altering authored data. */
export function validateNpcIdleViews(value: unknown, knownAssetKeys: ReadonlySet<string>): NpcIdleViews {
  if (!isRecord(value)) throw new Error('NPC idle views must be an object keyed by direction.');
  const directions = Object.keys(value);
  const missing = NPC_DIRECTIONS.filter(direction => !Object.hasOwn(value, direction));
  const extra = directions.filter(direction => !NPC_DIRECTIONS.includes(direction as CardinalDirection));
  if (missing.length || extra.length) {
    const details = [missing.length ? `missing: ${missing.join(', ')}` : '', extra.length ? `unexpected: ${extra.join(', ')}` : '']
      .filter(Boolean).join('; ');
    throw new Error(`NPC idle views require exactly up, down, left, right (${details}).`);
  }

  const result = {} as Record<CardinalDirection, NpcIdleView>;
  const usedAssetKeys = new Set<string>();
  for (const direction of NPC_DIRECTIONS) {
    const view = validateNpcPose(value[direction], knownAssetKeys, `NPC idle view "${direction}"`);
    const assetKey = view.assetKey;
    if (usedAssetKeys.has(assetKey)) throw new Error(`NPC idle assetKey "${assetKey}" is repeated; each direction requires its own view.`);
    usedAssetKeys.add(assetKey);
    result[direction] = view;
  }
  return result;
}

/** Shared pose geometry for independently drawn idle and movement frames. */
export function validateNpcPose(value: unknown, knownAssetKeys: ReadonlySet<string>, label: string): NpcIdleView {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  assertExactFields(value, VIEW_FIELDS, label, 'assetKey, origin, displaySize');
  const assetKey = value.assetKey;
  if (typeof assetKey !== 'string' || !assetKey.trim()) {
    throw new Error(`${label} assetKey must be a non-empty string.`);
  }
  if (!knownAssetKeys.has(assetKey)) throw new Error(`${label} references unknown assetKey "${assetKey}".`);

  if (!isRecord(value.origin)) throw new Error(`${label} origin must contain finite x and y values from 0 to 1.`);
  assertExactFields(value.origin, ORIGIN_FIELDS, `${label} origin`, 'x, y');
  const { x, y } = value.origin;
  if (typeof x !== 'number' || !Number.isFinite(x) || x < 0 || x > 1 ||
      typeof y !== 'number' || !Number.isFinite(y) || y < 0 || y > 1) {
    throw new Error(`${label} origin x and y must be finite numbers from 0 to 1.`);
  }

  const displaySize = value.displaySize;
  if (typeof displaySize !== 'number' || !Number.isFinite(displaySize) || displaySize <= 0) {
    throw new Error(`${label} displaySize must be a finite number greater than 0.`);
  }
  return { assetKey, origin: { x, y }, displaySize };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactFields(record: Record<string, unknown>, expected: readonly string[], label: string, expectedText: string): void {
  const keys = Object.keys(record);
  const missing = expected.filter(key => !Object.hasOwn(record, key));
  const extra = keys.filter(key => !expected.includes(key));
  if (missing.length || extra.length) {
    const details = [missing.length ? `missing ${missing.join(', ')}` : '', extra.length ? `unexpected ${extra.join(', ')}` : '']
      .filter(Boolean).join('; ');
    throw new Error(`${label} must contain exactly ${expectedText} (${details}).`);
  }
}
