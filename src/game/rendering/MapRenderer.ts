import Phaser from 'phaser';
import { getMapKey } from '../maps/map-registry';
import type { MapInteractable, MapTrigger, RegisteredMap } from '../maps/map-types';

const TILE = 32;
type RenderedMap = {
  container: Phaser.GameObjects.Container;
  occupied: Set<string>;
  interactables: MapInteractable[];
  triggers: MapTrigger[];
  width: number;
  height: number;
};

type TiledObject = Phaser.Types.Tilemaps.TiledObject & { properties?: unknown; class?: string };
const cellKey = (x: number, y: number) => `${x},${y}`;

function propertiesOf(object: TiledObject): Record<string, unknown> {
  if (Array.isArray(object.properties)) {
    return Object.fromEntries(object.properties.map((item: { name: string; value: unknown }) => [item.name, item.value]));
  }
  return object.properties && typeof object.properties === 'object' ? object.properties as Record<string, unknown> : {};
}

function propString(properties: Record<string, unknown>, key: string): string | undefined {
  const value = properties[key];
  return typeof value === 'string' ? value : undefined;
}

function propNumber(properties: Record<string, unknown>, key: string): number | undefined {
  const value = properties[key];
  return typeof value === 'number' ? value : undefined;
}

function attach<T extends Phaser.GameObjects.GameObject>(container: Phaser.GameObjects.Container, object: T): T {
  container.add(object);
  return object;
}

export function renderMap(scene: Phaser.Scene, definition: RegisteredMap, collectedFlags: readonly string[] = []): RenderedMap {
  const tilemap = scene.make.tilemap({ key: getMapKey(definition) });
  const tilesets = definition.metadata.renderAssets
    .filter(asset => asset.kind === 'tileset')
    .map(asset => {
      const tileset = tilemap.addTilesetImage(asset.tiledName, asset.key, asset.tileWidth, asset.tileHeight);
      if (!tileset) throw new Error(`Tileset ${asset.tiledName} is missing from ${definition.metadata.tiledAsset}.`);
      return tileset;
    });
  if (tilesets.length === 0) throw new Error(`No tilesets are declared for ${definition.metadata.id}.`);
  const imageKeys = new Set(definition.metadata.renderAssets.filter(asset => asset.kind === 'image').map(asset => asset.key));

  // Source texels may be larger than the fixed 32px world grid. Only terrain layers scale.
  const sourceWidth = tilesets[0].tileWidth, sourceHeight = tilesets[0].tileHeight;
  if (tilesets.some(set => set.tileWidth !== sourceWidth || set.tileHeight !== sourceHeight)) throw new Error('Terrain tilesets must share source dimensions.');
  tilemap.setBaseTileSize(sourceWidth, sourceHeight);
  for (const name of ['ground', 'terrain_detail']) tilemap.setLayerTileSize(sourceWidth, sourceHeight, name);
  if (sourceWidth > TILE || sourceHeight > TILE) for (const asset of definition.metadata.renderAssets) {
    if (asset.kind === 'tileset') scene.textures.get(asset.key).setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
  const container = scene.add.container();
  for (const [name, depth] of [['ground', -10], ['terrain_detail', -5]] as const) {
    const layer = tilemap.createLayer(name, tilesets, 0, 0);
    if (!layer) throw new Error(`Tiled layer ${name} is missing from ${definition.metadata.tiledAsset}.`);
    layer.setDepth(depth).setScale(TILE / sourceWidth, TILE / sourceHeight);
    // Alternating reflections join matching material edges instead of repeating hard seams.
    if (sourceWidth > TILE || sourceHeight > TILE) layer.forEachTile(tile => {
      tile.flipX = tile.x % 2 !== 0;
      tile.flipY = tile.y % 2 !== 0;
    });
    container.add(layer);
  }

  const occupied = collectCollision(tilemap, tilemap.width, tilemap.height);
  const interactables: MapInteractable[] = [];
  for (const layerName of ['decorations', 'characters', 'canopy_overhead', 'interactions']) {
    const objectLayer = tilemap.getObjectLayer(layerName);
    for (const raw of objectLayer?.objects ?? []) {
      const object = raw as TiledObject;
      const properties = propertiesOf(object);
      const kind = propString(properties, 'kind') ?? object.class ?? object.type ?? '';
      const collectedFlag = propString(properties, 'collectedFlag');
      if (collectedFlag && collectedFlags.includes(collectedFlag)) continue;
      const id = propString(properties, 'id') ?? object.name ?? `${layerName}-${object.id}`;
      const item: MapInteractable = {
        id, kind, name: object.name ?? id,
        x: object.x ?? 0, y: object.y ?? 0, width: object.width ?? TILE, height: object.height ?? TILE,
        properties,
      };
      if (layerName !== 'decorations') interactables.push(item);
      renderObject(scene, container, item, imageKeys);
    }
  }

  const triggers = (tilemap.getObjectLayer('triggers')?.objects ?? []).map(raw => {
    const object = raw as TiledObject;
    const properties = propertiesOf(object);
    return {
      id: object.name ?? `trigger-${object.id}`,
      kind: propString(properties, 'kind'),
      x: object.x ?? 0, y: object.y ?? 0, width: object.width ?? TILE, height: object.height ?? TILE,
      destinationMapId: propString(properties, 'destinationMapId'),
      destinationSpawnId: propString(properties, 'destinationSpawnId'),
      requiredFlag: propString(properties, 'requiredFlag'),
      message: propString(properties, 'message'),
      failureMessage: propString(properties, 'failureMessage'),
      questEvent: propString(properties, 'questEvent'),
      encounterTableId: propString(properties, 'encounterTableId'),
      encounterChance: propNumber(properties, 'encounterChance'),
    };
  });

  return { container, occupied, interactables, triggers, width: tilemap.width, height: tilemap.height };
}

function collectCollision(tilemap: Phaser.Tilemaps.Tilemap, width: number, height: number): Set<string> {
  const occupied = new Set<string>();
  for (const object of tilemap.getObjectLayer('collision')?.objects ?? []) {
    const objectX = object.x ?? 0, objectY = object.y ?? 0;
    const objectWidth = object.width ?? TILE, objectHeight = object.height ?? TILE;
    const left = Math.max(0, Math.floor(objectX / TILE));
    const top = Math.max(0, Math.floor(objectY / TILE));
    const right = Math.min(width, Math.ceil((objectX + Math.max(1, objectWidth)) / TILE));
    const bottom = Math.min(height, Math.ceil((objectY + Math.max(1, objectHeight)) / TILE));
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) occupied.add(cellKey(x, y));
  }
  return occupied;
}

function renderObject(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable, imageKeys: ReadonlySet<string>): void {
  const x = item.x, y = item.y, depth = Math.floor(y + item.height);
  switch (item.kind) {
    // Baked room artwork already draws this object; Tiled owns its interaction footprint.
    case 'hotspot':
      break;
    case 'house': {
      const sprite = propString(item.properties, 'houseSprite') ?? 'borgofonte-house';
      requireImageAsset(imageKeys, sprite, item);
      const house = attach(container, scene.add.image(x, y, sprite).setOrigin(0, 0).setDisplaySize(item.width, item.height).setDepth(depth));
      const tint = propNumber(item.properties, 'tint');
      if (tint) house.setTint(tint);
      attach(container, scene.add.text(x + item.width / 2, y - 5, item.name.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '8px', color: '#fff0d3', stroke: '#26372c', strokeThickness: 3,
      }).setOrigin(.5).setDepth(depth + 1));
      break;
    }
    case 'scenery-image': {
      const sprite = propString(item.properties, 'sprite');
      if (!sprite) throw new Error(`Scenery image ${item.id} must declare a sprite key.`);
      requireImageAsset(imageKeys, sprite, item);
      const renderDepth = propNumber(item.properties, 'renderDepth') ?? -4;
      attach(container, scene.add.image(x, y, sprite)
        .setOrigin(0, 0).setDisplaySize(item.width, item.height).setDepth(renderDepth));
      break;
    }
    case 'tree': {
      const sprite = propString(item.properties, 'sprite') ?? (imageKeys.has('veloria-canopy-v2') ? 'veloria-canopy-v2' : 'borgofonte-tree');
      requireImageAsset(imageKeys, sprite, item);
      attach(container, scene.add.image(x + item.width / 2, y + item.height, sprite, sprite === 'veloria-canopy-v2' ? atlasFrame(scene, sprite, 2, 2, Math.abs(Math.floor(x / TILE) + Math.floor(y / TILE) * 3) % 4) : undefined)
        .setOrigin(.5, .94).setDisplaySize(96, 112).setDepth(depth + 8));
      break;
    }
    case 'npc':
      renderNpc(scene, container, item, imageKeys);
      break;
    case 'sign':
      renderSign(scene, container, x, y, depth);
      break;
    case 'mill-wheel':
      renderMillWheel(scene, container, item);
      break;
    case 'rock':
      if (item.properties.questEvent === 'event/forest_signal/read') renderSensor(scene, container, x, y, depth);
      else renderRock(scene, container, x, y, depth);
      break;
    case 'pickup':
      renderPickup(scene, container, item);
      break;
    case 'resonance-plate':
      renderResonancePlate(scene, container, item);
      break;
  }
}

function renderPickup(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable): void {
  const x = item.x + item.width / 2, y = item.y + item.height / 2, depth = item.y + item.height;
  const art = attach(container, scene.add.graphics().setDepth(depth));
  art.fillStyle(0x1b2b24, .55).fillEllipse(x, y + 9, 26, 8);
  art.fillStyle(0xd6be83, 1).fillRoundedRect(x - 7, y - 8, 14, 20, 4);
  art.lineStyle(1, 0xf4e2b4, 1).strokeRoundedRect(x - 7, y - 8, 14, 20, 4);
  art.fillStyle(0x728a79, 1).fillRoundedRect(x - 5, y - 11, 10, 5, 2);
  art.lineStyle(1, 0x26372c, .9).lineBetween(x - 6, y + 1, x + 6, y + 1);
  art.fillStyle(0xfff0d3, .95).fillCircle(x, y + 1, 2);
  attach(container, scene.add.text(x, item.y - 3, item.name.toUpperCase(), {
    fontFamily: 'monospace', fontSize: '7px', color: '#fff0d3', stroke: '#26372c', strokeThickness: 3,
  }).setOrigin(.5, 1).setDepth(depth + 1));
}

function requireImageAsset(imageKeys: ReadonlySet<string>, key: string, item: MapInteractable): void {
  if (!imageKeys.has(key)) throw new Error(`Map object ${item.id} references undeclared image asset ${key}.`);
}

function renderResonancePlate(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable): void {
  const x = item.x + item.width / 2, y = item.y + item.height / 2, depth = item.y + item.height - 1;
  const art = attach(container, scene.add.graphics().setDepth(depth));
  art.fillStyle(0x2b4136, .7).fillEllipse(x, y + 5, 24, 10);
  art.lineStyle(2, 0xe7c77c, .9).strokeEllipse(x, y + 3, 19, 8);
  art.fillStyle(0xf4d795, .9).fillCircle(x, y + 3, 2);
  attach(container, scene.add.text(x, item.y - 2, item.name, {
    fontFamily: 'monospace', fontSize: '7px', color: '#ffe5a5', stroke: '#26372c', strokeThickness: 2,
  }).setOrigin(.5, 1).setDepth(depth + 1));
}

/** Frames are derived from source dimensions; world coordinates and collision stay unchanged. */
function atlasFrame(scene: Phaser.Scene, key: string, columns: number, rows: number, index: number): string {
  const texture = scene.textures.get(key);
  texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  const source = texture.getSourceImage() as HTMLImageElement;
  const frame = 'cell-' + index;
  if (!texture.has(frame)) texture.add(frame, 0, index % columns * source.width / columns, Math.floor(index / columns) * source.height / rows, source.width / columns, source.height / rows);
  return frame;
}

function renderNpc(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable, imageKeys: ReadonlySet<string>): void {
  const x = item.x + item.width / 2, y = item.y + item.height / 2;
  const sprite = propString(item.properties, 'sprite');
  if (!sprite) throw new Error('NPC ' + item.id + ' must declare a character sprite.');
  requireImageAsset(imageKeys, sprite, item);
  const frame = propNumber(item.properties, 'spriteFrame') ?? 0;
  attach(container, scene.add.ellipse(x, y + 14, 21, 7, 0x142c35, .22).setDepth(y + 10));
  attach(container, scene.add.image(x, y + 19, sprite, atlasFrame(scene, sprite, 3, 2, frame)).setOrigin(.5, 1).setDisplaySize(60, 60).setDepth(y + 22));
  attach(container, scene.add.text(x, y - 43, item.name, {
    fontFamily: 'system-ui, sans-serif', fontSize: '8px', fontStyle: 'bold', color: '#effcff', stroke: '#153746', strokeThickness: 2,
  }).setOrigin(.5).setDepth(y + 23));
}

/** A recognisable field instrument instead of the old generic rock placeholder. */
function renderSensor(scene: Phaser.Scene, container: Phaser.GameObjects.Container, x: number, y: number, depth: number): void {
  const g = attach(container, scene.add.graphics().setDepth(depth));
  g.fillStyle(0x132d39, .24).fillEllipse(x + 16, y + 29, 28, 8);
  g.lineStyle(3, 0xb68c68).lineBetween(x + 16, y + 14, x + 6, y + 29).lineBetween(x + 16, y + 14, x + 26, y + 29);
  g.fillStyle(0x203f50).fillRoundedRect(x + 4, y - 4, 24, 25, 7);
  g.lineStyle(1, 0xafffe3, .8).strokeRoundedRect(x + 4, y - 4, 24, 25, 7);
  g.fillStyle(0x79e6d1).fillCircle(x + 16, y + 7, 7);
  g.lineStyle(1.5, 0x173e51).lineBetween(x + 16, y + 7, x + 20, y + 3);
  g.fillStyle(0xffffff).fillCircle(x + 11, y + 16, 1.5);
  g.fillStyle(0xb9a8f6).fillCircle(x + 21, y + 16, 1.5);
}

function renderSign(scene: Phaser.Scene, container: Phaser.GameObjects.Container, x: number, y: number, depth: number): void {
  const g = attach(container, scene.add.graphics().setDepth(depth));
  g.fillStyle(0x3d4d3c).fillRect(x + 12, y + 15, 9, 19);
  g.fillStyle(0x795b3d).fillRect(x + 4, y + 4, 24, 17);
  g.fillStyle(0xd2bd8a).fillRect(x + 7, y + 8, 18, 2);
}

function renderMillWheel(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable): void {
  const cx = item.x + item.width / 2, cy = item.y + item.height / 2, depth = cy + 10;
  attach(container, scene.add.ellipse(cx, cy + 4, 62, 42, 0x3d5546).setDepth(depth));
  attach(container, scene.add.ellipse(cx, cy, 54, 38, 0x795b3d).setDepth(depth + 1));
  attach(container, scene.add.ellipse(cx, cy, 44, 29, 0xc6b68f).setDepth(depth + 2));
  attach(container, scene.add.ellipse(cx, cy, 34, 21, 0x537d7a).setDepth(depth + 3));
  const spokes = attach(container, scene.add.graphics().setDepth(depth + 4));
  spokes.lineStyle(3, 0x886646, 1);
  spokes.lineBetween(cx - 21, cy, cx + 21, cy); spokes.lineBetween(cx, cy - 14, cx, cy + 14);
  spokes.lineBetween(cx - 15, cy - 10, cx + 15, cy + 10); spokes.lineBetween(cx - 15, cy + 10, cx + 15, cy - 10);
  attach(container, scene.add.ellipse(cx, cy, 8, 8, 0xd3bd8c).setDepth(depth + 5));
}

function renderRock(scene: Phaser.Scene, container: Phaser.GameObjects.Container, x: number, y: number, depth: number): void {
  const g = attach(container, scene.add.graphics().setDepth(depth));
  g.fillStyle(0x4d5b44, .45).fillEllipse(x + 17, y + 27, 28, 9);
  g.fillStyle(0x827f66).fillPoints([{ x: x + 5, y: y + 22 }, { x: x + 11, y: y + 8 }, { x: x + 23, y: y + 5 }, { x: x + 29, y: y + 20 }], true);
  g.fillStyle(0xb4ad87).fillPoints([{ x: x + 11, y: y + 12 }, { x: x + 17, y: y + 7 }, { x: x + 23, y: y + 11 }], true);
}
