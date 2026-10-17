import test from 'node:test';
import assert from 'node:assert/strict';
import opening from '../../content/dialogue/opening.v1.json' with { type: 'json' };
import { selectOpeningGuidance } from '../../src/core/quests/opening-guidance.ts';

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
