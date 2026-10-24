import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { npcSpriteOrigin } from '../../src/game/rendering/npc-sprite-origin.ts';

const read = (path: string) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const catalog = read('content/characters/appearances.v1.json');
const maps = readdirSync(new URL('../../content/maps/', import.meta.url)).filter(file => file.endsWith('.map.json')).map(file => read(`content/maps/${file}`));

for (const profile of catalog.profiles) {
  test(`all appearances of ${profile.id} retain the same authored identity and foot anchor`, () => {
    const found: string[] = [];
    for (const map of maps) {
      const tiled = read(`public/${map.tiledAsset}`);
      for (const layer of tiled.layers) for (const object of layer.objects ?? []) {
        const props = Object.fromEntries((object.properties ?? []).map((p: any) => [p.name, p.value]));
        if (!profile.npcIds.includes(props.npcId)) continue;
        found.push(props.npcId);
        assert.equal(props.characterAppearanceId, profile.id);
        assert.equal(props.sprite, catalog.atlas.key);
        assert.equal(props.spriteFrame, profile.frame);
        assert.deepEqual(npcSpriteOrigin(props), profile.origin);
        assert.ok(profile.dialogueIds.includes(props.dialogueId));
        assert.ok(read('content/dialogue/world.v1.json')[props.dialogueId]);
        assert.deepEqual(map.renderAssets.find((asset: any) => asset.key === catalog.atlas.key), {
          kind: 'image', key: catalog.atlas.key, path: catalog.atlas.path,
          atlas: { columns: catalog.atlas.columns, rows: catalog.atlas.rows },
        });
      }
    }
    assert.deepEqual(found.sort(), [...profile.npcIds].sort());
  });
}

test('main identities use distinct portraits and the narrative explicitly identifies professor Elia', () => {
  assert.equal(new Set(catalog.profiles.map((profile: any) => profile.frame)).size, catalog.profiles.length);
  assert.match(read('content/dialogue/world.v1.json').prof_elia.speaker, /Professoressa/);
});

test('foot anchors preserve legacy defaults and reject malformed custom origins', () => {
  assert.deepEqual(npcSpriteOrigin({}), { x: .5, y: 1 });
  for (const properties of [{ spriteOriginX: .5 }, { spriteOriginX: -1, spriteOriginY: 1 }, { spriteOriginX: .5, spriteOriginY: NaN }]) {
    assert.throws(() => npcSpriteOrigin(properties), /explicit pair/);
  }
});
