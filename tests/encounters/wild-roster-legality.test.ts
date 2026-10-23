import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { createBattleCreature, type SpeciesBattleRegistry, type BattleMoveRegistry } from '../../src/core/battle/create-creature.ts';
import { validateTable, type EncounterTable } from '../../src/core/encounters/select-encounter.ts';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };

test('every authored wild encounter can spawn with imported legal moves at both level boundaries', () => {
  const species = speciesData.species as SpeciesBattleRegistry;
  const moves = moveData.moves as BattleMoveRegistry;
  const root = new URL('../../content/encounters/', import.meta.url);
  for (const file of readdirSync(root).filter(name => name.endsWith('.encounter.json'))) {
    const table = JSON.parse(readFileSync(new URL(file, root), 'utf8')) as EncounterTable;
    validateTable(table, species);
    for (const entries of Object.values(table.timeBands)) for (const entry of entries) {
      for (const level of new Set([entry.minLevel, entry.maxLevel])) {
        const creature = createBattleCreature({ species, moves, speciesId: entry.speciesId, level, instanceId: 'boundary-check' });
        assert.ok(creature.moves.length > 0, `${table.id}: ${creature.name} at ${level}`);
        for (const slot of creature.moves) {
          assert.ok(species[entry.speciesId].officialLearnset?.some(learned => learned.moveId === slot.moveId && learned.level <= level),
            `${table.id}: ${creature.name} ${slot.moveId} must come from the imported learnset`);
          assert.equal(slot.pp, moves[slot.moveId].maxPp);
        }
      }
    }
  }
});
