import type { CreatureSave, GameSave } from '../../persistence/save-types.ts';
import type { SpeciesBattleRegistry } from '../battle/create-creature.ts';
import { calculateStats } from '../battle/create-creature.ts';

export interface ItemEvolutionRule {
  readonly fromSpeciesId: number;
  readonly toSpeciesId: number;
  readonly itemId: string;
}
export interface EvolutionReceipt {
  readonly creatureId: string;
  readonly fromSpeciesId: number;
  readonly toSpeciesId: number;
  readonly level: number;
}
const PREFIX = 'presentation/evolution/';
export function evolutionReceiptFlag(receipt: EvolutionReceipt): string {
  return PREFIX + [encodeURIComponent(receipt.creatureId), receipt.fromSpeciesId, receipt.toSpeciesId, receipt.level].join('/');
}
export function pendingEvolutionReceipts(save: GameSave): EvolutionReceipt[] {
  return save.flags.flatMap(flag => {
    if (!flag.startsWith(PREFIX)) return [];
    const parts = flag.slice(PREFIX.length).split('/');
    if (parts.length !== 4) return [];
    try {
      const creatureId = decodeURIComponent(parts[0]);
      const [fromSpeciesId, toSpeciesId, level] = parts.slice(1).map(Number);
      if (!creatureId || ![fromSpeciesId, toSpeciesId, level].every(n => Number.isSafeInteger(n) && n > 0)) return [];
      return [{ creatureId, fromSpeciesId, toSpeciesId, level }];
    } catch { return []; }
  });
}
export function queueEvolutionReceipts(save: GameSave, receipts: readonly EvolutionReceipt[]): GameSave {
  return { ...save, flags: [...new Set([...save.flags, ...receipts.map(evolutionReceiptFlag), ...receipts.map(r => `pokedex_seen_${r.toSpeciesId}`)])] };
}
export type ItemEvolutionResult =
  | { readonly ok: false; readonly reason: 'missingItem' | 'notInParty' | 'incompatible' | 'unavailable'; readonly save: GameSave }
  | { readonly ok: true; readonly save: GameSave; readonly receipt: EvolutionReceipt; readonly creature: CreatureSave };

/** Consumes exactly one stone together with the new creature and durable presentation receipt. */
export function applyItemEvolution(save: GameSave, itemId: string, creatureId: string,
  rules: readonly ItemEvolutionRule[], species: SpeciesBattleRegistry): ItemEvolutionResult {
  const quantity = save.inventory[itemId] ?? 0;
  if (!Number.isSafeInteger(quantity) || quantity < 1) return { ok: false, reason: 'missingItem', save };
  const current = save.party.find(creature => creature.instanceId === creatureId);
  if (!current) return { ok: false, reason: 'notInParty', save };
  const rule = rules.find(rule => rule.itemId === itemId && rule.fromSpeciesId === current.speciesId);
  if (!rule) return { ok: false, reason: 'incompatible', save };
  const target = species[rule.toSpeciesId];
  if (!target) return { ok: false, reason: 'unavailable', save };
  const stats = calculateStats(target.baseStats, current.level);
  const creature: CreatureSave = { ...current, speciesId: target.speciesId, maxHp: stats.maxHp,
    hp: current.hp === 0 ? 0 : Math.min(stats.maxHp, current.hp + Math.max(0, stats.maxHp - current.maxHp)),
    moves: current.moves.map(move => ({ ...move })), ...(current.status ? { status: { ...current.status } } : {}) };
  const receipt = { creatureId, fromSpeciesId: current.speciesId, toSpeciesId: target.speciesId, level: current.level };
  const next = { ...save, inventory: { ...save.inventory, [itemId]: quantity - 1 },
    party: save.party.map(member => member.instanceId === creatureId ? creature : member) };
  return { ok: true, creature, receipt, save: queueEvolutionReceipts(next, [receipt]) };
}
