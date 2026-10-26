import type { GameSave } from '../../persistence/save-types.ts';
import type { SpeciesBattleRegistry } from '../battle/create-creature.ts';
import { evolvePartyMember, type ItemEvolutionResult } from './item-evolution.ts';

export interface TradeEvolutionRule {
  readonly fromSpeciesId: number;
  readonly toSpeciesId: number;
}

/** Staff trades and returns the same companion; no invented stone or fee. */
export function applyTradeEvolution(save: GameSave, creatureId: string,
  rules: readonly TradeEvolutionRule[], species: SpeciesBattleRegistry): ItemEvolutionResult {
  const current = save.party.find(creature => creature.instanceId === creatureId);
  if (!current) return { ok: false, reason: 'notInParty', save };
  const rule = rules.find(candidate => candidate.fromSpeciesId === current.speciesId);
  if (!rule) return { ok: false, reason: 'incompatible', save };
  return evolvePartyMember(save, creatureId, rule.toSpeciesId, species);
}
