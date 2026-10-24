import Phaser from 'phaser';
import type { CardinalDirection } from '../../core/world/index.ts';

export const TRAVELER_TEXTURE = 'veloria-traveler-walk-v2';
const ROW: Record<CardinalDirection, number> = { down: 0, left: 1, right: 2, up: 3 };

/** Presentation only: tile movement, collision and saved position stay in the world controller. */
export class TravelerAnimation {
  readonly sprite: Phaser.GameObjects.Sprite;
  private direction: CardinalDirection = 'down';
  private lastStepAt = -Infinity;
  private cycleStartedAt = 0;
  private reduced = false;

  constructor(scene: Phaser.Scene, textureKey = TRAVELER_TEXTURE) {
    const texture = scene.textures.get(textureKey);
    const source = texture.getSourceImage() as HTMLImageElement;
    for (let row = 0; row < 4; row++) {
      for (let column = 0; column < 4; column++) {
        const frame = row * 4 + column;
        if (!texture.has(String(frame))) texture.add(frame, 0, column * source.width / 4, row * source.height / 4, source.width / 4, source.height / 4);
      }
    }
    this.sprite = scene.add.sprite(0, -8, textureKey, 1).setDisplaySize(textureKey === TRAVELER_TEXTURE ? 64 : 51.2, 64);
  }

  face(direction: CardinalDirection): void {
    this.direction = direction;
    this.sprite.setFrame(ROW[direction] * 4 + 1);
  }

  step(direction: CardinalDirection, time: number, reduced: boolean): void {
    if (time - this.lastStepAt > 170) this.cycleStartedAt = time;
    this.direction = direction;
    this.lastStepAt = time;
    this.reduced = reduced;
    this.update(time);
  }

  update(time: number): void {
    const frame = !this.reduced && time - this.lastStepAt < 145
      ? Math.floor((time - this.cycleStartedAt) / 70) % 4
      : 1;
    this.sprite.setFrame(ROW[this.direction] * 4 + frame);
  }
}
