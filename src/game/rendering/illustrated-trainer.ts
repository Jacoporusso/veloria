import type { TrainerAppearance } from '../../core/party/trainer-appearance.ts';
import { inTrainerPolygon, removeMaskSpecks, trainerPoseMask } from './trainer-pose-masks.ts';
import { publicAssetUrl } from '../../core/assets/index.ts';

export const trainerSourcePath = (a: TrainerAppearance) => `assets/avatars/trainer-${a.hairStyle}-v1.webp`;
const sources = new Map<string, Promise<HTMLImageElement>>();
const skinColors = { light: [237, 187, 149], medium: [184, 126, 89], deep: [113, 74, 57] } as const;
const hairColors = { brown: [83, 54, 39], black: [37, 35, 36], blond: [189, 143, 69] } as const;
const outfitColors = { teal: [49, 125, 121], lavender: [134, 116, 173], coral: [187, 104, 87] } as const;
const bagColors = { coral: [204, 108, 76], mint: [112, 166, 139], navy: [54, 81, 112] } as const;
const eyeColors = { brown: [105,68,46], blue: [68,127,156], green: [84,126,81] } as const;

/** Original painted sheets retain their shading. Palette regions use the source's
 * authored material colors; no photo processing, inference or generated-at-run-time art.
 */
export function normalizeTrainerSource(source: HTMLImageElement): HTMLCanvasElement {
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
  return canvas;
}

export function composeIllustratedTrainer(source: HTMLImageElement, a: TrainerAppearance): HTMLCanvasElement {
  const canvas = normalizeTrainerSource(source);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const original = new Uint8ClampedArray(image.data);
  const poses = Array.from({ length: 16 }, (_, index) => trainerPoseMask(a.hairStyle, index));
  const bags = new Uint8Array(canvas.width * canvas.height);
  // Mask only painted coral material inside the authored bag/strap silhouette.
  // Skin, coins, seams, and isolated antialiasing flecks must not become a bag.
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    const i = (y*canvas.width+x)*4, r = original[i], g = original[i+1], b = original[i+2];
    const pose = poses[Math.floor(y/240)*4+Math.floor(x/192)];
    if (original[i+3] >= 160 && r > 135 && r > g*1.2 && g > b*1.1 && g-b < .33*(r-b) &&
        (r-Math.min(g,b))/r > .42 && pose.bags.some(polygon => inTrainerPolygon(x%192,y%240,polygon))) bags[y*canvas.width+x] = 1;
  }
  removeMaskSpecks(bags, canvas.width);
  const tint = (i: number, target: readonly number[], baseline: number) => {
    const light = .299*original[i]+.587*original[i+1]+.114*original[i+2];
    const shade = Math.max(.28,Math.min(1.65,light/baseline));
    for (let c=0;c<3;c++) image.data[i+c]=Math.min(255,target[c]*shade);
  };
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    const i = (y * canvas.width + x) * 4; if (original[i+3] < 160) continue;
    const r = original[i], g = original[i+1], b = original[i+2];
    const max = Math.max(r,g,b), min = Math.min(r,g,b), delta = max-min;
    const saturation = max ? delta/max : 0;
    const hue = !delta ? 0 : ((max===r ? (g-b)/delta : max===g ? (b-r)/delta+2 : (r-g)/delta+4)/6+1)%1;
    const localY = y%240, localX = x%192;
    const pose = poses[Math.floor(y/240)*4+Math.floor(x/192)];
    const iris = pose.eyes.some(([ex,ey]) => ((localX-ex)/3.8)**2+((localY-ey)/4.2)**2 <= 1);
    const skinPixel = hue>.015 && hue<.16 && saturation>.17 && saturation<.78;
    if (bags[y*canvas.width+x]) {
      if (a.backpack !== 'coral') tint(i,bagColors[a.backpack],132);
    } else if (iris) {
      // Recolor the existing iris; retain pupils, whites, lashes and highlights.
      if (a.eyes !== 'brown' && max>38 && max<170 && saturation>.2 && r>g && g>=b) tint(i,eyeColors[a.eyes],87);
    } else if (skinPixel && max>(localY<112 ? 140 : 170) &&
        (localY>35 && localY<112 || localY>=168 && localY<199 || localY>=112 && localY<178 && (localX<78 || localX>115))) {
      tint(i,skinColors[a.skin],181);
    } else if (hue>.38 && hue<.57 && saturation>.18) tint(i,outfitColors[a.outfit],115);
    else if (localY<(a.hairStyle==='long' ? 115 : 90) && r>g*1.04 && g>=b && max<145 && saturation>.15) tint(i,hairColors[a.hairColor],69);
    if (a.beard === 'short' && skinPixel && max>125 && inTrainerPolygon(localX,localY,pose.beard)) {
      const eyeY = pose.eyes[0][1];
      const opacity = Math.min(.8,Math.max(.3,(localY-eyeY-7)/18));
      const shade = (.299*r+.587*g+.114*b)/181;
      for (let c=0;c<3;c++) image.data[i+c]=image.data[i+c]*(1-opacity)+hairColors[a.hairColor][c]*shade*opacity;
    }
  }
  ctx.putImageData(image,0,0);
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
