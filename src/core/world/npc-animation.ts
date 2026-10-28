import type { CardinalDirection } from './grid-movement.ts';
import { NPC_DIRECTIONS, validateNpcPose, type NpcIdleView, type NpcIdleViews } from './npc-idle-views.ts';

export interface NpcWalkCycle {
  readonly frameDurationMs: number;
  readonly views: Readonly<Record<CardinalDirection, readonly NpcIdleView[]>>;
}

export interface NpcAnimationPose {
  readonly pose: NpcIdleView;
  readonly motion: 'idle' | 'walk';
  readonly frameIndex: number;
}

/** Independent frames only: neither an idle nor another direction can stand in for a step. */
export function validateNpcWalkCycle(value: unknown, knownAssetKeys: ReadonlySet<string>, idleViews: NpcIdleViews): NpcWalkCycle {
  if (!isRecord(value) || Object.keys(value).sort().join(',') !== 'frameDurationMs,views') {
    throw new Error('NPC walk cycle requires exactly frameDurationMs and views.');
  }
  const duration = value.frameDurationMs;
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) {
    throw new Error('NPC walk frameDurationMs must be finite and greater than zero.');
  }
  const views = value.views;
  if (!isRecord(views) || Object.keys(views).sort().join(',') !== [...NPC_DIRECTIONS].sort().join(',')) {
    throw new Error('NPC walk views require exactly up, down, left, right.');
  }
  const used = new Set(Object.values(idleViews).map(view => view.assetKey));
  const result = {} as Record<CardinalDirection, NpcIdleView[]>;
  for (const direction of NPC_DIRECTIONS) {
    const frames = views[direction];
    if (!Array.isArray(frames) || frames.length < 2) throw new Error(`NPC walk "${direction}" needs at least two independent frames.`);
    result[direction] = Array.from(frames, (frame, index) => {
      const pose = validateNpcPose(frame, knownAssetKeys, `NPC walk "${direction}" frame ${index}`);
      if (used.has(pose.assetKey)) throw new Error(`NPC walk frame "${pose.assetKey}" repeats an idle or another movement frame.`);
      used.add(pose.assetKey);
      return pose;
    });
  }
  return { frameDurationMs: duration, views: result };
}

/** Presentation selection only; no world position, collision, dialogue or RNG is touched. */
export function npcAnimationPose(idleViews: NpcIdleViews, cycle: NpcWalkCycle | undefined,
  direction: CardinalDirection, moving: boolean, elapsedMs: number, reducedMotion: boolean): NpcAnimationPose {
  if (!NPC_DIRECTIONS.includes(direction)) throw new Error('Unknown NPC direction.');
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new Error('NPC animation elapsed time must be finite and non-negative.');
  if (!moving || !cycle) return { pose: idleViews[direction], motion: 'idle', frameIndex: 0 };
  const frames = cycle.views[direction];
  const offset = elapsedMs % (cycle.frameDurationMs * frames.length);
  const frameIndex = reducedMotion ? 0 : Math.min(frames.length - 1, Math.floor(offset / cycle.frameDurationMs));
  return { pose: frames[frameIndex], motion: 'walk', frameIndex };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
