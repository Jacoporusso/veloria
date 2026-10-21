/** Run with node --experimental-strip-types tools/audit_progression.ts.
 * A generous XP budget, NOT a playthrough: assumes every optional trainer is won,
 * no losses and all earned XP can be assigned freely. Captures and travel are not simulated.
 */
import { readFile, readdir } from 'node:fs/promises';
import { experienceForDefeat, prototypeBattleRules } from '../src/core/battle/rules.ts';
import { experienceToNextLevel } from '../src/core/battle/progression.ts';

type Trainer = { id: string; name: string; team: { speciesId: number; level: number }[] };
type PoolEntry = { speciesId: number; weight: number; minLevel: number; maxLevel: number };
const root = new URL('../', import.meta.url);
async function json(path: string): Promise<any> {
  return JSON.parse(await readFile(new URL(path, root), 'utf8'));
}
const species = (await json('content/battle/species.v1.json')).species;
const growth = (await json('content/battle/progression.v1.json')).growthCurves;
const curve = growth.veloria_medium_fast_v1;
const trainers = new Map<string, Trainer>();
for (const file of (await readdir(new URL('content/trainers/', root))).filter(f => f.endsWith('.json'))) {
  const trainer: Trainer = await json(`content/trainers/${file}`);
  trainers.set(trainer.id, trainer);
}
function trainer(id: string): Trainer {
  const found = trainers.get(`veloria/${id}`);
  if (!found) throw new Error(`Unknown trainer: ${id}`);
  return found;
}
function xpForTrainer(t: Trainer): number {
  return t.team.reduce((sum, member) => sum + experienceForDefeat(
    species[member.speciesId].experienceYield, member.level, true, prototypeBattleRules.experienceRewards), 0);
}
function xpToLevel(level: number): number {
  let xp = 0;
  for (let current = 5; current < level; current++) xp += experienceToNextLevel(current, curve);
  return xp;
}
function levelForXp(xp: number): number {
  let level = 5;
  while (level < prototypeBattleRules.maxLevel) {
    const needed = experienceToNextLevel(level, curve);
    if (xp < needed) break;
    xp -= needed;
    level++;
  }
  return level;
}
async function meanWildXp(file: string): Promise<Record<string, number>> {
  const table = await json(`content/encounters/${file}.encounter.json`);
  return Object.fromEntries(Object.entries(table.timeBands).map(([band, entries]) => {
    let weighted = 0, weights = 0;
    for (const entry of entries as PoolEntry[]) {
      let total = 0;
      for (let level = entry.minLevel; level <= entry.maxLevel; level++) {
        total += experienceForDefeat(species[entry.speciesId].experienceYield, level, false, prototypeBattleRules.experienceRewards);
      }
      weighted += entry.weight * total / (entry.maxLevel - entry.minLevel + 1);
      weights += entry.weight;
    }
    return [band, weighted / weights];
  }));
}
// Route order is authored here; teams, yields, growth and habitat weights remain live content.
const stages = [
  ['trainer_mira_gym01', ['trainer_route01_sera', 'trainer_route01_timo'], 'd01_woodland'],
  ['trainer_dalia_gym02', ['trainer_r04_nila'], 'r04_petal_ascent'],
  ['trainer_aster_gym03', ['trainer_r05_oren'], 'r05_cherry_viaduct'],
  ['trainer_rhea_gym04', ['trainer_r06_iris'], 'r06_magnetic_patch'],
  ['trainer_nerea_gym05', ['trainer_r07_dario', 'trainer_r08_viola'], 'r08_coastal_grass'],
  ['trainer_selene_gym06', ['trainer_r09_lina', 'trainer_delta_teo', 'trainer_r10_maya', 'trainer_r11_celia', 'trainer_r09_noemi', 'trainer_r10_bruno'], 'r10_reed_patch'],
  ['trainer_nives_gym07', ['trainer_r12_ruben', 'trainer_r13_alma'], 'r13_snow_patch'],
  ['trainer_aurel_gym08', ['trainer_r15_nilo'], 'r15_garden_patch'],
  ['trainer_league_council1', ['trainer_r16_maia', 'trainer_r16_tobia'], 'r16_garden_patch'],
] as const;
let cumulative = 0;
const report = [];
for (const [bossId, optionalIds, habitat] of stages) {
  const boss = trainer(bossId);
  const optionalXp = optionalIds.reduce((sum, id) => sum + xpForTrainer(trainer(id)), 0);
  cumulative += optionalXp;
  const targetLevel = Math.min(...boss.team.map(member => member.level));
  const wild = await meanWildXp(habitat);
  // Best time band is deliberately optimistic; this is a lower bound on extra KO count.
  const bestWild = Math.max(...Object.values(wild));
  report.push({
    boss: boss.id, targetLevel, optionalTrainerXp: optionalXp,
    cumulativeTrainerXpBeforeBoss: cumulative,
    optimisticSoloLevelFromTrainers: levelForXp(cumulative),
    optimisticThreeMemberLevelFromTrainers: levelForXp(Math.floor(cumulative / 3)),
    habitat, expectedWildXpByTime: wild,
    extraWildKosForSoloTarget: Math.ceil(Math.max(0, xpToLevel(targetLevel) - cumulative) / bestWild),
    extraWildKosForThreeTargets: Math.ceil(Math.max(0, 3 * xpToLevel(targetLevel) - cumulative) / bestWild),
  });
  cumulative += xpForTrainer(boss);
}
console.log(JSON.stringify({
  contentVersion: (await json('content/manifest.json')).contentVersion,
  ruleset: prototypeBattleRules.id,
  assumptions: [
    'All optional trainers defeated once before the next boss; current boss XP excluded.',
    'Starts at level 5 with zero residual XP; cubic prototype curve for all species.',
    'Perfect victories and freely assignable XP are optimistic; runtime rewards only the KO recipient.',
    'Wild KO estimate uses the BEST current habitat time band at its actual weighted levels.',
    'Late habitat yields applied to the entire deficit: lower-bound budget, not a reachable itinerary.',
    'Capturing higher-level party members, battle outcomes, healing, PP and travel are not simulated.',
    'Three-member target is a diagnostic scenario, not an assertion that all three start at level 5.',
  ], stages: report,
}, null, 2));
