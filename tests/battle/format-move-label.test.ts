import assert from 'node:assert/strict';
import test from 'node:test';
import { BATTLE_TYPES } from '../../src/core/battle/types.ts';
import { formatBattleMoveLabel } from '../../src/game/battle/format-move-label.ts';

test('battle move labels show the localized type and remaining PP on separate lines', () => {
  assert.equal(formatBattleMoveLabel('Fulmine', 'electric', 7, 30), 'Fulmine\nELETTRO · PP 7/30');
  assert.equal(formatBattleMoveLabel('Foglielama', 'grass', 0, 25), 'Foglielama\nERBA · PP 0/25');
});

test('every supported battle type has a localized label', () => {
  for (const type of BATTLE_TYPES) {
    const [name, details] = formatBattleMoveLabel('Mossa', type, 1, 1).split('\n');
    assert.equal(name, 'Mossa');
    assert.match(details ?? '', /^[A-ZÀ-Ü]+ · PP 1\/1$/);
  }
});
