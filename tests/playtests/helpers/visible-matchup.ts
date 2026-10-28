import { effectivenessFor, type TypeChart } from '../../../src/core/battle/rules.ts';
import type { BattleCreature, BattleType, MoveDefinition } from '../../../src/core/battle/types.ts';

const GEN_I_MAX_SPECIES_ID = 151;
const MIN_RESERVE_HP_RATIO = 0.4;
const MIN_SWITCH_ADVANTAGE = 1.3;

type DamagingMoveCatalog = Readonly<Record<string, MoveDefinition>>;

function damagingScore(
  creature: BattleCreature,
  targetTypes: readonly BattleType[],
  moveCatalog: DamagingMoveCatalog,
  typeChart: TypeChart,
): number {
  let best = 0;
  for (const slot of creature.moves) {
    if (slot.pp <= 0) continue;
    const move = moveCatalog[slot.moveId];
    if (!move || move.category === 'status' || move.power <= 0 || move.fixedDamage !== undefined) continue;
    const effectiveness = effectivenessFor(targetTypes, move.type, typeChart);
    if (effectiveness <= 0) continue;
    const stab = creature.types.includes(move.type) ? 1.5 : 1;
    const offensiveStat = move.category === 'physical' ? creature.stats.attack : creature.stats.specialAttack;
    best = Math.max(best, move.power * effectiveness * stab * offensiveStat);
  }
  return best;
}

/**
 * Pick a living Kanto reserve only when its best usable, variable-power attack
 * is more than 30% better than the active creature's, using visible typing and
 * the supplied local move/type data. Returns the existing party object by ref.
 */
export function chooseVisibleMatchupReplacement(
  active: BattleCreature,
  party: readonly BattleCreature[],
  targetTypes: readonly BattleType[],
  moveCatalog: DamagingMoveCatalog,
  typeChart: TypeChart,
): BattleCreature | undefined {
  const activeScore = damagingScore(active, targetTypes, moveCatalog, typeChart);
  let best: BattleCreature | undefined;
  let bestScore = 0;

  for (const candidate of party) {
    if (candidate.instanceId === active.instanceId || candidate.speciesId < 1 || candidate.speciesId > GEN_I_MAX_SPECIES_ID) continue;
    if (candidate.hp <= 0 || candidate.stats.maxHp <= 0 || candidate.hp / candidate.stats.maxHp <= MIN_RESERVE_HP_RATIO) continue;
    const score = damagingScore(candidate, targetTypes, moveCatalog, typeChart);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best && bestScore > activeScore * MIN_SWITCH_ADVANTAGE ? best : undefined;
}
