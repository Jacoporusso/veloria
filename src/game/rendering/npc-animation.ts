import type Phaser from 'phaser';
import appearances from '../../../content/characters/appearances.v2.json';
import { npcAnimationPose, validateNpcWalkCycle, type NpcWalkCycle } from '../../core/world/npc-animation.ts';
import type { CardinalDirection } from '../../core/world/grid-movement.ts';
import type { NpcIdleViews } from '../../core/world/npc-idle-views.ts';
import { npcIdleViews } from './npc-idle-views.ts';
import { applyNpcPose } from './npc-pose.ts';

const profiles = appearances.profiles as unknown as { id: string; walkCycle?: unknown }[];
const assetKeys = new Set(appearances.assets.map(asset => asset.key));
const cycles = new Map<string, NpcWalkCycle>();
for (const profile of profiles) {
  if (profile.walkCycle === undefined) continue;
  const idle = npcIdleViews(profile.id);
  if (!idle) throw new Error(`NPC ${profile.id} needs directional idle views before declaring a walk cycle.`);
  cycles.set(profile.id, validateNpcWalkCycle(profile.walkCycle, assetKeys, idle));
}

export function npcWalkCycle(appearanceId: unknown): NpcWalkCycle | undefined {
  return typeof appearanceId === 'string' ? cycles.get(appearanceId) : undefined;
}

/** Selects authentic images; its caller alone owns position, depth, collision and movement. */
export class NpcAnimationController {
  private direction: CardinalDirection = 'down';
  private moving = false;
  private startedAt = 0;
  private previousTime = 0;
  private appliedKey?: string;

  constructor(private readonly sprite: Phaser.GameObjects.Image, private readonly idle: NpcIdleViews,
    private readonly cycle?: NpcWalkCycle) {
    this.update(0, 'down', false, false);
  }

  update(time: number, direction: CardinalDirection, moving: boolean, reducedMotion: boolean): void {
    if (!Number.isFinite(time) || time < 0) throw new Error('NPC animation clock must be finite and non-negative.');
    if (direction !== this.direction || moving !== this.moving || time < this.previousTime) this.startedAt = time;
    this.direction = direction; this.moving = moving; this.previousTime = time;
    const elapsed = Math.max(0, time - this.startedAt);
    const selected = npcAnimationPose(this.idle, this.cycle, direction, moving, elapsed, reducedMotion);
    if (selected.pose.assetKey !== this.appliedKey) {
      applyNpcPose(this.sprite, selected.pose);
      this.appliedKey = selected.pose.assetKey;
    }
    this.sprite.setData('npcFacing', direction).setData('npcMotion', selected.motion)
      .setData('npcAnimationFrame', selected.frameIndex).setData('npcAnimationElapsedMs', elapsed);
  }
}
