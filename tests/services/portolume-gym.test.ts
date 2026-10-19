import assert from 'node:assert/strict';
import test from 'node:test';
import trainer from '../../content/trainers/gym05_nerea.trainer.json' with { type: 'json' };
import puzzle from '../../content/quests/gym05_sluices.quest.json' with { type: 'json' };
import medal from '../../content/quests/gym05_badge.quest.json' with { type: 'json' };
import learnsets from '../../content/sources/pokeapi/source-learnsets.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import { applyQuestEvent } from '../../src/core/quests/apply-quest-event.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';
import { readFileSync } from 'node:fs';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';

test('Nerea only uses implemented moves learned by her Pokemon at their actual HGSS levels', () => {
  for (const member of trainer.team) {
    const source = learnsets.species[String(member.speciesId) as keyof typeof learnsets.species];
    for (const moveId of member.moveIds) {
      assert.ok(moveId in moves.moves, moveId);
      assert.ok(source.some(entry => entry.moveId === moveId && entry.level <= member.level), `${member.speciesId}: ${moveId}`);
    }
  }
});

test('sluices open in sequence and the fifth badge remains unique after serialization', () => {
  let save: GameSave = {
    schemaVersion: 2, saveRevision: 1, contentVersion: 'test', saveId: 'sluices', savedAt: '2026-10-19T00:00:00Z',
    player: { name: 'Ada', mapId: 'veloria/gym05_portolume', spawnPointId: 'from_portolume', money: 500 },
    party: [], storage: [], flags: ['q_portolume_tide_report'], badges: [], inventory: {}, rngState: 42,
  };
  const quests = [puzzle, medal];
  const steps = [...puzzle.steps, ...medal.steps];
  for (let index = 0; index < steps.length; index++) {
    for (const later of steps.slice(index + 1)) assert.equal(applyQuestEvent(save, later.trigger, quests).progressed, false);
    const result = applyQuestEvent(save, steps[index].trigger, quests);
    assert.equal(result.progressed, true);
    save = JSON.parse(JSON.stringify(result.save));
  }
  assert.deepEqual(save.badges, ['badge_marea']);
  for (const step of steps) assert.deepEqual(applyQuestEvent(save, step.trigger, quests).save, save);
});

test('gym geometry exposes each next control and keeps the south return reachable', () => {
  const map = JSON.parse(readFileSync(new URL('../../public/tilemaps/gym05_portolume.tmj', import.meta.url), 'utf8'));
  const collision = map.layers.find((layer: any) => layer.name === 'collision').objects;
  const reach = (flags: string[]) => {
    const blocked = collectMapCollision(collision, map.width, map.height, flags);
    const visited = new Set(['15,22']);
    const queue = [[15,22]];
    for (let index = 0; index < queue.length; index++) {
      const [x,y] = queue[index];
      for (const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
        const key = `${nx},${ny}`;
        if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height || blocked.has(key) || visited.has(key)) continue;
        visited.add(key); queue.push([nx,ny]);
      }
    }
    return visited;
  };
  const lower = reach([]);
  assert.ok(lower.has('8,18'));
  assert.ok(lower.has('15,23'));
  assert.equal(lower.has('24,11'), false);
  const middle = reach(['gym05_basin_balanced']);
  assert.ok(middle.has('24,11'));
  assert.equal(middle.has('8,5'), false);
  const upper = reach(['gym05_basin_balanced','gym05_sluice_open']);
  assert.ok(upper.has('8,5'));
  assert.ok(upper.has('16,4'));
  assert.ok(upper.has('15,23'));
});
