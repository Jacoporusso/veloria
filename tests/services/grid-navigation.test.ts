import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navigateGrid } from '../../src/game/input/grid-navigation.ts';

test('capture remains reachable when bag and party are disabled', () => {
  const cells = [{row:0,column:0},{row:1,column:1},{row:2,column:0}];
  assert.equal(navigateGrid(cells,0,1,0),2);
  assert.equal(navigateGrid(cells,2,0,1),1);
  assert.equal(navigateGrid(cells,0,0,1),1);
});
test('normal grid keeps lane movement and wraps at its edge', () => {
  const cells = [{row:0,column:0},{row:0,column:1},{row:1,column:0},{row:1,column:1}];
  assert.equal(navigateGrid(cells,0,1,0),2);
  assert.equal(navigateGrid(cells,0,0,1),1);
  assert.equal(navigateGrid(cells,2,1,0),0);
  assert.equal(navigateGrid(cells,1,0,1),0);
});
test('empty and single cell grids keep selection', () => {
  assert.equal(navigateGrid([],0,1,0),0);
  assert.equal(navigateGrid([{row:0,column:0}],0,0,1),0);
});
