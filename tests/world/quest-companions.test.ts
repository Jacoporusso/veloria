import assert from 'node:assert/strict';
import test from 'node:test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import movesData from '../../content/battle/moves.v1.json' with { type: 'json' };
import greenhouse from '../../content/quests/radicelmo_greenhouse.quest.json' with { type: 'json' };
import ferraluce from '../../content/quests/ferraluce_report.quest.json' with { type: 'json' };
import acquariva from '../../content/quests/acquariva_research.quest.json' with { type: 'json' };
import omanyte from '../../content/quests/fossil_omanyte.quest.json' with { type: 'json' };
import kabuto from '../../content/quests/fossil_kabuto.quest.json' with { type: 'json' };
import aerodactyl from '../../content/quests/fossil_aerodactyl.quest.json' with { type: 'json' };
import { applyQuestEvent } from '../../src/core/quests/apply-quest-event.ts';
import type { CreatureRegistries } from '../../src/core/battle/create-creature.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const registries = { species: speciesData.species, moves: movesData.moves } as unknown as CreatureRegistries;
for (const quest of [greenhouse, ferraluce, acquariva, omanyte, kabuto, aerodactyl]) {
  test(`${quest.id} grants its companion once, with full-team delivery to storage`, () => {
    const step = quest.steps.at(-1)!;
    const save: GameSave = { schemaVersion: 2, contentVersion: 'test', saveRevision: 1, saveId: 'quest-gift', savedAt: '',
      player: { name: 'Ada', mapId: 'veloria/radicelmo', spawnPointId: 'test', x: 1, y: 1, money: 200 },
      party: Array.from({ length: 6 }, (_, i) => ({ instanceId: `member-${i}`, speciesId: 4, level: 5,
        experience: 0, hp: 19, maxHp: 19, moves: [{ id: 'scratch', pp: 20 }] })),
      storage: [], inventory: {}, flags: [...step.requiresFlags], badges: [], rngState: 17 };
    const snapshot = structuredClone(save);
    assert.throws(() => applyQuestEvent(save, step.trigger, [quest]), /Companion registries required/);
    assert.deepEqual(save, snapshot);
    const awarded = applyQuestEvent(save, step.trigger, [quest], registries);
    assert.equal(awarded.save.party.length, 6);
    assert.equal(awarded.save.storage.length, 1);
    const gift = awarded.save.storage[0];
    assert.equal(gift.speciesId, quest.reward.pokemon[0].speciesId);
    assert.equal(gift.level, quest.reward.pokemon[0].level);
    assert.ok((gift.moves as { id: string }[]).every(slot => registries.moves[slot.id]));
    assert.ok(awarded.save.flags.includes(`pokedex_caught_${gift.speciesId}`));
    const replay = applyQuestEvent(JSON.parse(JSON.stringify(awarded.save)), step.trigger, [quest], registries);
    assert.deepEqual(replay.save, awarded.save);
    assert.equal(replay.progressed, false);
    assert.deepEqual(save, snapshot);
    const withRoom = applyQuestEvent({ ...save, party: save.party.slice(0, 1) }, step.trigger, [quest], registries);
    assert.equal(withRoom.save.party.length, 2);
    assert.equal(withRoom.save.party[1].speciesId, gift.speciesId);
    assert.equal(withRoom.save.storage.length, 0);
  });
}
