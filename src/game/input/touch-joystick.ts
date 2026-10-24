type Direction = 'up' | 'down' | 'left' | 'right';

/** Cardinal movement keeps the existing map collisions and walking speed. */
export function joystickDirection(x: number, y: number, deadZone = 12): Direction | null {
  if (Math.hypot(x, y) < deadZone) return null;
  return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
}

export class TouchJoystick {
  private readonly abort = new AbortController();
  private readonly stick = document.querySelector<HTMLButtonElement>('.movement-stick');
  private pointer: number | null = null;
  private direction: Direction | null = null;
  private readonly change: (direction: Direction | null) => void;

  constructor(change: (direction: Direction | null) => void) {
    this.change = change;
    const signal = this.abort.signal;
    const setting = document.querySelector<HTMLSelectElement>('#movement-control');
    let preference = 'buttons';
    try { preference = localStorage.getItem('veloria-movement-control') ?? preference; } catch { /* Session preference works without storage. */ }
    if (setting) {
      setting.value = preference === 'joystick' ? 'joystick' : 'buttons';
      const apply = () => {
        this.reset();
        const enabled = setting.value === 'joystick';
        document.querySelector('.game-footer')?.classList.toggle('uses-joystick', enabled);
        if (this.stick) this.stick.hidden = !enabled;
      };
      apply();
      setting.addEventListener('change', () => {
        apply();
        try { localStorage.setItem('veloria-movement-control', setting.value); } catch { /* Keep the selection for this session. */ }
      }, { signal });
    }
    this.stick?.addEventListener('pointerdown', event => {
      if (this.pointer !== null || event.button !== 0) return;
      event.preventDefault();
      this.pointer = event.pointerId;
      this.stick!.setPointerCapture(event.pointerId);
      this.move(event);
    }, { signal });
    this.stick?.addEventListener('pointermove', event => this.move(event), { signal });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      this.stick?.addEventListener(name, event => { if (event.pointerId === this.pointer) this.reset(); }, { signal });
    }
    this.stick?.addEventListener('touchstart', event => event.preventDefault(), { passive: false, signal });
    window.addEventListener('blur', () => this.reset(), { signal });
    window.addEventListener('resize', () => this.reset(), { signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.reset(); }, { signal });
  }

  private move(event: PointerEvent): void {
    if (event.pointerId !== this.pointer || !this.stick) return;
    event.preventDefault();
    const rect = this.stick.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(x, y);
    const scale = distance > 32 ? 32 / distance : 1;
    this.stick.style.setProperty('--stick-x', `${x * scale}px`);
    this.stick.style.setProperty('--stick-y', `${y * scale}px`);
    const direction = joystickDirection(x, y);
    if (direction !== this.direction) { this.direction = direction; this.change(direction); }
  }

  reset(): void {
    const pointer = this.pointer;
    this.pointer = null;
    if (pointer !== null && this.stick?.hasPointerCapture(pointer)) this.stick.releasePointerCapture(pointer);
    this.stick?.style.removeProperty('--stick-x');
    this.stick?.style.removeProperty('--stick-y');
    if (this.direction !== null) { this.direction = null; this.change(null); }
  }

  destroy(): void { this.reset(); this.abort.abort(); }
}
