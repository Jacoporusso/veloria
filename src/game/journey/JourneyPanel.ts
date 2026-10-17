import '../../journey.css';
import type { GameSave } from '../../persistence/save-types.ts';
import type { QuestDefinition } from '../../core/quests/apply-quest-event.ts';
import { questCatalog } from '../quests/catalog.ts';
import itemContent from '../../../content/items/items.v1.json';
import { formatQuestRewards, selectJourneyProgress } from './progress.ts';

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
  private readonly celebrated = new Set<string>();
  private celebrationTimer?: ReturnType<typeof setTimeout>;
  private save?: GameSave;
  private focusBeforeOpen?: HTMLElement;

  get isOpen(): boolean { return !this.overlay.hidden; }

  constructor(stage: HTMLElement) {
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
    this.trigger.append(top, this.heading, this.objective, meter);
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
    const title = element('h2', 'journey-title', 'Il tuo viaggio');
    title.id = 'journey-title';
    this.closeButton.type = 'button';
    this.closeButton.addEventListener('click', () => this.close());
    header.append(title, this.closeButton);
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
    document.addEventListener('keydown', this.onKeyDown, true);
  }

  update(save: GameSave): void {
    this.save = save;
    const progress = selectJourneyProgress(save);
    this.heading.textContent = progress.title;
    this.objective.textContent = progress.objective;
    this.count.textContent = `${progress.completed}/${progress.total}`;
    this.meter.style.width = `${progress.percent}%`;
    if (this.isOpen) this.renderJournal();
  }

  celebrate(completedQuestIds: readonly string[]): void {
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
    }
    const dismiss = element('button', 'journey-reward-dismiss', '×');
    dismiss.type = 'button';
    dismiss.setAttribute('aria-label', 'Chiudi ricompensa');
    dismiss.addEventListener('click', () => { this.reward.hidden = true; });
    this.reward.append(dismiss);
    this.reward.hidden = false;
    clearTimeout(this.celebrationTimer);
    this.celebrationTimer = setTimeout(() => { this.reward.hidden = true; }, 6500);
  }

  destroy(): void {
    clearTimeout(this.celebrationTimer);
    document.removeEventListener('keydown', this.onKeyDown, true);
    this.root.remove();
  }

  private open(): void {
    if (!this.save) return;
    this.focusBeforeOpen = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.renderJournal();
    this.overlay.hidden = false;
    this.trigger.setAttribute('aria-expanded', 'true');
    this.closeButton.focus();
  }

  private close(): void {
    this.overlay.hidden = true;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.focusBeforeOpen?.focus();
  }

  private renderJournal(): void {
    if (!this.save) return;
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
    let activeAssigned = false;
    for (const milestone of progress.milestones) {
      const active = !milestone.complete && !activeAssigned;
      if (active) activeAssigned = true;
      const row = element('li', `journey-milestone${milestone.complete ? ' complete' : active ? ' current' : ''}`);
      row.append(element('span', 'journey-step-mark', milestone.complete ? '✓' : active ? '◆' : '○'), element('span', '', milestone.title));
      if (milestone.complete) row.append(element('span', 'journey-step-state', 'Fatto'));
      else if (active) row.append(element('span', 'journey-step-state', 'In corso'));
      milestones.append(row);
    }
    this.contents.append(summary, next, element('h3', 'journey-section-title', 'Le tue tappe'), milestones, element('h3', 'journey-section-title', 'Missioni e ricompense'));
    for (const quest of questCatalog as readonly NamedQuest[]) {
      const complete = this.save.flags.includes(quest.completionFlag);
      const stepsDone = quest.steps.filter(step => this.save!.flags.includes(step.setFlag)).length;
      const row = element('article', `journey-quest${complete ? ' complete' : ''}`);
      const rewards = formatQuestRewards(quest, itemNames);
      row.append(element('strong', '', quest.displayName ?? quest.id), element('span', 'journey-quest-state', complete ? 'Completata ✓' : `${stepsDone}/${quest.steps.length} passi`));
      if (rewards.length) row.append(element('p', '', `${complete ? 'Ricevuto' : 'Ricompensa'}: ${rewards.join(' · ')}`));
      this.contents.append(row);
    }
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.isOpen) return;
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); this.close(); }
    if (event.key === 'Tab') {
      event.preventDefault();
      (document.activeElement === this.closeButton ? this.contents : this.closeButton).focus();
    }
    // Stop game input while keeping native arrow/page scrolling available inside the journal.
  };
}
