import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')) as T;
const catalog = read<any>('content/characters/appearances.v2.json');
const cases = [
  { map: 'league_forecourt', npcId: 'league_reception', profileId: 'league-receptionist', frame: 0 },
  { map: 'petalora', npcId: 'petalora_ivo', profileId: 'petalora-custodian-ivo', frame: 1 },
  { map: 'r16_cammino_equilibrio', npcId: 'r16_maia', profileId: 'route-trainer-maia-r16', frame: 2 },
  { map: 'r16_cammino_equilibrio', npcId: 'r16_tobia', profileId: 'route-trainer-tobia-r16', frame: 3 },
] as const;

for (const entry of cases) {
  test(`${entry.npcId} has matching Tiled identity, frame, MapDefinition asset, and foot origin`, () => {
    const profile = catalog.profiles.find((item: any) => item.id === entry.profileId);
    assert.ok(profile);
    assert.deepEqual(profile.npcIds, [entry.npcId]);
    assert.equal(profile.frame, entry.frame);
    const asset = catalog.assets.find((item: any) => item.key === profile.assetKey);
    assert.ok(asset);
    assert.deepEqual(asset.atlas, { columns: 2, rows: 2 });

    const map = read<any>(`content/maps/${entry.map}.map.json`);
    assert.deepEqual(map.renderAssets.find((item: any) => item.key === asset.key), asset);
    const tiled = read<any>(`public/tilemaps/${entry.map}.tmj`);
    const objects = tiled.layers.flatMap((layer: any) => layer.objects ?? []);
    const matches = objects.filter((object: any) => object.properties?.some((property: any) =>
      property.name === 'npcId' && property.value === entry.npcId));
    assert.equal(matches.length, 1);
    const props = Object.fromEntries(matches[0].properties.map((property: any) => [property.name, property.value]));
    assert.equal(props.characterAppearanceId, profile.id);
    assert.equal(props.sprite, profile.assetKey);
    assert.equal(props.spriteFrame, profile.frame);
    assert.deepEqual({ x: props.spriteOriginX, y: props.spriteOriginY }, profile.origin);
    assert.ok(profile.dialogueIds.includes(props.dialogueId));
  });
}

test('Petalora Custodian Ivo is not Ferraluce Ivo', () => {
  const petaloraIvo = catalog.profiles.find((profile: any) => profile.id === 'petalora-custodian-ivo');
  const ferraluceIvo = catalog.profiles.find((profile: any) => profile.id === 'ferraluce-ivo');
  assert.ok(petaloraIvo && ferraluceIvo);
  assert.notEqual(petaloraIvo.id, ferraluceIvo.id);
  assert.ok(!petaloraIvo.npcIds.some((npcId: string) => ferraluceIvo.npcIds.includes(npcId)));
});
