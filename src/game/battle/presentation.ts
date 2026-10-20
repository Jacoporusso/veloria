import { experienceToNextLevel } from '../../core/battle/progression.ts';
import type { BattleRules } from '../../core/battle/rules.ts';
import type { BattleCreature, BattleEvent, BattleType } from '../../core/battle/types.ts';

const TYPE_NAMES: Readonly<Record<BattleType, string>> = {
  normal: 'NORMALE', fire: 'FUOCO', water: 'ACQUA', electric: 'ELETTRO', grass: 'ERBA',
  ice: 'GHIACCIO', fighting: 'LOTTA', poison: 'VELENO', ground: 'TERRA', flying: 'VOLANTE',
  psychic: 'PSICO', bug: 'COLEOTTERO', rock: 'ROCCIA', ghost: 'SPETTRO', dragon: 'DRAGO', dark: 'BUIO', steel: 'ACCIAIO',
};

const STAT_STAGE_NAMES = {
  attack: 'l’Attacco',
  defense: 'la Difesa',
  specialAttack: 'l’Attacco speciale',
  specialDefense: 'la Difesa speciale',
  speed: 'la Velocità',
  accuracy: 'la Precisione',
  evasion: 'l’Elusione',
} as const;

export type StatStageName = keyof typeof STAT_STAGE_NAMES;

export function formatStatStageChanged(stat: StatStageName, change: number, creatureName: string): string {
  return `${STAT_STAGE_NAMES[stat]} di ${creatureName} ${change > 0 ? 'sale' : 'scende'}.`;
}

export function formatStatStageLimited(stat: StatStageName, stage: number, creatureName: string): string {
  return `${STAT_STAGE_NAMES[stat]} di ${creatureName} è già al ${stage > 0 ? 'massimo' : 'minimo'}.`;
}

export function battleTypeLabel(type: BattleType): string { return TYPE_NAMES[type]; }

export function formatFlinched(creatureName: string): string {
  return `${creatureName} ha tentennato e non può usare la sua mossa in questo turno!`;
}

/** The core stores XP toward the next level, rather than lifetime XP. */
export function battleExperienceProgress(creature: BattleCreature, rules: BattleRules): { ratio: number; label: string } | undefined {
  if (creature.level >= rules.maxLevel) return { ratio: 1, label: 'LIVELLO MASSIMO' };
  const curve = creature.growthCurveId ? rules.experienceCurves[creature.growthCurveId] : undefined;
  if (!curve) return undefined;
  const required = experienceToNextLevel(creature.level, curve);
  return { ratio: Math.max(0, Math.min(1, creature.experience / required)), label: `${creature.experience}/${required} XP` };
}

/** Presentation only: rewards have already been applied by the battle core. */
export function battleRewardSummary(events: readonly BattleEvent[]): string[] {
  const xp = events.reduce((sum, event) => sum + (event.type === 'experienceGained' && event.side === 'player' ? event.amount : 0), 0);
  const levels = events.reduce((sum, event) => sum + (event.type === 'levelUp' && event.side === 'player' ? event.level - event.previousLevel : 0), 0);
  const captures = events.filter(event => event.type === 'creatureCaptured').length;
  return [...(xp ? [`+${xp} XP`] : []), ...(levels ? [`+${levels} ${levels === 1 ? 'LIVELLO' : 'LIVELLI'}`] : []), ...(captures ? [`${captures} NUOVA CATTURA`] : [])];
}
