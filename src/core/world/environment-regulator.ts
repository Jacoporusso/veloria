export interface EnvironmentRegulatorLevel {
  value: number;
  label: string;
  hint: string;
}

export interface EnvironmentRegulatorControl {
  id: string;
  label: string;
  hint: string;
  min: number;
  max: number;
  initial: number;
  target: number;
  levels: readonly EnvironmentRegulatorLevel[];
}

/** An authored discrete puzzle: values have no implicit physical meaning. */
export interface EnvironmentRegulator {
  id: string;
  name: string;
  requiredFlags: readonly string[];
  solvedFlag: string;
  solvedEvent: string;
  controls: readonly EnvironmentRegulatorControl[];
}

export interface EnvironmentRegulatorState {
  values: Readonly<Record<string, number>>;
  balanced: boolean;
  completed: boolean;
}

export interface EnvironmentRegulatorResult extends EnvironmentRegulatorState {
  flags: string[];
  changed: boolean;
  event: string | null;
}

const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-z][a-z0-9]*$/.test(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const prefix = (regulator: EnvironmentRegulator) => `regulator_${regulator.id}_`;
const controlPrefix = (regulator: EnvironmentRegulator, control: EnvironmentRegulatorControl) => `${prefix(regulator)}${control.id}_level`;
const levelFlag = (regulator: EnvironmentRegulator, control: EnvironmentRegulatorControl, value: number) => `${controlPrefix(regulator, control)}${value - control.min}`;

export function validateEnvironmentRegulator(regulator: EnvironmentRegulator): void {
  if (!regulator || !validId(regulator.id) || !text(regulator.name) || !Array.isArray(regulator.requiredFlags) || regulator.requiredFlags.some(flag => !text(flag)) || new Set(regulator.requiredFlags).size !== regulator.requiredFlags.length ||
      !text(regulator.solvedFlag) || !text(regulator.solvedEvent) || !Array.isArray(regulator.controls) || !regulator.controls.length || regulator.controls.length > 4) {
    throw new Error('Invalid environment regulator identity or actions.');
  }
  const ids = new Set<string>();
  for (const control of regulator.controls) {
    if (!control || !validId(control.id) || ids.has(control.id) || !text(control.label) || !text(control.hint) ||
        ![control.min, control.max, control.initial, control.target].every(Number.isSafeInteger) ||
        control.min >= control.max || control.max - control.min >= 16 || control.initial < control.min || control.initial > control.max ||
        control.target < control.min || control.target > control.max || !Array.isArray(control.levels) ||
        control.levels.length !== control.max - control.min + 1) throw new Error('Invalid environment regulator control.');
    ids.add(control.id);
    const values = new Set<number>();
    for (const level of control.levels) {
      if (!level || !Number.isSafeInteger(level.value) || level.value < control.min || level.value > control.max ||
          values.has(level.value) || !text(level.label) || !text(level.hint)) throw new Error('Invalid environment regulator level.');
      values.add(level.value);
    }
  }
  if (regulator.solvedFlag.startsWith(prefix(regulator))) throw new Error('Completion flag overlaps regulator state.');
}

export function environmentRegulatorState(regulator: EnvironmentRegulator, flags: readonly string[]): EnvironmentRegulatorState {
  validateEnvironmentRegulator(regulator);
  if (!Array.isArray(flags) || flags.some(flag => !text(flag)) || new Set(flags).size !== flags.length) throw new Error('Invalid environment regulator flags.');
  const values: Record<string, number> = {};
  const accepted = new Set<string>();
  for (const control of regulator.controls) {
    const selected = control.levels.filter(level => flags.includes(levelFlag(regulator, control, level.value)));
    if (selected.length > 1) throw new Error(`Conflicting environment regulator state: ${control.id}.`);
    values[control.id] = selected[0]?.value ?? control.initial;
    for (const level of control.levels) accepted.add(levelFlag(regulator, control, level.value));
  }
  if (flags.some(flag => flag.startsWith(prefix(regulator)) && !accepted.has(flag))) throw new Error('Unknown environment regulator state flag.');
  return {
    values,
    balanced: regulator.controls.every(control => values[control.id] === control.target),
    completed: flags.includes(regulator.solvedFlag),
  };
}

function result(regulator: EnvironmentRegulator, flags: string[], changed: boolean): EnvironmentRegulatorResult {
  const state = environmentRegulatorState(regulator, flags);
  return { ...state, flags, changed, event: changed && state.balanced && !state.completed ? regulator.solvedEvent : null };
}

export function adjustEnvironmentRegulator(regulator: EnvironmentRegulator, controlId: string, delta: -1 | 1, flags: readonly string[]): EnvironmentRegulatorResult {
  const state = environmentRegulatorState(regulator, flags);
  const control = regulator.controls.find(item => item.id === controlId);
  if (!control) throw new Error(`Unknown environment regulator control ${controlId}.`);
  if (delta !== -1 && delta !== 1) throw new Error('Invalid environment regulator adjustment.');
  const current = state.values[controlId];
  const next = Math.max(control.min, Math.min(control.max, current + delta));
  if (state.completed || !regulator.requiredFlags.every(flag => flags.includes(flag)) || current === next) return result(regulator, [...flags], false);
  return result(regulator, [...flags.filter(flag => !flag.startsWith(controlPrefix(regulator, control))), levelFlag(regulator, control, next)], true);
}

export function resetEnvironmentRegulator(regulator: EnvironmentRegulator, flags: readonly string[]): EnvironmentRegulatorResult {
  const state = environmentRegulatorState(regulator, flags);
  if (state.completed || !regulator.requiredFlags.every(flag => flags.includes(flag))) return result(regulator, [...flags], false);
  const next = flags.filter(flag => !flag.startsWith(prefix(regulator)));
  return result(regulator, next, next.length !== flags.length);
}

