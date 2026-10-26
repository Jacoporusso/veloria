import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import guides from '../../content/journey/pokemon-rewards.v1.json' with { type: 'json' };
import dialogue from '../../content/dialogue/world.v1.json' with { type: 'json' };
import type { QuestDefinition } from '../../src/core/quests/apply-quest-event.ts';
import { pokemonRewardDiscoveryState } from '../../src/core/quests/pokemon-reward-discovery.ts';

const quests: QuestDefinition[] = readdirSync('content/quests').filter(file => file.endsWith('.quest.json'))
  .map(file => JSON.parse(readFileSync(`content/quests/${file}`, 'utf8')));
const maps = readdirSync('content/maps').filter(file => file.endsWith('.map.json'))
  .map(file => JSON.parse(readFileSync(`content/maps/${file}`, 'utf8')));

test('every Pokémon reward quest has one guide pointing to an actual map NPC', () => {
  const rewards = quests.filter(quest => quest.reward?.pokemon?.length);
  assert.deepEqual(guides.guides.map(guide => guide.questId).sort(), rewards.map(quest => quest.id).sort());
  assert.equal(new Set(guides.guides.map(guide => guide.questId)).size, guides.guides.length);
  for (const guide of guides.guides) {
    const map = maps.find(map => map.id === guide.mapId);
    assert.ok(map, guide.mapId);
    assert.ok(map.npcRefs.includes(guide.npcId), `${guide.questId}: NPC belongs to destination`);
    const tiled = JSON.parse(readFileSync(`public/${map.tiledAsset}`, 'utf8'));
    assert.ok(tiled.layers.flatMap((layer: any) => layer.objects ?? []).some((object: any) =>
      object.properties?.some((property: any) => property.name === 'npcId' && property.value === guide.npcId)));
    for (const hint of [guide.routeHint, guide.actionHint, guide.unlockHint]) assert.ok(hint.trim());
  }
});

test('fossils point to Elia actual dialogue choices and unlock only after the League', () => {
  const stage = dialogue.prof_elia.stages.find(stage => stage.whenFlagPresent === 'q_league_completed')!;
  for (const guide of guides.guides.filter(guide => guide.questId.includes('/q_fossil_'))) {
    const quest = quests.find(quest => quest.id === guide.questId)!;
    const choice = stage.choices!.find(choice => choice.questEvent === quest.steps[0].trigger)!;
    assert.ok(choice, quest.id);
    assert.ok(guide.actionHint.includes(choice.label));
    assert.equal(guide.mapId, 'veloria/borgofonte_lab');
    assert.equal(pokemonRewardDiscoveryState(quest, []), 'locked');
    assert.equal(pokemonRewardDiscoveryState(quest, ['q_league_completed']), 'available');
    assert.equal(pokemonRewardDiscoveryState(quest, [quest.completionFlag]), 'received');
  }
});

test('greenhouse guidance distinguishes external access from its own unfinished steps', () => {
  const quest = quests.find(quest => quest.id === 'veloria/q_radicelmo_greenhouse')!;
  assert.equal(pokemonRewardDiscoveryState(quest, []), 'locked');
  assert.equal(pokemonRewardDiscoveryState(quest, ['q_radicelmo_seed_archived']), 'available');
  assert.equal(pokemonRewardDiscoveryState(quest, ['q_radicelmo_greenhouse_complete']), 'received');
});

test('Ivo needs both the city visit and real R06 reading before his reward is ready', () => {
  const quest = quests.find(quest => quest.id === 'veloria/q_ferraluce_report')!;
  assert.equal(pokemonRewardDiscoveryState(quest, ['q_ferraluce_visited']), 'locked');
  assert.equal(pokemonRewardDiscoveryState(quest, ['q_ferraluce_visited', 'q_r06_measurement']), 'available');
});
