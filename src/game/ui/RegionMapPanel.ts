import '../../region-map.css';
import { deriveAtlasState, regionAtlas } from '../../core/world/region-atlas.ts';
import type { GameSave } from '../../persistence/save-types.ts';
import { publicAssetUrl } from '../../core/assets/index.ts';
import { specialEncounterCatalog } from '../maps/special-encounter-registry.ts';
import { specialEncounterDiscoveryState } from '../../core/encounters/special-encounter.ts';
import { battleSpecies, encounterCatalog } from '../battle/catalog.ts';

const ns = 'http://www.w3.org/2000/svg';
function html<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string>, text?: string) {
  const element = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (text !== undefined) element.textContent = text;
  return element;
}

/** An illustrated atlas: inspecting a destination never moves the player. */
export class RegionMapPanel {
  private readonly overlay = html('div', 'region-map-overlay');
  private readonly dialog = html('section', 'region-map-dialog');
  private readonly viewport = html('div', 'region-map-viewport');
  private readonly details = html('section', 'region-map-details');
  private readonly location = html('p', 'region-map-location');
  private readonly select = html('select', 'region-map-select');
  private readonly closeButton = html('button', 'region-map-close', 'Chiudi ×');
  private readonly controller = new AbortController();
  private focusBeforeOpen?: HTMLElement;
  private state?: ReturnType<typeof deriveAtlasState>;
  private save?: Pick<GameSave, 'player' | 'flags'> & Partial<Pick<GameSave, 'inventory'>>;
  private chart?: SVGSVGElement;
  private zoom = 1;
  private readonly resizeObserver = new ResizeObserver(() => {
    if (this.isOpen) this.setZoom(this.zoom);
  });

  get isOpen(): boolean { return !this.overlay.hidden; }

  constructor(stage: HTMLElement = document.querySelector<HTMLElement>('.game-stage') ?? document.body) {
    this.overlay.hidden = true;
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.addEventListener('keydown', event => event.stopPropagation());
    this.dialog.setAttribute('aria-modal', 'true');
    this.dialog.setAttribute('aria-labelledby', 'region-map-title');
    const header = html('header', 'region-map-header');
    const title = html('h2', '', 'Esplora Veloria');
    title.id = 'region-map-title';
    this.closeButton.type = 'button';
    this.closeButton.addEventListener('click', () => this.close());
    header.append(title, this.closeButton);
    const controls = html('div', 'region-map-tools');
    for (const [label, aria, action] of [
      ['−', 'Riduci mappa', () => this.setZoom(Math.max(1, this.zoom - 0.5))],
      ['+', 'Ingrandisci mappa', () => this.setZoom(Math.min(3, this.zoom + 0.5))],
      ['Panoramica', 'Mostra tutta la regione', () => this.setZoom(1)],
      ['Sei qui', 'Mostra la tua posizione', () => this.showCurrent()],
    ] as const) {
      const button = html('button', '', label);
      button.type = 'button'; button.setAttribute('aria-label', aria);
      button.addEventListener('click', action); controls.append(button);
    }
    this.select.setAttribute('aria-label', 'Scegli un luogo da conoscere');
    this.select.addEventListener('change', () => { this.showArea(this.select.value); this.centerArea(this.select.value); });
    this.viewport.tabIndex = 0;
    this.viewport.setAttribute('aria-label', 'Mappa di Veloria. Ingrandisci e scorri per esplorare.');
    this.details.setAttribute('aria-live', 'polite');
    const legend = html('p', 'region-map-legend', '● Sei qui   ✓ Visitato   🎣 Pesca   ✦ Incontro');
    const note = html('p', 'region-map-note', 'Scorri la mappa e tocca un luogo. Le aree in preparazione non sono ancora giocabili.');
    const body = html('div', 'region-map-body');
    const mapColumn = html('div', 'region-map-chart-column');
    const side = html('aside', 'region-map-sidebar');
    mapColumn.append(this.viewport, controls, legend);
    header.insertBefore(this.location, this.closeButton);
    side.append(this.select, this.details, note);
    body.append(mapColumn, side);
    this.dialog.append(header, body); this.overlay.append(this.dialog); stage.append(this.overlay);
    this.resizeObserver.observe(this.viewport);
    this.overlay.addEventListener('click', event => { if (event.target === this.overlay) this.close(); });
    this.overlay.addEventListener('keydown', event => event.stopPropagation());
    for (const type of ['pointerdown', 'pointerup', 'touchstart', 'touchend']) this.overlay.addEventListener(type, event => event.stopPropagation());
    document.addEventListener('keydown', this.onKeyDown, { capture: true, signal: this.controller.signal });
  }

  open(save: Pick<GameSave, 'player' | 'flags'> & Partial<Pick<GameSave, 'inventory'>>, mapId?: string): void {
    if (!this.isOpen) this.focusBeforeOpen = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.save = save;
    this.state = deriveAtlasState(save);
    const current = this.state.areas.find(area => area.current);
    this.location.textContent = `Sei qui: ${current?.name ?? 'Posizione non disponibile'}`;
    this.select.replaceChildren(...this.state.areas.map(area => {
      const option = document.createElement('option');
      option.value = area.id; option.textContent = `${area.name} · ${area.status}`; return option;
    }));
    this.renderChart(); this.overlay.hidden = false; this.setZoom(1);
    const requested = mapId ? this.state.areas.find(area => area.mapIds.includes(mapId)) : undefined;
    this.showArea(requested?.id ?? current?.id ?? regionAtlas.areas[0].id);
    if (requested) { this.setZoom(this.viewport.clientWidth < 540 ? 3 : 1.5); this.centerArea(requested.id); }
    else if (this.viewport.clientWidth < 540) this.showCurrent();
    this.closeButton.focus();
  }

  close(): void {
    if (!this.isOpen) return;
    this.overlay.hidden = true;
    this.focusBeforeOpen?.focus();
  }

  destroy(): void { this.close(); this.resizeObserver.disconnect(); this.controller.abort(); this.overlay.remove(); }

  private showArea(id: string): void {
    const area = this.state?.areas.find(item => item.id === id);
    if (!area) return;
    this.select.value = id;
    const title = html('h3', '', area.name);
    const state = html('strong', 'region-map-state', area.status);
    const description = html('p', '', area.description);
    const gym = area.gym ? html('p', '', `Palestra · tappa ${area.gym}`) : undefined;
    this.details.replaceChildren(title, state, description, ...(gym ? [gym] : []));
    if (this.hasFishing(area.mapIds)) {
      const fishing = html('section', 'region-map-discovery');
      fishing.setAttribute('aria-label', 'Punti pesca');
      fishing.append(html('h4', '', '🎣 Punti pesca'), html('p', '',
        this.save?.inventory?.['old-rod']
          ? 'Canna pronta. Cerca il simbolo 🎣 PESCA sul posto, fermati accanto rivolto verso di esso e premi A.'
          : 'Serve la Canna da pesca: parla con la Capitana Marina a Portolume. Sul posto cerca il simbolo 🎣 PESCA.'));
      this.details.append(fishing);
    }
    for (const encounter of Object.values(specialEncounterCatalog).filter(item => area.mapIds.includes(item.mapId))) {
      const encounterState = specialEncounterDiscoveryState(encounter, this.save?.flags ?? []);
      const card = html('section', 'region-map-discovery');
      card.setAttribute('aria-label', `Incontro con ${battleSpecies[encounter.speciesId].name}`);
      card.append(html('h4', '', `✦ ${battleSpecies[encounter.speciesId].name} · Lv.${encounter.level}`),
        html('strong', 'region-map-state', encounterState === 'caught' ? 'Catturato ✓' : encounterState === 'locked' ? 'Da sbloccare' : 'Da raggiungere'));
      if (encounterState !== 'caught') card.append(html('p', '', encounter.unlockHint), html('p', '', encounter.routeHint),
        html('p', '', 'Fermati accanto al Pokémon, rivolto verso di lui: premi A e scegli INCONTRA.'));
      this.details.append(card);
    }
    for (const node of this.chart?.querySelectorAll('[data-area]') ?? []) node.setAttribute('aria-pressed', String(node.getAttribute('data-area') === id));
  }

  private hasFishing(mapIds: readonly string[]): boolean {
    return Object.values(encounterCatalog).some(table => table.method === 'fishing' && mapIds.includes(table.mapId));
  }

  private setZoom(zoom: number): void {
    const previousWidth = this.chart?.clientWidth ?? 0;
    const centerX = previousWidth ? (this.viewport.scrollLeft + this.viewport.clientWidth / 2) / previousWidth : .5;
    const centerY = previousWidth ? (this.viewport.scrollTop + this.viewport.clientHeight / 2) / previousWidth : .5;
    this.zoom = zoom;
    // Keep terrain under the full viewport in either orientation. The atlas can
    // be panned horizontally in portrait, instead of leaving an empty sea panel.
    if (this.chart) this.chart.style.width = `${Math.max(this.viewport.clientWidth * zoom, this.viewport.clientHeight * regionAtlas.width / regionAtlas.height)}px`;
    if (this.chart && previousWidth) this.viewport.scrollTo({ left: centerX * this.chart.clientWidth - this.viewport.clientWidth / 2, top: centerY * this.chart.clientWidth - this.viewport.clientHeight / 2, behavior: 'instant' });
  }

  private showCurrent(): void {
    const current = this.state?.areas.find(area => area.current);
    if (!current) return;
    this.showArea(current.id); this.setZoom(this.viewport.clientWidth < 540 ? 3 : 1.5);
    this.centerArea(current.id);
  }

  private centerArea(id: string): void {
    const area = this.state?.areas.find(item => item.id === id);
    if (!area) return;
    requestAnimationFrame(() => {
      if (!this.isOpen || !this.chart) return;
      this.viewport.scrollTo({ left: area.x / regionAtlas.width * this.chart.clientWidth - this.viewport.clientWidth / 2,
        top: area.y / regionAtlas.height * this.chart.clientHeight - this.viewport.clientHeight / 2, behavior: 'instant' });
    });
  }

  private renderChart(): void {
    const chart = svg('svg', { viewBox: `0 0 ${regionAtlas.width} ${regionAtlas.height}`, class: 'region-map-chart', role: 'group', 'aria-label': 'Luoghi e collegamenti di Veloria' });
    chart.append(svg('image', { href: publicAssetUrl('assets/ui/veloria-region-atlas-v1.webp', import.meta.env.BASE_URL), x: '0', y: '0', width: String(regionAtlas.width), height: String(regionAtlas.height), preserveAspectRatio: 'none', 'aria-hidden': 'true' }));
    const byId = new Map(this.state!.areas.map(area => [area.id, area]));
    // Only existing paths are traced; the illustration carries the rest of the geography.
    for (const [from, to] of regionAtlas.connections) {
      const a = byId.get(from)!; const b = byId.get(to)!;
      if (!a.available || !b.available) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      chart.append(svg('path', { d: `M${a.x} ${a.y} C${a.x + dx * .25 - dy * .12} ${a.y + dy * .25 + dx * .12},${b.x - dx * .25 - dy * .12} ${b.y - dy * .25 + dx * .12},${b.x} ${b.y}`, class: 'region-map-path is-built' }));
    }
    for (const area of this.state!.areas) {
      const node = svg('g', { transform: `translate(${area.x} ${area.y})`, class: `region-map-node ${area.current ? 'is-current' : area.visited ? 'is-visited' : ''} ${area.available ? '' : 'is-planned'}`, role: 'button', tabindex: '0', 'data-area': area.id, 'aria-label': `${area.name}, ${area.status}`, 'aria-pressed': 'false' });
      node.append(svg('circle', { r: '30', class: 'region-map-hit' }));
      if (area.current) node.append(svg('circle', { r: '22', class: 'region-map-pulse' }));
      node.append(svg('circle', { r: area.current ? '13' : area.visited ? '9' : '6', class: 'region-map-dot' }));
      node.append(svg('text', { 'text-anchor': 'middle', y: '5', class: 'region-map-symbol' }, area.current ? '●' : area.visited ? '✓' : ''));
      const availableEncounter = Object.values(specialEncounterCatalog).some(encounter => area.mapIds.includes(encounter.mapId) &&
        specialEncounterDiscoveryState(encounter, this.save?.flags ?? []) === 'available');
      if (this.hasFishing(area.mapIds) || availableEncounter) node.append(svg('text', {
        x: '15', y: '-12', class: 'region-map-discovery-symbol', 'aria-hidden': 'true',
      }, this.hasFishing(area.mapIds) ? '🎣' : '✦'));
      const shortName = area.kind === 'route' ? area.name.split(' · ')[0] : area.name;
      node.append(svg('text', { 'text-anchor': 'middle', y: '34', class: 'region-map-label' }, shortName));
      node.addEventListener('click', () => this.showArea(area.id));
      node.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); this.showArea(area.id); } });
      chart.append(node);
    }
    this.chart = chart; this.viewport.replaceChildren(chart);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.isOpen) return;
    if (event.key === 'Escape' || (event.key.toLowerCase() === 'b' && event.target !== this.select)) { event.preventDefault(); event.stopImmediatePropagation(); this.close(); return; }
    if (event.key === 'Tab') {
      const nodes = Array.from(this.dialog.querySelectorAll<HTMLElement>('[tabindex="0"], button, select'));
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  };
}
