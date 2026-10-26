import type Phaser from 'phaser';
import type { MapInteractable } from '../maps/map-types.ts';

/** Shared vector props stay aligned with their authored interaction footprints. */
export function renderWeatherInstrument(scene: Phaser.Scene, container: Phaser.GameObjects.Container,
  item: MapInteractable, kind: 'wind' | 'thermometer'): void {
  const x = item.x + item.width / 2, feet = item.y + item.height + 4;
  const art = scene.add.graphics().setDepth(item.y + item.height + 1).setName(`weather-instrument-${kind}`);
  art.fillStyle(0x173d50, .22).fillEllipse(x, feet + 1, 24, 8);
  art.fillStyle(0xe0e9d5).fillRoundedRect(x - 9, feet - 6, 18, 7, 3);
  if (kind === 'wind') {
    art.fillStyle(0x467c82).fillRoundedRect(x - 2, feet - 40, 4, 36, 2);
    const rotor = feet - 37;
    art.lineStyle(2, 0xeafaf0).lineBetween(x - 12, rotor, x + 12, rotor);
    art.lineBetween(x, rotor - 10, x, rotor + 10);
    art.fillStyle(0x9de4ce).fillCircle(x - 12, rotor, 4).fillCircle(x + 12, rotor, 4);
    art.fillStyle(0xc4b2ef).fillCircle(x, rotor - 10, 4).fillCircle(x, rotor + 10, 4);
    art.fillStyle(0xf9fff1).fillCircle(x, rotor, 3);
  } else {
    art.fillStyle(0x497e83).fillRoundedRect(x - 9, feet - 43, 18, 38, 6);
    art.fillStyle(0xe9fff8).fillRoundedRect(x - 6, feet - 40, 12, 32, 4);
    art.fillStyle(0xef857e).fillRoundedRect(x - 2, feet - 33, 4, 20, 2).fillCircle(x, feet - 14, 4);
    art.lineStyle(1, 0x6b9ca2);
    for (const offset of [0, 6, 12]) art.lineBetween(x + 3, feet - 34 + offset, x + 5, feet - 34 + offset);
  }
  container.add(art);
}
