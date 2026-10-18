import levelUpData from '../../../content/battle/level-up-moves.v1.json';
import speciesData from '../../../content/battle/species.v1.json';
import moveData from '../../../content/battle/moves.v1.json';
import type { EncounterTable } from '../../core/encounters/select-encounter.ts';
import { prototypeBattleRules } from '../../core/battle/rules.ts';
import type { BattleMoveRegistry, SpeciesBattleRegistry } from '../../core/battle/create-creature.ts';
import type { TrainerBattleDefinition } from './create-battle-state.ts';
import type { ShopDefinition } from '../../core/services/shop.ts';
import itemData from '../../../content/items/items.v1.json';
import progressionData from '../../../content/battle/progression.v1.json';
import typeChartData from '../../../content/battle/type-chart.v1.json';
import type { EvolutionRule, ExperienceCurve, TypeChart } from '../../core/battle/rules.ts';

export const battleSpecies = (speciesData as { species: SpeciesBattleRegistry }).species;
export const battleMoves: BattleMoveRegistry = (moveData as { moves: BattleMoveRegistry }).moves;
export const trainerCatalog: Readonly<Record<string, TrainerBattleDefinition>> = Object.values(import.meta.glob<TrainerBattleDefinition>('../../../content/trainers/*.trainer.json', {
  eager: true,
  import: 'default',
})).reduce<Record<string, TrainerBattleDefinition>>((catalog, trainer) => ({ ...catalog, [trainer.id]: trainer }), {});

export const encounterCatalog: Readonly<Record<string, EncounterTable>> = Object.values(import.meta.glob<EncounterTable>('../../../content/encounters/*.encounter.json', {
  eager: true,
  import: 'default',
})).reduce((catalog, table) => ({ ...catalog, [table.id]: table }), {});

type ItemDefinition = {
  id: string; name: string; price: number; maxStack: number; description?: string;
  battle?: { healHp?: number; cures?: readonly ('burn' | 'poison' | 'paralysis' | 'sleep' | 'freeze')[] };
  capture?: { baseChance: number; missingHpBonus?: number; statusBonus?: number };
};
export const itemCatalog: Readonly<Record<string, ItemDefinition>> = (itemData as { items: Record<string, ItemDefinition> }).items;

export const shopCatalog: Readonly<Record<string, ShopDefinition>> = Object.values(import.meta.glob<ShopDefinition>('../../../content/shops/*.shop.json', {
  eager: true,
  import: 'default',
})).reduce<Record<string, ShopDefinition>>((catalog, shop) => ({ ...catalog, [shop.id]: shop }), {});

const progression = progressionData as {
  growthCurves: Record<string, ExperienceCurve>;
  evolutions: readonly { fromSpeciesId: number; toSpeciesId: number; minimumLevel: number }[];
};
const growthCurves = progression.growthCurves;
export const battleTypeChart = typeChartData.chart as TypeChart;
const evolutionRules = progression.evolutions.reduce<Record<number, EvolutionRule[]>>((rules, entry) => {
  const target = battleSpecies[String(entry.toSpeciesId)];
  if (!target) throw new Error(`Evolution target ${entry.toSpeciesId} is not in the battle species registry.`);
  (rules[entry.fromSpeciesId] ??= []).push({ minimumLevel: entry.minimumLevel, target });
  return rules;
}, {});

/** Prototype consumable values remain content-owned until the battle balance pass. */
export const veloriaBattleRules = {
  ...prototypeBattleRules,
  id: prototypeBattleRules.id,
  typeChart: battleTypeChart,
  experienceCurves: growthCurves,
  levelUpMoves: Object.fromEntries(Object.entries(levelUpData.species).map(([id, entries]) => [id, entries.map(entry => {
    const move = battleMoves[entry.moveId];
    if (!move) throw new Error('Unknown level-up move: ' + entry.moveId);
    return { ...entry, maxPp: move.maxPp };
  })])),
  evolutions: evolutionRules,
  items: Object.fromEntries(Object.values(itemCatalog).filter(item => item.battle).map(item => [item.id, item.battle!])),
  captureItems: Object.fromEntries(Object.values(itemCatalog).filter(item => item.capture).map(item => [item.id, item.capture!])),
};
