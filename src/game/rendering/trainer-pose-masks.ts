import type { TrainerAppearance } from '../../core/party/trainer-appearance.ts';

type Point = readonly [number, number];
type Pose = { eyes: readonly Point[]; beard: readonly Point[]; bags: readonly (readonly Point[])[] };
// Coordinates are authored against normalized 192×240 cells, not the source
// atlas grid. Each walk phase has its own face position. Back poses have no face.
const IRIS: Record<TrainerAppearance['hairStyle'], readonly (readonly Point[])[]> = {
  short: [ [[85,78],[108,78]], [[85,88],[108,88]], [[89,77],[112,77]], [[85,87],[108,87]],
    [[70,66]], [[64,59]], [[69,69]], [[65,59]], [[120,69]], [[121,62]], [[120,71]], [[122,61]] ],
  curly: [ [[85,78],[108,78]], [[85,88],[108,88]], [[89,77],[112,77]], [[85,88],[108,88]],
    [[70,66]], [[65,63]], [[70,69]], [[65,64]], [[122,68]], [[121,62]], [[121,72]], [[122,62]] ],
  long: [ [[85,78],[108,78]], [[85,87],[108,87]], [[89,76],[112,76]], [[85,86],[109,86]],
    [[62,66]], [[60,60]], [[65,70]], [[61,60]], [[123,68]], [[125,62]], [[124,71]], [[125,62]] ],
};

export function trainerPoseMask(style: TrainerAppearance['hairStyle'], index: number): Pose {
  const row = Math.floor(index / 4);
  const eyes = IRIS[style][index] ?? [];
  if (row === 3) return { eyes: [], beard: [], bags: [[[67,80],[124,80],[129,171],[64,171]]] };
  const x = eyes.reduce((sum, point) => sum + point[0], 0) / eyes.length;
  const y = eyes[0][1];
  if (row === 0) return {
    eyes,
    beard: [[x-18,y+9],[x-14,y+18],[x,y+23],[x+14,y+18],[x+18,y+9],[x+11,y+13],[x,y+17],[x-11,y+13]],
    bags: [ [[64,y+9],[77,y+13],[78,140],[65,146]], [[116,y+9],[127,y+10],[132,143],[118,146]] ],
  };
  const sign = row === 1 ? 1 : -1;
  const relative = (points: readonly Point[]) => points.map(([dx,dy]) => [x + sign*dx, y+dy] as const);
  return {
    eyes,
    beard: relative([[-5,10],[-5,15],[6,21],[19,15],[20,5],[13,10],[4,15]]),
    bags: [relative([[26,22],[62,27],[78,45],[73,77],[37,82],[24,54]])],
  };
}

export function inTrainerPolygon(x: number, y: number, points: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj-xi)*(y-yi)/(yj-yi)+xi) inside = !inside;
  }
  return inside;
}

/** Reject tiny disconnected color flecks: they are not a backpack panel/strap. */
export function removeMaskSpecks(mask: Uint8Array, width: number, minimum = 8): void {
  const visited = new Uint8Array(mask.length);
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || visited[start]) continue;
    const component = [start]; visited[start] = 1;
    for (let next = 0; next < component.length; next++) {
      const p = component[next], x = p % width;
      for (const neighbor of [x > 0 ? p-1 : -1, x < width-1 ? p+1 : -1, p-width, p+width]) {
        if (neighbor < 0 || neighbor >= mask.length || visited[neighbor] || !mask[neighbor]) continue;
        visited[neighbor] = 1; component.push(neighbor);
      }
    }
    if (component.length < minimum) for (const p of component) mask[p] = 0;
  }
}
