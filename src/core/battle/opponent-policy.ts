import { hasUsableBattleMove } from './emergency-move.ts';
import { effectivenessFor, type BattleRules } from './rules.ts';
import { effectiveStat, effectiveMoveAccuracy } from './stat-stages.ts';
import type { MoveCatalog } from './engine.ts';
import type { BattleCommand, BattleCreature, BattleState, MoveDefinition } from './types.ts';

export interface OpponentPolicy {
  readonly id: string;
  readonly statusEveryTurns: number;
  readonly maxSetupStage: number;
  /** Optional attempt limit per support move, using its spent PP as battle history. */
  readonly maxStatusUsesPerMove?: number;
  readonly damageSelection: 'best' | 'cycle';
}

function hasDamageCategory(creature: BattleCreature, catalog: MoveCatalog, category: 'physical' | 'special'): boolean {
  return creature.moves.some(slot => slot.pp > 0 && catalog[slot.moveId]?.category === category && catalog[slot.moveId].power > 0);
}

/** Ranking utility, not a damage prediction: no RNG, HP changes or player-command inspection. */
function attackUtility(user: BattleCreature, target: BattleCreature, move: MoveDefinition, rules: BattleRules): number {
  if (move.category !== 'status' && move.fixedDamage !== undefined) {
    return effectivenessFor(target.types, move.type, rules.typeChart) === 0 ? 0
      : move.fixedDamage * effectiveMoveAccuracy(user, target, move) / 100;
  }
  if (move.category === 'status' || move.power <= 0) return 0;
  const physical = move.category === 'physical';
  const attack = effectiveStat(user, physical ? 'attack' : 'specialAttack');
  const defense = effectiveStat(target, physical ? 'defense' : 'specialDefense');
  const burn = physical && user.status?.status === 'burn' ? 0.5 : 1;
  return move.power * attack / defense * burn * (user.types.includes(move.type) ? 1.5 : 1)
    * effectivenessFor(target.types, move.type, rules.typeChart) * effectiveMoveAccuracy(user, target, move) / 100;
}

function setupUtility(user: BattleCreature, target: BattleCreature, move: MoveDefinition, catalog: MoveCatalog, policy: OpponentPolicy): number {
  if (move.accuracy <= 0) return 0;
  let utility = 0;
  for (const effect of move.statChanges ?? []) {
    const recipient = effect.target === 'self' ? user : target;
    const current = recipient.statStages?.[effect.stat] ?? 0;
    const beneficial = effect.target === 'self' ? effect.stages > 0 : effect.stages < 0;
    if (!beneficial) continue;
    if (Math.abs(current) >= policy.maxSetupStage && Math.sign(current) === Math.sign(effect.stages)) continue;
    if (current >= 6 && effect.stages > 0 || current <= -6 && effect.stages < 0) continue;
    const physical = effect.stat === 'attack' || effect.stat === 'defense';
    const special = effect.stat === 'specialAttack' || effect.stat === 'specialDefense';
    const attacker = effect.stat === 'attack' || effect.stat === 'specialAttack' ? recipient : effect.target === 'self' ? target : user;
    if ((physical || special) && !hasDamageCategory(attacker, catalog, physical ? 'physical' : 'special')) continue;
    utility += Math.abs(effect.stages) * effectiveMoveAccuracy(user, target, move) / 100;
  }
  if (move.inflictedStatus && !target.status && !move.statChanges?.length) utility += (move.statusChance ?? 100) / 100;
  if (move.leechSeedFraction && !target.leechSeed && !target.types.includes('grass')) utility += effectiveMoveAccuracy(user, target, move) / 100;
  return utility;
}

/** Selects from visible battle state using an injected content policy. Does not advance PRNG. */
export function chooseOpponentCommand(state: BattleState, catalog: MoveCatalog, rules: BattleRules, policy: OpponentPolicy): BattleCommand {
  const user = state.opponent.creatures[state.opponent.activeIndex];
  const target = state.player.creatures[state.player.activeIndex];
  const replacement = state.opponent.creatures.findIndex((creature, index) => index !== state.opponent.activeIndex && creature.hp > 0);
  if (user.hp <= 0) return replacement >= 0 ? { kind: 'switch', partyIndex: replacement } : { kind: 'useMove', moveSlot: 0 };
  const options = user.moves.flatMap((slot, index) => {
    const move = catalog[slot.moveId];
    if (slot.pp <= 0 || !move || (move.batonPass && replacement < 0)) return [];
    const setupAllowed = policy.maxStatusUsesPerMove === undefined || move.maxPp - slot.pp < policy.maxStatusUsesPerMove;
    const setup = setupAllowed ? setupUtility(user, target, move, catalog, policy) : 0;
    const statusImmune = (move.inflictedStatus && target.types.some(type => rules.statusImmunities[type]?.includes(move.inflictedStatus!))) ||
      (move.category === 'status' && move.statusAffectedByTypeImmunity && effectivenessFor(target.types, move.type, rules.typeChart) === 0);
    return [{ index, move, attack: attackUtility(user, target, move, rules), setup: statusImmune ? 0 : setup }];
  });
  if (!options.length) {
    const withPp = state.opponent.creatures.findIndex((creature, index) => index !== state.opponent.activeIndex && creature.hp > 0 && hasUsableBattleMove(creature, catalog));
    return withPp >= 0 ? { kind: 'switch', partyIndex: withPp } : { kind: 'struggle' };
  }
  const attacks = options.filter(option => option.attack > 0).sort((a, b) => b.attack - a.attack || b.move.priority - a.move.priority || a.index - b.index);
  const setup = options.filter(option => option.move.category === 'status' && option.setup > 0).sort((a, b) => b.setup - a.setup || a.index - b.index);
  const useSetup = policy.statusEveryTurns > 0 && state.turn % policy.statusEveryTurns === 0;
  let chosen = useSetup && setup.length ? setup[0] : undefined;
  if (!chosen && attacks.length) chosen = policy.damageSelection === 'cycle'
    ? [...attacks].sort((a, b) => a.index - b.index)[state.turn % attacks.length] : attacks[0];
  chosen ??= setup[0] ?? options.find(option => option.move.category !== 'status') ?? options[0];
  return chosen.move.batonPass
    ? { kind: 'useMove', moveSlot: chosen.index, batonPassPartyIndex: replacement }
    : { kind: 'useMove', moveSlot: chosen.index };
}
