import type { CreatureSave, GameSave } from '../../persistence/save-types.ts';
import { buildPokedexEntries, seenSpeciesFromFlags } from '../../core/party/pokedex.ts';
import { BATTLE_TYPES, type MoveDefinition } from '../../core/battle/types.ts';
import { effectivenessFor } from '../../core/battle/rules.ts';
import { calculateStats } from '../../core/battle/create-creature.ts';
import { battleMoves, battleSpecies, veloriaBattleRules } from '../battle/catalog.ts';
import { battleTypeLabel } from '../battle/presentation.ts';
import { describeMoveEffects } from '../battle/move-description.ts';
import { createCreaturePortrait } from '../battle/creature-art.ts';
import evolutionData from '../../../content/battle/evolution-reference.v1.json';

const evolutionReference: Readonly<Record<string, { evolutions: readonly {
  targetSpeciesId: number; targetName: string; trigger: string; minimumLevel: number | null; itemName: string | null; locationName?: string;
  heldItemName?: string; minimumHappiness?: number; timeOfDay?: string; nearSpecialRock?: boolean;
}[] }>> = evolutionData.species;

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = ''): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  result.textContent = text;
  result.className = className;
  return result;
}

/** Read-only strategy browser: no team, combat or persistence mutations. */
export class PokemonPanel {
  private readonly list = document.querySelector<HTMLOListElement>('#pokedex-list')!;
  private readonly title = document.querySelector<HTMLElement>('#pokedex-title')!;
  private readonly summary = document.querySelector<HTMLElement>('#pokedex-summary')!;

  render(save: GameSave, view: 'team' | 'dex'): void {
    this.title.textContent = view === 'team' ? 'Squadra' : 'Pokédex';
    this.list.replaceChildren();
    const entries = buildPokedexEntries(battleSpecies, save.party, save.storage, seenSpeciesFromFlags(save.flags));
    this.summary.textContent = view === 'team'
      ? `${save.party.length}/6 compagni · Seleziona un Pokémon per studiare statistiche e mosse.`
      : `${entries.filter(entry => entry.seen).length} viste · ${entries.filter(entry => entry.registered).length} catturate · ${entries.length} specie nel catalogo. Seleziona una specie per i dettagli.`;
    const rows = view === 'team'
      ? save.party.map(creature => ({ speciesId: creature.speciesId, creature, label: `Lv.${creature.level} · HP ${creature.hp}/${creature.maxHp}` }))
      : entries.filter(entry => entry.seen).map(entry => ({ speciesId: entry.speciesId, creature: undefined, label: entry.registered ? 'CATTURATO' : 'VISTO' }));
    for (const row of rows) {
      const species = battleSpecies[row.speciesId];
      if (!species) continue;
      const item = node('li');
      const button = node('button', '', 'pokedex-entry pokemon-select');
      button.type = 'button';
      button.append(createCreaturePortrait(row.speciesId), node('span', `N° ${String(row.speciesId).padStart(3, '0')}`, 'pokedex-number'), node('span', species.name, 'pokedex-name'), node('span', row.label, 'pokedex-count'));
      button.addEventListener('click', () => this.details(save, view, row.speciesId, row.creature));
      item.append(button);
      this.list.append(item);
    }
    if (!rows.length) this.list.append(node('li', view === 'team' ? 'Scegli il tuo primo compagno al laboratorio.' : 'Incontra Pokémon per iniziare il registro.', 'pokedex-empty'));
  }

  private details(save: GameSave, view: 'team' | 'dex', speciesId: number, creature?: CreatureSave): void {
    const species = battleSpecies[speciesId];
    const body = node('li', '', 'pokemon-detail');
    const back = node('button', view === 'team' ? '← Squadra' : '← Tutte le specie viste', 'pokemon-back');
    back.type = 'button';
    back.addEventListener('click', () => { this.render(save, view); this.list.querySelector<HTMLButtonElement>('button')?.focus(); });
    const hero = node('div', '', 'pokemon-hero');
    hero.append(createCreaturePortrait(speciesId), node('h3', species.name), node('p', species.types.map(battleTypeLabel).join(' / ')));
    body.append(back, hero);
    if (creature) body.append(node('p', `Livello ${creature.level} · HP ${creature.hp}/${creature.maxHp}${creature.status ? ` · Stato: ${({ poison: 'Avvelenato', burn: 'Scottato', paralysis: 'Paralizzato', sleep: 'Addormentato', freeze: 'Congelato' })[creature.status.status]}` : ''}`));
    const evolutionSection = node('section', '', 'pokemon-evolution');
    evolutionSection.setAttribute('aria-label', 'Evoluzione');
    evolutionSection.append(node('h3', 'Evoluzione'));
    const reference = evolutionReference[speciesId];
    if (!reference) evolutionSection.append(node('p', 'Informazioni evolutive non ancora disponibili.'));
    else if (!reference.evolutions.length) evolutionSection.append(node('p', 'Non ha ulteriori evoluzioni in HeartGold/SoulSilver.'));
    for (const evolution of reference?.evolutions ?? []) {
      const requirement = evolution.trigger === 'trade'
        ? `Tramite scambio${evolution.heldItemName ? ` tenendo ${evolution.heldItemName}` : ''} · non dipende dal livello`
        : evolution.minimumHappiness
        ? `Aumenta di livello con amicizia alta${evolution.timeOfDay === 'day' ? ', di giorno' : evolution.timeOfDay === 'night' ? ', di notte' : ''}`
        : evolution.locationName
        ? `Aumenta di livello ${evolution.nearSpecialRock ? 'vicino alla roccia speciale di' : 'presso'} ${evolution.locationName}${evolution.minimumLevel ? `, dal livello ${evolution.minimumLevel}` : ''}. Luogo della serie originale.`
        : evolution.trigger === 'level-up' ? `Dal livello ${evolution.minimumLevel}` : `Usa ${evolution.itemName} · non dipende dal livello`;
      evolutionSection.append(node('strong', `${species.name} → ${evolution.targetName}`), node('p', requirement, 'pokemon-evolution-requirement'));
      const available = (veloriaBattleRules.evolutions[speciesId] ?? []).some(rule => rule.target.speciesId === evolution.targetSpeciesId && rule.minimumLevel === evolution.minimumLevel);
      evolutionSection.append(node('p', available ? 'Disponibile nel gioco.' : 'Evoluzione ufficiale non ancora disponibile nel prototipo.', 'pokemon-note'));
    }
    body.append(evolutionSection);
    body.append(node('h3', 'Affinità difensive'));
    for (const [label, predicate] of [
      ['Debole a', (value: number) => value > 1],
      ['Resiste a', (value: number) => value > 0 && value < 1],
      ['Immune a', (value: number) => value === 0],
    ] as const) {
      const types = BATTLE_TYPES.map(type => ({ type, multiplier: effectivenessFor(species.types, type, veloriaBattleRules.typeChart) })).filter(entry => predicate(entry.multiplier));
      body.append(node('p', `${label}: ${types.map(entry => `${battleTypeLabel(entry.type)} ×${entry.multiplier}`).join(' · ') || 'nessun tipo'}`, 'pokemon-affinity'));
    }
    const labels = { hp: 'HP', attack: 'Attacco', defense: 'Difesa', specialAttack: 'Att. speciale', specialDefense: 'Dif. speciale', speed: 'Velocità' };
    const statGrid = (values: typeof species.baseStats): HTMLElement => {
      const stats = node('dl', '', 'pokemon-stats');
      for (const [stat, value] of Object.entries(values)) {
        const cell = node('div');
        cell.append(node('dt', labels[stat as keyof typeof labels]), node('dd', String(value)));
        stats.append(cell);
      }
      return stats;
    };
    if (creature) {
      const { maxHp: _maxHp, ...current } = calculateStats(species.baseStats, creature.level);
      body.append(node('h3', `Statistiche al livello ${creature.level}`), statGrid({ hp: creature.maxHp, ...current }), node('p', 'Valori del motore senza modificatori temporanei o penalità degli stati.', 'pokemon-note'));
    }
    body.append(node('h3', 'Statistiche base della specie'), statGrid(species.baseStats), node('p', 'Attacco e Difesa contano per le mosse fisiche; Attacco speciale e Difesa speciale per quelle speciali. La Velocità influenza chi agisce prima.', 'pokemon-note'));
    if (creature) {
      body.append(node('h3', 'Mosse attuali'));
      for (const slot of creature.moves) {
        const move = battleMoves[slot.id];
        if (move) body.append(this.moveCard(move, `PP ${slot.pp}/${move.maxPp}`));
      }
    }
    body.append(node('h3', 'Apprendimento per livello · HGSS'), node('p', 'Dati PokéAPI salvati in locale. Sono elencate le mosse implementate nel prototipo; il catalogo non include ancora tutti gli effetti del gioco originale.', 'pokemon-note'));
    for (const entry of species.officialLearnset ?? []) {
      const move = battleMoves[entry.moveId];
      if (move) body.append(this.moveCard(move, `Livello ${entry.level}`));
    }
    this.list.replaceChildren(body);
    this.list.scrollTop = 0;
    back.focus();
  }

  private moveCard(move: MoveDefinition, context: string): HTMLElement {
    const card = node('article', '', 'pokemon-move');
    card.append(node('h4', `${move.name} · ${context}`), node('p', `${battleTypeLabel(move.type)} · ${{ physical: 'Fisica', special: 'Speciale', status: 'Supporto' }[move.category]} · ${move.fixedDamage ? `Danno fisso ${move.fixedDamage} HP` : `Potenza ${move.power || '—'}`} · Precisione ${move.alwaysHits ? 'Non fallisce' : `${move.accuracy}%`} · PP ${move.maxPp}`), node('p', describeMoveEffects(move).join('\n\n')));
    return card;
  }
}
