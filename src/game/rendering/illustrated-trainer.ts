import type { TrainerAppearance } from '../../core/party/trainer-appearance.ts';
import { publicAssetUrl } from '../../core/assets/index.ts';

export const trainerSourcePath = (a: TrainerAppearance) => `assets/avatars/trainer-${a.hairStyle}-v1.webp`;
const sources = new Map<string, Promise<HTMLImageElement>>();
const skinColors = { light: [237, 187, 149], medium: [184, 126, 89], deep: [113, 74, 57] } as const;
const hairColors = { brown: [83, 54, 39], black: [37, 35, 36], blond: [189, 143, 69] } as const;
const outfitColors = { teal: [49, 125, 121], lavender: [134, 116, 173], coral: [187, 104, 87] } as const;
const bagColors = { coral: [204, 108, 76], mint: [112, 166, 139], navy: [54, 81, 112] } as const;
const eyeColors = { brown: '#69442e', blue: '#447f9c', green: '#547e51' };

/** Original painted sheets retain their shading. Palette regions use the source's
 * authored material colors; no photo processing, inference or generated-at-run-time art.
 */
export function composeIllustratedTrainer(source: HTMLImageElement, a: TrainerAppearance): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 960;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const sourceCanvas = document.createElement('canvas'); sourceCanvas.width = source.naturalWidth; sourceCanvas.height = source.naturalHeight;
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })!; sourceContext.drawImage(source, 0, 0);
  const pixels = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const cellW = sourceCanvas.width / 4, cellH = sourceCanvas.height / 4;
  const bounds = Array.from({ length: 16 }, (_, i) => {
    const column = i % 4, row = Math.floor(i / 4);
    const originX = Math.floor(column * cellW), originY = Math.floor(row * cellH);
    const width = Math.floor((column + 1) * cellW) - originX, height = Math.floor((row + 1) * cellH) - originY;
    let x0 = width, y0 = height, x1 = 0, y1 = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (pixels.data[((originY + y) * sourceCanvas.width + originX + x) * 4 + 3] < 128) continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    if (x0 > x1 || y0 > y1) throw new Error('Missing illustrated trainer pose');
    return { x0: originX + x0, y0: originY + y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  });
  const scale = 218 / Math.max(...bounds.map(b => b.height));
  for (const [i, b] of bounds.entries()) ctx.drawImage(source, b.x0, b.y0, b.width, b.height,
    i % 4 * 192 + (192 - b.width * scale) / 2, Math.floor(i / 4) * 240 + 231 - b.height * scale, b.width * scale, b.height * scale);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    const i = (y * canvas.width + x) * 4; if (image.data[i + 3] < 40) continue;
    const r = image.data[i], g = image.data[i + 1], b = image.data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    const saturation = max ? delta / max : 0;
    const hue = !delta ? 0 : ((max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) / 6 + 1) % 1;
    const localY = y % 240, localX = x % 192;
    let target: readonly number[] | undefined, baseline = 1;
    const faceRegion = localY > 35 && localY < 112;
    const legRegion = localY >= 168 && localY < 199;
    const handRegion = localY >= 112 && localY < 178 && (localX < 78 || localX > 115);
    if (hue > .015 && hue < .16 && saturation > .17 && saturation < .78 && max > (faceRegion ? 140 : 170) && (faceRegion || handRegion || legRegion)) { target = skinColors[a.skin]; baseline = 181; }
    else if (hue > .38 && hue < .57 && saturation > .18) { target = outfitColors[a.outfit]; baseline = 115; }
    else if (hue < .075 && saturation > .36 && localY >= 112 && localY < 172) { target = bagColors[a.backpack]; baseline = 132; }
    else if (localY < (a.hairStyle === 'long' ? 115 : 90) && r > g * 1.04 && g >= b && max < 145 && saturation > .15) { target = hairColors[a.hairColor]; baseline = 69; }
    if (target) {
      const luminance = .299 * r + .587 * g + .114 * b;
      const shade = Math.max(.28, Math.min(1.65, luminance / baseline));
      for (let c = 0; c < 3; c++) image.data[i + c] = Math.min(255, target[c] * shade);
    }
  }
  ctx.putImageData(image, 0, 0);
  for (let row = 0; row < 3; row++) for (let column = 0; column < 4; column++) {
    const baseX = column * 192, baseY = row * 240;
    const eyes = row === 0 ? [87, 105] : row === 1 ? [78] : [114];
    if (a.eyes !== 'brown') {
      ctx.fillStyle = eyeColors[a.eyes];
      for (const x of eyes) { ctx.beginPath(); ctx.ellipse(baseX + x, baseY + 65, 1.4, 1.8, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    if (a.beard === 'short') {
      const x = row === 0 ? 96 : row === 1 ? 81 : 111;
      ctx.fillStyle = `rgb(${hairColors[a.hairColor].join(',')})`; ctx.globalAlpha = .75;
      ctx.beginPath(); ctx.ellipse(baseX + x, baseY + 85, row === 0 ? 10 : 5, 4.5, 0, 0, Math.PI); ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  return canvas;
}

export async function loadIllustratedTrainer(a: TrainerAppearance): Promise<HTMLCanvasElement> {
  const path = trainerSourcePath(a);
  if (!sources.has(path)) sources.set(path, new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => { sources.delete(path); reject(new Error('Trainer artwork unavailable')); };
    image.src = publicAssetUrl(path, import.meta.env.BASE_URL);
  }));
  return composeIllustratedTrainer(await sources.get(path)!, a);
}
