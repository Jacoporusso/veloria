import { validateLocalFerryNetwork, type LocalFerryNetwork } from '../../core/world/local-ferry.ts';

const networks = Object.values(import.meta.glob<LocalFerryNetwork>(
  '../../../content/transit/*.ferry.json', { eager: true, import: 'default' },
));
networks.forEach(validateLocalFerryNetwork);
if (new Set(networks.map(network => network.id)).size !== networks.length) {
  throw new Error('Duplicate local ferry network ID.');
}

export function getLocalFerryNetwork(id: string): LocalFerryNetwork | undefined {
  return networks.find(network => network.id === id);
}
