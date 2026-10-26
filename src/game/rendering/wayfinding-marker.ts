import type Phaser from 'phaser';
import type { MapInteractable } from '../maps/map-types.ts';

/** Optional map-authored signs share a visual language without adding collision. */
export function renderWayfindingMarker(scene: Phaser.Scene, container: Phaser.GameObjects.Container,
  item: MapInteractable): void {
  const kind = item.properties.wayfindingIcon;
  if (kind !== 'heal' && kind !== 'shop' && kind !== 'cable' && kind !== 'survey') return;
  const x = item.x + item.width / 2, y = item.y + item.height / 2 + 19;
  const art = scene.add.graphics().setDepth(-1).setName(`wayfinding-${kind}`);
  art.fillStyle(0x173d50, .92).fillCircle(x, y, 12);
  art.lineStyle(1.5, 0xb8f5e2, .95).strokeCircle(x, y, 12);
  art.lineStyle(2, 0xf4fff8, 1);
  if (kind === 'heal') {
    art.fillStyle(0xf7b0a9).fillRoundedRect(x - 2, y - 7, 4, 14, 1);
    art.fillRoundedRect(x - 7, y - 2, 14, 4, 1);
  } else if (kind === 'shop') {
    art.strokeRoundedRect(x - 6, y - 2, 12, 9, 2);
    art.beginPath().arc(x, y - 2, 4, Math.PI, 0).strokePath();
  } else if (kind === 'cable') {
    art.lineBetween(x - 8, y - 7, x + 8, y - 7);
    art.lineBetween(x, y - 7, x, y - 3);
    art.strokeRoundedRect(x - 6, y - 3, 12, 10, 3);
    art.lineBetween(x - 5, y + 2, x + 5, y + 2);
  } else {
    art.strokeCircle(x - 1, y - 1, 5);
    art.lineBetween(x + 3, y + 3, x + 7, y + 7);
  }
  container.add(art);
}
