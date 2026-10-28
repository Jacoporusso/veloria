import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { npcSpriteOrigin } from '../../src/game/rendering/npc-sprite-origin.ts';
import { validateNpcIdleViews } from '../../src/core/world/npc-idle-views.ts';
import { validateNpcWalkCycle } from '../../src/core/world/npc-animation.ts';
import { createHash } from 'node:crypto';

const read = (path: string) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const catalog = read('content/characters/appearances.v2.json');
const assetByKey = new Map(catalog.assets.map((asset: any) => [asset.key, asset]));
const maps = readdirSync(new URL('../../content/maps/', import.meta.url)).filter(file => file.endsWith('.map.json')).map(file => read(`content/maps/${file}`));

for (const profile of catalog.profiles) {
  test(`all appearances of ${profile.id} retain the same authored identity and foot anchor`, () => {
    const asset: any = assetByKey.get(profile.assetKey);
    assert.ok(asset, `profile ${profile.id} references missing asset ${profile.assetKey}`);
    const found: string[] = [];
    for (const map of maps) {
      const tiled = read(`public/${map.tiledAsset}`);
      for (const layer of tiled.layers) for (const object of layer.objects ?? []) {
        const props = Object.fromEntries((object.properties ?? []).map((p: any) => [p.name, p.value]));
        if (!profile.npcIds.includes(props.npcId)) continue;
        found.push(props.npcId);
        assert.equal(props.characterAppearanceId, profile.id);
        assert.equal(props.sprite, asset.key);
        assert.equal(props.spriteFrame, profile.frame);
        assert.deepEqual(npcSpriteOrigin(props), profile.origin);
        assert.ok(profile.dialogueIds.includes(props.dialogueId));
        assert.ok(read('content/dialogue/world.v1.json')[props.dialogueId]);
        const mapAsset = map.renderAssets.find((candidate: any) => candidate.key === asset.key);
        assert.deepEqual(mapAsset, asset);
        if (profile.idleViews) {
          const views = validateNpcIdleViews(profile.idleViews, new Set(catalog.assets.map((entry: any) => entry.key)));
          assert.equal(profile.assetKey, views.down.assetKey);
          assert.deepEqual(profile.origin, views.down.origin);
          for (const view of Object.values(views)) {
            assert.deepEqual(map.renderAssets.find((entry: any) => entry.key === view.assetKey), assetByKey.get(view.assetKey),
              `map ${map.id} must load every idle direction of ${profile.id}`);
          }
          if (profile.walkCycle) {
            const cycle = validateNpcWalkCycle(profile.walkCycle, new Set(catalog.assets.map((entry: any) => entry.key)), views);
            for (const frames of Object.values(cycle.views)) for (const pose of frames) {
              assert.deepEqual(map.renderAssets.find((entry: any) => entry.key === pose.assetKey), assetByKey.get(pose.assetKey),
                `map ${map.id} must load every walk frame of ${profile.id}`);
            }
          }
        }
      }
    }
    assert.deepEqual(found.sort(), [...profile.npcIds].sort());
  });
}

test('profile asset references exist and asset/frame identity pairs are unique', () => {
  assert.equal(assetByKey.size, catalog.assets.length, 'catalog asset keys must be unique');
  for (const asset of catalog.assets) {
    assert.equal(asset.kind, 'image');
    assert.ok(existsSync(new URL(`../../public/${asset.path}`, import.meta.url)), `asset file is missing: public/${asset.path}`);
    if (asset.atlas) assert.ok(asset.atlas.columns > 0 && asset.atlas.rows > 0, `asset ${asset.key} has an invalid atlas grid`);
  }
  const seenPairs = new Set<string>();
  for (const profile of catalog.profiles) {
    const asset: any = assetByKey.get(profile.assetKey);
    assert.ok(asset, `profile ${profile.id} references missing asset ${profile.assetKey}`);
    assert.equal(asset.kind, 'image');
    if (asset.atlas) {
      assert.ok(Number.isInteger(profile.frame), `atlas profile ${profile.id} needs a frame`);
      assert.ok(profile.frame >= 0 && profile.frame < asset.atlas.columns * asset.atlas.rows);
    }
    const pair = `${profile.assetKey}:${profile.frame ?? 'single'}`;
    assert.ok(!seenPairs.has(pair), `duplicate profile asset/frame pair ${pair}`);
    seenPairs.add(pair);
  }
  for (const study of catalog.unboundStudies) {
    const asset: any = assetByKey.get(study.assetKey);
    assert.ok(asset, `unbound study references missing asset ${study.assetKey}`);
    if (asset.atlas) assert.ok(Number.isInteger(study.frame) && study.frame >= 0 && study.frame < asset.atlas.columns * asset.atlas.rows);
  }
});

test('directional idle artwork has intact source/runtime provenance and calibrated catalog bindings', () => {
  const provenance = read('assets/npc-idle-views-v1.json');
  const declared = catalog.profiles.filter((profile: any) => profile.idleViews);
  assert.deepEqual(provenance.profiles.map((entry: any) => entry.profileId).sort(), declared.map((profile: any) => profile.id).sort());
  for (const entry of provenance.profiles) {
    const profile = declared.find((candidate: any) => candidate.id === entry.profileId);
    assert.equal(entry.views.length, 4);
    assert.equal(new Set(entry.views.map((view: any) => view.direction)).size, 4);
    for (const view of entry.views) {
      assert.deepEqual(profile.idleViews[view.direction], { assetKey: view.assetKey, origin: view.origin, displaySize: view.displaySize });
      const asset: any = assetByKey.get(view.assetKey);
      assert.equal(`public/${asset.path}`, view.runtimePath);
      for (const kind of ['source', 'runtime']) {
        const bytes = readFileSync(new URL(`../../${view[`${kind}Path`]}`, import.meta.url));
        assert.equal(createHash('sha256').update(bytes).digest('hex'), view[`${kind}Sha256`]);
      }
      const png = readFileSync(new URL(`../../${view.sourcePath}`, import.meta.url));
      assert.equal(png.readUInt32BE(16), view.width);
      assert.equal(png.readUInt32BE(20), view.height);
    }
  }
});

test('walk artwork has independent intact sources and calibrated bindings for every declared frame', () => {
  const provenance = read('assets/npc-walk-cycles-v1.json');
  const declared = catalog.profiles.filter((profile: any) => profile.walkCycle);
  assert.deepEqual(provenance.profiles.map((entry: any) => entry.profileId).sort(), declared.map((profile: any) => profile.id).sort());
  for (const entry of provenance.profiles) {
    const profile = declared.find((candidate: any) => candidate.id === entry.profileId);
    const idle = validateNpcIdleViews(profile.idleViews, new Set(assetByKey.keys()) as Set<string>);
    const cycle = validateNpcWalkCycle(profile.walkCycle, new Set(assetByKey.keys()) as Set<string>, idle);
    assert.equal(entry.frameDurationMs, cycle.frameDurationMs);
    assert.equal(entry.frames.length, Object.values(cycle.views).flat().length);
    assert.equal(new Set(entry.frames.map((frame: any) => frame.sourceSha256)).size, entry.frames.length);
    assert.equal(new Set(entry.frames.map((frame: any) => frame.assetKey)).size, entry.frames.length);
    for (const frame of entry.frames) {
      const pose = cycle.views[frame.direction as keyof typeof cycle.views][frame.frameIndex];
      assert.deepEqual(pose, { assetKey: frame.assetKey, origin: frame.origin, displaySize: frame.displaySize });
      assert.equal(`public/${(assetByKey.get(frame.assetKey) as any).path}`, frame.runtimePath);
      for (const kind of ['source', 'runtime']) {
        const bytes = readFileSync(new URL(`../../${frame[`${kind}Path`]}`, import.meta.url));
        assert.equal(createHash('sha256').update(bytes).digest('hex'), frame[`${kind}Sha256`]);
      }
      const png = readFileSync(new URL(`../../${frame.sourcePath}`, import.meta.url));
      assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [frame.width, frame.height]);
    }
  }
});

test('opening route, terrace guide and Champion keep their separate NPC identities', () => {
  const expected = [
    ['route-trainer-sera', 'trainer_route01_a', 'sera_route01', 0],
    ['route-trainer-timo', 'trainer_route01_b', 'timo_route01', 1],
    ['guide-rami-r03', 'r03_path_guide', 'r03_path_guide', 2],
    ['league-champion-enea', 'league_champion', 'league_champion', 3],
  ] as const;
  const ids = new Set<string>();
  for (const [profileId, npcId, dialogueId, frame] of expected) {
    const profile = catalog.profiles.find((candidate: any) => candidate.id === profileId);
    assert.ok(profile, `missing profile ${profileId}`);
    assert.deepEqual(profile.npcIds, [npcId]);
    assert.deepEqual(profile.dialogueIds, [dialogueId]);
    if (profileId === 'route-trainer-sera') {
      assert.equal(profile.assetKey, 'veloria-sera-idle-south-v1');
      assert.equal(profile.frame, undefined);
      assert.equal(new Set(Object.values(profile.idleViews).map((view: any) => view.assetKey)).size, 4);
    } else {
      assert.equal(profile.assetKey, 'veloria-cast-opening-and-champion-v1');
      assert.equal(profile.frame, frame);
    }
    assert.ok(!ids.has(npcId), `NPC identity ${npcId} is reused`);
    ids.add(npcId);
  }
  assert.equal(catalog.profiles.find((candidate: any) => candidate.id === 'guide-rami-r03')?.npcIds.includes('r03_path_guide'), true);
  assert.equal(catalog.profiles.find((candidate: any) => candidate.id === 'guide-rami-r03')?.npcIds.includes('ivo'), false);
  assert.equal(catalog.profiles.find((candidate: any) => candidate.id === 'guide-rami-r03')?.npcIds.includes('oren'), false);
});

test('the narrative explicitly identifies professor Elia', () => {
  assert.match(read('content/dialogue/world.v1.json').prof_elia.speaker, /Professoressa/);
});

test('foot anchors preserve legacy defaults and reject malformed custom origins', () => {
  assert.deepEqual(npcSpriteOrigin({}), { x: .5, y: 1 });
  for (const properties of [{ spriteOriginX: .5 }, { spriteOriginX: -1, spriteOriginY: 1 }, { spriteOriginX: .5, spriteOriginY: NaN }]) {
    assert.throws(() => npcSpriteOrigin(properties), /explicit pair/);
  }
});
