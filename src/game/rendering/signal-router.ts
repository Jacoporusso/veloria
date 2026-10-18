import type Phaser from 'phaser';
import { signalRouterState, traceSignalRouter, type SignalRouter } from '../../core/world/signal-router.ts';

/** Circuit geometry and orientations come from content, never a city-specific renderer. */
export function renderSignalRouter(scene: Phaser.Scene, container: Phaser.GameObjects.Container, router: SignalRouter, flags: readonly string[]): void {
  const trace = traceSignalRouter(router, flags);
  const paths = scene.add.graphics().setDepth(-2);
  container.add(paths);
  for (const node of router.nodes) for (const state of node.states) {
    if (!state.nextNodeId) continue;
    const target = router.nodes.find(candidate => candidate.id === state.nextNodeId)!;
    const index = trace.nodeIds.indexOf(node.id);
    const energized = index >= 0 && trace.nodeIds[index + 1] === target.id;
    const x = (node.x + .5) * 32, y = (node.y + .5) * 32;
    const tx = (target.x + .5) * 32, ty = (target.y + .5) * 32;
    paths.lineStyle(14, 0x466c80, .22).lineBetween(x, y, tx, ty);
    paths.lineStyle(7, energized ? 0x64d9cd : 0xc3d5e0, .9).lineBetween(x, y, tx, ty);
    paths.lineStyle(2, energized ? 0xe5fff9 : 0xf4fafc, .8).lineBetween(x, y, tx, ty);
  }
  const arrows = { up: '↑', down: '↓', left: '←', right: '→' };
  for (const node of router.nodes) {
    const x = (node.x + .5) * 32, y = (node.y + .5) * 32;
    const active = trace.nodeIds.includes(node.id);
    const g = scene.add.graphics().setDepth(y + 1);
    g.fillStyle(0x234658, .18).fillEllipse(x, y + 12, 44, 13);
    g.fillStyle(0xe0ebef).fillCircle(x, y, 20);
    g.lineStyle(2, active ? 0x70dacd : 0xa6a3d8).strokeCircle(x, y, 19);
    g.fillStyle(active ? 0x245e67 : 0x4c5677).fillCircle(x, y, 14);
    const symbol = node.id === router.goalNodeId ? (active ? '✓' : '○') : node.id === router.sourceNodeId ? '●' : arrows[signalRouterState(router, node, flags).direction];
    const label = scene.add.text(x, y - 1, symbol, { fontFamily: 'system-ui, sans-serif', fontSize: '23px', color: '#f1fcff', resolution: 4 }).setOrigin(.5).setDepth(y + 2);
    const name = scene.add.text(x, y - 26, node.label, { fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#21495a', backgroundColor: '#edf6f5', padding: { x: 4, y: 2 }, resolution: 4 }).setOrigin(.5, 1).setDepth(y + 2);
    container.add([g, label, name]);
  }
}
