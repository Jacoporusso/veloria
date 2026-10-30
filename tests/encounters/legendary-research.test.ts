import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { applyQuestEvent, type QuestDefinition } from '../../src/core/quests/apply-quest-event.ts';
import {
  chooseResearchSymbol,
  legendaryResearchState,
  validateLegendaryResearchDefinition,
  type LegendaryResearchDefinition,
} from '../../src/core/encounters/legendary-research.ts';
import {
  specialEncounterAvailability,
  specialEncounterDiscoveryState,
  type SpecialEncounter,
} from '../../src/core/encounters/special-encounter.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';
import researchData from '../../content/encounters/legendary-research.v1.json' with { type: 'json' };
import specialData from '../../content/encounters/special-pokemon.v1.json' with { type: 'json' };
import { legendaryResearchCatalog, legendaryResearchForEncounter, getLegendaryResearch } from '../../src/game/maps/legendary-research-registry.ts';
import type { QuestDefinition as AuthoredQuestDefinition } from '../../src/core/quests/apply-quest-event.ts';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const tiledProperties = (object: any) => Object.fromEntries((object.properties ?? []).map((property: any) => [property.name, property.value]));

function overlaps(a: any, b: any): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function tileRange(object: any, tilewidth: number, tileheight: number) {
  return {
    left: Math.floor(object.x / tilewidth),
    right: Math.ceil((object.x + object.width) / tilewidth) - 1,
    top: Math.floor(object.y / tileheight),
    bottom: Math.ceil((object.y + object.height) / tileheight) - 1,
  };
}

function manhattanGap(a: any, b: any, tilewidth: number, tileheight: number): number {
  const first = tileRange(a, tilewidth, tileheight), second = tileRange(b, tilewidth, tileheight);
  const dx = first.right < second.left ? second.left - first.right : second.right < first.left ? first.left - second.right : 0;
  const dy = first.bottom < second.top ? second.top - first.bottom : second.bottom < first.top ? first.top - second.bottom : 0;
  return dx + dy;
}

const definition: LegendaryResearchDefinition = {
  id: 'ice-bird-research',
  encounterId: 'special-articuno',
  questId: 'research-articuno',
  requiredFlag: 'league_complete',
  revealedFlag: 'research_articuno_revealed',
  capturedFlag: 'pokemon_caught_144',
  regionHint: 'Una zona fredda della regione',
  clues: [
    { id: 'wind', mapId: 'ice-pass', title: 'Correnti fredde', text: 'Osserva il vento.', event: 'research/articuno/wind', flag: 'research_articuno_clue_wind' },
    { id: 'shore', mapId: 'north-coast', title: 'Riva gelida', text: 'Segui il ghiaccio.', event: 'research/articuno/shore', flag: 'research_articuno_clue_shore' },
  ],
  puzzle: {
    mapId: 'ice-pass', title: 'Allinea i simboli', hint: 'Segui l’ordine degli indizi.',
    options: [{ id: 'north', label: 'Nord' }, { id: 'east', label: 'Est' }, { id: 'south', label: 'Sud' }],
    solution: ['east', 'north', 'south'], event: 'research/articuno/solve',
    progressFlagPrefix: 'research_articuno_symbol_',
  },
};

function quest(): QuestDefinition {
  return {
    id: definition.questId,
    steps: [
      ...definition.clues.map(clue => ({ trigger: clue.event, setFlag: clue.flag, requiresFlags: [] })),
      { trigger: definition.puzzle.event, setFlag: definition.revealedFlag, requiresFlags: [definition.requiredFlag, ...definition.clues.map(clue => clue.flag)] },
    ],
    completionFlag: definition.revealedFlag,
    reward: { money: 400 },
  };
}

function save(flags: string[]): GameSave {
  return {
    schemaVersion: 2, contentVersion: 'test', saveId: 'test', saveRevision: 0, savedAt: 'test',
    player: { name: 'Test', mapId: 'ice-pass', spawnPointId: 'spawn', money: 0, x: 0, y: 0 },
    party: [], storage: [], flags, badges: [], inventory: {}, rngState: 1,
  };
}

test('clue flags are observed in any order and captured records remain separate', () => {
  const allCluesFirst = [definition.clues[1]!.flag, definition.clues[0]!.flag];
  assert.deepEqual(legendaryResearchState(definition, [definition.capturedFlag]), {
    status: 'locked', foundClueIds: [], progress: 0, captured: true,
  });
  const state = legendaryResearchState(definition, [definition.requiredFlag, definition.capturedFlag, ...allCluesFirst]);
  assert.equal(state.status, 'ready');
  assert.deepEqual(state.foundClueIds, ['wind', 'shore']);
  assert.equal(state.captured, true);
  assert.equal(legendaryResearchState(definition, [...allCluesFirst, definition.revealedFlag]).status, 'revealed');
});

test('clue quest events write flags and can be completed in either order', () => {
  let current = save([]);
  const quests = [quest()];
  const second = applyQuestEvent(current, definition.clues[1]!.event, quests);
  assert.equal(second.progressed, true);
  current = second.save;
  current = applyQuestEvent(current, definition.clues[0]!.event, quests).save;
  assert.deepEqual(legendaryResearchState(definition, current.flags).foundClueIds, ['wind', 'shore']);
  assert.equal(applyQuestEvent(current, definition.clues[0]!.event, quests).progressed, false);
});

test('puzzle is gated by league completion and all clues, then tracks partial progress across reload', () => {
  const noGate = chooseResearchSymbol(definition, definition.clues.map(clue => clue.flag), 'east');
  assert.equal(noGate.outcome, 'locked');
  const noClues = chooseResearchSymbol(definition, [definition.requiredFlag], 'east');
  assert.equal(noClues.outcome, 'cluesMissing');
  const readyFlags = [definition.requiredFlag, ...definition.clues.map(clue => clue.flag), 'story_unrelated'];
  const first = chooseResearchSymbol(definition, readyFlags, 'east');
  assert.equal(first.outcome, 'progress');
  assert.equal(first.progress, 1);
  assert.ok(first.flags.includes('story_unrelated'));
  assert.ok(first.flags.some(flag => flag.startsWith(definition.puzzle.progressFlagPrefix)));
  const reloaded = legendaryResearchState(definition, first.flags);
  assert.equal(reloaded.progress, 1);
  const second = chooseResearchSymbol(definition, first.flags, 'north');
  assert.equal(second.outcome, 'progress');
  assert.equal(second.progress, 2);
});

test('wrong selection resets only this puzzle progress; correct sequence emits the quest event once settled', () => {
  const ready = [definition.requiredFlag, ...definition.clues.map(clue => clue.flag), 'story_keep'];
  const step = chooseResearchSymbol(definition, ready, 'east');
  const wrong = chooseResearchSymbol(definition, step.flags, 'south');
  assert.equal(wrong.outcome, 'wrong');
  assert.equal(wrong.progress, 0);
  assert.ok(wrong.flags.includes('story_keep'));
  assert.ok(!wrong.flags.some(flag => flag.startsWith(definition.puzzle.progressFlagPrefix)));

  const first = chooseResearchSymbol(definition, wrong.flags, 'east');
  const second = chooseResearchSymbol(definition, first.flags, 'north');
  const solved = chooseResearchSymbol(definition, second.flags, 'south');
  assert.equal(solved.outcome, 'solved');
  assert.equal(solved.event, definition.puzzle.event);
  assert.ok(!solved.flags.some(flag => flag.startsWith(definition.puzzle.progressFlagPrefix)));
  const completed = applyQuestEvent(save(solved.flags), solved.event!, [quest()]);
  assert.equal(completed.save.player.money, 400);
  assert.ok(completed.save.flags.includes(definition.revealedFlag));
  const repeat = chooseResearchSymbol(definition, completed.save.flags, 'east');
  assert.equal(repeat.outcome, 'alreadySolved');
  assert.equal(applyQuestEvent(completed.save, definition.puzzle.event, [quest()]).save.player.money, 400);
});

test('repeated arbitrary inputs keep puzzle progress flags bounded', () => {
  const ready = [definition.requiredFlag, ...definition.clues.map(clue => clue.flag)];
  let flags = ready;
  for (let index = 0; index < 500; index++) {
    const result = chooseResearchSymbol(definition, flags, index % 3 === 0 ? 'east' : 'unknown');
    flags = result.flags;
    assert.ok(flags.filter(flag => flag.startsWith(definition.puzzle.progressFlagPrefix)).length <= definition.puzzle.solution.length);
  }
});

test('each symbol input canonicalizes only its own bounded progress prefix', () => {
  const malformed = [
    definition.requiredFlag,
    ...definition.clues.map(clue => clue.flag),
    'unrelated_save_flag',
    ...Array.from({ length: 30 }, (_, index) => `${definition.puzzle.progressFlagPrefix}junk_${index}`),
  ];
  const result = chooseResearchSymbol(definition, malformed, 'east');
  assert.equal(result.outcome, 'progress');
  assert.equal(result.flags.filter(flag => flag.startsWith(definition.puzzle.progressFlagPrefix)).length, 1);
  assert.ok(result.flags.includes('unrelated_save_flag'));
});

test('definition validation rejects duplicate flags, duplicate options, and unknown solution symbols', () => {
  assert.throws(() => validateLegendaryResearchDefinition({ ...definition, revealedFlag: definition.requiredFlag }), /unique/);
  assert.throws(() => validateLegendaryResearchDefinition({
    ...definition, puzzle: { ...definition.puzzle, options: [...definition.puzzle.options, { id: 'north', label: 'Another north' }] },
  }), /unique/);
  assert.throws(() => validateLegendaryResearchDefinition({
    ...definition, puzzle: { ...definition.puzzle, solution: ['not_an_option'] },
  }), /declared option/);
});

test('authored research catalog and quest events are internally consistent', async () => {
  const authored = researchData.researches;
  assert.equal(Object.keys(legendaryResearchCatalog).length, authored.length);
  const specialById = new Map(specialData.encounters.map(encounter => [encounter.id, encounter]));
  const questUrls = authored.map(research => new URL(`../../content/quests/${research.id.split('/').at(-1)}.quest.json`, import.meta.url));
  for (const research of authored) {
    validateLegendaryResearchDefinition(research);
    assert.equal(getLegendaryResearch(research.id)?.encounterId, research.encounterId);
    assert.equal(legendaryResearchForEncounter(research.encounterId)?.id, research.id);
    const special = specialById.get(research.encounterId);
    assert.ok(special, `missing special encounter ${research.encounterId}`);
    assert.equal(research.capturedFlag, special.capturedFlag);
  }
  const quests = await Promise.all(questUrls.map(async url => (await import(url.href, { with: { type: 'json' } })).default as AuthoredQuestDefinition));
  for (const research of authored) {
    const quest = quests.find(candidate => candidate.id === research.questId);
    assert.ok(quest, `missing quest ${research.questId}`);
    for (const clue of research.clues) {
      assert.ok(quest.steps.some(step => step.trigger === clue.event && step.setFlag === clue.flag), clue.id);
    }
    const reveal = quest.steps.find(step => step.trigger === research.puzzle.event);
    assert.equal(reveal?.setFlag, research.revealedFlag);
    assert.ok(reveal?.requiresFlags.includes(research.requiredFlag));
    for (const clue of research.clues) assert.ok(reveal?.requiresFlags.includes(clue.flag), clue.id);
    assert.equal(quest.completionFlag, research.revealedFlag);
    assert.ok((quest.reward?.money ?? 0) > 0);
  }
});

test('all 17 authored research markers are wired, separated from boss and clear of interactive solids', async () => {
  const allMarkers: Array<{ object: any; tiled: any; researchId: string }> = [];
  for (const research of researchData.researches) {
    const mapSlug = research.puzzle.mapId.split('/').at(-1)!;
    const metadata = readJson(`content/maps/${mapSlug}.map.json`);
    assert.equal(metadata.id, research.puzzle.mapId);
    const tiled = readJson(`public/${metadata.tiledAsset}`);
    const interactionObjects = tiled.layers.find((layer: any) => layer.name === 'interactions')?.objects ?? [];
    const collisionObjects = tiled.layers.find((layer: any) => layer.name === 'collision')?.objects ?? [];
    const researchObjects = interactionObjects.filter((object: any) => tiledProperties(object).researchId === research.id);
    assert.equal(researchObjects.length, research.clues.length + 1, research.id);
    const special = specialData.encounters.find(encounter => encounter.id === research.encounterId)!;
    const boss = interactionObjects.find((object: any) => tiledProperties(object).specialEncounterId === research.encounterId);
    assert.ok(boss, `${research.id} boss object exists`);
    const bossRect = { x: boss.x, y: boss.y, width: boss.width, height: boss.height };

    for (const clue of research.clues) {
      const object = researchObjects.find((item: any) => tiledProperties(item).researchClueId === clue.id);
      assert.ok(object, `${research.id}/${clue.id} object exists`);
      const properties = tiledProperties(object);
      assert.equal(object.name, clue.title);
      assert.equal(properties.kind, 'research-clue');
      assert.equal(properties.questEvent, clue.event);
      assert.equal(properties.activatedFlag, clue.flag);
      assert.equal(properties.researchId, research.id);
      assert.equal(clue.mapId, research.puzzle.mapId);
      allMarkers.push({ object, tiled, researchId: research.id });
    }
    const puzzle = researchObjects.find((item: any) => !tiledProperties(item).researchClueId);
    assert.ok(puzzle, `${research.id} puzzle object exists`);
    const puzzleProperties = tiledProperties(puzzle);
    assert.equal(puzzleProperties.kind, 'research-puzzle');
    assert.equal(puzzleProperties.questEvent, research.puzzle.event);
    assert.equal(puzzleProperties.activatedFlag, research.revealedFlag);
    assert.equal(puzzleProperties.collectedFlag, research.revealedFlag);
    assert.ok(manhattanGap(puzzle, bossRect, tiled.tilewidth, tiled.tileheight) >= 3,
      `${research.id} puzzle is at least 3 tiles Manhattan from its boss`);
    allMarkers.push({ object: puzzle, tiled, researchId: research.id });

    const specialProperties = tiledProperties(boss);
    assert.equal(specialProperties.visibleWhenFlag, research.revealedFlag);
    assert.equal(specialProperties.collectedFlag, special.capturedFlag);
    const specialGate = collisionObjects.find((object: any) => object.x === boss.x && object.y === boss.y &&
      tiledProperties(object).blocksUntilFlag === special.capturedFlag);
    assert.ok(specialGate, `${research.id} boss footprint has a conditional collision`);
    assert.equal(tiledProperties(specialGate).blocksWhenFlag, research.revealedFlag);
    const collision = collectMapCollision(collisionObjects, tiled.width, tiled.height, []);
    assert.equal(collision.has(`${special.x},${special.y}`), false);
    assert.equal(collectMapCollision(collisionObjects, tiled.width, tiled.height, [research.revealedFlag]).has(`${special.x},${special.y}`), true);
    assert.equal(collectMapCollision(collisionObjects, tiled.width, tiled.height, [research.revealedFlag, special.capturedFlag]).has(`${special.x},${special.y}`), false);
  }
  assert.equal(allMarkers.length, 17);
  for (const { object, tiled, researchId } of allMarkers) {
    const layerObjects = tiled.layers.find((layer: any) => layer.name === 'interactions')?.objects ?? [];
    for (const other of layerObjects) {
      if (other === object) continue;
      assert.ok(!overlaps(object, other), `${researchId}: ${object.name} overlaps interactive ${other.name}`);
    }
    const solids = tiled.layers.find((layer: any) => layer.name === 'collision')?.objects ?? [];
    for (const solid of solids) {
      assert.ok(!overlaps(object, solid), `${researchId}: ${object.name} overlaps solid ${solid.name}`);
    }
  }
});

test('authored clue events have no prerequisites and reveal rewards settle only once', async () => {
  const quests = await Promise.all(researchData.researches.map(async research =>
    (await import(new URL(`../../content/quests/${research.id.split('/').at(-1)}.quest.json`, import.meta.url).href,
      { with: { type: 'json' } })).default as AuthoredQuestDefinition));
  for (const research of researchData.researches) {
    const authoredQuest = quests.find(candidate => candidate.id === research.questId)!;
    for (const clue of research.clues) {
      const step = authoredQuest.steps.find(candidate => candidate.trigger === clue.event && candidate.setFlag === clue.flag);
      assert.ok(step);
      assert.deepEqual(step.requiresFlags, [], `${research.id}/${clue.id} is order-free`);
      const first = applyQuestEvent(save([]), clue.event, [authoredQuest]);
      assert.equal(first.progressed, true);
      assert.ok(first.save.flags.includes(clue.flag));
      assert.equal(applyQuestEvent(first.save, clue.event, [authoredQuest]).progressed, false);
    }
    const flags = [research.requiredFlag, ...research.clues.map(clue => clue.flag)];
    const before = save(flags);
    const first = applyQuestEvent(before, research.puzzle.event, [authoredQuest]);
    assert.equal(first.progressed, true);
    assert.ok(first.save.flags.includes(research.revealedFlag));
    assert.equal(first.save.player.money, before.player.money + (authoredQuest.reward?.money ?? 0));
    assert.deepEqual(first.completedQuestIds, [research.questId]);
    const replay = applyQuestEvent(first.save, research.puzzle.event, [authoredQuest]);
    assert.equal(replay.progressed, false);
    assert.equal(replay.save.player.money, first.save.player.money);
  }
});

test('special encounter availability enforces route and research flags but captured overrides every gate', () => {
  const encounter: SpecialEncounter = {
    id: 'special-articuno', mapId: 'ice-pass', speciesId: 144, level: 50,
    requiredFlag: 'region_open', routeRequiredFlags: ['north_pass_open'],
    researchRequiredFlag: definition.revealedFlag, capturedFlag: definition.capturedFlag,
    captureEvent: 'special/articuno/captured', description: 'A rare bird.', unlockHint: 'Research it.', routeHint: 'Reach the pass.',
  };
  assert.equal(specialEncounterDiscoveryState(encounter, []), 'locked');
  assert.equal(specialEncounterAvailability(encounter, 'ice-pass', ['region_open'], true), 'locked');
  assert.equal(specialEncounterDiscoveryState(encounter, ['region_open', 'north_pass_open']), 'researching');
  assert.equal(specialEncounterAvailability(encounter, 'ice-pass', ['region_open', 'north_pass_open'], true), 'researching');
  assert.equal(specialEncounterAvailability(encounter, 'ice-pass', ['region_open', 'north_pass_open', definition.revealedFlag], true), 'available');
  assert.equal(specialEncounterDiscoveryState(encounter, [definition.capturedFlag]), 'caught');
  assert.equal(specialEncounterAvailability(encounter, 'wrong-map', [definition.capturedFlag], true), 'wrongMap');
});
