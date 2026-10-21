import Phaser from 'phaser';

export interface BattleCommandTab {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly enabled: boolean;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

export interface BattleCommandNavigationBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Presentation only: command availability and selection belong to the scene. */
export function drawBattleCommandNavigation(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  bounds: BattleCommandNavigationBounds,
  tabs: readonly BattleCommandTab[],
  density: number,
): void {
  if (!tabs.length || bounds.width <= 0 || bounds.height <= 0) return;
  const resolution = Number.isFinite(density) ? Math.max(4, density) : 1;
  const cellWidth = bounds.width / tabs.length;
  const pad = Math.min(6, cellWidth * .06);
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x102f3e, .98);
  graphics.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  graphics.lineStyle(1, 0xc1f3e5, .13);
  graphics.lineBetween(bounds.x, bounds.y, bounds.x + bounds.width, bounds.y);
  container.add(graphics);

  tabs.forEach((tab, index) => {
    const x = bounds.x + cellWidth * index;
    const centerX = x + cellWidth / 2;
    const centerY = bounds.y + bounds.height / 2;
    const color = tab.selected ? '#b8ffe5' : '#c0d5dc';
    if (tab.selected) {
      graphics.fillStyle(0xafffe3, .09);
      graphics.fillRoundedRect(x + pad, bounds.y + 5, cellWidth - pad * 2, Math.max(1, bounds.height - 10), 12);
      graphics.fillStyle(0xafffe3, .95);
      graphics.fillRoundedRect(centerX - Math.min(19, cellWidth * .2), bounds.y + 1, Math.min(38, cellWidth * .4), 3, 1.5);
    }
    const icon = scene.add.text(centerX, centerY - 10, tab.icon, {
      fontFamily: 'Nunito, "Trebuchet MS", sans-serif',
      fontSize: `${Math.min(23, Math.max(17, bounds.height * .32))}px`,
      color, resolution,
      padding: { top: 2, bottom: 2 },
    }).setOrigin(.5).setAlpha(tab.enabled ? 1 : .4);
    icon.name = `battle-tab-icon-${tab.id}`;
    const label = scene.add.text(centerX, centerY + 13, tab.label.toUpperCase(), {
      fontFamily: 'Nunito, "Trebuchet MS", sans-serif',
      fontStyle: 'bold',
      fontSize: `${Math.min(11, Math.max(8, cellWidth * .12))}px`,
      color, resolution,
      padding: { top: 2, bottom: 2 },
    }).setOrigin(.5).setAlpha(tab.enabled ? 1 : .4);
    label.name = `battle-tab-label-${tab.id}`;
    label.setData('selected', tab.selected);
    label.setData('enabled', tab.enabled);
    const zone = scene.add.zone(centerX, centerY, Math.max(44, cellWidth), Math.max(44, bounds.height));
    zone.name = `battle-tab-${tab.id}`;
    zone.setData('selected', tab.selected);
    zone.setData('enabled', tab.enabled);
    if (tab.enabled) {
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        tab.onSelect();
      });
    }
    container.add([icon, label, zone]);
  });
}
