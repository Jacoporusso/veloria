import test from 'node:test';
import assert from 'node:assert/strict';
import { getTerrainTileFlip } from '../../src/game/rendering/terrain-tiling.ts';

test('terrain reflections vary repeated cells without a checkerboard pattern', () => {
  const mapId = 'veloria/d01_bosco_veli';
  const choices = new Set<string>();
  const choicesByParity = new Map<string, Set<string>>();
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      const flip = getTerrainTileFlip(mapId, x, y);
      const choice = `${Number(flip.flipX)}${Number(flip.flipY)}`;
      choices.add(choice);
      const parity = `${x % 2}${y % 2}`;
      const parityChoices = choicesByParity.get(parity) ?? new Set<string>();
      parityChoices.add(choice);
      choicesByParity.set(parity, parityChoices);
    }
  }

  assert.equal(choices.size, 4, 'all four reflections should appear in a map area');
  for (const parityChoices of choicesByParity.values()) {
    assert.ok(parityChoices.size > 1, 'the pattern should not repeat every two cells');
  }
});

test('terrain reflections are deterministic and map-specific', () => {
  let differentCells = 0;
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      const forestChoice = getTerrainTileFlip('veloria/d01_bosco_veli', x, y);
      assert.deepEqual(forestChoice, getTerrainTileFlip('veloria/d01_bosco_veli', x, y));
      if (JSON.stringify(forestChoice) !== JSON.stringify(getTerrainTileFlip('veloria/r01_sentiero_alba', x, y))) {
        differentCells += 1;
      }
    }
  }
  assert.ok(differentCells > 0, 'map IDs should change terrain variation across the sampled region');
});

