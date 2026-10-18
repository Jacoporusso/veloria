import { validateSignalRouter, type SignalRouter } from '../../core/world/signal-router.ts';

const routers = Object.values(import.meta.glob<SignalRouter>('../../../content/puzzles/*.v1.json', { eager: true, import: 'default' }));
routers.forEach(validateSignalRouter);
if (new Set(routers.map(router => router.id)).size !== routers.length) throw new Error('Duplicate signal router ID.');

export function getSignalRouter(id: string): SignalRouter {
  const router = routers.find(router => router.id === id);
  if (!router) throw new Error(`Unknown signal router ${id}.`);
  return router;
}
