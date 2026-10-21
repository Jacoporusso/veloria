import '../../evolution-celebration.css';
import { createCreaturePortrait } from '../battle/creature-art.ts';

export interface EvolutionCelebrationArgs {
  fromSpeciesId: number;
  toSpeciesId: number;
  fromName: string;
  toName: string;
  level: number;
  reducedAnimations?: boolean;
  signal?: AbortSignal;
}

/** Presents an evolution already committed by the caller. No game state is changed. */
export function showEvolutionCelebration(args: EvolutionCelebrationArgs): Promise<void> {
  if (args.signal?.aborted) return Promise.resolve();
  return new Promise(resolve => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controller = new AbortController();
    const timers: number[] = [];
    const reduced = args.reducedAnimations || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const node = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) => {
      const el = document.createElement(tag);
      el.className = className;
      if (text !== undefined) el.textContent = text;
      return el;
    };
    const overlay = node('div', 'evolution-celebration');
    overlay.classList.toggle('is-reduced', Boolean(reduced));
    const panel = node('section', 'evolution-celebration__panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'evolution-celebration-title');
    panel.tabIndex = -1;
    const kicker = node('p', 'evolution-celebration__kicker', 'UN LEGAME CHE CRESCE');
    const title = node('h2', 'evolution-celebration__title', 'Sta succedendo qualcosa…');
    title.id = 'evolution-celebration-title';
    title.setAttribute('aria-live', 'polite');
    const stage = node('div', 'evolution-celebration__stage');
    stage.setAttribute('aria-hidden', 'true');
    const oldArt = createCreaturePortrait(args.fromSpeciesId);
    oldArt.classList.add('evolution-celebration__before');
    const newArt = createCreaturePortrait(args.toSpeciesId);
    newArt.classList.add('evolution-celebration__after');
    const halo = node('span', 'evolution-celebration__halo');
    const light = node('span', 'evolution-celebration__light');
    const rays = node('span', 'evolution-celebration__rays');
    const pulse = node('span', 'evolution-celebration__pulse');
    stage.append(halo, rays);
    for (let i = 0; i < 3; i++) {
      const orbit = node('span', 'evolution-celebration__orbit');
      orbit.style.setProperty('--orbit', String(i));
      stage.append(orbit);
    }
    stage.append(oldArt, newArt, light, pulse);
    for (let i = 0; i < 12; i++) {
      const spark = node('i', 'evolution-celebration__spark');
      spark.style.setProperty('--angle', `${i * 30}deg`);
      spark.style.setProperty('--delay', `${i * 65}ms`);
      stage.append(spark);
    }
    const caption = node('p', 'evolution-celebration__caption', `${args.fromName} sta evolvendo.`);
    const action = node('button', 'evolution-celebration__continue', 'Attendi…');
    action.type = 'button';
    action.disabled = !reduced;
    panel.append(kicker, title, stage, caption, action);
    overlay.append(panel);
    document.body.append(overlay);
    let revealed = false;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      timers.forEach(window.clearTimeout);
      controller.abort();
      overlay.remove();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      resolve();
    };
    const reveal = () => {
      if (revealed || finished) return;
      revealed = true;
      overlay.classList.add('is-revealed');
      title.textContent = `Ora è ${args.toName}!`;
      caption.textContent = `${args.fromName} si è evoluto in ${args.toName} · Livello ${args.level}`;
      action.disabled = false;
      action.textContent = 'Continua';
      action.focus({ preventScroll: true });
    };
    const activate = () => {
      if (action.disabled) return;
      if (revealed) finish();
      else reveal();
    };
    action.addEventListener('click', activate, { signal: controller.signal });
    document.addEventListener('keydown', event => {
      event.stopImmediatePropagation();
      if (event.key === 'Tab') {
        event.preventDefault();
        (action.disabled ? panel : action).focus({ preventScroll: true });
      } else if (['Enter', ' ', 'Escape'].includes(event.key)) {
        event.preventDefault();
        if (!event.repeat) activate();
      }
    }, { capture: true, signal: controller.signal });
    for (const name of ['pointerdown', 'pointerup', 'touchstart', 'touchend']) {
      overlay.addEventListener(name, event => event.stopPropagation(), { signal: controller.signal });
    }
    args.signal?.addEventListener('abort', finish, { once: true, signal: controller.signal });
    panel.focus({ preventScroll: true });
    if (reduced) reveal();
    else {
      timers.push(window.setTimeout(() => {
        action.disabled = false;
        action.textContent = 'Salta animazione';
      }, 1000));
      timers.push(window.setTimeout(() => overlay.classList.add('is-transforming'), 1700));
      timers.push(window.setTimeout(() => overlay.classList.add('is-gathered'), 4400));
      timers.push(window.setTimeout(reveal, 6200));
    }
  });
}
