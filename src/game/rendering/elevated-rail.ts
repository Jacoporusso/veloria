import type Phaser from 'phaser';
import type { MapInteractable } from '../maps/map-types';

/** Cosmetic horizontal guideway. Collision stays owned by the Tiled collision layer. */
export function renderElevatedRail(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable): void {
  const { x, y, width, height } = item;
  const rail = scene.add.graphics().setDepth(-5);
  rail.fillStyle(0x203f53, .22).fillRoundedRect(x + 4, y + 16, width, height, 8);
  for (let offset = 48; offset < width - 24; offset += 128) {
    rail.fillStyle(0x789da8).fillRoundedRect(x + offset, y + height / 2, 18, height / 2 + 20, 5);
    rail.fillStyle(0xd9e8e4).fillRoundedRect(x + offset + 3, y + height / 2, 10, height / 2 + 16, 4);
  }
  rail.fillStyle(0x9fbcc6).fillRoundedRect(x, y, width, height * .65, 8);
  rail.fillStyle(0xe6efdf).fillRoundedRect(x, y, width, height * .4, 6);
  rail.lineStyle(3, 0x4b8395).lineBetween(x + 4, y + height * .2, x + width - 4, y + height * .2);
  rail.lineStyle(2, 0xb2f3ed).lineBetween(x + 4, y + height * .38, x + width - 4, y + height * .38);
  container.add(rail);
}
