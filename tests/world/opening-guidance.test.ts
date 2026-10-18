import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import opening from '../../content/dialogue/opening.v1.json' with { type: 'json' };
import { selectOpeningGuidance } from '../../src/core/quests/opening-guidance.ts';

function tiledMap(file: string) {
  return JSON.parse(readFileSync(new URL(`../../public/tilemaps/${file}`, import.meta.url), 'utf8')) as {
    layers: { name: string; objects?: { name?: string; properties?: { name: string; value: unknown }[] }[] }[];
  };
}
function property(object: { properties?: { name: string; value: unknown }[] }, name: string): unknown {
  return object.properties?.find(candidate => candidate.name === name)?.value;
}

test('main route guidance leads through Radicelmo and the petal ascent without requiring the optional greenhouse', () => {
  const flags = ['badge_aurora_awarded'];
  for (const [mapId, destination] of [
    ['veloria/r03_terrazze_muschio','veloria/radicelmo'],
    ['veloria/radicelmo','veloria/r04_salita_petali'],
    ['veloria/r04_salita_petali','veloria/petalora'],
  ]) assert.equal(selectOpeningGuidance(mapId, flags, opening.guidance)?.destinationMapId, destination);
});

test('guidance keeps Elia visible after selection and distinguishes the room exit from the village exit', () => {
  const chosen = ['q_starter_selected'];
  assert.equal(selectOpeningGuidance('veloria/borgofonte_lab', chosen, opening.guidance)?.npcId, 'prof_elia');
  const mission = [...chosen, 'q_research_sample_received'];
  assert.equal(selectOpeningGuidance('veloria/borgofonte_lab', mission, opening.guidance)?.destinationMapId, 'veloria/borgofonte');
  assert.equal(selectOpeningGuidance('veloria/borgofonte', mission, opening.guidance)?.destinationMapId, 'veloria/r01_sentiero_alba');
  assert.equal(selectOpeningGuidance('veloria/r01_sentiero_alba', mission, opening.guidance), undefined);
});

test('Bosco guidance leads to the resonance meter, then Ada, then the unlocked onward exit', () => {
  const bosco = 'veloria/d01_bosco_veli';
  assert.equal(selectOpeningGuidance(bosco, ['q_research_sample_received'], opening.guidance)?.npcId, 'Misuratore di risonanza');
  assert.equal(selectOpeningGuidance(bosco, ['q_research_sample_received', 'q_forest_signal_found'], opening.guidance)?.npcId, 'forest_ranger_ada');
  assert.equal(selectOpeningGuidance(bosco, ['q_research_sample_received', 'q_forest_signal_found', 'q_ada_helped'], opening.guidance)?.destinationMapId, 'veloria/r02_viale_fronde');
});

test('after reaching Petalora, guidance follows the optional seed and greenhouse route', () => {
  const brumalta = 'veloria/brumalta';
  const terraces = 'veloria/r03_terrazze_muschio';
  const radicelmo = 'veloria/radicelmo';
  const badge = ['badge_aurora_awarded', 'q_petalora_visited'];
  assert.equal(selectOpeningGuidance(brumalta, [], opening.guidance), undefined);
  assert.equal(selectOpeningGuidance('veloria/gym01_brumalta', badge, opening.guidance)?.destinationMapId, brumalta);
  assert.equal(selectOpeningGuidance(brumalta, badge, opening.guidance)?.destinationMapId, terraces);

  const seedCollected = [...badge, 'q_radicelmo_seed_found'];
  assert.equal(selectOpeningGuidance(terraces, badge, opening.guidance)?.npcId, 'Seme custodito');
  assert.equal(selectOpeningGuidance(terraces, seedCollected, opening.guidance)?.destinationMapId, radicelmo);
  assert.equal(selectOpeningGuidance(radicelmo, badge, opening.guidance)?.destinationMapId, terraces);
  assert.equal(selectOpeningGuidance(radicelmo, seedCollected, opening.guidance)?.npcId, 'radicelmo_keeper');

  const archived = [...seedCollected, 'q_radicelmo_seed_archived'];
  assert.equal(selectOpeningGuidance(brumalta, archived, opening.guidance), undefined);
  assert.equal(selectOpeningGuidance(terraces, archived, opening.guidance), undefined);
  assert.equal(selectOpeningGuidance(radicelmo, archived, opening.guidance)?.npcId, 'radicelmo_keeper');
  const current = [...archived];
  for (const [flag, target] of [
    ['greenhouse_started', 'radicelmo_water'], ['greenhouse_watered', 'radicelmo_light'],
    ['greenhouse_lit', 'radicelmo_seed'], ['seed_sprouted', 'radicelmo_keeper'],
  ]) {
    current.push(`q_radicelmo_${flag}`);
    assert.equal(selectOpeningGuidance(radicelmo, current, opening.guidance)?.npcId, target);
  }
  current.push('q_radicelmo_greenhouse_complete');
  assert.equal(selectOpeningGuidance(radicelmo, current, opening.guidance), undefined);
});

test('post-medal guidance targets exist in the authored Tiled maps', () => {
  const gym = tiledMap('gym01_brumalta.tmj');
  const r03 = tiledMap('r03_terrazze_muschio.tmj');
  const radicelmo = tiledMap('radicelmo.tmj');
  const gymExit = gym.layers.find(layer => layer.name === 'triggers')?.objects ?? [];
  assert.ok(gymExit.some(object => property(object, 'destinationMapId') === 'veloria/brumalta'));

  const pickupTargets = r03.layers.flatMap(layer => layer.objects ?? []);
  assert.ok(pickupTargets.some(object => object.name === 'Seme custodito'));
  const ledaTargets = radicelmo.layers.flatMap(layer => layer.objects ?? []);
  assert.ok(ledaTargets.some(object => property(object, 'npcId') === 'radicelmo_keeper' || property(object, 'dialogueId') === 'radicelmo_keeper'));
});

test('Circuito guidance follows the R06 meter and sends missing readings back from Ferraluce', () => {
  const badge = ['badge_circuito_awarded'];
  assert.equal(selectOpeningGuidance('veloria/vetracielo', badge, opening.guidance)?.destinationMapId, 'veloria/r06_anello_magnetico');
  assert.equal(selectOpeningGuidance('veloria/r06_anello_magnetico', badge, opening.guidance)?.npcId, 'Misuratore dell’Anello');
  assert.equal(selectOpeningGuidance('veloria/r06_anello_magnetico', [...badge, 'q_r06_measurement'], opening.guidance)?.destinationMapId, 'veloria/ferraluce');
  assert.equal(selectOpeningGuidance('veloria/ferraluce', [...badge, 'q_ferraluce_visited'], opening.guidance)?.destinationMapId, 'veloria/r06_anello_magnetico');
  assert.equal(selectOpeningGuidance('veloria/ferraluce', [...badge, 'q_r06_measurement', 'q_ferraluce_visited'], opening.guidance)?.npcId, 'ferraluce_ivo');
  for (const mapId of ['veloria/r06_anello_magnetico', 'veloria/ferraluce']) {
    assert.equal(selectOpeningGuidance(mapId, [...badge, 'q_r06_measurement', 'q_ferraluce_visited', 'q_ferraluce_report'], opening.guidance), undefined);
  }
});
