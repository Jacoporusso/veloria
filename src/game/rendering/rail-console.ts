import type Phaser from 'phaser';
import type { MapInteractable } from '../maps/map-types';

/** Original vector console; the authored collision footprint remains independent. */
export function renderRailConsole(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable, active: boolean): void {
  const x = item.x + item.width / 2, y = item.y + item.height;
  const color = typeof item.properties.tint === 'number' ? item.properties.tint : 0x79cfff;
  const panel = scene.add.graphics().setDepth(y + 1);
  panel.fillStyle(0x284b63, .18).fillEllipse(x, y + 2, 52, 14);
  panel.fillStyle(0x72929f).fillRoundedRect(x - 18, y - 26, 36, 28, 9);
  panel.fillStyle(0xe1ece7).fillRoundedRect(x - 14, y - 29, 28, 27, 8);
  panel.fillStyle(0xa3bec6).fillRoundedRect(x - 28, y - 57, 56, 34, 9);
  panel.fillStyle(0xf0f5e9).fillRoundedRect(x - 26, y - 59, 52, 32, 8);
  panel.fillStyle(active ? color : 0x304d60).fillRoundedRect(x - 21, y - 54, 42, 22, 5);
  panel.fillStyle(active ? 0xdefdf4 : color, active ? 1 : .7).fillCircle(x + 15, y - 14, 3);
  container.add(panel);
  const label = scene.add.text(x, y - 43, active ? '✓' : String(item.properties.lineIndex ?? '•'), {
    fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: 'bold',
    color: active ? '#163f50' : '#effbff', resolution: 4,
  }).setOrigin(.5).setDepth(y + 2);
  container.add(label);
}
