import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { describeMoveEffects, formatMoveDescription } from '../../src/game/battle/move-description.ts';
import type { MoveDefinition } from '../../src/core/battle/types.ts';

const base: MoveDefinition = { id: 'test', name: 'Test', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20 };

test('move descriptions distinguish every stat target, direction, magnitude and chance', () => {
  const description = formatMoveDescription({ ...base, statChanges: [
    { target: 'self', stat: 'attack', stages: 2 },
    { target: 'opponent', stat: 'defense', stages: -1 },
  ], statChangeChance: 30 });
  assert.match(description, /Aumenta Attacco del tuo Pokémon di 2 gradi \(30% di probabilità\)/);
  assert.match(description, /Riduce Difesa dell’avversario di 1 grado/);
  assert.match(description, /si azzerano/);
});

test('descriptions include all simultaneous implemented effects, not just the first', () => {
  const description = formatMoveDescription({ ...base, category: 'special', power: 40,
    inflictedStatus: 'paralysis', statusChance: 10, inflictedConfusionChance: 20,
    drainPercent: 50, minHits: 2, maxHits: 5, priority: 1, alwaysHits: true,
  });
  for (const text of ['danni speciali', 'paralisi', '10%', 'Confonde', '20%', '50%', '2–5 volte', 'Priorità +1', 'Non effettua']) assert.ok(description.includes(text), text);
  assert.match(description, /Precisione sempre/);
});

test('seed explanation uses runtime fraction and support does not promise damage', () => {
  const description = formatMoveDescription({ ...base, type: 'grass', leechSeedFraction: 0.125 });
  assert.match(description, /12.5%/);
  assert.match(description, /Non funziona sui Pokémon Erba/);
  assert.ok(!description.includes('Infligge danni'));
  assert.deepEqual(describeMoveEffects(base), ['Nessun effetto aggiuntivo implementato.']);
});

test('recoil description explains HP loss from damage dealt and when it can occur', () => {
  const description = formatMoveDescription({ ...base, category: 'physical', power: 100, recoilPercent: 25 });
  assert.match(description, /perde HP pari al 25% dei danni inflitti/);
  assert.match(description, /almeno 1 HP/);
  assert.match(description, /può mandarlo KO/);
  assert.doesNotMatch(description, /Recuperi HP/);
  assert.match(description, /se la mossa manca o non danneggia per un’immunità/);
});

test('canonical move descriptions explain Sonicboom fixed damage and Thunder Wave type immunity', () => {
  const moves = JSON.parse(readFileSync(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves as Record<string, MoveDefinition>;
  const sonic = formatMoveDescription(moves['sonic-boom']);
  assert.match(sonic, /Danno fisso 20 HP/);
  assert.match(sonic, /Infligge 20 HP di danno fisso se colpisce/);
  assert.match(sonic, /le immunità lo annullano/);

  const wave = formatMoveDescription(moves['thunder-wave']);
  assert.match(wave, /Infligge paralisi all’avversario/);
  assert.match(wave, /Non funziona sui Pokémon immuni al tipo ELETTRO/);
});
