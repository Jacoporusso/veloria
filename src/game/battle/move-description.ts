import type { BattleStat, MajorStatus, MoveDefinition } from '../../core/battle/types.ts';
import { battleTypeLabel } from './presentation.ts';

const STATS: Record<BattleStat, string> = { attack: 'Attacco', defense: 'Difesa', specialAttack: 'Attacco speciale', specialDefense: 'Difesa speciale', speed: 'Velocità', accuracy: 'Precisione', evasion: 'Elusione' };
const STATUS: Record<MajorStatus, string> = { burn: 'scottatura', poison: 'veleno', paralysis: 'paralisi', sleep: 'sonno', freeze: 'gelo' };
const STATUS_HELP: Record<MajorStatus, string> = { burn: 'La scottatura causa danni a fine turno e riduce i danni fisici inflitti.', poison: 'Il veleno sottrae HP a fine turno.', paralysis: 'La paralisi riduce la Velocità e può impedire di agire.', sleep: 'Il sonno impedisce di usare mosse finché il Pokémon non si sveglia.', freeze: 'Il gelo impedisce di usare mosse finché il Pokémon non si scongela.' };
const chance = (value: number) => value < 100 ? ` (${value}% di probabilità)` : '';

/** Describes implemented effects directly from the runtime catalog, never from move names. */
export function describeMoveEffects(move: MoveDefinition): string[] {
  const effects: string[] = [];
  if (move.fixedDamage) effects.push(`Infligge ${move.fixedDamage} HP di danno fisso se colpisce. Statistiche, resistenze, bonus di tipo e colpi critici non aumentano o riducono questo danno; le immunità lo annullano.`);
  if (move.category !== 'status' && move.power > 0) effects.push(move.category === 'physical'
    ? 'Infligge danni fisici: il tuo Attacco si confronta con la Difesa avversaria.'
    : 'Infligge danni speciali: il tuo Attacco speciale si confronta con la Difesa speciale avversaria.');
  for (const change of move.statChanges ?? []) {
    if (!change.stages) continue;
    effects.push(`${change.stages > 0 ? 'Aumenta' : 'Riduce'} ${STATS[change.stat]} ${change.target === 'self' ? 'del tuo Pokémon' : 'dell’avversario'} di ${Math.abs(change.stages)} ${Math.abs(change.stages) === 1 ? 'grado' : 'gradi'}${chance(move.statChangeChance ?? 100)}.`);
  }
  if (move.inflictedStatus) effects.push(`Infligge ${STATUS[move.inflictedStatus]} all’avversario${chance(move.statusChance ?? 100)}${move.minStatusTurns ? ` per ${move.minStatusTurns}–${move.maxStatusTurns ?? move.minStatusTurns} turni` : ''}. ${STATUS_HELP[move.inflictedStatus]}`);
  if (move.statusAffectedByTypeImmunity) effects.push(`Non funziona sui Pokémon immuni al tipo ${battleTypeLabel(move.type)}.`);
  if (move.inflictedConfusionChance) effects.push(`Confonde l’avversario${chance(move.inflictedConfusionChance)}${move.minConfusionTurns ? ` per ${move.minConfusionTurns}–${move.maxConfusionTurns ?? move.minConfusionTurns} turni` : ''}: può colpirsi da solo.`);
  if (move.flinchChance) effects.push(`Può far tentennare l’avversario (${move.flinchChance}% di probabilità): perde la mossa di questo turno senza consumare PP, solo se colpisci prima che agisca e resta in campo.`);
  if (move.drainPercent) effects.push(`Recuperi HP pari al ${move.drainPercent}% dei danni inflitti.`);
  if (move.minHits) effects.push(`Colpisce ${move.minHits === move.maxHits ? move.minHits : `${move.minHits}–${move.maxHits ?? move.minHits}`} volte nello stesso turno.`);
  if (move.leechSeedFraction) effects.push(`Pianta un seme: a fine turno sottrae ${Number((move.leechSeedFraction * 100).toFixed(2))}% degli HP massimi avversari e cura il Pokémon attivo dalla tua parte. Non funziona sui Pokémon Erba o già seminati.`);
  if (move.priority > 0) effects.push(`Priorità +${move.priority}: agisce prima delle mosse con priorità inferiore, anche se sei più lento.`);
  if (move.priority < 0) effects.push(`Priorità ${move.priority}: agisce dopo le mosse con priorità superiore.`);
  if (move.alwaysHits) effects.push('Non effettua il controllo di precisione.');
  if (!effects.length) effects.push('Nessun effetto aggiuntivo implementato.');
  if (move.statChanges?.length) effects.push('I gradi delle statistiche sono temporanei e si azzerano quando il Pokémon viene sostituito.');
  return effects;
}

export function formatMoveDescription(move: MoveDefinition): string {
  const category = move.category === 'physical' ? 'Fisica' : move.category === 'special' ? 'Speciale' : 'Supporto';
  const power = move.fixedDamage ? `Danno fisso ${move.fixedDamage} HP` : `Potenza ${move.power || '—'}`;
  return [`${battleTypeLabel(move.type)} · ${category} · ${power} · Precisione ${move.alwaysHits ? 'sempre' : `${move.accuracy}%`} · PP ${move.maxPp}`, ...describeMoveEffects(move)].join('\n\n');
}
