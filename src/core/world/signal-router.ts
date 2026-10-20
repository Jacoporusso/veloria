export interface SignalRouterState {
  id: string;
  label: string;
  direction: 'up' | 'down' | 'left' | 'right';
  nextNodeId: string | null;
  mirror?: '/' | '\\';
}

export interface SignalRouterNode {
  id: string;
  label: string;
  x: number;
  y: number;
  initialStateId: string;
  states: readonly SignalRouterState[];
}

export interface SignalRouter {
  id: string;
  presentation?: 'circuit' | 'reflection' | 'convergence';
  sourceNodeId: string;
  additionalSourceNodeIds?: readonly string[];
  goalNodeId: string;
  solvedFlag: string;
  solvedEvent: string;
  nodes: readonly SignalRouterNode[];
}

export interface SignalPath {
  sourceNodeId: string;
  nodeIds: string[];
  outcome: 'connected' | 'disconnected' | 'cycle';
}

export interface SignalTrace {
  /** Stable union for node highlighting, never an ordered list of edges. */
  nodeIds: string[];
  outcome: SignalPath['outcome'];
  paths: SignalPath[];
}

function flagPrefix(router: SignalRouter, node: SignalRouterNode): string {
  return `router_${router.id}_${node.id}_`;
}

/** Reject broken authored routes before they can trap the player in a puzzle. */
export function validateSignalRouter(router: SignalRouter): void {
  if (router.additionalSourceNodeIds !== undefined && !Array.isArray(router.additionalSourceNodeIds)) throw new Error('Invalid signal sources.');
  if (router.presentation !== undefined && !['circuit','reflection','convergence'].includes(router.presentation)) {
    throw new Error('Invalid signal router presentation.');
  }
  const validId = (id: string) => typeof id === 'string' && /^[a-z][a-z0-9]*$/.test(id);
  const nodes = new Set(router.nodes.map(node => node.id));
  const sources = [router.sourceNodeId, ...(router.additionalSourceNodeIds ?? [])];
  if (!validId(router.id) || nodes.size !== router.nodes.length || !nodes.has(router.goalNodeId) ||
      new Set(sources).size !== sources.length || sources.some(id => !nodes.has(id) || id === router.goalNodeId)) {
    throw new Error('Invalid signal router identity or endpoints.');
  }
  for (const node of router.nodes) {
    const states = new Set(node.states.map(state => state.id));
    if (!validId(node.id) || !Number.isInteger(node.x) || !Number.isInteger(node.y) || node.x < 0 || node.y < 0 ||
        states.size !== node.states.length || !states.has(node.initialStateId)) throw new Error(`Invalid signal node ${node.id}.`);
    for (const state of node.states) {
      if (router.presentation === 'reflection' && node.states.length > 1 && state.mirror !== '/' && state.mirror !== '\\') {
        throw new Error(`Invalid mirror inclination ${node.id}/${state.id}.`);
      }
      if (!validId(state.id) || !['up', 'down', 'left', 'right'].includes(state.direction) ||
          state.nextNodeId !== null && !nodes.has(state.nextNodeId)) throw new Error(`Invalid signal state ${node.id}/${state.id}.`);
    }
  }
}

export function signalRouterState(router: SignalRouter, node: SignalRouterNode, flags: readonly string[]): SignalRouterState {
  const prefix = flagPrefix(router, node);
  return node.states.find(state => flags.includes(prefix + state.id)) ?? node.states.find(state => state.id === node.initialStateId)!;
}

/** Follow the energy, independently from the order in which switches were used. */
export function traceSignalRouter(router: SignalRouter, flags: readonly string[]): SignalTrace {
  validateSignalRouter(router);
  const paths = [router.sourceNodeId, ...(router.additionalSourceNodeIds ?? [])].map(sourceNodeId => {
    const nodeIds: string[] = [];
    let current: string | null = sourceNodeId;
    let outcome: SignalPath['outcome'] = 'disconnected';
    while (current !== null) {
      if (nodeIds.includes(current)) { outcome = 'cycle'; break; }
      nodeIds.push(current);
      if (current === router.goalNodeId) { outcome = 'connected'; break; }
      const node = router.nodes.find(node => node.id === current)!;
      current = signalRouterState(router, node, flags).nextNodeId;
    }
    return { sourceNodeId, nodeIds, outcome };
  });
  return {
    nodeIds: [...new Set(paths.flatMap(path => path.nodeIds))],
    outcome: paths.every(path => path.outcome === 'connected') ? 'connected' : paths.some(path => path.outcome === 'cycle') ? 'cycle' : 'disconnected',
    paths,
  };
}

/** Persist only the selected orientation. Quest completion remains the quest engine's job. */
export function rotateSignalRouter(router: SignalRouter, nodeId: string, flags: readonly string[]): { flags: string[]; changed: boolean; trace: SignalTrace } {
  validateSignalRouter(router);
  const node = router.nodes.find(node => node.id === nodeId);
  if (!node) throw new Error(`Unknown signal node ${nodeId}.`);
  if (flags.includes(router.solvedFlag) || node.states.length < 2) return { flags: [...flags], changed: false, trace: traceSignalRouter(router, flags) };
  const current = signalRouterState(router, node, flags);
  const next = node.states[(node.states.indexOf(current) + 1) % node.states.length];
  const prefix = flagPrefix(router, node);
  const nextFlags = [...flags.filter(flag => !flag.startsWith(prefix)), prefix + next.id];
  return { flags: nextFlags, changed: true, trace: traceSignalRouter(router, nextFlags) };
}
