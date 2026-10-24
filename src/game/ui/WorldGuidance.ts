import type Phaser from 'phaser';
import { placeGuidance, type ScreenRect } from './guidance-placement.ts';
import '../../world-guidance.css';

const HUD = '.game-header, .journey-trigger, .journey-reward:not([hidden]), .dpad, .movement-stick, .touch-actions, .interaction-prompt:not([hidden]), .toast.visible, .dev-preview-banner';

/** DOM text stays sharp at native display density; projection follows the rendered camera. */
export class WorldGuidance {
  readonly element = document.createElement('div');
  private target?: ScreenRect;

  constructor(private readonly stage: HTMLElement) {
    this.element.className = 'world-guidance';
    this.element.hidden = true;
    this.element.setAttribute('aria-hidden', 'true');
    stage.append(this.element);
  }

  setTarget(label: string, target: ScreenRect): void {
    this.element.textContent = label;
    this.target = target;
  }

  clear(): void { this.target = undefined; this.element.hidden = true; }

  render(camera: Phaser.Cameras.Scene2D.Camera, canvas: HTMLCanvasElement, visible: boolean, protectedObjects: readonly ScreenRect[] = []): void {
    if (!visible || !this.target) { this.element.hidden = true; return; }
    const stage = this.stage.getBoundingClientRect();
    const surface = canvas.getBoundingClientRect();
    const ratioX = surface.width / canvas.width, ratioY = surface.height / canvas.height;
    // World cameras stay unrotated; use the public inverse projection at the screen origin.
    const origin = camera.getWorldPoint(0, 0);
    const project = (rect: ScreenRect): ScreenRect => ({
      x: surface.left - stage.left + (rect.x - origin.x) * camera.zoom * ratioX,
      y: surface.top - stage.top + (rect.y - origin.y) * camera.zoom * ratioY,
      width: rect.width * camera.zoom * ratioX,
      height: rect.height * camera.zoom * ratioY,
    });
    const target = project(this.target);
    this.element.hidden = false;
    const obstacles = [...document.querySelectorAll<HTMLElement>(HUD)]
      .filter(item => item.getClientRects().length > 0)
      .map(item => {
        const rect = item.getBoundingClientRect();
        return { x: rect.left - stage.left, y: rect.top - stage.top, width: rect.width, height: rect.height };
      });
    obstacles.push(...protectedObjects.map(project));
    const label = this.element.getBoundingClientRect();
    const placement = placeGuidance(target, { width: label.width, height: label.height }, stage, obstacles);
    if (!placement) { this.element.hidden = true; return; }
    this.element.style.left = `${Math.floor(placement.x)}px`;
    this.element.style.top = `${Math.floor(placement.y)}px`;
  }

  destroy(): void { this.element.remove(); }
}
