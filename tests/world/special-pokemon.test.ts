import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import specials from '../../content/encounters/special-pokemon.v1.json' with { type: 'json' };
import { specialEncounterAvailability } from '../../src/core/encounters/special-encounter.ts';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';
import { applyQuestEvent } from '../../src/core/quests/apply-quest-event.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const maps = readdirSync('content/maps').filter(file => file.endsWith('.map.json')).map(file => read(`content/maps/${file}`));
const quests = readdirSync('content/quests').filter(file => file.endsWith('.quest.json')).map(file => read(`content/quests/${file}`));
const authoredFlags = quests.flatMap(quest => quest.steps.map((step: any) => step.setFlag));
for (const encounter of specials.encounters) {
  test(`${encounter.id} is visible, approachable, retryable and only settled on capture`, () => {
    assert.equal(specialEncounterAvailability(encounter, encounter.mapId, [], true), 'locked');
    assert.equal(specialEncounterAvailability(encounter, encounter.mapId, [encounter.requiredFlag], false), 'exhausted');
    assert.equal(specialEncounterAvailability(encounter, encounter.mapId, [encounter.requiredFlag], true), 'available');
    const map = maps.find(map => map.id === encounter.mapId)!;
    const tiled = read(`public/${map.tiledAsset}`);
    const object = tiled.layers.flatMap((layer: any) => layer.objects ?? []).find((obj: any) =>
      obj.properties?.some((prop: any) => prop.name === 'specialEncounterId' && prop.value === encounter.id));
    assert.ok(object);
    const properties = Object.fromEntries(object.properties.map((prop: any) => [prop.name, prop.value]));
    assert.equal(properties.visibleWhenFlag, encounter.requiredFlag);
    assert.equal(properties.collectedFlag, encounter.capturedFlag);
    assert.ok(map.renderAssets.some((asset: any) => asset.key === properties.sprite));
    const collisions = tiled.layers.find((layer: any) => layer.name === 'collision').objects;
    const tile = `${encounter.x},${encounter.y}`;
    assert.equal(collectMapCollision(collisions, tiled.width, tiled.height, []).has(tile), false, 'invisible Pokémon has no invisible wall');
    assert.equal(collectMapCollision(collisions, tiled.width, tiled.height, [encounter.requiredFlag]).has(tile), true);
    assert.equal(collectMapCollision(collisions, tiled.width, tiled.height, [encounter.requiredFlag, encounter.capturedFlag]).has(tile), false);
    const flags = authoredFlags.filter((flag: string) => flag !== encounter.capturedFlag);
    const blocked = collectMapCollision(collisions, tiled.width, tiled.height, flags);
    const spawn = map.spawns[0];
    const queue = [{ x: spawn.x, y: spawn.y }], seen = new Set([`${spawn.x},${spawn.y}`]);
    for (let index = 0; index < queue.length; index++) {
      const point = queue[index];
      for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const x = point.x + dx, y = point.y + dy, key = `${x},${y}`;
        if (x < 0 || y < 0 || x >= tiled.width || y >= tiled.height || blocked.has(key) || seen.has(key)) continue;
        seen.add(key); queue.push({ x, y });
      }
    }
    assert.ok([[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dx, dy]) => seen.has(`${encounter.x + dx},${encounter.y + dy}`)), 'reachable adjacent interaction tile');
    const fixture = { flags: [encounter.requiredFlag], player: { money: 0 }, inventory: {}, badges: [] } as unknown as GameSave;
    assert.equal(applyQuestEvent(fixture, `special/${encounter.id}/knocked-out`, quests).progressed, false);
    const capture = applyQuestEvent(fixture, encounter.captureEvent, quests);
    assert.ok(capture.save.flags.includes(encounter.capturedFlag));
    assert.equal(specialEncounterAvailability(encounter, encounter.mapId, capture.save.flags, true), 'caught');
    assert.equal(applyQuestEvent(capture.save, encounter.captureEvent, quests).progressed, false);
  });
}
