import Phaser from 'phaser';
import '../../npc-animation-preview.css';
import appearances from '../../../content/characters/appearances.v2.json';
import { publicAssetUrl } from '../../core/assets/index.ts';
import type { CardinalDirection } from '../../core/world/grid-movement.ts';
import { npcIdleViews } from '../rendering/npc-idle-views.ts';
import { npcWalkCycle, NpcAnimationController } from '../rendering/npc-animation.ts';
import { prepareNpcPoseTextures } from '../rendering/npc-pose.ts';
import { gameViewport } from '../rendering/game-size.ts';

/** Developer-only art review; no campaign state or persistence is imported. */
export class NpcAnimationPreviewScene extends Phaser.Scene {
  actor!: Phaser.GameObjects.Image;
  readonly logicalPosition = { x: 320, y: 240 };
  direction: CardinalDirection = 'down';
  moving = false;
  reducedMotion = false;
  private animation!: NpcAnimationController;
  private groundAnchor!: Phaser.GameObjects.Graphics;
  private toolbar?: HTMLElement;
  private status?: HTMLOutputElement;
  private listeners = new AbortController();

  constructor() { super('npc-animation-preview'); }

  preload(): void {
    const idle = npcIdleViews('ranger-ada');
    const walk = npcWalkCycle('ranger-ada');
    if (!idle || !walk) throw new Error('Ada needs authored idle and walk images for the motion preview.');
    for (const pose of [...Object.values(idle), ...Object.values(walk.views).flat()]) {
      const asset = appearances.assets.find(asset => asset.key === pose.assetKey);
      if (!asset) throw new Error(`Preview asset ${pose.assetKey} is missing.`);
      this.load.image(asset.key, publicAssetUrl(asset.path, import.meta.env.BASE_URL));
    }
  }

  create(): void {
    this.listeners = new AbortController();
    const idle = npcIdleViews('ranger-ada')!;
    const walk = npcWalkCycle('ranger-ada')!;
    prepareNpcPoseTextures(this, [...Object.values(idle), ...Object.values(walk.views).flat()]);
    document.body.classList.add('npc-motion-preview');
    document.querySelector('#game')?.setAttribute('aria-label', 'Prova camminata di Ada');
    this.cameras.main.setBackgroundColor('#102d3e');
    this.add.grid(320, 240, 2048, 2048, 32, 32, 0x173b49, 1, 0x96d7cf, .12);
    this.groundAnchor = this.add.graphics().lineStyle(1, 0x9fffea, .9)
      .lineBetween(-15, 0, 15, 0).lineBetween(0, -4, 0, 4);
    this.actor = this.add.image(this.logicalPosition.x, this.logicalPosition.y, idle.down.assetKey).setName('npc-walk-preview-actor');
    this.animation = new NpcAnimationController(this.actor, idle, walk);
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches || localStorage.getItem('veloria-animation-quality') === 'reduced';
    this.createControls();
    this.cameras.main.startFollow(this.actor, true, 1, 1);
    this.layout();
    this.scale.on('resize', this.layout, this);
    const loading = document.querySelector<HTMLElement>('#game-loading');
    if (loading) loading.hidden = true;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
      this.listeners.abort(); this.toolbar?.remove();
      document.body.classList.remove('npc-motion-preview');
    });
  }

  update(time: number, delta: number): void {
    if (!this.actor) return;
    if (this.moving) {
      const step = 60 * Math.min(delta, 50) / 1000;
      const dx = this.direction === 'left' ? -step : this.direction === 'right' ? step : 0;
      const dy = this.direction === 'up' ? -step : this.direction === 'down' ? step : 0;
      this.logicalPosition.x = Phaser.Math.Clamp(this.logicalPosition.x + dx, 80, 560);
      this.logicalPosition.y = Phaser.Math.Clamp(this.logicalPosition.y + dy, 80, 400);
      if ((dx < 0 && this.logicalPosition.x === 80) || (dx > 0 && this.logicalPosition.x === 560) ||
          (dy < 0 && this.logicalPosition.y === 80) || (dy > 0 && this.logicalPosition.y === 400)) this.moving = false;
    }
    this.actor.setPosition(this.logicalPosition.x, this.logicalPosition.y);
    this.groundAnchor.setPosition(this.logicalPosition.x, this.logicalPosition.y);
    this.animation.update(time, this.direction, this.moving, this.reducedMotion);
    if (this.status) this.status.textContent = this.moving
      ? `Camminata · passo ${Number(this.actor.getData('npcAnimationFrame')) + 1}/${npcWalkCycle('ranger-ada')!.views[this.direction].length}`
      : 'In attesa';
  }

  private layout(): void {
    const viewport = gameViewport(this.game);
    this.cameras.main.setZoom(2 * Math.min(1, viewport.height / 500) * viewport.density);
  }

  private createControls(): void {
    const toolbar = document.createElement('section');
    toolbar.className = 'npc-animation-tools'; toolbar.setAttribute('aria-label', 'Prova animazioni Ada');
    const title = document.createElement('h2'); title.textContent = 'Ada · prova camminata';
    const note = document.createElement('p'); note.textContent = 'Scena isolata · progressi non salvati';
    const buttons = document.createElement('div'); buttons.className = 'npc-animation-buttons';
    for (const [direction, name] of [['up', 'nord'], ['down', 'sud'], ['left', 'ovest'], ['right', 'est']] as const) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = name;
      button.setAttribute('aria-label', `Cammina verso ${name}`);
      button.addEventListener('click', () => { this.direction = direction; this.moving = true; }, { signal: this.listeners.signal });
      buttons.append(button);
    }
    const stop = document.createElement('button'); stop.type = 'button'; stop.textContent = 'Ferma';
    stop.addEventListener('click', () => { this.moving = false; }, { signal: this.listeners.signal }); buttons.append(stop);
    const label = document.createElement('label');
    const reduced = document.createElement('input'); reduced.type = 'checkbox'; reduced.checked = this.reducedMotion;
    reduced.addEventListener('change', () => { this.reducedMotion = reduced.checked; }, { signal: this.listeners.signal });
    label.append(reduced, ' Movimento ridotto');
    this.status = document.createElement('output'); this.status.setAttribute('aria-label', 'Stato animazione');
    toolbar.append(title, note, buttons, label, this.status);
    document.querySelector('.game-stage')!.append(toolbar); this.toolbar = toolbar;
  }
}
