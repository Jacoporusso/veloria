import Phaser from 'phaser';
import type { MoveDefinition, MajorStatus } from '../../core/battle/types.ts';

type Actor = Phaser.GameObjects.Container;
const COLORS: Record<string, number> = {
  fire: 0xffa65f, water: 0x79ddff, electric: 0xffe587, grass: 0xa6f3a0,
  ice: 0xb7f5ff, psychic: 0xf7a5ed, ghost: 0xc7adff, dark: 0xb49ad7,
  poison: 0xdca2f3, rock: 0xdac09e, ground: 0xe2b18a, steel: 0xc6e4ee,
  fighting: 0xffbb9b, flying: 0xd2f4ff, bug: 0xcfe89c, dragon: 0xb0b5ff, normal: 0xe5faff,
};

/** Presentation only: resolved events decide whether an attack hits or a status applies.
 * Every effect belongs to the scene UI, so skip, resize and shutdown cancel it together.
 */
export class BattleEffects {
  constructor(private readonly scene: Phaser.Scene, private readonly ui: Actor, private readonly reduced: boolean) {}

  private layer(name: string, x = 0, y = 0): Actor {
    const layer = this.scene.add.container(x, y).setName(`battle-vfx-${name}`);
    this.ui.add(layer);
    layer.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.tweens.killTweensOf(layer);
      for (const child of layer.list) this.scene.tweens.killTweensOf(child);
    });
    return layer;
  }

  private ring(layer: Actor, x: number, y: number, color: number, radius = 22): void {
    const ring = this.scene.add.circle(x, y, radius, color, .06).setStrokeStyle(2, color, .85);
    layer.add(ring);
    if (!this.reduced) this.scene.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 540, ease: 'Cubic.easeOut' });
  }

  cast(source: Actor, target: Actor, move?: MoveDefinition): void {
    if (this.reduced) return;
    const color = COLORS[move?.type ?? 'normal'];
    const layer = this.layer(`cast-${move?.type ?? 'normal'}`);
    if (move?.category === 'status') {
      const recipient = move.statChanges?.every(change => change.target === 'self') ? source : target;
      this.ring(layer, recipient.x, recipient.y, color, 30);
      return;
    }
    if (move?.category === 'physical' || !move) {
      this.scene.tweens.killTweensOf(source);
      const x = source.x, y = source.y;
      this.scene.tweens.add({ targets: source, x: x - (target.x - x) * .035, y: y + 3,
        duration: 90, ease: 'Sine.easeOut', onComplete: () => {
          if (!source.active) return;
          this.scene.tweens.add({ targets: source, x: x + (target.x - x) * .18, y: y - 6,
            duration: 130, yoyo: true, ease: 'Cubic.easeOut', onComplete: () => source.setPosition(x, y) });
        } });
      const slash = this.scene.add.graphics().setPosition(target.x, target.y);
      slash.lineStyle(4, color, .9);
      const claw = /scratch|claw|slash|fury/.test(move?.id ?? '');
      for (let i = 0; i < 3; i++) {
        if (claw) slash.lineBetween(-28 + i * 13, 22, 8 + i * 13, -23);
        else slash.lineBetween(-42, -10 + i * 11, -12, -10 + i * 11);
      }
      layer.add(slash);
      this.scene.tweens.add({ targets: slash, alpha: 0, scale: 1.35, duration: 450, delay: 100 });
      return;
    }
    if (move?.type === 'electric') {
      const bolt = this.scene.add.graphics();
      for (const [width, alpha] of [[10, .12], [4, .9], [1.5, 1]]) {
        bolt.lineStyle(width, color, alpha).beginPath().moveTo(source.x, source.y);
        for (let i = 1; i <= 9; i++) {
          const t = i / 9;
          bolt.lineTo(Phaser.Math.Linear(source.x, target.x, t), Phaser.Math.Linear(source.y, target.y, t) + (i === 9 ? 0 : (i % 2 ? -14 : 14)));
        }
        bolt.strokePath();
      }
      layer.add(bolt);
      this.scene.tweens.add({ targets: bolt, alpha: 0, duration: 380, ease: 'Sine.easeIn' });
      return;
    }
    for (let i = 0; i < 9; i++) {
      const particle = this.scene.add.graphics();
      const radius = 5 + i % 3;
      particle.fillStyle(color, .9).lineStyle(1.5, 0xffffff, .65);
      if (move?.type === 'grass' || move?.type === 'bug') {
        particle.fillEllipse(0, 0, radius * 2.5, radius).lineBetween(-radius, 0, radius, 0);
      } else if (['ice', 'rock', 'ground', 'steel'].includes(move?.type ?? '')) {
        particle.fillTriangle(0, -radius, radius, radius, -radius, radius).strokeTriangle(0, -radius, radius, radius, -radius, radius);
      } else if (['psychic', 'ghost', 'dark', 'flying'].includes(move?.type ?? '')) {
        particle.strokeCircle(0, 0, radius);
      } else {
        particle.fillCircle(0, 0, radius);
        particle.fillStyle(0xffffff, .6).fillCircle(-1, -2, radius * .35);
      }
      particle.setPosition(source.x, source.y + (i % 3 - 1) * 8);
      layer.add(particle);
      this.scene.tweens.add({ targets: particle, x: target.x + (i % 3 - 1) * 12,
        y: target.y + (i % 3 - 1) * 10, angle: move?.type === 'water' ? 0 : 140,
        scale: .35, alpha: .15, delay: i * 22, duration: 290 + i * 8, ease: 'Sine.easeIn' });
    }
  }

  impact(target: Actor, color: number, immune = false, critical = false): void {
    const layer = this.layer(immune ? 'immune' : 'impact', target.x, target.y);
    this.ring(layer, 0, 0, immune ? 0xbacfff : color, immune ? 34 : 17);
    if (this.reduced || immune) return;
    const rays = this.scene.add.graphics().lineStyle(critical ? 4 : 3, color, .9);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      rays.lineBetween(Math.cos(angle) * 16, Math.sin(angle) * 16, Math.cos(angle) * 34, Math.sin(angle) * 34);
    }
    layer.add(rays);
    this.scene.tweens.add({ targets: rays, scale: critical ? 1.9 : 1.4, alpha: 0, duration: 370 });
    this.scene.tweens.killTweensOf(target);
    this.scene.tweens.add({ targets: target, x: target.x + 5, duration: 45, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });
  }

  aura(target: Actor, kind: 'heal' | 'up' | 'down' | MajorStatus | 'confusion'): void {
    const color = kind === 'heal' || kind === 'up' ? 0xafffe3 : kind === 'down' || kind === 'confusion' ? 0xc6b1ff
      : kind === 'burn' ? COLORS.fire : kind === 'freeze' ? COLORS.ice : kind === 'paralysis' ? COLORS.electric : COLORS.poison;
    const layer = this.layer(`aura-${kind}`);
    this.ring(layer, target.x, target.y + 12, color, 28);
    if (this.reduced) return;
    if (kind === 'heal' || kind === 'up' || kind === 'down') {
      this.motes(layer, target, color, kind === 'down' ? 'fall' : 'rise');
      return;
    }
    for (let i = 0; i < 6; i++) {
      const symbol = this.scene.add.graphics().setPosition(target.x + Math.cos(i * Math.PI / 3) * 30, target.y - 16 + Math.sin(i * Math.PI / 3) * 16);
      symbol.lineStyle(2, color, .95).fillStyle(color, .6);
      if (kind === 'sleep') symbol.lineBetween(-4, -5, 4, -5).lineBetween(4, -5, -4, 5).lineBetween(-4, 5, 4, 5);
      else if (kind === 'burn') symbol.fillTriangle(0, -9, 5, 4, -5, 4).fillCircle(0, 4, 5);
      else if (kind === 'freeze') {
        for (let ray = 0; ray < 6; ray++) symbol.lineBetween(0, 0, Math.cos(ray * Math.PI / 3) * 7, Math.sin(ray * Math.PI / 3) * 7);
      } else if (kind === 'paralysis') symbol.lineBetween(4, -8, -3, 0).lineBetween(-3, 0, 3, 0).lineBetween(3, 0, -4, 8);
      else if (kind === 'confusion') symbol.fillTriangle(0, -6, 5, 5, -5, 5);
      else symbol.strokeCircle(0, 0, 5).fillCircle(-1, -2, 1);
      layer.add(symbol);
      this.scene.tweens.add({ targets: symbol, y: symbol.y - 20, alpha: 0, scale: 1.3, delay: i * 25, duration: 520, ease: 'Sine.easeOut' });
    }
  }

  private motes(layer: Actor, target: Actor, color: number, direction: 'rise' | 'fall'): void {
    for (let i = 0; i < 8; i++) {
      const mote = this.scene.add.graphics().setPosition(target.x - 32 + i * 9, target.y + (direction === 'rise' ? 25 : -35));
      mote.lineStyle(2, color, .9);
      const sign = direction === 'rise' ? -1 : 1;
      mote.lineBetween(0, 5 * sign, 0, -5 * sign).lineBetween(-4, 0, 0, -5 * sign).lineBetween(0, -5 * sign, 4, 0);
      layer.add(mote);
      this.scene.tweens.add({ targets: mote, y: mote.y + sign * 48, alpha: 0, delay: i * 25, duration: 470, ease: 'Sine.easeOut' });
    }
  }
}
