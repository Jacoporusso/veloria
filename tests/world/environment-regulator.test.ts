import test from 'node:test';
import assert from 'node:assert/strict';
import { adjustEnvironmentRegulator, environmentRegulatorState, resetEnvironmentRegulator, validateEnvironmentRegulator, type EnvironmentRegulator } from '../../src/core/world/environment-regulator.ts';

const regulator: EnvironmentRegulator = {
  id: 'climate', name: 'Regolatore', requiredFlags: [], solvedFlag: 'q_climate_balanced', solvedEvent: 'climate/balanced',
  controls: [
    { id: 'air', label: 'Ventilazione', hint: 'Regola il flusso.', min: 0, max: 2, initial: 0, target: 1,
      levels: [0, 1, 2].map(value => ({ value, label: `Flusso ${value}`, hint: `Indicatore ${value}` })) },
    { id: 'heat', label: 'Scambio termico', hint: 'Regola lo scambio.', min: -1, max: 2, initial: 2, target: 0,
      levels: [-1, 0, 1, 2].map(value => ({ value, label: `Scambio ${value}`, hint: `Indicatore ${value}` })) },
  ],
};

test('every finite state reaches the authored target and resets after JSON reload', () => {
  validateEnvironmentRegulator(regulator);
  for (let air = 0; air <= 2; air++) for (let heat = -1; heat <= 2; heat++) {
    let flags = ['q_other', `regulator_climate_air_level${air}`, `regulator_climate_heat_level${heat + 1}`];
    const original = [...flags];
    for (const control of regulator.controls) {
      while (environmentRegulatorState(regulator, flags).values[control.id] !== control.target) {
        const delta = environmentRegulatorState(regulator, flags).values[control.id] < control.target ? 1 : -1;
        const update = adjustEnvironmentRegulator(regulator, control.id, delta, Object.freeze(flags));
        assert.equal(update.changed, true);
        assert.equal(update.event, update.balanced ? 'climate/balanced' : null);
        flags = JSON.parse(JSON.stringify(update.flags));
      }
    }
    assert.equal(environmentRegulatorState(regulator, flags).balanced, true);
    assert.ok(flags.includes('q_other'));
    assert.ok(!flags.includes(regulator.solvedFlag));
    assert.equal(flags.filter(flag => flag.startsWith('regulator_climate_air_')).length, 1);
    assert.equal(flags.filter(flag => flag.startsWith('regulator_climate_heat_')).length, 1);
    assert.deepEqual(resetEnvironmentRegulator(regulator, Object.freeze(flags)).flags, ['q_other']);
    assert.deepEqual(environmentRegulatorState(regulator, ['q_other']).values, { air: 0, heat: 2 });
    assert.deepEqual(original, ['q_other', `regulator_climate_air_level${air}`, `regulator_climate_heat_level${heat + 1}`]);
  }
});

test('limits are stable, foreign namespaces survive, completed controls and reset are immutable', () => {
  const initial = Object.freeze(['regulator_other_air_level99', 'q_other']);
  assert.deepEqual(adjustEnvironmentRegulator(regulator, 'air', -1, initial).flags, initial);
  assert.equal(adjustEnvironmentRegulator(regulator, 'heat', 1, initial).changed, false);
  const updated = adjustEnvironmentRegulator(regulator, 'air', 1, initial);
  assert.deepEqual(initial, ['regulator_other_air_level99', 'q_other']);
  const completed = Object.freeze([...updated.flags, regulator.solvedFlag]);
  for (const result of [adjustEnvironmentRegulator(regulator, 'air', -1, completed), resetEnvironmentRegulator(regulator, completed)]) {
    assert.deepEqual(result.flags, completed);
    assert.equal(result.completed, true);
    assert.equal(result.changed, false);
    assert.equal(result.event, null);
  }
});

test('invalid actions and ambiguous, unknown or duplicate persisted states fail explicitly', () => {
  assert.throws(() => adjustEnvironmentRegulator(regulator, 'missing', 1, []), /Unknown.*control/);
  assert.throws(() => adjustEnvironmentRegulator(regulator, 'air', 2 as 1, []), /Invalid.*adjustment/);
  for (const flags of [
    ['regulator_climate_air_level0', 'regulator_climate_air_level1'],
    ['regulator_climate_air_level03'], ['regulator_climate_unknown_level0'],
    ['regulator_climate_heat_level9'], ['q_other', 'q_other'],
  ]) assert.throws(() => environmentRegulatorState(regulator, flags), /state|flags/);
});

test('required flags lock both adjustment and reset until every prerequisite is present', () => {
  const locked = { ...regulator, requiredFlags: ['q_readings', 'badge_seven'] };
  const flags = Object.freeze(['q_readings', 'regulator_climate_air_level1']);
  assert.equal(adjustEnvironmentRegulator(locked, 'air', 1, flags).changed, false);
  assert.deepEqual(resetEnvironmentRegulator(locked, flags).flags, flags);
  const unlocked = [...flags, 'badge_seven'];
  assert.equal(adjustEnvironmentRegulator(locked, 'air', 1, unlocked).changed, true);
  assert.deepEqual(resetEnvironmentRegulator(locked, unlocked).flags, ['q_readings', 'badge_seven']);
});

test('invalid catalogs fail before interaction, including missing levels and overlapping completion state', () => {
  const invalid = [
    (copy: EnvironmentRegulator) => { copy.id = 'bad_id'; },
    (copy: EnvironmentRegulator) => { copy.solvedEvent = ''; },
    (copy: EnvironmentRegulator) => { copy.requiredFlags = ['same', 'same']; },
    (copy: EnvironmentRegulator) => { copy.controls = []; },
    (copy: EnvironmentRegulator) => { copy.controls[0].max = 16; },
    (copy: EnvironmentRegulator) => { copy.solvedFlag = 'regulator_climate_done'; },
    (copy: EnvironmentRegulator) => { copy.controls[0].target = 3; },
    (copy: EnvironmentRegulator) => { copy.controls[0].initial = -1; },
    (copy: EnvironmentRegulator) => { copy.controls[0].max = 0.5; },
    (copy: EnvironmentRegulator) => { copy.controls[0].id = 'heat'; },
    (copy: EnvironmentRegulator) => { copy.controls[0].levels = copy.controls[0].levels.slice(1); },
    (copy: EnvironmentRegulator) => { copy.controls[0].levels = [copy.controls[0].levels[0], copy.controls[0].levels[0], copy.controls[0].levels[2]]; },
    (copy: EnvironmentRegulator) => { copy.controls[0].levels[0].hint = ''; },
  ];
  for (const mutate of invalid) {
    const copy = structuredClone(regulator);
    mutate(copy);
    assert.throws(() => validateEnvironmentRegulator(copy), /Invalid|overlaps/);
  }
});

