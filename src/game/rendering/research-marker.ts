import type Phaser from 'phaser';
import type { MapInteractable } from '../maps/map-types';

/** A small environmental observation marker; never a portrait or position of the hidden Pokémon. */
export function renderResearchMarker(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable, recorded: boolean): void {
  const x = item.x + item.width / 2, y = item.y + item.height / 2;
  const color = recorded ? 0x9de0be : 0x90deef;
  const ring = scene.add.graphics().setDepth(Math.floor(item.y + item.height) - 1)
    .setName('research-marker').setData('researchId', item.properties.researchId).setData('clueId', item.properties.researchClueId);
  ring.fillStyle(0x163847, .85).fillCircle(x, y, 11);
  ring.lineStyle(1.5, color, .9).strokeCircle(x, y, 11);
  const icon = scene.add.text(x, y, recorded ? '✓' : item.kind === 'research-puzzle' ? '◇' : '✦', {
    fontFamily: 'system-ui, sans-serif', fontSize: '17px', color: recorded ? '#baf5d6' : '#d7f5ff', resolution: 4,
  }).setOrigin(.5).setDepth(Math.floor(item.y + item.height)).setName('research-marker-symbol');
  container.add([ring, icon]);
}
