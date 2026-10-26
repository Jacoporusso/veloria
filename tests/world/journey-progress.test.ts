import assert from 'node:assert/strict';
import test from 'node:test';
import { selectJourneyProgress, formatQuestRewards, journeyMilestones } from '../../src/game/journey/progress.ts';

test('journey objective follows existing flags without mutating the save', () => {
  const save = { flags: [], party: [], storage: [], badges: [] };
  const first = selectJourneyProgress(save);
  assert.equal(first.completed, 0);
  assert.match(first.objective, /laboratorio/);
  const advanced = selectJourneyProgress({ ...save, flags: ['q_starter_selected', 'q_research_sample_received'] });
  assert.equal(advanced.completed, 2);
  assert.match(advanced.objective, /misuratore di risonanza.*radura del Bosco dei Veli/i);
  const signalFound = selectJourneyProgress({ ...save, flags: ['q_starter_selected', 'q_research_sample_received', 'q_forest_signal_found'] });
  assert.match(signalFound.objective, /torna da Ada nel Bosco dei Veli.*rilevazioni/i);
  assert.deepEqual(save.flags, []);
});

test('an independent forest reading guides back to Ada without inventing Elia progress', () => {
  const save = { flags: ['q_starter_selected', 'q_forest_signal_found'], party: [], storage: [], badges: [] };
  const reading = selectJourneyProgress(save);
  assert.match(reading.objective, /torna da Ada/i);
  assert.equal(reading.milestones.find(step => step.flag === 'q_research_sample_received')?.complete, false);
  const reported = selectJourneyProgress({ ...save, flags: [...save.flags, 'q_ada_helped'] });
  assert.match(reported.objective, /Viale delle Fronde/);
  assert.deepEqual(save.flags, ['q_starter_selected', 'q_forest_signal_found']);
});

test('collection counts unique species and uses earned badges', () => {
  const progress = selectJourneyProgress({
    flags: ['badge_aurora_awarded'], badges: ['badge_aurora'],
    party: [{ speciesId: 25 }, { speciesId: 25 }], storage: [{ speciesId: 16 }],
  } as Parameters<typeof selectJourneyProgress>[0]);
  assert.equal(progress.speciesCount, 2);
  assert.equal(progress.badgeCount, 1);
  assert.equal(progress.completed, 1);
});

test('reward labels reflect quest money, items and badges without adding rewards', () => {
  const quest = { id: 'quest', completionFlag: 'done', steps: [{ trigger: 'win', setFlag: 'done', requiresFlags: [], addBadge: 'badge_aurora' }], reward: { money: 100, items: { potion: 2 } } };
  assert.deepEqual(formatQuestRewards(quest, { potion: 'Pozione' }), ['+100 monete', 'Pozione ×2', 'Medaglia Aurora']);
  assert.deepEqual(formatQuestRewards({ id: 'empty', completionFlag: 'x', steps: [] }, {}), []);
  assert.equal(quest.reward.money, 100);
});

test('gym objective previews real opponent levels and preparation without adding a level gate', () => {
  const save = { flags: ['q_starter_selected', 'q_research_sample_received', 'q_forest_signal_found', 'q_ada_helped', 'q_brumalta_visited', 'gym01_puzzle_solved'],
    party: [{ speciesId: 4, level: 6, hp: 10, maxHp: 20 }], storage: [], badges: [] };
  const before = structuredClone(save);
  const progress = selectJourneyProgress(save as Parameters<typeof selectJourneyProgress>[0]);
  assert.equal(progress.title, 'La Medaglia Aurora');
  assert.match(progress.objective, /livello 7–8.*livello 6.*foglie.*compagno.*Centro Pokémon/);
  assert.equal(progress.completed, 6);
  assert.deepEqual(save, before);
});

test('post-medal journey directions name the existing terraces, seed pickup, and Leda archive', () => {
  const flags = ['q_starter_selected', 'q_research_sample_received', 'q_forest_signal_found', 'q_ada_helped', 'q_brumalta_visited', 'gym01_puzzle_solved', 'badge_aurora_awarded', 'q_petalora_visited', 'gym02_water_source_open', 'gym02_water_west_open', 'gym02_water_east_open', 'gym02_irrigation_solved', 'badge_corolla_awarded', 'q_vetracielo_visited', 'q_vetracielo_orientation', 'gym03_line_gardens_active', 'gym03_line_glass_active', 'gym03_lines_connected', 'badge_circuito_awarded', 'q_r06_measurement', 'q_ferraluce_visited', 'q_ferraluce_report'];
  flags.push('gym04_magnetic_aligned', 'badge_acciaio_awarded', 'q_r07_measurement', 'q_centrale_log', 'q_centrale_isolated', 'q_centrale_output', 'q_centrale_report');
  flags.push('q_portolume_visited', 'q_portolume_orientation', 'q_portolume_tide_read', 'q_portolume_tide_report', 'gym05_basin_balanced', 'gym05_sluice_open', 'gym05_tide_stable', 'badge_marea_awarded');
  flags.push(...journeyMilestones.filter(step=>!('optional' in step&&step.optional) || 'availableAfterFlag' in step).map(step=>step.flag));
  // Finish the main story and special encounters to inspect the remaining greenhouse tasks.
  const towardSeed = selectJourneyProgress({ flags, party: [], storage: [], badges: ['badge_aurora'] });
  assert.equal(towardSeed.title, 'Un seme dal passato');
  assert.match(towardSeed.objective, /est.*Terrazze del Muschio.*Seme custodito/i);

  const towardArchive = selectJourneyProgress({ flags: [...flags, 'q_radicelmo_seed_found'], party: [], storage: [], badges: ['badge_aurora'] });
  assert.equal(towardArchive.title, 'La memoria di Radicelmo');
  assert.match(towardArchive.objective, /Radicelmo.*custode Leda.*archivio della serra/i);

  const archived = selectJourneyProgress({ flags: [...flags, 'q_radicelmo_seed_found', 'q_radicelmo_seed_archived'], party: [], storage: [], badges: ['badge_aurora'] });
  assert.equal(archived.title, 'Un archivio che cresce');
  assert.match(archived.objective, /Leda.*vivaio/i);
});

test('Petalora is the main objective after Aurora while Radicelmo tasks remain optional', () => {
  const flags = ['q_starter_selected','q_research_sample_received','q_forest_signal_found','q_ada_helped','q_brumalta_visited','gym01_puzzle_solved','badge_aurora_awarded'];
  const progress = selectJourneyProgress({flags, party: [], storage: [], badges: ['badge_aurora']});
  assert.equal(progress.currentFlag, 'q_petalora_visited');
  assert.match(progress.objective, /nord di Radicelmo.*Salita dei Petali.*Petalora/);
  assert.ok(progress.milestones.filter(m => m.flag.startsWith('q_radicelmo_')).every(m => m.optional));
  const garden = selectJourneyProgress({flags: [...flags,'q_petalora_visited'], party: [], storage: [], badges: ['badge_aurora']});
  assert.equal(garden.currentFlag, 'gym02_water_source_open');
});

test('Vetracielo is the main objective after Corolla, then Lea follows arrival before optional Radicelmo', () => {
  const flags = ['q_starter_selected','q_research_sample_received','q_forest_signal_found','q_ada_helped','q_brumalta_visited','gym01_puzzle_solved','badge_aurora_awarded','q_petalora_visited','gym02_water_source_open','gym02_water_west_open','gym02_water_east_open','gym02_irrigation_solved','badge_corolla_awarded'];
  const towardVetracielo = selectJourneyProgress({ flags, party: [], storage: [], badges: ['badge_aurora', 'badge_corolla'] });
  assert.equal(towardVetracielo.currentFlag, 'q_vetracielo_visited');
  assert.equal(towardVetracielo.title, 'Verso la città dei giardini');
  assert.match(towardVetracielo.objective, /Medaglia Corolla.*esci a est di Petalora.*Viadotto dei Ciliegi.*Vetracielo/i);
  assert.ok(towardVetracielo.milestones.filter(milestone => milestone.flag.startsWith('q_radicelmo_')).every(milestone => milestone.optional));

  const afterArrival = selectJourneyProgress({ flags: [...flags, 'q_vetracielo_visited'], party: [], storage: [], badges: ['badge_aurora', 'badge_corolla'] });
  assert.equal(afterArrival.currentFlag, 'q_vetracielo_orientation');
  assert.equal(afterArrival.title, 'La Piazza della Monorotaia');
  assert.match(afterArrival.objective, /Parla con Lea davanti alla stazione di Vetracielo/i);
});

test('Gym03 journey marks Giardini, Vetro, Cielo, then Aster before optional Radicelmo', () => {
  const flags = ['q_starter_selected','q_research_sample_received','q_forest_signal_found','q_ada_helped','q_brumalta_visited','gym01_puzzle_solved','badge_aurora_awarded','q_petalora_visited','gym02_water_source_open','gym02_water_west_open','gym02_water_east_open','gym02_irrigation_solved','badge_corolla_awarded','q_vetracielo_visited','q_vetracielo_orientation'];
  const gardens = selectJourneyProgress({ flags, party: [], storage: [], badges: ['badge_aurora', 'badge_corolla'] });
  assert.equal(gardens.currentFlag, 'gym03_line_gardens_active');
  assert.match(gardens.objective, /console 1 Giardini/i);

  const glass = selectJourneyProgress({ flags: [...flags, 'gym03_line_gardens_active'], party: [], storage: [], badges: ['badge_aurora', 'badge_corolla'] });
  assert.equal(glass.currentFlag, 'gym03_line_glass_active');
  assert.match(glass.objective, /dopo Giardini.*console 2 Vetro/i);

  const sky = selectJourneyProgress({ flags: [...flags, 'gym03_line_gardens_active', 'gym03_line_glass_active'], party: [], storage: [], badges: ['badge_aurora', 'badge_corolla'] });
  assert.equal(sky.currentFlag, 'gym03_lines_connected');
  assert.match(sky.objective, /console 3 Cielo.*sotto Aster/i);

  const aster = selectJourneyProgress({ flags: [...flags, 'gym03_line_gardens_active', 'gym03_line_glass_active', 'gym03_lines_connected'], party: [], storage: [], badges: ['badge_aurora', 'badge_corolla'] });
  assert.equal(aster.currentFlag, 'badge_circuito_awarded');
  assert.match(aster.objective, /Affronta Aster.*Terra è immune.*Sonicboom/i);
});


test('the main story continues after Circuito through measurement, Ferraluce arrival and Ivo report', () => {
  const completed = journeyMilestones.filter(milestone => !('optional' in milestone)).map(milestone => milestone.flag);
  const start = completed.filter(flag => !['q_r06_measurement', 'q_ferraluce_visited', 'q_ferraluce_report'].includes(flag));
  const save = { flags: start, party: [], storage: [], badges: ['badge_circuito'] };
  assert.equal(selectJourneyProgress(save).currentFlag, 'q_r06_measurement');
  assert.match(selectJourneyProgress(save).objective, /est di Vetracielo.*misuratore/i);
  assert.equal(selectJourneyProgress({...save,flags:[...start,'q_r06_measurement']}).currentFlag, 'q_ferraluce_visited');
  assert.equal(selectJourneyProgress({...save,flags:[...start,'q_r06_measurement','q_ferraluce_visited']}).currentFlag, 'q_ferraluce_report');
});
