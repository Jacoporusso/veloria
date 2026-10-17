import type { BattleType } from '../../core/battle/types.ts';

const TYPE_LABELS: Readonly<Record<BattleType, string>> = {
  normal: 'NORMALE',
  fire: 'FUOCO',
  water: 'ACQUA',
  electric: 'ELETTRO',
  grass: 'ERBA',
  ice: 'GHIACCIO',
  fighting: 'LOTTA',
  poison: 'VELENO',
  ground: 'TERRA',
  flying: 'VOLANTE',
  psychic: 'PSICO',
  bug: 'COLEOTTERO',
  rock: 'ROCCIA',
  ghost: 'SPETTRO',
  dragon: 'DRAGO',
  dark: 'BUIO',
  steel: 'ACCIAIO',
};

/** Two compact lines keep move name, type and remaining PP readable in the battle grid. */
export function formatBattleMoveLabel(name: string, type: BattleType, pp: number, maxPp: number): string {
  return `${name}\n${TYPE_LABELS[type]} · PP ${pp}/${maxPp}`;
}
