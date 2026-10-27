/** Authoring reference only. Final scenery must be illustrated and reviewed separately. */
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const [mapFile, sourceFile, outputFile, floorArgument, habitatArgument] = process.argv.slice(2);
if (!mapFile || !sourceFile || !outputFile || !floorArgument) {
  throw new Error('Usage: node tools/render_map_floor_reference.mjs map.tmj source.png output.png floorX,Y,W,H [habitatX,Y,W,H]');
}
const output = resolve(outputFile);
if ([mapFile, sourceFile].some(file => resolve(file) === output)) throw new Error('Reference output must not overwrite an input.');
function rectangle(argument) {
  if (!argument) return undefined;
  const values = argument.split(',').map(Number);
  if (values.length !== 4 || !values.every(Number.isFinite) || values[0] < 0 || values[1] < 0 || values[2] <= 0 || values[3] <= 0) {
    throw new Error('Material sample must be source-pixel x,y,width,height with positive dimensions.');
  }
  return { x: values[0], y: values[1], width: values[2], height: values[3] };
}
const tiled = JSON.parse(await readFile(mapFile, 'utf8'));
if (tiled.orientation !== 'orthogonal' || tiled.infinite || tiled.tilewidth !== 32 || tiled.tileheight !== 32) {
  throw new Error('Expected a finite orthogonal map using the 32px gameplay grid.');
}
const collision = tiled.layers.find(layer => layer.name === 'collision');
if (!collision) throw new Error('Missing collision layer.');
const props = object => Object.fromEntries((object.properties ?? []).map(property => [property.name, property.value]));
const blocked = new Set(), actors = new Set(), habitats = new Set();
function cells(object) {
  if (object.rotation || ['polygon', 'polyline', 'ellipse'].some(key => key in object)) throw new Error('Unsupported non-rectangular geometry.');
  const result = [];
  for (let y = Math.max(0, Math.floor(object.y / 32)); y < Math.min(tiled.height, Math.ceil((object.y + object.height) / 32)); y++) {
    for (let x = Math.max(0, Math.floor(object.x / 32)); x < Math.min(tiled.width, Math.ceil((object.x + object.width) / 32)); x++) result.push(`${x},${y}`);
  }
  return result;
}
for (const layer of tiled.layers) {
  if (layer.type === 'group') throw new Error('Flatten group layers first.');
  if (layer.type !== 'objectgroup') continue;
  if (['x', 'y', 'offsetx', 'offsety'].some(key => layer[key])) throw new Error('Offset layers require explicit geometry conversion.');
  for (const object of layer.objects ?? []) {
    const properties = props(object);
    const target = layer.name === 'collision' ? blocked
      : ['npc', 'wild-pokemon'].includes(properties.kind) ? actors
      : properties.kind === 'encounter-zone' ? habitats : undefined;
    if (target) for (const cell of cells(object)) target.add(cell);
  }
}
for (const object of collision.objects) {
  const properties = props(object);
  if ((properties.blocksWhenFlag || properties.blocksUntilFlag) && cells(object).some(cell => !actors.has(cell))) {
    throw new Error('Conditional non-actor collisions need a separate state-aware illustration plan.');
  }
}
for (const cell of actors) blocked.delete(cell);
const source = await readFile(sourceFile);
const data = `data:image/${sourceFile.toLowerCase().endsWith('.webp') ? 'webp' : 'png'};base64,${source.toString('base64')}`;
const width = tiled.width * 32, height = tiled.height * 32;
const localChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = process.env.CHROME_EXECUTABLE_PATH ?? (existsSync(localChrome) ? localChrome : undefined);
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(`<style>body{margin:0}</style><canvas width="${width}" height="${height}"></canvas>`);
  await page.evaluate(async ({ data, width, height, blocked, habitats, floor, habitat }) => {
    const image = new Image(); image.src = data; await image.decode();
    if (Math.abs(image.width / image.height / (width / height) - 1) > .005) throw new Error('Source and map aspect ratios differ.');
    const canvas = document.querySelector('canvas'), context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);
    const blockedCells = new Set(blocked), habitatCells = new Set(habitats);
    function material(sample) {
      if (sample.x + sample.width > image.width || sample.y + sample.height > image.height) throw new Error('Sample outside source image.');
      const tile = document.createElement('canvas'); tile.width = sample.width; tile.height = sample.height;
      tile.getContext('2d').drawImage(image, sample.x, sample.y, sample.width, sample.height, 0, 0, sample.width, sample.height);
      return context.createPattern(tile, 'repeat');
    }
    const layers = [{ pattern: material(floor), include: cell => !blockedCells.has(cell) }];
    if (habitat) layers.push({ pattern: material(habitat), include: cell => habitatCells.has(cell) && !blockedCells.has(cell) });
    for (const layer of layers) {
      context.fillStyle = layer.pattern;
      for (let y = 0; y < height / 32; y++) for (let x = 0; x < width / 32; x++) {
        if (layer.include(`${x},${y}`)) context.fillRect(x * 32, y * 32, 32, 52);
      }
    }
  }, { data, width, height, blocked: [...blocked], habitats: [...habitats], floor: rectangle(floorArgument), habitat: rectangle(habitatArgument) });
  await mkdir(dirname(output), { recursive: true });
  await page.locator('canvas').screenshot({ path: output });
  console.log(`Wrote authoring reference ${output}; source map and artwork untouched.`);
} finally {
  await browser.close();
}
