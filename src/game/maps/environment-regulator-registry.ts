import { validateEnvironmentRegulator, type EnvironmentRegulator } from '../../core/world/environment-regulator.ts';

const regulators = Object.values(import.meta.glob<EnvironmentRegulator>('../../../content/regulators/*.v1.json', {
  eager: true,
  import: 'default',
}));
regulators.forEach(validateEnvironmentRegulator);
if (new Set(regulators.map(regulator => regulator.id)).size !== regulators.length) {
  throw new Error('Duplicate environment regulator ID.');
}

export function getEnvironmentRegulator(id: string): EnvironmentRegulator {
  const regulator = regulators.find(item => item.id === id);
  if (!regulator) throw new Error(`Unknown environment regulator ${id}.`);
  return regulator;
}
