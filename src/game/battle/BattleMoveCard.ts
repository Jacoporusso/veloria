import Phaser from 'phaser';
import type { MoveCard } from './move-card';

/** A move and its inspection button are separate targets: inspecting cannot issue a turn. */
export function drawBattleMoveCard(scene: Phaser.Scene, container: Phaser.GameObjects.Container,
  bounds: { x: number; y: number; width: number; height: number }, card: MoveCard,
  color: number, enabled: boolean, density: number, onUse: () => void, onDetails: () => void) {
  const { x, y, width, height } = bounds;
  const surface = scene.add.graphics();
  const paint = (selected: boolean) => {
    surface.clear();
    surface.fillStyle(selected ? 0x315b68 : 0x244453, .98).fillRoundedRect(x, y, width, height, 16);
    surface.fillStyle(color, enabled ? .09 : .025).fillRoundedRect(x, y, width, height, 16);
    surface.lineStyle(selected ? 2 : 1, selected ? 0xb1f5df : color, selected ? .95 : .45).strokeRoundedRect(x + 1, y + 1, width - 2, height - 2, 15);
    if (selected) surface.fillStyle(0xb1f5df).fillRoundedRect(x + 4, y + 13, 3, height - 26, 2);
  };
  paint(false);
  const text = (tx: number, ty: number, value: string, size: number, maxWidth: number, tint = '#eef8f7') => {
    const label = scene.add.text(tx, ty, value, { fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: `${size}px`, fontStyle: 'bold', color: tint, resolution: Math.max(4, density) });
    if (label.width > maxWidth) label.setFontSize(Math.max(8, Math.floor(size * maxWidth / label.width)));
    container.add(label);
    return label;
  };
  container.add(surface);
  const use = scene.add.zone(x, y, width, height).setOrigin(0).setName('battle-move-use');
  use.setData({ moveName: card.name, enabled, presentation: card });
  if (enabled) use.setInteractive({ useHandCursor: true }).on('pointerdown', onUse);
  container.add(use);
  const tint = enabled ? '#eef8f7' : '#93acb8';
  text(x + 12, y + 10, card.name, 14, width - 62, tint).setName('battle-move-name');
  text(x + 12, y + 32, card.typeIcon, 19, 23);
  text(x + 37, y + 36, `${card.typeLabel} · ${card.categoryIcon} ${card.categoryLabel}`, 10, width - 49, tint);
  text(x + 12, y + 58, `💥 ${card.powerLabel.replace(' HP fissi', ' HP')}`, 10, width * .31, tint);
  text(x + width * .37, y + 58, `🎯 ${card.accuracyLabel}`, 10, width * .31, tint);
  text(x + width - 12, y + 58, card.ppLabel, 10, width * .31, tint).setOrigin(1, 0);
  text(x + 12, y + 77, card.riskLabel ?? card.supportEffect ?? card.effectivenessLabel, 10, width - 24, card.effectiveness === 'immune' ? '#ffb6a4' : card.effectiveness === 'super' ? '#ffdc9b' : '#c7e9e3');
  const info = scene.add.zone(x + width - 44, y, 44, 44).setOrigin(0).setName('battle-move-details').setInteractive({ useHandCursor: true });
  info.setData({ moveName: card.name });
  info.on('pointerdown', (_pointer: unknown, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); onDetails(); });
  container.add(info);
  text(x + width - 22, y + 10, 'ⓘ', 19, 24).setOrigin(.5, 0);
  return paint;
}
