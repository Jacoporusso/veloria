import '../../item-evolution-menu.css';
import type { GameSave } from '../../persistence/save-types.ts';
import type { ItemEvolutionRule } from '../../core/services/item-evolution.ts';
import type { TradeEvolutionRule } from '../../core/services/trade-evolution.ts';
import type { BattleMoveRegistry, SpeciesBattleRegistry } from '../../core/battle/create-creature.ts';
import { createCreaturePortrait } from '../battle/creature-art.ts';
import { battleTypeLabel } from '../battle/presentation.ts';

type EvolutionMenuSharedArgs = {
  save: GameSave;
  creatureId?: string;
  species: SpeciesBattleRegistry;
  moves: BattleMoveRegistry;
  signal?: AbortSignal;
};
export type ItemEvolutionMenuArgs = EvolutionMenuSharedArgs & (
  | { method?: 'item'; itemId: string; itemName: string; rules: readonly ItemEvolutionRule[] }
  | { method: 'trade'; serviceName: string; rules: readonly TradeEvolutionRule[] }
);

/** Returns a confirmed selection. Consumption and evolution belong to the caller. */
export function chooseItemEvolution(args: ItemEvolutionMenuArgs): Promise<string | null> {
  if (args.signal?.aborted) return Promise.resolve(null);
  return new Promise(resolve => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controller = new AbortController();
    const node = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string) => {
      const el = document.createElement(tag);
      el.className = cls;
      if (text !== undefined) el.textContent = text;
      return el;
    };
    const overlay = node('div', 'item-evolution');
    const panel = node('section', 'item-evolution__panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'item-evolution-title');
    const heading = node('header', 'item-evolution__header');
    const title = node('h2', '', args.method === 'trade' ? args.serviceName : args.itemName);
    title.id = 'item-evolution-title';
    const quantity = args.method === 'trade' ? 1 : args.save.inventory[args.itemId] ?? 0;
    heading.append(node('p', 'item-evolution__eyebrow', args.method === 'trade'
      ? 'SCAMBIO ASSISTITO · IL TUO COMPAGNO TORNA CON TE' : `ZAINO · ${quantity} DISPONIBILI`), title);
    const content = node('div', 'item-evolution__content');
    content.tabIndex = 0;
    const footer = node('footer', 'item-evolution__footer');
    panel.append(heading, content, footer);
    overlay.append(panel);
    document.body.append(overlay);
    let selected: string | null = null;
    let settled = false;
    const finish = (id: string | null) => {
      if (settled) return;
      settled = true;
      controller.abort();
      overlay.remove();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      resolve(id);
    };
    const button = (label: string, fn: () => void, primary = false) => {
      const el = node('button', primary ? 'item-evolution__button is-primary' : 'item-evolution__button', label);
      el.type = 'button';
      el.addEventListener('click', fn, { signal: controller.signal });
      return el;
    };
    const compatibleRule = (id: string) => {
      const member = args.save.party.find(mon => mon.instanceId === id);
      return member && args.rules.find(rule => rule.fromSpeciesId === member.speciesId &&
        (args.method === 'trade' || ('itemId' in rule && rule.itemId === args.itemId)));
    };
    const focusFirst = () => {
      content.scrollTop = 0;
      (content.querySelector<HTMLElement>('button:not(:disabled)') ?? footer.querySelector<HTMLElement>('button') ?? content).focus({ preventScroll: true });
    };
    const showParty = () => {
      selected = null;
      content.replaceChildren(node('p', 'item-evolution__intro', 'Scegli il compagno da far evolvere. Puoi controllare la nuova forma prima di confermare.'));
      const list = node('div', 'item-evolution__party');
      for (const member of args.save.party) {
        const current = args.species[String(member.speciesId)];
        const rule = compatibleRule(member.instanceId);
        const target = rule && args.species[String(rule.toSpeciesId)];
        const row = button('', () => showPreview(member.instanceId));
        row.className = 'item-evolution__member';
        row.disabled = quantity < 1 || !target;
        const description = node('span', 'item-evolution__member-copy');
        description.append(node('strong', '', current?.name ?? `Pokémon ${member.speciesId}`), node('span', '', `Livello ${member.level}`), node('small', '', quantity < 1 ? 'Nessuna pietra disponibile' : target ? `Può evolversi in ${target.name}` : rule ? 'Nuova forma non ancora disponibile' : args.method === 'trade' ? 'Non evolve tramite scambio' : 'Questa pietra non ha effetto'));
        row.append(createCreaturePortrait(member.speciesId), description);
        list.append(row);
      }
      content.append(list);
      footer.replaceChildren(button('Annulla', () => finish(null)));
      focusFirst();
    };
    const showPreview = (id: string) => {
      const member = args.save.party.find(mon => mon.instanceId === id);
      const rule = compatibleRule(id);
      const current = member && args.species[String(member.speciesId)];
      const target = rule && args.species[String(rule.toSpeciesId)];
      if (!member || !current || !target || quantity < 1) { showParty(); return; }
      selected = id;
      content.replaceChildren();
      const forms = node('div', 'item-evolution__forms');
      for (const definition of [current, target]) {
        const form = node('div', 'item-evolution__form');
        form.append(createCreaturePortrait(definition.speciesId), node('strong', '', definition.name), node('span', '', `${definition.types.map(battleTypeLabel).join(' / ')} · Livello ${member.level}`));
        forms.append(form);
        if (definition === current) forms.append(node('span', 'item-evolution__arrow', '→'));
      }
      const note = node('p', 'item-evolution__intro', args.method === 'trade'
        ? 'Il personale scambia il tuo Pokémon e te lo restituisce subito dopo l’evoluzione. Conserva livello e mosse. Il servizio è gratuito e l’evoluzione è definitiva.'
        : `Userai 1 ${args.itemName}. Il livello e tutte le mosse attuali vengono conservati. L’evoluzione è definitiva.`);
      const kept = node('section', 'item-evolution__section');
      kept.append(node('h3', '', 'Mosse che conserva'));
      const keptList = node('ul', 'item-evolution__moves');
      for (const slot of member.moves) keptList.append(node('li', '', `${args.moves[slot.id]?.name ?? slot.id} · PP ${slot.pp}/${args.moves[slot.id]?.maxPp ?? '?'}`));
      kept.append(keptList);
      const future = node('section', 'item-evolution__section');
      future.append(node('h3', '', `Cosa imparerà ${target.name}`));
      const futureList = node('ul', 'item-evolution__moves');
      const entries = target.officialLearnset?.filter(entry => entry.level > member.level && args.moves[entry.moveId]) ?? [];
      for (const entry of entries) futureList.append(node('li', '', `Livello ${entry.level} · ${args.moves[entry.moveId].name}`));
      future.append(entries.length ? futureList : node('p', '', 'Nessuna nuova mossa per livello disponibile dopo il livello attuale.'));
      future.append(node('p', 'item-evolution__source', 'Apprendimenti ufficiali HGSS, limitati alle mosse implementate nel gioco. Le mosse di livelli già superati non vengono apprese automaticamente.'));
      content.append(forms, note, kept, future);
      footer.replaceChildren(button('Indietro', showParty), button(`Evolvi in ${target.name}`, () => finish(id), true));
      focusFirst();
    };
    document.addEventListener('keydown', event => {
      event.stopImmediatePropagation();
      if (event.key === 'Tab') {
        event.preventDefault();
        const targets = [content, ...panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
        const index = targets.indexOf(document.activeElement as HTMLButtonElement);
        targets[(index + (event.shiftKey ? -1 : 1) + targets.length) % targets.length].focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (!event.repeat) { if (selected) showParty(); else finish(null); }
      } else if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault();
    }, { capture: true, signal: controller.signal });
    for (const type of ['pointerdown', 'pointerup', 'touchstart', 'touchend']) overlay.addEventListener(type, event => event.stopPropagation(), { signal: controller.signal });
    args.signal?.addEventListener('abort', () => finish(null), { once: true, signal: controller.signal });
    if (args.creatureId) showPreview(args.creatureId);
    else showParty();
  });
}
