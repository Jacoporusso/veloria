import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import specials from '../../content/encounters/special-pokemon.v1.json' with { type: 'json' };
import researches from '../../content/encounters/legendary-research.v1.json' with { type: 'json' };
import { specialEncounterDiscoveryState } from '../../src/core/encounters/special-encounter.ts';
import { legendaryResearchState } from '../../src/core/encounters/legendary-research.ts';

const maps = readdirSync('content/maps').filter(file => file.endsWith('.map.json'))
  .map(file => JSON.parse(readFileSync(`content/maps/${file}`, 'utf8')));
const readMap = (id: string) => maps.find(map => map.id === id)!;

const paths: Record<string, string[]> = {
  'veloria/special_snorlax': ['veloria/acquariva', 'veloria/r12_valle_vento'],
  'veloria/special_articuno': ['veloria/passobrina', 'veloria/r13_tornanti_bianchi'],
  'veloria/special_zapdos': ['veloria/ferraluce', 'veloria/r07_condotto_risonante', 'veloria/d03_centrale_risonante'],
  'veloria/special_moltres': ['veloria/concordia', 'veloria/r15_passo_due_luci'],
  'veloria/special_mewtwo': ['veloria/concordia', 'veloria/d06_santuario_due_luci'],
  'veloria/special_mew': ['veloria/borgofonte', 'veloria/r01_sentiero_alba', 'veloria/d01_bosco_veli'],
};

test('special encounter discovery distinguishes unlocks, routes and captures', () => {
  const snorlax = specials.encounters.find(encounter => encounter.id === 'veloria/special_snorlax')!;
  assert.equal(specialEncounterDiscoveryState(snorlax, []), 'locked');
  assert.equal(specialEncounterDiscoveryState(snorlax, [snorlax.requiredFlag]), 'locked');
  assert.equal(specialEncounterDiscoveryState(snorlax, [snorlax.requiredFlag, ...(snorlax.routeRequiredFlags ?? [])]), 'available');
  assert.equal(specialEncounterDiscoveryState(snorlax, [snorlax.capturedFlag]), 'caught');

  for (const encounter of specials.encounters.filter(entry => entry.id !== snorlax.id)) {
    assert.equal(specialEncounterDiscoveryState(encounter, []), 'locked');
    const beforeReveal = [encounter.requiredFlag, ...(encounter.routeRequiredFlags ?? [])];
    assert.equal(specialEncounterDiscoveryState(encounter, beforeReveal),
      encounter.researchRequiredFlag ? 'researching' : 'available');
    if (encounter.researchRequiredFlag) {
      assert.equal(specialEncounterDiscoveryState(encounter, [...beforeReveal, encounter.researchRequiredFlag]), 'available');
    }
    assert.equal(specialEncounterDiscoveryState(encounter, [encounter.capturedFlag]), 'caught');
  }
});

test('already-captured legendaries remain caught while their optional research archive stays incomplete', () => {
  for (const research of researches.researches) {
    const encounter = specials.encounters.find(entry => entry.id === research.encounterId)!;
    const state = specialEncounterDiscoveryState(encounter, [encounter.capturedFlag]);
    assert.equal(state, 'caught');
    const archive = legendaryResearchState(research, [encounter.capturedFlag]);
    assert.equal(archive.captured, true);
    assert.notEqual(archive.status, 'revealed', 'capture alone does not complete optional research');
    assert.deepEqual(archive.foundClueIds, []);
  }
});

test('special encounter route hints name maps along the authored connection paths', () => {
  for (const encounter of specials.encounters) {
    assert.ok(encounter.routeHint.trim(), `${encounter.id} has a route hint`);
    const route = paths[encounter.id];
    assert.ok(route, `${encounter.id} has a sourced map route`);
    assert.equal(route.at(-1), encounter.mapId);
    for (let index = 0; index < route.length; index += 1) {
      const map = readMap(route[index]);
      const canonicalMapName = map.displayName.split(' · ')[0];
      assert.ok(encounter.routeHint.includes(canonicalMapName), `${encounter.id} names ${canonicalMapName}`);
      if (index === 0) continue;
      const previous = readMap(route[index - 1]);
      const linked = previous.connections.some((connection: { toMapId: string }) => connection.toMapId === map.id)
        || map.connections.some((connection: { toMapId: string }) => connection.toMapId === previous.id);
      assert.ok(linked, `${previous.displayName} connects to ${map.displayName}`);
    }
  }
});
