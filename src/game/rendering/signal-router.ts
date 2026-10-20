import type Phaser from 'phaser';
import { signalRouterState, traceSignalRouter, type SignalRouter } from '../../core/world/signal-router.ts';

/** Circuit geometry and orientations come from content, never a city-specific renderer. */
export function renderSignalRouter(scene: Phaser.Scene, container: Phaser.GameObjects.Container, router: SignalRouter, flags: readonly string[]): void {
  const trace = traceSignalRouter(router, flags);
  const reflection = router.presentation === 'reflection';
  const convergence = router.presentation === 'convergence';
  const flowColors = [0x64d9cd, 0xc5a1ff];
  const paths = scene.add.graphics().setDepth(-2);
  container.add(paths);
  for (const node of router.nodes) for (const state of node.states) {
    if (!state.nextNodeId) continue;
    const target = router.nodes.find(candidate => candidate.id === state.nextNodeId)!;
    const energized = trace.paths.some(path => {
      const index = path.nodeIds.indexOf(node.id);
      return index >= 0 && (path.nodeIds[index + 1] === target.id || path.outcome === 'cycle' && index === path.nodeIds.length - 1 && signalRouterState(router, node, flags).nextNodeId === target.id);
    });
    if (reflection && !energized) continue;
    const x = (node.x + .5) * 32, y = (node.y + .5) * 32;
    const tx = (target.x + .5) * 32, ty = (target.y + .5) * 32;
    paths.lineStyle(14, reflection ? 0xe6c6ff : 0x466c80, .22).lineBetween(x, y, tx, ty);
    paths.lineStyle(7, reflection ? 0xffedb2 : energized ? 0x64d9cd : 0xc3d5e0, .9).lineBetween(x, y, tx, ty);
    paths.lineStyle(2, energized ? 0xe5fff9 : 0xf4fafc, .8).lineBetween(x, y, tx, ty);
  }
  if (convergence) trace.paths.forEach((path, index) => {
    const flow = scene.add.graphics().setDepth(-1);
    container.add(flow);
    const edges = path.nodeIds.slice(0, -1).map((id, position) => [id, path.nodeIds[position + 1]]);
    if (path.outcome === 'cycle') {
      const last = router.nodes.find(node => node.id === path.nodeIds.at(-1))!;
      const target = signalRouterState(router, last, flags).nextNodeId;
      if (target) edges.push([last.id, target]);
    }
    for (const [from, to] of edges) {
      const start = router.nodes.find(node => node.id === from)!, end = router.nodes.find(node => node.id === to)!;
      // Offset shared segments so both flows remain visible after convergence.
      const offset = trace.paths.length === 1 ? 0 : (index % 2 ? 2.5 : -2.5);
      const ox = start.y === end.y ? 0 : offset, oy = start.x === end.x ? 0 : offset;
      const x = (start.x + .5) * 32 + ox, y = (start.y + .5) * 32 + oy;
      const tx = (end.x + .5) * 32 + ox, ty = (end.y + .5) * 32 + oy;
      flow.lineStyle(10, flowColors[index % flowColors.length], .18).lineBetween(x,y,tx,ty);
      flow.lineStyle(3, flowColors[index % flowColors.length], 1).lineBetween(x,y,tx,ty);
    }
  });
  const arrows = { up: '↑', down: '↓', left: '←', right: '→' };
  for (const node of router.nodes) {
    const x = (node.x + .5) * 32, y = (node.y + .5) * 32;
    const active = trace.nodeIds.includes(node.id);
    const activeFlows = trace.paths.map((path, index) => path.nodeIds.includes(node.id) ? index : -1).filter(index => index >= 0);
    const g = scene.add.graphics().setDepth(y + 1);
    g.fillStyle(0x234658, .18).fillEllipse(x, y + 12, 44, 13);
    g.fillStyle(0xe0ebef).fillCircle(x, y, 20);
    g.lineStyle(2, active ? 0x70dacd : 0xa6a3d8).strokeCircle(x, y, 19);
    if (convergence) for (const [ring, index] of activeFlows.entries()) g.lineStyle(2, flowColors[index % flowColors.length]).strokeCircle(x,y,19 + ring * 3);
    g.fillStyle(active ? 0x245e67 : 0x4c5677).fillCircle(x, y, 14);
    const state = signalRouterState(router, node, flags);
    const source = node.id === router.sourceNodeId || router.additionalSourceNodeIds?.includes(node.id);
    const symbol = node.id === router.goalNodeId ? (trace.outcome === 'connected' ? '✓' : '○') : source ? (reflection ? '✦' : '●') : reflection ? '' : arrows[state.direction];
    if (reflection && node.states.length > 1) {
      const tilt = state.mirror === '/' ? -1 : 1;
      g.lineStyle(8, 0x91bbd0, 1).lineBetween(x-9,y-9*tilt,x+9,y+9*tilt);
      g.lineStyle(3, 0xf3ffff, 1).lineBetween(x-9,y-9*tilt,x+9,y+9*tilt);
    }
    const label = scene.add.text(x, y - 1, symbol, { fontFamily: 'system-ui, sans-serif', fontSize: '23px', color: '#f1fcff', resolution: 4 }).setOrigin(.5).setDepth(y + 2);
    const name = scene.add.text(x, y - 26, node.label, { fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#21495a', backgroundColor: '#edf6f5', padding: { x: 4, y: 2 }, resolution: 4 }).setOrigin(.5, 1).setDepth(y + 2);
    container.add([g, label, name]);
  }
}
