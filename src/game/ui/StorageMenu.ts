import type { GameSave } from '../../persistence/save-types.ts';
import { transferSelectedCreatures } from '../../core/services/party-storage.ts';
import { battleSpecies } from '../battle/catalog.ts';
import { createCreaturePortrait } from '../battle/creature-art.ts';
import { element, managementDialog } from './ManagementDialog';

export async function showStorageManager(args: {
  getSave(): GameSave; commit(save: GameSave): Promise<boolean>; signal?: AbortSignal;
}): Promise<void> {
  const ui = managementDialog('Deposito Pokémon', args.signal);
  const deposits = new Set<string>(), withdrawals = new Set<string>();
  const apply = element('button', 'Sposta selezionati');
  apply.type = 'button';
  const clear = element('button', 'Deseleziona tutti');
  clear.type = 'button';
  const count = element('span');
  ui.footer.append(count, clear, apply);
  const refreshSelection = () => {
    count.textContent = `${deposits.size} da depositare · ${withdrawals.size} da ritirare`;
    const finalCount = args.getSave().party.length - deposits.size + withdrawals.size;
    apply.disabled = !deposits.size && !withdrawals.size || finalCount < 1 || finalCount > 6;
    ui.status.textContent = finalCount < 1 ? 'Lascia almeno un Pokémon in squadra o selezionane uno dal box.'
      : finalCount > 6 ? 'La squadra può contenere al massimo 6 Pokémon: selezionane alcuni da depositare.'
      : `Squadra dopo lo spostamento: ${finalCount}/6. Seleziona o deseleziona più Pokémon, poi conferma.`;
  };
  const render = () => {
    const save = args.getSave();
    const columns = element('div', '', 'management-columns');
    for (const [title, members, selected, prefix] of [
      ['Squadra', save.party, deposits, 'BOX'], ['Box', save.storage, withdrawals, 'RITIRA'],
    ] as const) {
      const section = element('section');
      section.setAttribute('aria-label', title);
      section.append(element('h3', `${title} · ${members.length}${title === 'Squadra' ? '/6' : ''}`));
      const roster = element('div', '', 'management-roster');
      for (const member of members) {
        const name = battleSpecies[member.speciesId]?.name ?? `Specie ${member.speciesId}`;
        const button = element('button', '', 'storage-choice');
        button.type = 'button';
        button.setAttribute('aria-label', `${prefix} · ${name}${typeof member.level === 'number' ? ` Lv.${member.level}` : ''}`);
        button.setAttribute('aria-pressed', String(selected.has(member.instanceId)));
        const text = element('span', name);
        text.append(element('small', typeof member.level === 'number' ? `Lv.${member.level}${typeof member.hp === 'number' ? ` · HP ${member.hp}/${member.maxHp}` : ''}` : 'Nel box'));
        button.append(createCreaturePortrait(member.speciesId), text);
        button.onclick = () => {
          if (selected.has(member.instanceId)) selected.delete(member.instanceId); else selected.add(member.instanceId);
          button.setAttribute('aria-pressed', String(selected.has(member.instanceId)));
          refreshSelection();
        };
        roster.append(button);
      }
      if (!members.length) roster.append(element('p', 'Nessun Pokémon nel box.'));
      section.append(roster);
      columns.append(section);
    }
    ui.content.replaceChildren(columns);
    refreshSelection();
  };
  clear.onclick = () => { deposits.clear(); withdrawals.clear(); render(); };
  apply.onclick = async () => {
    if (apply.disabled) return;
    const result = transferSelectedCreatures(args.getSave(), [...deposits], [...withdrawals]);
    if (!result.ok) { ui.status.textContent = 'Spostamento non disponibile. Controlla la selezione.'; return; }
    ui.setBusy(true);
    try {
      if (await args.commit(result.save)) {
        deposits.clear(); withdrawals.clear(); render();
        ui.status.textContent = 'Pokémon spostati e salvati. Puoi continuare a gestire il deposito.';
      }
    } finally { ui.setBusy(false); ui.content.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }); }
  };
  render();
  await ui.closed;
}
