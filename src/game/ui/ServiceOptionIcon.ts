/** Semantic pictograms used by service and shop option buttons. */
export type ServiceOptionIconKind =
  | 'potion'
  | 'antidote'
  | 'pokeball'
  | 'rest'
  | 'storage'
  | 'shop'
  | 'close'
  | 'challenge'
  | 'transit'
  | 'fishing'
  | 'ferry'
  | 'rotate';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Add a decorative, code-drawn icon while keeping the button's text as its accessible name. */
export function decorateServiceOption(button: HTMLButtonElement, kind: ServiceOptionIconKind): void {
  button.classList.add('service-option');
  const icon = document.createElementNS(SVG_NS, 'svg');
  icon.classList.add('service-option__icon', `service-option__icon--${kind}`);
  icon.setAttribute('viewBox', '0 0 40 40');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  const add = (tag: string, attrs: Record<string, string>) => {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
    icon.append(element);
  };
  const path = (d: string, className = 'line') => add('path', { d, class: className });
  const circle = (cx: number, cy: number, r: number, className = 'line') => add('circle', { cx: `${cx}`, cy: `${cy}`, r: `${r}`, class: className });

  if (kind === 'ferry') {
    path('M6 22h28l-6 10H12z', 'fill');
    path('M12 22V12h15v10M19 12V5M19 6h10', 'line');
    path('M4 35q4-4 8 0t8 0t8 0t8 0', 'line');
  } else if (kind === 'fishing') {
    path('M8 32L24 7l5 3-16 25', 'line');
    path('M25 8h8v16a5 5 0 0 1-10 0v-2', 'line');
    path('M4 35h32', 'line');
  } else if (kind === 'rotate') {
    path('M30 15a12 12 0 1 0 1 10M30 6v10H20', 'line');
  } else if (kind === 'potion') {
    path('M15 5h10M17 5v8l-7 8v11h20V21l-7-8V5', 'line');
    path('M12 25h16v7H12z', 'fill');
    path('M20 26v5m-2.5-2.5h5', 'white');
  } else if (kind === 'antidote') {
    path('M15 5h10M17 5v8l-7 8v11h20V21l-7-8V5', 'line');
    path('M12 25h16v7H12z', 'fill');
    path('M16 27l2 2 5-5', 'white');
  } else if (kind === 'pokeball') {
    circle(20, 20, 15, 'ball-white');
    path('M5 20a15 15 0 0 1 30 0H5z', 'red');
    path('M5 20h30', 'dark');
    circle(20, 20, 4.5, 'ball-white');
    circle(20, 20, 1.7, 'dark');
  } else if (kind === 'rest') {
    path('M20 33S6 25 6 15a7 7 0 0 1 13-3 7 7 0 0 1 15 3c0 10-14 18-14 18z', 'red');
    path('M20 8v9m-4.5-4.5h9', 'white');
    path('M31 5v5m-2.5-2.5h5', 'sparkle');
  } else if (kind === 'storage') {
    path('M5 12h30v21H5z', 'fill');
    path('M4 8h32v8H4z', 'top');
    path('M17 21h6v12h-6z', 'white');
  } else if (kind === 'shop') {
    path('M7 16h26v18H7z', 'fill');
    path('M5 6h30l-2 10H7z', 'top');
    path('M12 6v10m8-10v10m8-10v10', 'white');
    path('M17 23h6v11h-6z', 'white');
  } else if (kind === 'close') {
    circle(20, 20, 15, 'fill');
    path('M14 14l12 12m0-12L14 26', 'white');
  } else if (kind === 'transit') {
    path('M7 24V12a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v12H7z', 'transit-body');
    path('M10 12h16v8H10z', 'transit-window');
    path('M7 23h22', 'transit-rail');
    circle(12, 25, 2.2, 'transit-wheel');
    circle(24, 25, 2.2, 'transit-wheel');
    path('M13 29h14', 'transit-track');
  } else {
    path('M20 5l4 9 10 1-7.5 6.5 2.5 10L20 26l-9 5 2.5-10L6 15l10-1z', 'gold');
    path('M20 11v8l6 3', 'white');
    path('M32 7v5m-2.5-2.5h5', 'sparkle');
  }
  button.prepend(icon);
}
