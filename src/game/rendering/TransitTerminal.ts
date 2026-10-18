import type Phaser from 'phaser';
import type { MapInteractable } from '../maps/map-types';

/** Compact monorail kiosk art. Tiled continues to own its one-tile footprint. */
export function renderTransitTerminal(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable): void {
  const x = item.x + item.width / 2;
  const y = item.y + item.height;
  const depth = Math.floor(y + 1);
  const art = scene.add.graphics().setDepth(depth);

  // Grounding shadow and a softly stepped plinth keep the kiosk legible over varied terrain.
  art.fillStyle(0x17384a, .2).fillEllipse(x, y + 2, 31, 9);
  art.fillStyle(0x597f83, 1).fillRoundedRect(x - 12, y - 7, 24, 7, 3);
  art.fillStyle(0xd4e9dc, 1).fillRoundedRect(x - 10, y - 9, 20, 5, 2);
  art.fillStyle(0x72929f, 1).fillRoundedRect(x - 4, y - 29, 8, 20, 3);

  // The kiosk rises about 30px beyond the one-tile authored footprint.
  art.fillStyle(0x587f91, 1).fillRoundedRect(x - 11, y - 59, 22, 31, 8);
  art.fillStyle(0xe4f5ec, 1).fillRoundedRect(x - 9, y - 61, 18, 29, 7);
  art.fillStyle(0x8edbca, 1).fillRoundedRect(x - 7, y - 58, 14, 23, 6);

  // Train capsule pictogram: body, mint window, paired wheels, and a quiet route line.
  art.fillStyle(0x263f58, 1).fillRoundedRect(x - 5.5, y - 54, 11, 15, 5);
  art.fillStyle(0xbaf4e5, 1).fillRoundedRect(x - 3.5, y - 51, 7, 6, 2.5);
  art.fillStyle(0x9b94e7, 1).fillCircle(x - 2.5, y - 37.5, 1.4);
  art.fillStyle(0x9b94e7, 1).fillCircle(x + 2.5, y - 37.5, 1.4);
  art.lineStyle(1.5, 0xf7fff8, .9).lineBetween(x - 3, y - 47, x + 3, y - 47);
  art.fillStyle(0x68bfae, 1).fillRoundedRect(x - 5, y - 31, 10, 2.5, 1.2);

  container.add(art);
}
