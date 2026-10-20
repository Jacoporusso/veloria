import { validateLocalTransportNetwork, type LocalTransportNetwork } from '../../core/world/local-transport.ts';

const networks = Object.values(import.meta.glob<LocalTransportNetwork>(
  '../../../content/transit/*.transport.json', { eager: true, import: 'default' },
));
networks.forEach(validateLocalTransportNetwork);
if (new Set(networks.map(network => network.id)).size !== networks.length) {
  throw new Error('Duplicate local transport network ID.');
}

export function getLocalTransportNetwork(id: string): LocalTransportNetwork | undefined {
  return networks.find(network => network.id === id);
}
