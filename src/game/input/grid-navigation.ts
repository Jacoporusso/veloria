export interface GridPosition { readonly row: number; readonly column: number }

/** Navigate enabled cells, including sparse grids whose empty lanes would trap focus. */
export function navigateGrid(cells: readonly GridPosition[], currentIndex: number, rowDelta: number, columnDelta: number): number {
  const current = cells[currentIndex];
  if (!current || cells.length < 2 || (!rowDelta && !columnDelta)) return currentIndex;
  const vertical = rowDelta !== 0;
  const delta = vertical ? rowDelta : columnDelta;
  const axis = (cell: GridPosition) => vertical ? cell.row : cell.column;
  const lane = (cell: GridPosition) => vertical ? cell.column : cell.row;
  const others = cells.map((cell, index) => ({cell, index})).filter(({index}) => index !== currentIndex);
  const forward = others.filter(({cell}) => (axis(cell) - axis(current)) * delta > 0);
  const nearest = (a: typeof others[number], b: typeof others[number]) =>
    Math.abs(axis(a.cell) - axis(current)) - Math.abs(axis(b.cell) - axis(current)) ||
    Math.abs(lane(a.cell) - lane(current)) - Math.abs(lane(b.cell) - lane(current)) || a.index - b.index;
  const next = forward.filter(({cell}) => lane(cell) === lane(current)).sort(nearest)[0]
    ?? forward.sort(nearest)[0]
    ?? others.filter(({cell}) => lane(cell) === lane(current)).sort((a,b) => (axis(b.cell) - axis(a.cell)) * delta)[0]
    ?? others.sort((a,b) => (axis(a.cell) - axis(b.cell)) * delta || Math.abs(lane(a.cell) - lane(current)) - Math.abs(lane(b.cell) - lane(current)) || a.index - b.index)[0];
  return next?.index ?? currentIndex;
}
