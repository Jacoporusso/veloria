import '../../journey.css';
import type { GameSave } from '../../persistence/save-types.ts';
import type { QuestDefinition } from '../../core/quests/apply-quest-event.ts';
import { questCatalog } from '../quests/catalog.ts';
import itemContent from '../../../content/items/items.v1.json';
import { formatQuestRewards, selectJourneyProgress } from './progress.ts';
import { badgeCatalog, createBadgeEmblem } from '../ui/BadgeEmblem.ts';
import { itemEvolutionRules, battleSpecies, battleMoves } from '../battle/catalog.ts';
import { createCreaturePortrait } from '../battle/creature-art.ts';
import { battleTypeLabel } from '../battle/presentation.ts';
import '../../evolution-item-actions.css';
import { specialEncounterCatalog } from '../maps/special-encounter-registry.ts';
import { getMap } from '../maps/map-registry.ts';
import { specialEncounterDiscoveryState } from '../../core/encounters/special-encounter.ts';
import { describePokemonReward } from './pokemon-reward-guidance.ts';

type NamedQuest = QuestDefinition & { displayName?: string };
const itemNames = Object.fromEntries(Object.entries(itemContent.items).map(([id, item]) => [id, item.name]));

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** HTML presentation adapter. All rewards are already applied by the quest service. */
export class JourneyPanel {
  private readonly root = element('div', 'journey-panel');
  private readonly trigger = element('button', 'journey-trigger');
  private readonly heading = element('span', 'journey-heading');
  private readonly objective = element('span', 'journey-objective');
  private readonly meter = element('span', 'journey-meter-fill');
  private readonly count = element('span', 'journey-count');
  private readonly overlay = element('div', 'journey-overlay');
  private readonly dialog = element('section', 'journey-dialog');
  private readonly contents = element('div', 'journey-contents');
  private readonly reward = element('div', 'journey-reward');
  private readonly closeButton = element('button', 'journey-close', 'Chiudi ×');
  private readonly wallet = element('button', 'wallet-trigger');
  private readonly title = element('h2', 'journey-title', 'Il tuo viaggio');
  private view: 'journal' | 'bag' | 'badges' = 'journal';
  private readonly menuController = new AbortController();
  private readonly celebrated = new Set<string>();
  private celebrationTimer?: ReturnType<typeof setTimeout>;
  private save?: GameSave;
  private focusBeforeOpen?: HTMLElement;

  get isOpen(): boolean { return !this.overlay.hidden; }
  get hasReward(): boolean { return !this.reward.hidden; }

  constructor(stage: HTMLElement, private readonly onUseEvolutionItem?: (itemId: string, creatureId?: string) => void,
    private readonly onShowMap?: (mapId: string, discoveryId?: string) => void) {
    this.contents.tabIndex = 0;
    this.trigger.type = 'button';
    this.trigger.setAttribute('aria-label', 'Apri diario del viaggio');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.trigger.setAttribute('aria-controls', 'journey-journal');
    const eyebrow = element('span', 'journey-eyebrow', 'IL TUO VIAGGIO');
    const top = element('span', 'journey-top');
    top.append(eyebrow, this.count, element('span', 'journey-book', 'Diario ↗'));
    const meter = element('span', 'journey-meter');
    meter.setAttribute('aria-hidden', 'true');
    meter.append(this.meter);
    const symbol = element('span', 'journey-symbol', '✦');
    symbol.setAttribute('aria-hidden', 'true');
    this.trigger.append(symbol, top, this.heading, this.objective, meter);
    this.trigger.addEventListener('click', () => this.open());
    this.overlay.hidden = true;
    this.overlay.addEventListener('click', event => { if (event.target === this.overlay) this.close(); });
    this.dialog.id = 'journey-journal';
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');
    this.dialog.setAttribute('aria-labelledby', 'journey-title');
    this.contents.tabIndex = 0;
    this.contents.setAttribute('role', 'region');
    this.contents.setAttribute('aria-label', 'Tappe e ricompense del viaggio');
    const header = element('header', 'journey-dialog-header');
    this.title.id = 'journey-title';
    this.closeButton.type = 'button';
    this.closeButton.addEventListener('click', () => this.close());
    header.append(this.title, this.closeButton);
    this.dialog.append(header, this.contents);
    this.overlay.append(this.dialog);
    this.reward.hidden = true;
    this.reward.setAttribute('role', 'status');
    this.reward.setAttribute('aria-live', 'polite');
    this.root.append(this.trigger, this.overlay, this.reward);
    for (const event of ['pointerdown', 'pointerup', 'touchstart', 'touchend']) {
      this.root.addEventListener(event, input => input.stopPropagation());
    }
    stage.append(this.root);
    this.wallet.type = 'button';
    this.wallet.title = 'Monete · apri lo zaino';
    this.wallet.setAttribute('aria-controls', 'journey-journal');
    this.wallet.setAttribute('aria-expanded', 'false');
    this.wallet.addEventListener('click', () => this.open('bag'));
    document.querySelector('#badges-button')?.addEventListener('click', () => this.open('badges'), { signal: this.menuController.signal });
    document.querySelector('.header-actions')?.prepend(this.wallet);
    document.addEventListener('keydown', this.onKeyDown, true);
  }

  update(save: GameSave): void {
    this.save = save;
    this.wallet.textContent = `◉ ${save.player.money.toLocaleString('it-IT')}`;
    this.wallet.setAttribute('aria-label', `Apri zaino e dotazioni: ${save.player.money} monete`);
    const progress = selectJourneyProgress(save);
    if (this.heading.textContent !== progress.title && !this.hasReward) this.trigger.classList.remove('is-compact');
    this.heading.textContent = progress.title;
    this.objective.textContent = progress.objective;
    this.count.textContent = `${progress.completed}/${progress.total}`;
    this.meter.style.width = `${progress.percent}%`;
    if (this.isOpen) this.renderJournal();
  }

  celebrate(completedQuestIds: readonly string[], receivedSave: GameSave | undefined = this.save): void {
    const quests = completedQuestIds
      .filter(id => !this.celebrated.has(id))
      .map(id => questCatalog.find(quest => quest.id === id) as NamedQuest | undefined)
      .filter((quest): quest is NamedQuest => quest !== undefined);
    if (!quests.length) return;
    quests.forEach(quest => this.celebrated.add(quest.id));
    this.reward.replaceChildren(element('span', 'journey-eyebrow', 'MISSIONE COMPLETATA'));
    for (const quest of quests) {
      this.reward.append(element('strong', 'journey-reward-title', quest.displayName ?? 'Una nuova tappa'));
      const rewards = formatQuestRewards(quest, itemNames);
      this.reward.append(element('span', 'journey-reward-items', rewards.length ? rewards.join(' · ') : 'Nuova tappa del viaggio raggiunta'));
      for (const [index, gift] of (quest.reward?.pokemon ?? []).entries()) {
        const instanceId = `quest:${quest.id}:pokemon:${index}`;
        const member = receivedSave?.party.find(creature => creature.instanceId === instanceId)
          ?? receivedSave?.storage.find(creature => creature.instanceId === instanceId);
        const species = battleSpecies[gift.speciesId];
        const card = element('section', 'journey-companion-reward');
        const copy = element('div', 'journey-companion-copy');
        copy.append(element('strong', '', `${species.name} si unisce al viaggio!`),
          element('span', '', `Livello ${gift.level} · ${species.types.map(battleTypeLabel).join(' / ')}`),
          element('span', '', receivedSave?.party.some(creature => creature.instanceId === instanceId)
            ? 'È nella tua squadra.' : 'La squadra è piena: ti aspetta al deposito.'));
        const moves = member?.moves as { id: string; pp: number }[] | undefined;
        copy.append(element('small', '', (moves ?? []).map(move => battleMoves[move.id]?.name ?? move.id).join(' · ')));
        card.append(createCreaturePortrait(gift.speciesId), copy);
        this.reward.append(card);
      }
    }
    const dismiss = element('button', 'journey-reward-dismiss', '×');
    dismiss.type = 'button';
    dismiss.setAttribute('aria-label', 'Chiudi ricompensa');
    dismiss.addEventListener('click', () => { this.reward.hidden = true; });
    this.reward.append(dismiss);
    this.reward.hidden = false;
    this.compact();
    clearTimeout(this.celebrationTimer);
    if (!quests.some(quest => quest.reward?.pokemon?.length)) {
      this.celebrationTimer = setTimeout(() => { this.reward.hidden = true; }, 6500);
    }
  }

  destroy(): void {
    this.menuController.abort();
    clearTimeout(this.celebrationTimer);
    document.removeEventListener('keydown', this.onKeyDown, true);
    this.root.remove();
    this.wallet.remove();
  }

  compact(): void { this.trigger.classList.add('is-compact'); }

  dismissReward(): void {
    this.reward.hidden = true;
    clearTimeout(this.celebrationTimer);
  }

  private open(view: 'journal' | 'bag' | 'badges' = 'journal'): void {
    if (!this.save) return;
    this.view = view;
    this.focusBeforeOpen = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.renderJournal();
    this.overlay.hidden = false;
    this.trigger.setAttribute('aria-expanded', 'true');
    this.wallet.setAttribute('aria-expanded', 'true');
    this.closeButton.focus();
  }

  close(): void {
    this.overlay.hidden = true;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.wallet.setAttribute('aria-expanded', 'false');
    if (this.focusBeforeOpen?.closest('.exploration-menu')) document.querySelector<HTMLElement>('#menu-button')?.focus();
    else this.focusBeforeOpen?.focus();
  }

  private renderJournal(): void {
    if (!this.save) return;
    this.title.textContent = this.view === 'bag' ? 'Zaino e dotazioni' : this.view === 'badges' ? 'Le tue medaglie' : 'Il tuo viaggio';
    if (this.view === 'bag') { this.renderBag(this.save); return; }
    if (this.view === 'badges') {
      this.contents.replaceChildren(element('p', 'pokemon-note', `${this.save.badges.length} medaglie conquistate`));
      if (!this.save.badges.length) this.contents.append(element('p', '', 'Il tuo medagliere ti aspetta. Supera la prova di Mira nella Palestra di Brumalta per conquistare la Medaglia Aurora.'));
      for (const id of this.save.badges) {
        const badge = badgeCatalog[id];
        if (!badge) continue;
        const card = element('article', 'badge-case-card');
        card.append(createBadgeEmblem(id), element('h3', '', badge.name), element('p', 'pokemon-note', `${badge.leader} · ${badge.location}`), element('p', '', badge.description));
        this.contents.append(card);
      }
      return;
    }
    const progress = selectJourneyProgress(this.save);
    this.contents.replaceChildren();
    const summary = element('div', 'journey-summary');
    for (const [value, label] of [[`${progress.completed}/${progress.total}`, 'Tappe'], [progress.speciesCount, 'Specie con te'], [progress.badgeCount, 'Medaglie']] as const) {
      const stat = element('div', 'journey-stat');
      stat.append(element('strong', '', String(value)), element('span', '', label));
      summary.append(stat);
    }
    const next = element('div', 'journey-next');
    next.append(element('span', 'journey-eyebrow', 'LA PROSSIMA TAPPA'), element('h3', '', progress.title), element('p', '', progress.objective));
    const milestones = element('ol', 'journey-milestones');
    for (const milestone of progress.milestones) {
      const active = milestone.flag === progress.currentFlag;
      const row = element('li', `journey-milestone${milestone.complete ? ' complete' : active ? ' current' : ''}`);
      row.append(element('span', 'journey-step-mark', milestone.complete ? '✓' : active ? '◆' : '○'), element('span', '', milestone.title));
      const state = [milestone.optional ? 'Facoltativa' : '', milestone.complete ? 'Fatto' : active ? 'In corso' : ''].filter(Boolean).join(' · ');
      if (state) row.append(element('span', 'journey-step-state', state));
      milestones.append(row);
    }
    this.contents.append(summary, next, element('h3', 'journey-section-title', 'Le tue tappe'), milestones, element('h3', 'journey-section-title', 'Missioni e ricompense'));
    for (const quest of questCatalog as readonly NamedQuest[]) {
      const complete = this.save.flags.includes(quest.completionFlag);
      const stepsDone = quest.steps.filter(step => this.save!.flags.includes(step.setFlag)).length;
      const specialEncounters = Object.values(specialEncounterCatalog)
        .filter(encounter => encounter.capturedFlag === quest.completionFlag || quest.steps.some(step => step.trigger === encounter.captureEvent))
        .map(encounter => {
          const discovery = specialEncounterDiscoveryState(encounter, this.save!.flags);
          return {
            encounter,
            location: getMap(encounter.mapId).metadata.displayName,
            status: discovery === 'caught' ? 'Catturato ✓' : discovery === 'available' ? 'Da raggiungere' : 'Da sbloccare',
          };
        });
      const row = element('article', `journey-quest${complete ? ' complete' : ''}`);
      const rewards = formatQuestRewards(quest, itemNames);
      const pokemonReward = describePokemonReward(quest, this.save.flags);
      const questStatus = specialEncounters.length
        ? specialEncounters.map(entry => entry.status).join(' · ')
        : pokemonReward?.status ?? (complete ? 'Completata ✓' : `${stepsDone}/${quest.steps.length} passi`);
      row.append(element('strong', '', quest.displayName ?? quest.id), element('span', 'journey-quest-state', questStatus));
      if (rewards.length) row.append(element('p', '', `${complete ? 'Ricevuto' : 'Ricompensa'}: ${rewards.join(' · ')}`));
      if (pokemonReward) {
        const { guide, name, location } = pokemonReward;
        const guidance = element('section', 'journey-special-encounter journey-pokemon-reward');
        guidance.append(element('strong', 'journey-special-encounter-title', `🎁 ${location}`),
          element('p', 'journey-special-encounter-unlock', guide.unlockHint),
          element('p', 'journey-special-encounter-route', guide.routeHint),
          element('p', 'journey-special-encounter-action', guide.actionHint));
        if (this.onShowMap) {
          const locate = element('button', 'journey-special-map', '🗺️ Vedi sulla mappa');
          locate.type = 'button';
          locate.setAttribute('aria-label', `Mostra ${name} sulla mappa`);
          locate.onclick = () => { this.close(); this.onShowMap?.(guide.mapId, quest.id); };
          guidance.append(locate);
        }
        row.append(guidance);
      }
      for (const { encounter, location } of specialEncounters) {
        const species = battleSpecies[encounter.speciesId];
        const guidance = element('section', 'journey-special-encounter');
        guidance.append(element('strong', 'journey-special-encounter-title', `${species.name} · ${location}`),
          element('p', 'journey-special-encounter-unlock', encounter.unlockHint),
          element('p', 'journey-special-encounter-route', encounter.routeHint),
          element('p', 'journey-special-encounter-action', 'Mettiti accanto all’incontro, premi A e scegli INCONTRA.'));
        if (this.onShowMap) {
          const locate = element('button', 'journey-special-map', '🗺️ Vedi sulla mappa');
          locate.type = 'button';
          locate.setAttribute('aria-label', `Mostra ${species.name} sulla mappa`);
          locate.onclick = () => { this.close(); this.onShowMap?.(encounter.mapId, encounter.id); };
          guidance.append(locate);
        }
        row.append(guidance);
      }
      this.contents.append(row);
    }
  }

  private renderBag(save: GameSave): void {
    const balance = element('div', 'bag-balance');
    balance.append(element('span', 'journey-eyebrow', 'LE TUE MONETE'), element('strong', '', `◉ ${save.player.money.toLocaleString('it-IT')}`));
    const list = element('ul', 'bag-items');
    list.setAttribute('aria-label', 'Oggetti posseduti');
    for (const [id, quantity] of Object.entries(save.inventory)) {
      if (quantity <= 0) continue;
      const item = itemContent.items[id as keyof typeof itemContent.items];
      const row = element('li', 'bag-item');
      const details = element('div', '');
      let description = 'Oggetto del viaggio';
      if (item && 'battle' in item) {
        if ('healHp' in item.battle) description = `Recupera ${item.battle.healHp} HP in lotta`;
        else if ('cures' in item.battle && item.battle.cures.includes('poison')) description = 'Cura l’avvelenamento in lotta';
      } else if (item && 'capture' in item) description = 'Per catturare Pokémon selvatici in lotta';
      if (item && 'description' in item) description = item.description;
      details.append(element('strong', '', item?.name ?? id), element('p', '', description));
      row.append(element('span', 'bag-item-icon', item && 'capture' in item ? '◉' : item && 'battle' in item ? '✚' : '✦'), details, element('span', 'bag-quantity', `×${quantity}`));
      if (this.onUseEvolutionItem && itemEvolutionRules.some(rule => rule.itemId === id)) {
        const use = element('button', 'evolution-item-use', 'Usa');
        use.type = 'button';
        use.setAttribute('aria-label', `Usa ${item?.name ?? id}`);
        use.addEventListener('click', () => { this.close(); this.onUseEvolutionItem?.(id); });
        row.append(use);
      }
      list.append(row);
    }
    this.contents.replaceChildren(balance, element('h3', 'journey-section-title', 'Il tuo equipaggiamento'));
    this.contents.append(list.children.length ? list : element('p', '', 'Lo zaino è vuoto. Troverai oggetti esplorando e nei negozi.'));
    this.contents.append(element('p', 'bag-hint', 'Durante la lotta scegli Zaino per usare gli strumenti o tentare una cattura.'));
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.isOpen) return;
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); this.close(); }
    if (event.key === 'Tab') {
      event.preventDefault();
      const controls = [this.closeButton, this.contents, ...this.contents.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      const index = controls.indexOf(document.activeElement as HTMLButtonElement);
      controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
    }
    // Stop game input while keeping native arrow/page scrolling available inside the journal.
  };
}
