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

export function renderMap(scene: Phaser.Scene, definition: RegisteredMap): RenderedMap {
  const tilemap = scene.make.tilemap({ key: getMapKey(definition) });
  const tileset = tilemap.addTilesetImage('veloria_terrain', 'veloria-ground', TILE, TILE);
  if (!tileset) throw new Error(`Tileset veloria_terrain is missing from ${definition.metadata.tiledAsset}.`);

  const container = scene.add.container();
  for (const [name, depth] of [['ground', -10], ['terrain_detail', -5]] as const) {
    const layer = tilemap.createLayer(name, tileset, 0, 0);
    if (!layer) throw new Error(`Tiled layer ${name} is missing from ${definition.metadata.tiledAsset}.`);
    layer.setDepth(depth);
    container.add(layer);
  }

  const occupied = collectCollision(tilemap, tilemap.width, tilemap.height);
  const interactables: MapInteractable[] = [];
  for (const layerName of ['characters', 'canopy_overhead', 'interactions']) {
    const objectLayer = tilemap.getObjectLayer(layerName);
    for (const raw of objectLayer?.objects ?? []) {
      const object = raw as TiledObject;
      const properties = propertiesOf(object);
      const kind = propString(properties, 'kind') ?? object.class ?? object.type ?? '';
      const id = propString(properties, 'id') ?? object.name ?? `${layerName}-${object.id}`;
      const item: MapInteractable = {
        id, kind, name: object.name ?? id,
        x: object.x ?? 0, y: object.y ?? 0, width: object.width ?? TILE, height: object.height ?? TILE,
        properties,
      };
      interactables.push(item);
      renderObject(scene, container, item);
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

function renderObject(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable): void {
  const x = item.x, y = item.y, depth = Math.floor(y + item.height);
  switch (item.kind) {
    case 'house': {
      const house = attach(container, scene.add.image(x, y, 'borgofonte-house').setOrigin(0, 0).setDisplaySize(item.width, item.height).setDepth(depth));
      const tint = propNumber(item.properties, 'tint');
      if (tint) house.setTint(tint);
      attach(container, scene.add.text(x + item.width / 2, y - 5, item.name.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '8px', color: '#fff0d3', stroke: '#26372c', strokeThickness: 3,
      }).setOrigin(.5).setDepth(depth + 1));
      break;
    }
    case 'tree':
      attach(container, scene.add.image(x + item.width / 2, y + item.height, 'borgofonte-tree')
        .setOrigin(.5, .94).setDisplaySize(96, 112).setDepth(depth + 8));
      break;
    case 'npc':
      renderNpc(scene, container, item);
      break;
    case 'sign':
      renderSign(scene, container, x, y, depth);
      break;
    case 'mill-wheel':
      renderMillWheel(scene, container, item);
      break;
    case 'rock':
      renderRock(scene, container, x, y, depth);
      break;
  }
}

function renderNpc(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable): void {
  const x = item.x + item.width / 2, y = item.y + item.height / 2;
  const coat = propNumber(item.properties, 'coat') ?? 0x728a79;
  attach(container, scene.add.ellipse(x, y + 9, 21, 7, 0x24382e, .38).setDepth(y + 10));
  const npc = scene.add.container(x, y).setDepth(y + 22);
  const art = scene.add.graphics();
  art.fillStyle(0x403c38).fillRoundedRect(-6, -15, 12, 7, 3);
  art.fillStyle(0xefd1a9).fillRoundedRect(-6, -12, 12, 11, 4);
  art.fillStyle(0x40352c).fillRect(-3, -8, 2, 2).fillRect(2, -8, 2, 2);
  art.fillStyle(coat).fillRoundedRect(-9, -2, 18, 15, 4);
  art.fillStyle(0xe3d5b5).fillRect(-2, -1, 4, 10);
  art.fillStyle(0x3f4c48).fillRoundedRect(-7, 10, 6, 7, 2).fillRoundedRect(1, 10, 6, 7, 2);
  npc.add(art);
  attach(container, npc);
  attach(container, scene.add.text(x, y - 25, item.name.toUpperCase(), {
    fontFamily: 'monospace', fontSize: '8px', color: '#fff0d3', stroke: '#26372c', strokeThickness: 3,
  }).setOrigin(.5).setDepth(y + 23));
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
