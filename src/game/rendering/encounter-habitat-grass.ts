import type Phaser from 'phaser';
import type { MapTrigger } from '../maps/map-types';
import { createEncounterHabitatMarkers, ENCOUNTER_HABITAT_LEAF_PATH } from './encounter-habitat-marker';

const TEXTURE = 'veloria-habitat-leaf-v2';

/** One approved silhouette per encounter patch, anchored on walkable ground. */
export function renderEncounterHabitatGrass(scene: Phaser.Scene, container: Phaser.GameObjects.Container, triggers: readonly MapTrigger[], occupied: ReadonlySet<string>): void {
  if (!scene.textures.exists(TEXTURE)) {
    const texture = scene.textures.createCanvas(TEXTURE, 192, 192)!;
    const context = texture.context;
    context.scale(8, 8);
    const path = new Path2D(ENCOUNTER_HABITAT_LEAF_PATH);
    const leaves = context.createLinearGradient(0, 1, 0, 23);
    leaves.addColorStop(0, '#c5df91');
    leaves.addColorStop(.5, '#86b568');
    leaves.addColorStop(1, '#426c47');
    context.fillStyle = leaves;
    context.strokeStyle = '#35533a';
    context.lineWidth = .45;
    context.lineJoin = 'round';
    context.stroke(path);
    context.fill(path);
    context.strokeStyle = '#e2edb5';
    context.lineWidth = .45;
    context.beginPath();
    context.moveTo(11, 21); context.quadraticCurveTo(12, 13, 13, 5);
    context.stroke();
    texture.refresh();
  }
  for (const marker of createEncounterHabitatMarkers(triggers, occupied)) {
    const tuft = scene.add.image(marker.x, marker.y + 12, TEXTURE)
      .setOrigin(.5, 1).setDisplaySize(26, 28)
      .setDepth(marker.y + 1).setName('encounter-habitat-marker')
      .setData('triggerId', marker.triggerId).setData('tileX', Math.floor(marker.x / 32)).setData('tileY', Math.floor(marker.y / 32));
    container.add(tuft);
  }
}
