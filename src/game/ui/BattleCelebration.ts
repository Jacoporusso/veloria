import '../../battle-celebration.css';
import type { BattleState, BattleEvent } from '../../core/battle/types.ts';
import type { MoveCatalog } from '../../core/battle/engine.ts';
import { createCreaturePortrait } from '../battle/creature-art.ts';
import { battleRewardSummary, battleTypeLabel } from '../battle/presentation.ts';
import { badgeCatalog, createBadgeEmblem } from './BadgeEmblem.ts';

export interface VictoryPresentation { trainerName: string; rewardMoney: number; feedback: string; badgeId?: string }
const element = (tag: string, className: string, text?: string) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/** A receipt of resolved events. This component never grants items, money or badges. */
export class BattleCelebration {
  private readonly root = element('div', 'battle-celebration');
  private readonly controller = new AbortController();
  private readonly confirm: HTMLButtonElement;

  constructor(state: BattleState, events: readonly BattleEvent[], moves: MoveCatalog, victory: VictoryPresentation | undefined, onClose: (event?: KeyboardEvent) => void, reducedAnimations = false) {
    this.root.classList.toggle('is-reduced', reducedAnimations);
    const dialog = element('section', 'battle-celebration-card');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'battle-celebration-title');
    const contents = element('div', 'battle-celebration-content');
    contents.tabIndex = 0;
    contents.setAttribute('role', 'region');
    contents.setAttribute('aria-label', 'Dettagli del risultato');
    const badge = victory?.badgeId ? badgeCatalog[victory.badgeId] : undefined;
    const captured = [...events].reverse().find(event => event.type === 'creatureCaptured');
    const creature = captured?.type === 'creatureCaptured' ? [...state.player.creatures, ...state.playerStorage].find(mon => mon.instanceId === captured.creatureId) : undefined;
    const kicker = element('p', 'battle-celebration-kicker', badge ? 'UN NUOVO TRAGUARDO' : creature ? 'UN NUOVO COMPAGNO' : 'SFIDA COMPLETATA');
    const title = element('h2', '', badge ? `${badge.name} conquistata!` : creature ? `${creature.name} catturato!` : victory ? `Hai vinto contro ${victory.trainerName}!` : 'Vittoria!');
    title.id = 'battle-celebration-title';
    const visual = badge ? createBadgeEmblem(victory!.badgeId) : creature ? createCreaturePortrait(creature.speciesId) : element('span', 'battle-victory-star', '✦');
    contents.append(kicker, visual, title);
    if (creature && captured?.type === 'creatureCaptured') {
      contents.append(element('p', 'battle-celebration-subtitle', `${creature.types.map(battleTypeLabel).join(' / ')} · Livello ${creature.level} · HP ${creature.hp}/${creature.stats.maxHp}`));
      contents.append(element('p', 'battle-celebration-destination', captured.destination === 'party' ? 'Aggiunto alla tua squadra' : 'Squadra piena: ti aspetta nel box'));
      const skills = element('div', 'battle-capture-moves');
      skills.append(element('h3', '', 'Le sue mosse'));
      for (const slot of creature.moves) skills.append(element('span', '', `${moves[slot.moveId]?.name ?? slot.moveId} · PP ${slot.pp}/${moves[slot.moveId]?.maxPp ?? '?'}`));
      contents.append(skills);
    }
    const rewards = battleRewardSummary(events);
    if (victory?.rewardMoney) rewards.push(`+${victory.rewardMoney} monete`);
    if (rewards.length) contents.append(element('p', 'battle-celebration-rewards', rewards.join('   ·   ')));
    if (victory?.feedback) {
      const quote = element('blockquote', 'battle-trainer-feedback');
      quote.append(element('strong', '', victory.trainerName), element('p', '', victory.feedback));
      contents.append(quote);
    }
    this.confirm = document.createElement('button');
    this.confirm.className = 'battle-celebration-continue';
    this.confirm.type = 'button';
    this.confirm.textContent = 'Continua';
    this.confirm.addEventListener('click', () => { this.destroy(); onClose(); }, { signal: this.controller.signal });
    dialog.append(contents, this.confirm);
    this.root.append(dialog);
    for (const name of ['pointerdown', 'pointerup', 'touchstart', 'touchend']) this.root.addEventListener(name, event => event.stopPropagation());
    document.addEventListener('keydown', event => {
      event.stopImmediatePropagation();
      if (event.key === 'Tab') { event.preventDefault(); (document.activeElement === this.confirm ? contents : this.confirm).focus(); }
      if (['Enter', ' ', 'Escape'].includes(event.key)) {
        event.preventDefault();
        if (!event.repeat) { this.destroy(); onClose(event); }
      }
    }, { capture: true, signal: this.controller.signal });
    (document.querySelector('.game-stage') ?? document.body).append(this.root);
    this.confirm.focus({ preventScroll: true });
  }

  destroy(): void { this.controller.abort(); this.root.remove(); }
}
