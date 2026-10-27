import Phaser from 'phaser';
import { getMap, getMapKey } from '../maps/map-registry';
import type { MapInteractable, MapTrigger, RegisteredMap } from '../maps/map-types';
import { ensureSeamlessTilesetTexture } from './seamless-tileset';
import { getTerrainTileFlip } from './terrain-tiling';
import { renderElevatedRail } from './elevated-rail';
import { renderRailConsole } from './rail-console';
import { renderTransitTerminal } from './TransitTerminal';
import { getSignalRouter } from '../maps/signal-router-registry';
import { renderSignalRouter } from './signal-router';
import { collectMapCollision } from '../../core/world/map-collision';
import { collectIceTiles } from '../../core/world/ice-movement';
import { renderEncounterHabitatGrass } from './encounter-habitat-grass.ts';
import { npcSpriteOrigin } from './npc-sprite-origin.ts';
import { renderWeatherInstrument } from './weather-instrument.ts';
import { renderWayfindingMarker } from './wayfinding-marker.ts';
import { renderMapEdgeBackdrop } from './map-edge-backdrop.ts';
import { applyNpcIdleView, npcIdleViews } from './npc-idle-views.ts';
import { prepareNpcIdleTextures } from './npc-idle-texture.ts';

const TILE = 32;

type RenderedMap = {
  container: Phaser.GameObjects.Container;
  occupied: Set<string>;
  iceTiles: Set<string>;
  interactables: MapInteractable[];
  triggers: MapTrigger[];
  updateExitMarkers: (flags: readonly string[]) => void;
  updateInteractionFocus: (target?: MapInteractable) => void;
  width: number;
  height: number;
};

type TiledObject = Phaser.Types.Tilemaps.TiledObject & { properties?: unknown; class?: string };

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
      const tiledTileset = tilemap.getTileset(asset.tiledName);
      if (!tiledTileset) throw new Error(`Tileset metadata ${asset.tiledName} is missing from ${definition.metadata.tiledAsset}.`);
      const textureKey = tiledTileset.tileWidth > TILE || tiledTileset.tileHeight > TILE
        ? ensureSeamlessTilesetTexture(
          scene, asset.key, tiledTileset.columns, tiledTileset.total,
          tiledTileset.tileWidth, tiledTileset.tileHeight, tiledTileset.tileMargin, tiledTileset.tileSpacing,
        )
        : asset.key;
      const tileset = tilemap.addTilesetImage(
        asset.tiledName, textureKey, tiledTileset.tileWidth, tiledTileset.tileHeight,
        tiledTileset.tileMargin, tiledTileset.tileSpacing,
      );
      if (!tileset) throw new Error(`Tileset ${asset.tiledName} is missing from ${definition.metadata.tiledAsset}.`);
      return tileset;
    });
  if (tilesets.length === 0) throw new Error(`No tilesets are declared for ${definition.metadata.id}.`);
  const imageKeys = new Set(definition.metadata.renderAssets.filter(asset => asset.kind === 'image').map(asset => asset.key));
  const imageAtlases = new Map(definition.metadata.renderAssets
    .filter((asset): asset is Extract<typeof asset, { kind: 'image' }> => asset.kind === 'image' && !!asset.atlas)
    .map(asset => [asset.key, asset.atlas!] as const));

  // Source texels may be larger than the fixed 32px world grid. Only terrain layers scale.
  const sourceWidth = tilesets[0].tileWidth, sourceHeight = tilesets[0].tileHeight;
  if (tilesets.some(set => set.tileWidth !== sourceWidth || set.tileHeight !== sourceHeight)) throw new Error('Terrain tilesets must share source dimensions.');
  tilemap.setBaseTileSize(sourceWidth, sourceHeight);
  for (const name of ['ground', 'terrain_detail']) tilemap.setLayerTileSize(sourceWidth, sourceHeight, name);
  if (sourceWidth > TILE || sourceHeight > TILE) for (const asset of definition.metadata.renderAssets) {
    if (asset.kind === 'tileset') scene.textures.get(asset.key).setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
  const container = scene.add.container();
  const terrainLayers: Phaser.Tilemaps.TilemapLayer[] = [];
  for (const [name, depth] of [['ground', -10], ['terrain_detail', -5]] as const) {
    const layer = tilemap.createLayer(name, tilesets, 0, 0);
    if (!layer) throw new Error(`Tiled layer ${name} is missing from ${definition.metadata.tiledAsset}.`);
    layer.setDepth(depth).setScale(TILE / sourceWidth, TILE / sourceHeight);
    // Stable coordinate hashes vary identical materials without a checkerboard; blended atlas edges keep them seamless.
    if (sourceWidth > TILE || sourceHeight > TILE) layer.forEachTile(tile => {
      const flip = getTerrainTileFlip(definition.metadata.id, tile.x, tile.y);
      tile.flipX = flip.flipX;
      tile.flipY = flip.flipY;
    });
    container.add(layer);
    terrainLayers.push(layer);
  }
  // Compose static terrain at world resolution once, so fractional camera scaling cannot expose gaps between tile quads.
  const terrainWidth = tilemap.width * TILE, terrainHeight = tilemap.height * TILE;
  const terrainSurface = scene.add.renderTexture(0, 0, terrainWidth, terrainHeight);
  const terrainBase = definition.metadata.terrainBase;
  if (terrainBase) {
    const baseTileset = tilesets.find(tileset => tileset.name === terrainBase.tilesetName);
    if (!baseTileset) throw new Error(`Map ${definition.metadata.id} terrainBase references a missing Tiled tileset.`);
    const expectedGid = baseTileset.firstgid + terrainBase.tileIndex;
    const hasUnexpectedGround = terrainLayers[0].layer.data.some(row => row.some(tile =>
      tile !== null && tile.index >= 0 && tile.index !== expectedGid));
    if (hasUnexpectedGround) {
      throw new Error(`Map ${definition.metadata.id} terrainBase can only replace ground tile ${expectedGid}.`);
    }
    const groundImage = scene.add.image(0, 0, terrainBase.assetKey)
      .setOrigin(0, 0).setDisplaySize(terrainWidth, terrainHeight);
    terrainSurface.draw([groundImage, terrainLayers[1]]);
    groundImage.destroy();
  } else {
    terrainSurface.draw(terrainLayers);
  }
  terrainSurface.setOrigin(0, 0).setDepth(-10);
  container.add(terrainSurface);
  let backdropTexture: string | Phaser.Textures.Texture = terrainBase?.assetKey ?? terrainSurface.texture;
  let backdropDepth = -11;
  for (const layer of terrainLayers) layer.destroy();

  const occupied = collectMapCollision(tilemap.getObjectLayer('collision')?.objects ?? [], tilemap.width, tilemap.height, collectedFlags);
  const interactables: MapInteractable[] = [];
  for (const layerName of ['decorations', 'characters', 'canopy_overhead', 'interactions']) {
    const objectLayer = tilemap.getObjectLayer(layerName);
    for (const raw of objectLayer?.objects ?? []) {
      const object = raw as TiledObject;
      const properties = propertiesOf(object);
      const kind = propString(properties, 'kind') ?? object.class ?? object.type ?? '';
      const visibleWhenFlag = propString(properties, 'visibleWhenFlag');
      if (visibleWhenFlag && !collectedFlags.includes(visibleWhenFlag)) continue;
      const collectedFlag = propString(properties, 'collectedFlag');
      if (collectedFlag && collectedFlags.includes(collectedFlag)) continue;
      const id = propString(properties, 'id') ?? object.name ?? `${layerName}-${object.id}`;
      const item: MapInteractable = {
        id, kind, name: object.name ?? id,
        x: object.x ?? 0, y: object.y ?? 0, width: object.width ?? TILE, height: object.height ?? TILE,
        properties,
      };
      if (layerName !== 'decorations') interactables.push(item);
      const activatedFlag = propString(properties, 'activatedFlag');
      if (item.kind === 'scenery-image' && item.x === 0 && item.y === 0 && item.width === terrainWidth && item.height === terrainHeight) {
        const sprite = propString(item.properties, 'sprite');
        const renderDepth = propNumber(item.properties, 'renderDepth') ?? -4;
        if (sprite && imageKeys.has(sprite) && renderDepth >= backdropDepth) {
          backdropTexture = sprite;
          backdropDepth = renderDepth;
        }
      }
      renderObject(scene, container, item, imageKeys, imageAtlases, !activatedFlag || collectedFlags.includes(activatedFlag), collectedFlags);
      const completedFlag = propString(properties, 'completedFlag');
      if (completedFlag && collectedFlags.includes(completedFlag)) {
        attach(container, scene.add.text(item.x + item.width / 2, item.y - 38, '✓', {
          fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#ffffff',
          backgroundColor: '#21786b', padding: { x: 5, y: 1 },
        }).setOrigin(.5, 1).setDepth(item.y + item.height + 4));
      }
    }
  }

  renderMapEdgeBackdrop(scene, container, backdropTexture, terrainWidth, terrainHeight, backdropDepth);
  const triggers = (tilemap.getObjectLayer('triggers')?.objects ?? []).map(raw => {
    const object = raw as TiledObject;
    const properties = propertiesOf(object);
    return {
      id: object.name ?? `trigger-${object.id}`,
      kind: propString(properties, 'kind'),
      x: object.x ?? 0, y: object.y ?? 0, width: object.width ?? TILE, height: object.height ?? TILE,
      destinationMapId: propString(properties, 'destinationMapId'),
      destinationSpawnId: propString(properties, 'destinationSpawnId'),
      exitDirection: propString(properties, 'exitDirection'),
      requiredFlag: propString(properties, 'requiredFlag'),
      message: propString(properties, 'message'),
      failureMessage: propString(properties, 'failureMessage'),
      questEvent: propString(properties, 'questEvent'),
      encounterTableId: propString(properties, 'encounterTableId'),
      encounterChance: propNumber(properties, 'encounterChance'),
    };
  });

  renderEncounterHabitatGrass(scene, container, triggers, occupied);

  const iceTiles = collectIceTiles(tilemap.getObjectLayer('movement_surfaces')?.objects ?? [], tilemap.width, tilemap.height);
  const exitMarkers = triggers.filter(trigger => trigger.kind === 'map-exit' && trigger.destinationMapId).map(trigger => {
    const cx = trigger.x + trigger.width / 2, cy = trigger.y + trigger.height / 2;
    const direction = trigger.exitDirection ?? (trigger.x < TILE ? 'left' : trigger.x + trigger.width > terrainWidth - TILE ? 'right' : trigger.y < terrainHeight / 2 ? 'up' : 'down');
    const angle = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[direction] ?? 0;
    const marker = attach(container, scene.add.graphics().setDepth(1));
    const labelX = Math.max(95, Math.min(terrainWidth - 95, cx));
    const labelY = cy < 70 ? cy + 38 : cy - 30;
    const label = attach(container, scene.add.text(labelX, labelY, '', {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#e6fff5',
      backgroundColor: '#183c49', padding: { x: 6, y: 4 }, align: 'center', wordWrap: { width: 180 }, resolution: 3,
    }).setOrigin(.5, cy < 70 ? 0 : 1).setDepth(trigger.y + trigger.height + 2));
    let previousOpen: boolean | undefined;
    return (flags: readonly string[]) => {
      const open = !trigger.requiredFlag || flags.includes(trigger.requiredFlag);
      if (open === previousOpen) return;
      previousOpen = open;
      const color = open ? 0xa5ffe1 : 0xffd494;
      marker.clear().fillStyle(color, .16).fillRoundedRect(trigger.x, trigger.y, trigger.width, trigger.height, 5);
      marker.lineStyle(1.5, color, .9).strokeRoundedRect(trigger.x + 1, trigger.y + 1, trigger.width - 2, trigger.height - 2, 5);
      const points = [[-7, 3], [0, -4], [7, 3]].map(([x, y]) => ({ x: cx + x * Math.cos(angle) - y * Math.sin(angle), y: cy + x * Math.sin(angle) + y * Math.cos(angle) }));
      marker.lineStyle(2.5, color, 1).beginPath().moveTo(points[0].x, points[0].y).lineTo(points[1].x, points[1].y).lineTo(points[2].x, points[2].y).strokePath();
      const destination = getMap(trigger.destinationMapId!).metadata.displayName;
      label.setText(open ? destination : `${destination}\n${trigger.failureMessage ?? 'Passaggio ancora chiuso'}`).setColor(open ? '#e6fff5' : '#ffe4b3');
    };
  });
  const updateExitMarkers = (flags: readonly string[]) => exitMarkers.forEach(update => update(flags));
  updateExitMarkers(collectedFlags);
  const focus = attach(container, scene.add.graphics().setName('interaction-focus').setVisible(false));
  let focusedId: string | undefined;
  const updateInteractionFocus = (target?: MapInteractable) => {
    if (target?.id === focusedId) return;
    focusedId = target?.id;
    focus.clear().setVisible(Boolean(target));
    if (!target) return;
    const x = target.x + target.width / 2, y = target.y + target.height - 1;
    const width = Math.min(58, Math.max(30, target.width));
    // A local contact highlight keeps active objects readable on detailed art.
    // It appears only for the same adjacent target as the existing action prompt.
    focus.fillStyle(0x173c49, .3).fillEllipse(x, y + 3, width + 8, 17);
    focus.fillStyle(0xafffe3, .12).fillEllipse(x, y, width, 13);
    focus.lineStyle(1.6, 0xc5fff0, .95).strokeEllipse(x, y, width, 13);
  };
  return { container, occupied, iceTiles, interactables, triggers, updateExitMarkers, updateInteractionFocus, width: tilemap.width, height: tilemap.height };
}

function renderObject(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable, imageKeys: ReadonlySet<string>, imageAtlases: ReadonlyMap<string, { columns: number; rows: number }>, active: boolean, flags: readonly string[]): void {
  renderWayfindingMarker(scene, container, item);
  // Full-map paintings can own a static object's appearance while Tiled keeps
  // its collision, service, dialogue and interaction coordinates authoritative.
  if (item.properties.visualBaked === true && item.kind !== 'fishing-spot') return;
  const x = item.x, y = item.y, depth = Math.floor(y + item.height);
  switch (item.kind) {
    case 'quest-sigil': {
      const cx = x + item.width / 2, cy = y + item.height / 2;
      const marker = attach(container, scene.add.graphics().setDepth(-1).setName('quest-sigil-marker')
        .setData('activatedFlag', item.properties.activatedFlag).setData('activated', active));
      marker.fillStyle(active ? 0x207e88 : 0x214a68, active ? .75 : .12).fillCircle(cx, cy, 13);
      marker.lineStyle(1.5, active ? 0xc1ffed : 0x49758b, 1).strokeCircle(cx, cy, 13);
      marker.lineStyle(2, active ? 0xf0fff8 : 0x49758b, 1);
      if (active) marker.beginPath().moveTo(cx - 6, cy).lineTo(cx - 1, cy + 5).lineTo(cx + 7, cy - 6).strokePath();
      else for (let ray = 0; ray < 6; ray++) {
        const angle = ray * Math.PI / 3;
        marker.lineBetween(cx, cy, cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
      }
      break;
    }
    case 'fishing-spot': {
      // One shared ground marker per authored spot; it never blocks movement.
      const cx = x + item.width / 2, cy = y + item.height / 2 + 19;
      const marker = attach(container, scene.add.graphics().setDepth(depth - 1).setName('fishing-spot-marker'));
      marker.fillStyle(0x173d50, .88).fillCircle(cx, cy, 14);
      marker.lineStyle(1.5, 0xb8f5e2, .95).strokeCircle(cx, cy, 14);
      attach(container, scene.add.text(cx, cy - 1, '🎣', {
        fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", system-ui', fontSize: '18px', resolution: 4,
      }).setOrigin(.5).setDepth(depth).setName('fishing-spot-icon'));
      attach(container, scene.add.text(cx, cy + 17, 'PESCA', {
        fontFamily: 'system-ui, sans-serif', fontSize: '9px', fontStyle: 'bold',
        color: '#e9fff8', stroke: '#173d50', strokeThickness: 3, resolution: 4,
      }).setOrigin(.5, 0).setDepth(depth).setName('fishing-spot-label'));
      break;
    }
    case 'sluice-gate': {
      if (active) break;
      const gate = attach(container, scene.add.graphics().setDepth(depth));
      gate.fillStyle(0x244c60, .94).fillRoundedRect(x, y + 10, item.width, 12, 4);
      gate.lineStyle(2, 0xe5bc7e, 1).strokeRoundedRect(x, y + 10, item.width, 12, 4);
      for (let offset = 8; offset < item.width; offset += 12) {
        gate.lineBetween(x + offset, y + 12, x + offset, y + 20);
      }
      break;
    }
    case 'challenge-sequence': {
      const marker = attach(container, scene.add.graphics().setDepth(depth));
      const cx = x + item.width / 2, cy = y + item.height / 2;
      marker.fillStyle(0x183d52, .85).fillRoundedRect(x + 2, y + 7, item.width - 4, item.height - 8, 7);
      marker.lineStyle(1.5, 0xb5fbe6, .9).strokeRoundedRect(x + 2, y + 7, item.width - 4, item.height - 8, 7);
      marker.fillStyle(0xcbb4ff, 1).fillTriangle(cx, cy - 8, cx + 7, cy + 1, cx, cy + 8);
      marker.fillStyle(0xa5ffe1, 1).fillTriangle(cx, cy - 8, cx - 7, cy + 1, cx, cy + 8);
      break;
    }
    case 'resonance-beacon': {
      // Authored state, shared rendering: feedback follows the verified quest flag.
      const light = attach(container, scene.add.graphics().setDepth(depth + 1));
      const cx = x + item.width / 2, cy = y + item.height / 2;
      light.fillStyle(active ? 0x94f5dc : 0xa8abda, active ? .22 : .09).fillEllipse(cx, cy, item.width * .9, item.height * .9);
      light.lineStyle(active ? 3 : 2, active ? 0xa3ffe6 : 0xb4abdf, active ? .9 : .4);
      light.strokeEllipse(cx, cy, item.width * .68, item.height * .68);
      light.lineStyle(2, active ? 0xe2c2ff : 0x68849a, active ? .85 : .35);
      light.strokeEllipse(cx, cy, item.width * .4, item.height * .4);
      if (active) light.fillStyle(0xf1fffa, .95).fillCircle(cx, cy, 4);
      break;
    }
    case 'signal-router':
      renderSignalRouter(scene, container, getSignalRouter(String(item.properties.routerId)), flags);
      break;
    case 'lift-pad': {
      const pad = attach(container, scene.add.graphics().setDepth(-2));
      pad.fillStyle(0x547c91, .3).fillRoundedRect(x, y, item.width, item.height, 10);
      pad.lineStyle(2, 0xb0f4e7, .95).strokeRoundedRect(x + 3, y + 3, item.width - 6, item.height - 6, 8);
      attach(container, scene.add.text(x + item.width / 2, y + item.height / 2, '↑ P4', {fontFamily:'system-ui, sans-serif',fontSize:'11px',color:'#21495a',backgroundColor:'#d8f6f2',resolution:4}).setOrigin(.5).setDepth(-1));
      break;
    }
    case 'signal-router-switch': break; // The shared circuit decoration draws its controls.
    case 'paved-walkway': {
      // Continuous path strips avoid a repeated paving texture. Tiled owns collision.
      const paving = attach(container, scene.add.graphics().setDepth(-6));
      paving.fillStyle(0xc3d4d7, 1).fillRect(x, y, item.width, item.height);
      paving.lineStyle(1.2, 0xf5fff8, .4);
      if (item.width > item.height * 4) paving.lineBetween(x, y + item.height / 2, x + item.width, y + item.height / 2);
      else if (item.height > item.width * 4) paving.lineBetween(x + item.width / 2, y, x + item.width / 2, y + item.height);
      break;
    }
    case 'rail-console':
      renderRailConsole(scene, container, item, active);
      break;
    case 'transit-terminal':
      renderTransitTerminal(scene, container, item);
      break;
    case 'elevated-rail':
      renderElevatedRail(scene, container, item);
      break;
    case 'irrigation-channel': {
      const g = attach(container, scene.add.graphics().setDepth(-3));
      g.fillStyle(0x735c52).fillRoundedRect(x, y, item.width, item.height, 5);
      g.fillStyle(0xd5baa0).fillRoundedRect(x + 2, y + 2, item.width - 4, item.height - 4, 4);
      g.fillStyle(active ? 0x5cc8d5 : 0xa88b75).fillRoundedRect(x + 5, y + 5, item.width - 10, item.height - 10, 3);
      if (active) {
        g.lineStyle(2, 0xd8f8f4, .7);
        if (item.width > item.height) g.lineBetween(x + 10, y + item.height / 2, x + item.width - 10, y + item.height / 2);
        else g.lineBetween(x + item.width / 2, y + 10, x + item.width / 2, y + item.height - 10);
      }
      break;
    }
    // Baked room artwork already draws this object; Tiled owns its interaction footprint.
    case 'hotspot':
      if (item.properties.weatherInstrument === 'wind' || item.properties.weatherInstrument === 'thermometer') {
        renderWeatherInstrument(scene, container, item, item.properties.weatherInstrument);
      } else if (item.properties.fieldInstrument === 'gauge') {
        renderSensor(scene, container, item, depth, imageKeys, imageAtlases);
      }
      break;
    case 'environment-regulator':
      if (item.properties.fieldInstrument === 'gauge') {
        renderSensor(scene, container, item, depth, imageKeys, imageAtlases);
      }
      break;
    case 'house': {
      const sprite = propString(item.properties, 'houseSprite') ?? 'borgofonte-house';
      requireImageAsset(imageKeys, sprite, item);
      const frameIndex = propNumber(item.properties, 'houseFrame');
      const frame = atlasFrame(scene, sprite, imageAtlases, frameIndex ?? 0);
      const image = frame === undefined
        ? scene.add.image(x, y, sprite)
        : scene.add.image(x, y, sprite, frame);
      const house = attach(container, image.setOrigin(0, 0).setDisplaySize(item.width, item.height).setDepth(depth));
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
      const atlas = imageAtlases.get(sprite);
      const frameIndex = atlas ? Math.abs(Math.floor(x / TILE) + Math.floor(y / TILE) * 3) % (atlas.columns * atlas.rows) : 0;
      const tree = scene.add.image(x + item.width / 2, y + item.height, sprite, atlasFrame(scene, sprite, imageAtlases, frameIndex));
      attach(container, tree.setOrigin(.5, .94).setScale(Math.min(96 / tree.width, 112 / tree.height)).setDepth(depth + 8));
      break;
    }
    case 'plant': {
      const sprite = propString(item.properties, 'sprite');
      if (!sprite) throw new Error('Plant ' + item.id + ' must declare a sprite atlas.');
      requireImageAsset(imageKeys, sprite, item);
      const frame = atlasFrame(scene, sprite, imageAtlases, propNumber(item.properties, 'spriteFrame') ?? 0);
      attach(container, scene.add.image(x + item.width / 2, y + item.height, sprite, frame)
        .setOrigin(.5, 1).setDisplaySize(item.width, item.height).setDepth(depth));
      break;
    }
    case 'npc':
      renderNpc(scene, container, item, imageKeys, imageAtlases);
      break;
    case 'wild-pokemon': {
      const sprite = propString(item.properties, 'sprite');
      if (!sprite) throw new Error(`Special Pokémon ${item.id} has no artwork.`);
      requireImageAsset(imageKeys, sprite, item);
      scene.textures.get(sprite).setFilter(Phaser.Textures.FilterMode.LINEAR);
      const centerX = x + item.width / 2, feetY = y + item.height / 2 + 19;
      attach(container, scene.add.ellipse(centerX, feetY - 3, 34, 10, 0x142c35, .24).setDepth(depth));
      attach(container, scene.add.image(centerX, feetY, sprite).setOrigin(.5, .94)
        .setDisplaySize(88, 88).setDepth(depth + 22).setName('special-pokemon-sprite'));
      attach(container, scene.add.text(centerX, feetY - 88, item.name, {
        fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#fff8dd',
        stroke: '#153746', strokeThickness: 3, resolution: 4,
      }).setOrigin(.5, 1).setDepth(depth + 23));
      break;
    }
    case 'sign':
      renderSign(scene, container, item, depth, imageKeys, imageAtlases);
      break;
    case 'mill-wheel':
      renderMillWheel(scene, container, item);
      break;
    case 'rock':
      if (item.properties.questEvent === 'event/forest_signal/read') renderSensor(scene, container, item, depth, imageKeys, imageAtlases);
      else if (propString(item.properties, 'sprite')) renderAtlasProp(scene, container, item, depth, imageKeys, imageAtlases, 1);
      else renderRock(scene, container, x, y, depth);
      break;
    case 'pickup':
      if (propString(item.properties, 'sprite')) renderAtlasProp(scene, container, item, depth, imageKeys, imageAtlases, 2, true);
      else renderPickup(scene, container, item);
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
function atlasFrame(scene: Phaser.Scene, key: string, atlases: ReadonlyMap<string, { columns: number; rows: number }>, index: number): string | undefined {
  const atlas = atlases.get(key);
  if (!atlas) {
    if (index === 0) return undefined;
    throw new Error('Image ' + key + ' does not declare an atlas for frame ' + index + '.');
  }
  const { columns, rows } = atlas;
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 1 || rows < 1 ||
      !Number.isInteger(index) || index < 0 || index >= columns * rows) {
    throw new Error('Atlas ' + key + ' has an invalid frame ' + index + '.');
  }
  const texture = scene.textures.get(key);
  texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  const source = texture.getSourceImage() as HTMLImageElement;
  if (source.width % columns !== 0 || source.height % rows !== 0) {
    throw new Error('Atlas ' + key + ' dimensions do not divide evenly into its cell grid.');
  }
  const frame = 'cell-' + index;
  if (!texture.has(frame)) texture.add(frame, 0, index % columns * source.width / columns, Math.floor(index / columns) * source.height / rows, source.width / columns, source.height / rows);
  return frame;
}

function renderNpc(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable, imageKeys: ReadonlySet<string>, imageAtlases: ReadonlyMap<string, { columns: number; rows: number }>): void {
  const x = item.x + item.width / 2, y = item.y + item.height / 2;
  const sprite = propString(item.properties, 'sprite');
  if (!sprite) throw new Error('NPC ' + item.id + ' must declare a character sprite.');
  requireImageAsset(imageKeys, sprite, item);
  const frame = propNumber(item.properties, 'spriteFrame') ?? 0;
  const views = npcIdleViews(item.properties.characterAppearanceId);
  if (views) for (const view of Object.values(views)) requireImageAsset(imageKeys, view.assetKey, item);
  if (views) prepareNpcIdleTextures(scene, views);
  const origin = views?.down.origin ?? npcSpriteOrigin(item.properties);
  attach(container, scene.add.ellipse(x, y + 14, 21, 7, 0x142c35, .22).setDepth(y + 10));
  const image = scene.add.image(x, y + 19, sprite, atlasFrame(scene, sprite, imageAtlases, frame))
    .setOrigin(origin.x, origin.y).setDisplaySize(60, 60).setDepth(y + 22)
    .setName('npc-sprite').setData('npcId', item.properties.npcId).setData('appearanceId', item.properties.characterAppearanceId)
    .setData('directionalIdle', Boolean(views)).setData('npcFacing', views ? 'down' : undefined);
  if (views) applyNpcIdleView(image, views.down);
  attach(container, image);
  attach(container, scene.add.text(x, y - 43, item.name, {
    fontFamily: 'system-ui, sans-serif', fontSize: '8px', fontStyle: 'bold', color: '#effcff', stroke: '#153746', strokeThickness: 2, resolution: 4,
  }).setOrigin(.5).setDepth(y + 23));
}

/** A recognisable field instrument instead of the old generic rock placeholder. */
function renderSensor(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable, depth: number, imageKeys: ReadonlySet<string>, imageAtlases: ReadonlyMap<string, { columns: number; rows: number }>): void {
  if (propString(item.properties, 'sprite')) {
    renderAtlasProp(scene, container, item, depth, imageKeys, imageAtlases, 3);
    return;
  }
  const x = item.x, y = item.y;
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

function renderSign(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable, depth: number, imageKeys: ReadonlySet<string>, imageAtlases: ReadonlyMap<string, { columns: number; rows: number }>): void {
  if (propString(item.properties, 'sprite')) {
    renderAtlasProp(scene, container, item, depth, imageKeys, imageAtlases, 0);
    return;
  }
  const x = item.x, y = item.y;
  const g = attach(container, scene.add.graphics().setDepth(depth));
  g.fillStyle(0x3d4d3c).fillRect(x + 12, y + 15, 9, 19);
  g.fillStyle(0x795b3d).fillRect(x + 4, y + 4, 24, 17);
  g.fillStyle(0xd2bd8a).fillRect(x + 7, y + 8, 18, 2);
}

/** Render a Tiled object from an atlas declared by its map metadata. */
function renderAtlasProp(scene: Phaser.Scene, container: Phaser.GameObjects.Container, item: MapInteractable, depth: number,
  imageKeys: ReadonlySet<string>, imageAtlases: ReadonlyMap<string, { columns: number; rows: number }>, fallbackFrame: number, showLabel = false): void {
  const sprite = propString(item.properties, 'sprite');
  if (!sprite) throw new Error(`Illustrated object ${item.id} must declare a sprite key.`);
  requireImageAsset(imageKeys, sprite, item);
  const frame = atlasFrame(scene, sprite, imageAtlases, propNumber(item.properties, 'spriteFrame') ?? fallbackFrame);
  const sizes: Record<number, [number, number]> = { 0: [58, 70], 1: [58, 48], 2: [42, 54], 3: [58, 66] };
  const [width, height] = sizes[propNumber(item.properties, 'spriteFrame') ?? fallbackFrame] ?? [item.width, item.height];
  const x = item.x + item.width / 2, y = item.y + item.height;
  attach(container, scene.add.image(x, y, sprite, frame).setOrigin(.5, 1).setDisplaySize(width, height).setDepth(depth + 2));
  if (showLabel) attach(container, scene.add.text(x, item.y - 3, item.name.toUpperCase(), {
    fontFamily: 'monospace', fontSize: '7px', color: '#fff0d3', stroke: '#26372c', strokeThickness: 3,
  }).setOrigin(.5, 1).setDepth(depth + 3));
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
