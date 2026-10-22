import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import progression from '../../content/battle/progression.v2.json' with { type: 'json' };
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import { experienceToNextLevel } from '../../src/core/battle/progression.ts';
import { battleExperienceProgress } from '../../src/game/battle/presentation.ts';
import { prototypeBattleRules, type ExperienceCurve } from '../../src/core/battle/rules.ts';
import type { BattleCreature } from '../../src/core/battle/types.ts';
const curves: Record<string, ExperienceCurve> = progression.growthCurves;
const source = (kind: string, id: number) => JSON.parse(readFileSync(new URL(`../../content/sources/pokeapi/${kind}-${id}.json`, import.meta.url), 'utf8'));

for (const id of [1, 2, 3, 4]) {
  test(`official growth table ${id} preserves every source threshold through level 100`, () => {
    const raw = source('growth-rate', id), curve = curves[`pokeapi_growth_${raw.name}_v1`];
    assert.ok('totalExperience' in curve);
    const levels = raw.levels.sort((a: any, b: any) => a.level - b.level);
    assert.deepEqual(curve.totalExperience, levels.map((entry: any) => entry.experience));
    for (let level = 1; level < 100; level++) {
      assert.equal(experienceToNextLevel(level, curve), levels[level].experience - levels[level - 1].experience);
    }
    assert.throws(() => experienceToNextLevel(100, curve), /Invalid/);
  });
}

test('every runtime species uses its own official growth category, never a template category', () => {
  const counts: Record<string, number> = {};
  for (const species of Object.values(speciesData.species)) {
    const category = source('pokemon-species', species.speciesId).growth_rate.name;
    assert.equal(species.growthCurveId, `pokeapi_growth_${category}_v1`);
    assert.ok(curves[species.growthCurveId]);
    counts[category] = (counts[category] ?? 0) + 1;
  }
  assert.deepEqual(counts, { 'medium-slow': 25, medium: 43, fast: 2, slow: 10 });
});

test('growth table rejects missing, decreasing, fractional and negative consecutive totals', () => {
  for (const totalExperience of [[], [0], [0, 0], [2, 1], [-1, 3], [0, 1.5]]) {
    assert.throws(() => experienceToNextLevel(1, { totalExperience }), /Invalid/);
  }
  for (const level of [0, -1, 1.5, Infinity]) assert.throws(() => experienceToNextLevel(level, { totalExperience: [0, 10] }), /Invalid/);
});

test('XP shown in battle uses the actual species curve and handles level 100', () => {
  const curve = curves[speciesData.species['4'].growthCurveId];
  const required = experienceToNextLevel(5, curve);
  assert.equal(required, 44);
  const creature = { level: 5, experience: 22, growthCurveId: speciesData.species['4'].growthCurveId } as BattleCreature;
  const rules = { ...prototypeBattleRules, experienceCurves: curves };
  assert.deepEqual(battleExperienceProgress(creature, rules), { ratio: .5, label: '22/44 XP' });
  assert.deepEqual(battleExperienceProgress({ ...creature, level: 100 }, rules), { ratio: 1, label: 'LIVELLO MASSIMO' });
});
