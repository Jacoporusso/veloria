import { effectivenessFor, type BattleRules } from '../../core/battle/rules.ts';
import type { BattleCreature, MoveDefinition } from '../../core/battle/types.ts';
import { battleTypeLabel } from './presentation.ts';

export interface MoveMatchup {
  readonly label: string;
  readonly explanation: readonly string[];
  readonly multiplier?: number;
  readonly blocked: boolean;
}
export function matchupMultiplierLabel(value: number): string {
  return `×${value === 0.25 ? '¼' : value === 0.5 ? '½' : value}`;
}
/** Uses injected combat rules, including support and fixed-damage exceptions. */
export function describeMoveMatchup(move: MoveDefinition, target: BattleCreature, rules: BattleRules): MoveMatchup {
  const multiplier = effectivenessFor(target.types, move.type, rules.typeChart);
  const reasons = target.types.map(type => `${battleTypeLabel(move.type)} contro ${battleTypeLabel(type)}: ${matchupMultiplierLabel(effectivenessFor([type], move.type, rules.typeChart))}.`);
  if (move.category === 'status') {
    if (move.statusAffectedByTypeImmunity && move.inflictedStatus && multiplier === 0) return { label: 'Ø Nessun effetto', blocked: true, explanation: reasons };
    if (move.leechSeedFraction && (target.types.includes('grass') || target.leechSeed)) return { label: 'Ø Nessun effetto', blocked: true, explanation: [target.types.includes('grass') ? 'I Pokémon Erba sono immuni ai semi.' : 'Il bersaglio è già seminato.'] };
    if (move.inflictedStatus) {
      const immune = target.types.filter(type => rules.statusImmunities[type]?.includes(move.inflictedStatus!));
      if (immune.length) return { label: 'Ø Stato impedito', blocked: true, explanation: [`Il tipo ${immune.map(battleTypeLabel).join(' / ')} impedisce questo stato.`] };
      if (target.status) return { label: 'Ø Stato già presente', blocked: true, explanation: ['Il bersaglio ha già uno stato principale: non può riceverne un altro.'] };
    }
    return { label: '◇ Supporto', blocked: false, explanation: ['Questa mossa modifica lo stato della lotta: non usa i moltiplicatori di danno dei tipi.'] };
  }
  if (move.fixedDamage && multiplier !== 0) return { label: `◆ ${move.fixedDamage} HP fissi`, multiplier: 1, blocked: false, explanation: [`Infligge ${move.fixedDamage} HP se colpisce. Resistenze e debolezze non modificano il danno fisso; restano valide le immunità.`] };
  const warnings = move.inflictedStatus && target.types.some(type => rules.statusImmunities[type]?.includes(move.inflictedStatus!)) ? ['Il danno può colpire, ma un tipo del bersaglio impedisce lo stato aggiuntivo.'] : [];
  return { label: `${multiplier === 0 ? 'Ø Nessun effetto' : multiplier > 1 ? '↑ Super efficace' : multiplier < 1 ? '↓ Poco efficace' : '● Normale'} ${matchupMultiplierLabel(multiplier)}`, multiplier, blocked: multiplier === 0, explanation: [...reasons, ...warnings] };
}
