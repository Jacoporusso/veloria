import test from 'node:test';
import assert from 'node:assert/strict';
import puzzle from '../../content/puzzles/gym04_magnetic.v1.json' with { type: 'json' };
import { rotateSignalRouter, traceSignalRouter, validateSignalRouter, type SignalRouter } from '../../src/core/world/signal-router.ts';

const router = puzzle as SignalRouter;

test('Ferraluce energy reaches the receiver in any switch order and survives serialized flags', () => {
  for (const order of [['first', 'second', 'field'], ['field', 'first', 'second'], ['second', 'field', 'first']]) {
    let flags = ['badge_circuito_awarded', 'q_ferraluce_report'];
    assert.equal(traceSignalRouter(router, flags).outcome, 'disconnected');
    for (const id of order) flags = rotateSignalRouter(router, id, flags).flags;
    assert.deepEqual(traceSignalRouter(router, JSON.parse(JSON.stringify(flags))), {
      nodeIds: ['source', 'first', 'second', 'field', 'goal'], outcome: 'connected',
    });
    assert.ok(flags.includes('badge_circuito_awarded'));
    assert.ok(flags.includes('q_ferraluce_report'));
    assert.ok(!flags.includes(router.solvedFlag));
  }
});

test('rotating twice restores the initial route and completed puzzles cannot be changed', () => {
  const original = Object.freeze(['q_ferraluce_report']);
  const first = rotateSignalRouter(router, 'first', original);
  const second = rotateSignalRouter(router, 'first', first.flags);
  assert.deepEqual(traceSignalRouter(router, second.flags), traceSignalRouter(router, original));
  assert.equal(second.flags.filter(flag => flag.startsWith('router_')).length, 1);
  const completed = [...first.flags, router.solvedFlag];
  assert.deepEqual(rotateSignalRouter(router, 'first', completed).flags, completed);
  assert.equal(rotateSignalRouter(router, 'first', completed).changed, false);
});

test('cycles terminate safely and dangling routes fail authoring validation', () => {
  const cyclic = structuredClone(router);
  cyclic.nodes[1].states[0].nextNodeId = 'source';
  assert.equal(traceSignalRouter(cyclic, []).outcome, 'cycle');
  cyclic.nodes[1].states[0].nextNodeId = 'missing';
  assert.throws(() => validateSignalRouter(cyclic), /Invalid signal state/);
  assert.throws(() => rotateSignalRouter(router, 'missing', []), /Unknown signal node/);
});
