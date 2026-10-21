import { effectivenessFor, type BattleRules } from '../../core/battle/rules.ts';
import type { BattleCreature, BattleStat, BattleType, MajorStatus, MoveDefinition } from '../../core/battle/types.ts';
import { describeMoveMatchup, matchupMultiplierLabel } from './move-matchup.ts';
import { battleTypeLabel } from './presentation.ts';

/** Fairy is included for the icon vocabulary; HGSS combat still has only its 17 supported types. */
export const MOVE_TYPE_ICONS: Readonly<Record<BattleType | 'fairy', string>> = {
  normal: '⚪', fire: '🔥', water: '💧', electric: '⚡', grass: '🌿', ice: '❄️',
  fighting: '🥊', poison: '☠️', ground: '⛰️', flying: '🪽', psychic: '🔮',
  bug: '🐛', rock: '🪨', ghost: '👻', dragon: '🐉', dark: '🌙', steel: '⚙️', fairy: '🧚',
};
const STATS: Readonly<Record<BattleStat, string>> = {
  attack: 'Attacco', defense: 'Difesa', specialAttack: 'Attacco speciale', specialDefense: 'Difesa speciale',
  speed: 'Velocità', accuracy: 'Precisione', evasion: 'Elusione',
};
const STATUS: Readonly<Record<MajorStatus, string>> = {
  burn: 'Scottatura', poison: 'Veleno', paralysis: 'Paralisi', sleep: 'Sonno', freeze: 'Gelo',
};

export interface MoveCard {
  readonly name: string;
  readonly typeIcon: string;
  readonly typeLabel: string;
  readonly categoryIcon: string;
  readonly categoryLabel: string;
  readonly powerLabel: string;
  readonly accuracyLabel: string;
  readonly ppLabel: string;
  readonly effectivenessLabel: string;
  readonly effectivenessShort: string;
  readonly effectiveness: 'immune' | 'super' | 'resisted' | 'normal' | 'support' | 'fixed';
  readonly supportEffect?: string;
  readonly accessibleLabel: string;
}

/** Condenses actual support effects without inventing a damage forecast or hiding their probabilities. */
function supportSummary(move: MoveDefinition): string | undefined {
  if (move.category !== 'status') return undefined;
  const effects: string[] = [];
  for (const change of move.statChanges ?? []) {
    if (!change.stages) continue;
    effects.push(`${STATS[change.stat]} ${change.target === 'self' ? 'tuo' : 'avversario'} ${change.stages > 0 ? '+' : ''}${change.stages}${(move.statChangeChance ?? 100) < 100 ? ` · ${move.statChangeChance}%` : ''}`);
  }
  if (move.inflictedStatus) effects.push(`${STATUS[move.inflictedStatus]} avversario · ${move.statusChance ?? 100}%`);
  if (move.inflictedConfusionChance) effects.push(`Confusione avversaria · ${move.inflictedConfusionChance}%`);
  if (move.leechSeedFraction) effects.push(`Seme · ${Number((move.leechSeedFraction * 100).toFixed(2))}% HP massimi/turno`);
  return effects.length ? effects.join(' · ') : 'Consulta gli effetti nei dettagli';
}

/** Presentation-only card. Accuracy may be supplied by the caller from current stat stages. */
export function createMoveCard(move: MoveDefinition, target: BattleCreature, rules: BattleRules, currentPp: number, actualAccuracyLabel?: string): MoveCard {
  const matchup = describeMoveMatchup(move, target, rules);
  const categoryLabel = move.category === 'physical' ? 'Fisica' : move.category === 'special' ? 'Speciale' : 'Supporto';
  const categoryIcon = move.category === 'physical' ? '💥' : move.category === 'special' ? '✨' : '◇';
  const powerLabel = move.fixedDamage ? `${move.fixedDamage} HP fissi` : move.category === 'status' ? '—' : String(move.power);
  const accuracyLabel = actualAccuracyLabel ?? (move.alwaysHits ? 'Non fallisce per precisione' : `${move.accuracy}%`);
  const ppLabel = `${currentPp}/${move.maxPp} PP`;
  const supportEffect = matchup.blocked ? undefined : supportSummary(move);
  const typeImmunity = matchup.blocked && (
    ((move.category !== 'status' || move.statusAffectedByTypeImmunity && move.inflictedStatus)
      && effectivenessFor(target.types, move.type, rules.typeChart) === 0)
    || Boolean(move.leechSeedFraction && target.types.includes('grass'))
    || Boolean(move.category === 'status' && move.inflictedStatus && target.types.some(type => rules.statusImmunities[type]?.includes(move.inflictedStatus!)))
  );
  const effectivenessLabel = typeImmunity ? `${matchup.label} · IMMUNITÀ DI TIPO` : matchup.label;
  const effectiveness = matchup.blocked ? 'immune' : move.category === 'status' ? 'support' : move.fixedDamage ? 'fixed'
    : matchup.multiplier! > 1 ? 'super' : matchup.multiplier! < 1 ? 'resisted' : 'normal';
  const effectivenessShort = effectiveness === 'immune' ? 'Ø' : effectiveness === 'support' ? '◇ Supporto'
    : effectiveness === 'fixed' ? `${move.fixedDamage} HP` : `${effectiveness === 'super' ? '↑' : effectiveness === 'resisted' ? '↓' : '●'} ${matchupMultiplierLabel(matchup.multiplier!)}`;
  return {
    name: move.name, typeIcon: MOVE_TYPE_ICONS[move.type], typeLabel: battleTypeLabel(move.type), categoryIcon, categoryLabel,
    powerLabel, accuracyLabel, ppLabel, effectivenessLabel, effectivenessShort, effectiveness, supportEffect,
    accessibleLabel: `${move.name}, ${battleTypeLabel(move.type)}, ${categoryLabel}, ${effectivenessLabel}, ${supportEffect ? `${supportEffect}, ` : ''}${move.fixedDamage ? 'Danno' : 'Potenza'} ${powerLabel}, precisione ${accuracyLabel}, ${ppLabel}`,
  };
}
