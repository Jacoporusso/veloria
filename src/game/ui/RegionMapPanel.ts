import '../../region-map.css';
import { deriveAtlasState, regionAtlas } from '../../core/world/region-atlas.ts';
import type { GameSave } from '../../persistence/save-types.ts';
import { publicAssetUrl } from '../../core/assets/index.ts';
import { specialEncounterCatalog } from '../maps/special-encounter-registry.ts';
import { specialEncounterDiscoveryState } from '../../core/encounters/special-encounter.ts';
import { battleSpecies, encounterCatalog } from '../battle/catalog.ts';
import { pokemonRewardsAt } from '../journey/pokemon-reward-guidance.ts';
import { atlasBackground, loadAtlasDiscoveries, loadAtlasTiled, type AtlasDiscovery } from './atlas-discoveries.ts';

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
  private readonly loadingStatus = html('p', 'region-map-catalog-status');
  private readonly controller = new AbortController();
  private focusBeforeOpen?: HTMLElement;
  private state?: ReturnType<typeof deriveAtlasState>;
  private save?: Pick<GameSave, 'player' | 'flags'> & Partial<Pick<GameSave, 'inventory'>>;
  private chart?: SVGSVGElement;
  private zoom = 1;
  private discoveries: AtlasDiscovery[] = [];
  private discoveryReady: Promise<void> = Promise.resolve();
  private target?: AtlasDiscovery;
  private category?: AtlasDiscovery['kind'];
  private request = 0;
  private focusRequest = 0;
  private readonly resizeObserver = new ResizeObserver(() => {
    if (this.isOpen) {
      this.setZoom(this.zoom);
      if (this.target) this.centerTarget();
    }
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
      ['Tutti i punti', 'Mostra tutta la regione', () => this.showOverview()],
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
    const legend = html('div', 'region-map-legend');
    legend.setAttribute('aria-label', 'Filtra i punti sulla mappa');
    for (const [kind, label] of [['gift', '🎁 Doni'], ['fishing', '🎣 Pesca'], ['encounter', '✦ Incontri']] as const) {
      const button = html('button', '', label);
      button.type = 'button'; button.dataset.kind = kind; button.setAttribute('aria-pressed', 'false');
      button.onclick = () => {
        this.showOverview(); this.category = kind;
        this.dialog.classList.add('has-category-filter');
        for (const item of legend.querySelectorAll('button')) item.setAttribute('aria-pressed', String(item.dataset.kind === kind));
        this.renderDiscoveryPins();
        this.setZoom(1);
        this.renderCategoryDetails(label);
      };
      legend.append(button);
    }
    const note = html('p', 'region-map-note', 'Scorri la mappa e tocca un luogo. Le aree in preparazione non sono ancora giocabili.');
    const body = html('div', 'region-map-body');
    const mapColumn = html('div', 'region-map-chart-column');
    const side = html('aside', 'region-map-sidebar');
    this.loadingStatus.setAttribute('role', 'status');
    mapColumn.append(this.viewport, controls, legend, this.loadingStatus);
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

  open(save: Pick<GameSave, 'player' | 'flags'> & Partial<Pick<GameSave, 'inventory'>>, mapId?: string, discoveryId?: string): void {
    if (!this.isOpen) this.focusBeforeOpen = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.save = save;
    this.category = undefined;
    this.dialog.classList.remove('has-category-filter');
    this.target = undefined;
    this.discoveries = [];
    this.loadingStatus.hidden = false;
    this.loadingStatus.textContent = 'Caricamento di doni, pesca e incontri…';
    const request = ++this.request;
    this.state = deriveAtlasState(save);
    const current = this.state.areas.find(area => area.current);
    this.location.textContent = `Sei qui: ${current?.name ?? 'Posizione non disponibile'}`;
    this.select.replaceChildren(...this.state.areas.map(area => {
      const option = document.createElement('option');
      option.value = area.id; option.textContent = `${area.name} · ${area.status}`; return option;
    }));
    this.renderChart(); this.overlay.hidden = false; this.setZoom(1);
    const requested = mapId ? this.state.areas.find(area => area.mapIds.includes(mapId)) : undefined;
    this.showArea(requested?.id ?? current?.id ?? regionAtlas.areas[0].id, discoveryId);
    if (requested) { this.setZoom(this.viewport.clientWidth < 540 ? 3 : 1.5); this.centerArea(requested.id); }
    else if (this.viewport.clientWidth < 540) this.showCurrent();
    this.closeButton.focus();
    const focusRequest = this.focusRequest;
    this.discoveryReady = loadAtlasDiscoveries(save.flags, save.player.mapId).then(({ points, incomplete }) => {
      if (request !== this.request) return;
      this.discoveries = points;
      this.loadingStatus.hidden = !incomplete;
      this.loadingStatus.textContent = incomplete ? 'Alcuni punti non sono disponibili. Riapri la mappa per riprovare.' : '';
      this.renderDiscoveryPins();
      if (this.category) this.renderCategoryDetails();
      if (discoveryId && focusRequest === this.focusRequest) void this.focusDiscovery(discoveryId);
    }).catch(() => {
      if (request === this.request) {
        this.loadingStatus.hidden = false;
        this.loadingStatus.textContent = 'Non riesco a caricare i punti. Chiudi e riapri la mappa per riprovare.';
      }
    });
  }

  close(): void {
    if (!this.isOpen) return;
    this.overlay.hidden = true;
    this.request++; this.focusRequest++;
    this.focusBeforeOpen?.focus();
  }

  destroy(): void { this.close(); this.resizeObserver.disconnect(); this.controller.abort(); this.overlay.remove(); }

  private showArea(id: string, discoveryId?: string): void {
    const area = this.state?.areas.find(item => item.id === id);
    if (!area) return;
    this.focusRequest++;
    this.category = undefined; this.dialog.classList.remove('has-category-filter');
    for (const button of this.dialog.querySelectorAll('.region-map-legend button')) button.setAttribute('aria-pressed', 'false');
    if (this.target) { this.target = undefined; this.renderChart(); this.setZoom(1); }
    this.select.value = id;
    const title = html('h3', '', area.name);
    const state = html('strong', 'region-map-state', area.status);
    const description = html('p', '', area.description);
    const gym = area.gym ? html('p', '', `Palestra · tappa ${area.gym}`) : undefined;
    const gifts = pokemonRewardsAt(area.mapIds, this.save?.flags ?? []);
    const encounters = Object.values(specialEncounterCatalog).filter(item => area.mapIds.includes(item.mapId));
    const fishingTarget = this.discoveries.find(point => point.id === discoveryId && point.kind === 'fishing');
    const questTarget = this.discoveries.find(point => point.id === discoveryId && point.kind === 'quest');
    const focused = Boolean(fishingTarget || questTarget) || gifts.some(reward => reward.guide.questId === discoveryId) || encounters.some(encounter => encounter.id === discoveryId);
    this.dialog.classList.toggle('has-discovery-target', focused);
    this.details.replaceChildren(...(!focused ? [title, state, description, ...(gym ? [gym] : [])] : []));
    this.details.closest<HTMLElement>('.region-map-sidebar')!.scrollTop = 0;
    if (questTarget) {
      const card = html('section', 'region-map-discovery'); card.setAttribute('aria-label', `Missione: ${questTarget.name}`);
      card.append(html('h4', '', `◆ ${questTarget.name}`), html('p', '', `Prossimo obiettivo: ${questTarget.objectName}`), html('p', '', questTarget.location));
      this.details.append(card);
    }
    if (this.hasFishing(area.mapIds) && (!focused || fishingTarget)) {
      const fishing = html('section', 'region-map-discovery');
      fishing.setAttribute('aria-label', 'Punti pesca');
      fishing.append(html('h4', '', '🎣 Punti pesca'), html('p', '',
        this.save?.inventory?.['old-rod']
          ? 'Canna pronta. Cerca il simbolo 🎣 PESCA sul posto, fermati accanto rivolto verso di esso e premi A.'
          : 'Serve la Canna da pesca: parla con la Capitana Marina a Portolume. Sul posto cerca il simbolo 🎣 PESCA.'));
      this.details.append(fishing);
      for (const point of this.discoveries.filter(point => point.kind === 'fishing' && area.mapIds.includes(point.mapId) && (!focused || point.id === discoveryId))) {
        fishing.append(this.locateButton(point.id, `🎣 ${point.name}`));
      }
    }
    for (const reward of gifts.filter(reward => !focused || reward.guide.questId === discoveryId)) {
      const card = html('section', 'region-map-discovery');
      card.setAttribute('aria-label', `Pokémon in dono: ${reward.name}`);
      card.append(html('h4', '', `🎁 ${reward.name} · ${reward.location}`), html('strong', 'region-map-state', reward.status));
      if (reward.state !== 'received') card.append(html('p', '', reward.guide.actionHint), html('p', '', reward.guide.unlockHint),
        html('p', '', reward.guide.routeHint));
      this.details.append(card);
      card.append(this.locateButton(reward.guide.questId, `Mostra il punto di ${reward.name}`));
    }
    for (const encounter of encounters.filter(encounter => !focused || encounter.id === discoveryId)) {
      const encounterState = specialEncounterDiscoveryState(encounter, this.save?.flags ?? []);
      const card = html('section', 'region-map-discovery');
      card.setAttribute('aria-label', `Incontro con ${battleSpecies[encounter.speciesId].name}`);
      card.append(html('h4', '', `✦ ${battleSpecies[encounter.speciesId].name} · Lv.${encounter.level}`),
        html('strong', 'region-map-state', encounterState === 'caught' ? 'Catturato ✓' : encounterState === 'locked' ? 'Da sbloccare' : 'Da raggiungere'));
      if (encounterState !== 'caught') card.append(html('p', '', encounter.unlockHint), html('p', '', encounter.routeHint),
        html('p', '', 'Fermati accanto al Pokémon, rivolto verso di lui: premi A e scegli INCONTRA.'));
      this.details.append(card);
      card.append(this.locateButton(encounter.id, `Mostra il punto di ${battleSpecies[encounter.speciesId].name}`));
    }
    for (const node of this.chart?.querySelectorAll('[data-area]') ?? []) node.setAttribute('aria-pressed', String(node.getAttribute('data-area') === id));
  }

  private renderCategoryDetails(label?: string): void {
    const title = label ?? (this.category === 'gift' ? '🎁 Doni' : this.category === 'fishing' ? '🎣 Pesca' : '✦ Incontri');
    const points = this.discoveries.filter(point => point.kind === this.category);
    this.details.replaceChildren(html('h3', '', title), html('p', '', `${points.length} punti. Tocca un simbolo o scegli qui sotto per vedere la posizione esatta.`));
    for (const point of points) this.details.append(this.locateButton(point.id, `${point.icon} ${point.name} · ${point.location}`));
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
    if (this.chart) {
      const box = this.chart.viewBox.baseVal;
      const width = this.category
        ? Math.min(this.viewport.clientWidth, this.viewport.clientHeight * box.width / box.height) * zoom
        : Math.max(this.viewport.clientWidth * zoom, this.viewport.clientHeight * box.width / box.height);
      this.chart.style.width = `${width}px`;
      this.sizePins();
    }
    if (this.chart && previousWidth) this.viewport.scrollTo({ left: centerX * this.chart.clientWidth - this.viewport.clientWidth / 2, top: centerY * this.chart.clientWidth - this.viewport.clientHeight / 2, behavior: 'instant' });
  }

  private showCurrent(): void {
    const current = this.state?.areas.find(area => area.current);
    if (!current) return;
    this.location.textContent = `Sei qui: ${current.name}`;
    this.showArea(current.id); this.setZoom(this.viewport.clientWidth < 540 ? 3 : 1.5);
    this.centerArea(current.id);
  }

  private centerArea(id: string): void {
    const area = this.state?.areas.find(item => item.id === id);
    if (!area) return;
    const chart = this.chart;
    requestAnimationFrame(() => {
      if (!this.isOpen || !this.chart || this.chart !== chart) return;
      this.viewport.scrollTo({ left: area.x / regionAtlas.width * this.chart.clientWidth - this.viewport.clientWidth / 2,
        top: area.y / regionAtlas.height * this.chart.clientHeight - this.viewport.clientHeight / 2, behavior: 'instant' });
    });
  }

  private renderChart(): void {
    const chart = svg('svg', { viewBox: `0 0 ${regionAtlas.width} ${regionAtlas.height}`, class: 'region-map-chart', role: 'group', 'aria-label': 'Luoghi e collegamenti di Veloria' });
    chart.append(svg('image', { href: publicAssetUrl('assets/ui/veloria-region-atlas-v1.webp', import.meta.env.BASE_URL), x: '0', y: '0', width: String(regionAtlas.width), height: String(regionAtlas.height), preserveAspectRatio: 'none', 'aria-hidden': 'true' }));
    chart.append(svg('rect', { width: String(regionAtlas.width), height: String(regionAtlas.height), class: 'region-map-shade', 'aria-hidden': 'true' }));
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
      const shortName = area.kind === 'route' ? area.name.split(' · ')[0] : area.name;
      node.append(svg('text', { 'text-anchor': 'middle', y: '34', class: 'region-map-label' }, shortName));
      node.addEventListener('click', () => this.showArea(area.id));
      node.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); this.showArea(area.id); } });
      chart.append(node);
    }
    this.chart = chart; this.viewport.replaceChildren(chart);
    this.renderDiscoveryPins();
  }

  private locateButton(id: string, label: string): HTMLButtonElement {
    const button = html('button', 'region-map-locate', label); button.type = 'button';
    button.onclick = () => { void this.focusDiscovery(id); };
    return button;
  }

  private showOverview(): void {
    this.category = undefined; this.dialog.classList.remove('has-category-filter');
    for (const button of this.dialog.querySelectorAll('.region-map-legend button')) button.setAttribute('aria-pressed', 'false');
    this.focusRequest++; this.target = undefined;
    this.renderChart(); this.showArea(this.select.value); this.setZoom(1);
    const current = this.state?.areas.find(area => area.current);
    this.location.textContent = `Sei qui: ${current?.name ?? 'Posizione non disponibile'}`;
  }

  private pin(point: AtlasDiscovery): SVGGElement {
    const kind = point.kind === 'gift' ? 'Dono' : point.kind === 'fishing' ? 'Pesca' : point.kind === 'quest' ? 'Missione' : 'Incontro';
    const pin = svg('g', { class: 'region-map-discovery-pin', role: 'button', tabindex: '0',
      'data-discovery-id': point.id, 'data-kind': point.kind, 'aria-label': `${kind}: ${point.name} · ${point.location}` });
    pin.append(svg('circle', { class: 'region-map-pin-hit' }), svg('circle', { class: 'region-map-pin-disc' }),
      svg('text', { class: 'region-map-pin-icon', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, point.icon));
    pin.addEventListener('click', () => { void this.focusDiscovery(point.id); });
    pin.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); void this.focusDiscovery(point.id); }
    });
    return pin;
  }

  private renderDiscoveryPins(): void {
    if (!this.chart || this.target) return;
    this.chart.querySelectorAll('.region-map-discovery-pin').forEach(node => node.remove());
    for (const area of this.state?.areas ?? []) {
      const points = this.discoveries.filter(point => point.kind !== 'quest' && (!this.category || point.kind === this.category) && area.mapIds.includes(point.mapId));
      points.forEach((point, index) => {
        const pin = this.pin(point);
        pin.dataset.regionX = String(area.x); pin.dataset.regionY = String(area.y);
        pin.dataset.offset = String(index - (points.length - 1) / 2);
        this.chart!.append(pin);
      });
    }
    this.sizePins();
  }

  private sizePins(): void {
    if (!this.chart?.clientWidth) return;
    const unit = this.chart.viewBox.baseVal.width / this.chart.clientWidth;
    this.chart.style.setProperty('--pin-radius', `${18 * unit}px`);
    this.chart.style.setProperty('--pin-hit', `${23 * unit}px`);
    this.chart.style.setProperty('--pin-font', `${20 * unit}px`);
    for (const pin of this.chart.querySelectorAll('.region-map-discovery-pin')) {
      pin.querySelector('.region-map-pin-hit')?.setAttribute('r', String(23 * unit));
      pin.querySelector('.region-map-pin-disc')?.setAttribute('r', String(18 * unit));
    }
    for (const pin of this.chart.querySelectorAll<SVGGElement>('.region-map-discovery-pin[data-region-x]')) {
      const margin = 24 * unit, box = this.chart.viewBox.baseVal;
      const x = Math.max(margin, Math.min(box.width - margin, Number(pin.dataset.regionX) + Number(pin.dataset.offset) * 44 * unit));
      const y = Math.max(margin, Math.min(box.height - margin, Number(pin.dataset.regionY) - 42 * unit));
      pin.setAttribute('transform', `translate(${x} ${y})`);
    }
  }

  private async focusDiscovery(id: string): Promise<void> {
    const focusRequest = ++this.focusRequest;
    await this.discoveryReady;
    if (focusRequest !== this.focusRequest || !this.isOpen) return;
    const target = this.discoveries.find(point => point.id === id);
    if (!target || !this.isOpen) return;
    const area = this.state?.areas.find(area => area.mapIds.includes(target.mapId));
    if (!area) return;
    this.showArea(area.id, id); this.target = target;
    const request = ++this.focusRequest;
    let tiled: Awaited<ReturnType<typeof loadAtlasTiled>>;
    try { tiled = await loadAtlasTiled(target.mapId); }
    catch {
      if (request === this.focusRequest && this.isOpen) {
        this.chart = undefined;
        this.viewport.replaceChildren(html('p', 'region-map-load-status', 'La pianta del luogo non è disponibile.'));
        this.details.append(this.locateButton(id, 'Riprova a caricare il punto'));
      }
      return;
    }
    if (request !== this.focusRequest || !this.isOpen) return;
    const width = tiled.width * tiled.tilewidth, height = tiled.height * tiled.tileheight;
    const chart = svg('svg', { viewBox: `0 0 ${width} ${height}`, class: 'region-map-chart region-map-local',
      role: 'group', 'aria-label': `Punto esatto: ${target.name} · ${target.location}`, 'data-map-id': target.mapId });
    const background = atlasBackground(target.mapId, tiled);
    if (background) chart.append(svg('image', { href: publicAssetUrl(background, import.meta.env.BASE_URL), width: String(width), height: String(height), preserveAspectRatio: 'none', 'aria-hidden': 'true' }));
    chart.append(svg('rect', { width: String(width), height: String(height), class: 'region-map-shade', 'aria-hidden': 'true' }));
    const pin = this.pin(target); pin.classList.add('region-map-local-target');
    pin.dataset.area = area.id; pin.dataset.mapX = String(target.x); pin.dataset.mapY = String(target.y);
    pin.setAttribute('transform', `translate(${target.x} ${target.y})`); chart.append(pin);
    this.chart = chart; this.viewport.replaceChildren(chart); this.dialog.classList.add('has-discovery-target');
    this.location.textContent = `${target.icon} ${target.objectName} · ${target.location}`;
    this.setZoom(1);
    this.centerTarget();
  }

  private centerTarget(): void {
    const chart = this.chart, target = this.target;
    if (!chart || !target) return;
    requestAnimationFrame(() => {
      if (!this.isOpen || this.chart !== chart || this.target !== target) return;
      const box = chart.viewBox.baseVal;
      this.viewport.scrollTo({ left: target.x / box.width * chart.clientWidth - this.viewport.clientWidth / 2,
        top: target.y / box.height * chart.clientHeight - this.viewport.clientHeight / 2, behavior: 'instant' });
    });
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.isOpen) return;
    if (event.key === 'Escape' || (event.key.toLowerCase() === 'b' && event.target !== this.select)) { event.preventDefault(); event.stopImmediatePropagation(); this.close(); return; }
    if (event.key === 'Tab') {
      const nodes = Array.from(this.dialog.querySelectorAll<HTMLElement>('[tabindex="0"], button, select'))
        .filter(node => node.getClientRects().length > 0);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  };
}
