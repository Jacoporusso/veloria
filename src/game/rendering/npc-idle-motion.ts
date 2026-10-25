import Phaser from 'phaser';

/** Subtle breathing around the authored foot anchor; no movement or RNG changes. */
export function addNpcIdleMotion(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, reducedMotion: boolean): Phaser.GameObjects.Image[] {
  if (reducedMotion) return [];
  const targets: Phaser.GameObjects.Image[] = [];
  for (const child of layer.list) {
    if (!(child instanceof Phaser.GameObjects.Image) || child.name !== 'npc-sprite') continue;
    const identity = String(child.getData('npcId') ?? 'npc');
    let phase = 0;
    for (const character of identity) phase = (Math.imul(phase, 31) + character.charCodeAt(0)) >>> 0;
    scene.tweens.add({
      targets: child, scaleY: child.scaleY * 1.012,
      duration: 1900 + phase % 700, delay: phase % 500,
      ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });
    targets.push(child);
  }
  return targets;
}
