import { environmentRegulatorState, type EnvironmentRegulator } from '../../core/world/environment-regulator.ts';

export type EnvironmentRegulatorCommand =
  | { kind: 'adjust'; controlId: string; delta: -1 | 1 }
  | { kind: 'reset' }
  | { kind: 'verify' }
  | { kind: 'close' };

export interface EnvironmentRegulatorOption {
  label: string;
  command: EnvironmentRegulatorCommand;
}

/** Translate authored levels into accessible text without exposing the target solution. */
export function environmentRegulatorMenu(regulator: EnvironmentRegulator, flags: readonly string[]): {
  prompt: string;
  options: EnvironmentRegulatorOption[];
} {
  const state = environmentRegulatorState(regulator, flags);
  const close: EnvironmentRegulatorOption = { label: 'CHIUDI', command: { kind: 'close' } };
  if (state.completed) {
    return { prompt: 'Regolazione completata. Le impostazioni restano stabili.', options: [close] };
  }
  if (!regulator.requiredFlags.every(flag => flags.includes(flag))) {
    return {
      prompt: 'Prima di usare la console, raccogli le letture delle stazioni lungo il percorso. Il diario ti aiuta a ritrovarle.',
      options: [close],
    };
  }

  const lines: string[] = [];
  const options: EnvironmentRegulatorOption[] = [];
  for (const control of regulator.controls) {
    const value = state.values[control.id];
    const level = control.levels.find(item => item.value === value)!;
    lines.push(`${control.label}: ${level.label}. ${level.hint}`);
    for (const delta of [-1, 1] as const) {
      if (value + delta < control.min || value + delta > control.max) continue;
      const next = control.levels.find(item => item.value === value + delta)!;
      options.push({
        label: `${control.label} → ${next.label}`,
        command: { kind: 'adjust', controlId: control.id, delta },
      });
    }
  }
  lines.push('Confronta le letture nel diario. Puoi ripristinare le impostazioni iniziali e riprovare.');
  options.push(
    { label: 'VERIFICA EQUILIBRIO', command: { kind: 'verify' } },
    { label: 'RIPRISTINA', command: { kind: 'reset' } },
    close,
  );
  return { prompt: lines.join('\n'), options };
}
