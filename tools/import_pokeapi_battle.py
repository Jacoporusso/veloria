"""Reproducible PokéAPI battle import. Network is opt-in; raw responses are cached."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
import time
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'content/sources/pokeapi'
API = 'https://pokeapi.co/api/v2/'
VERSION_GROUP = 'heartgold-soulsilver'
SUPPORTED_MOVES = '''thunder-shock growl scratch tackle tail-whip defense-curl quick-attack gust poison-sting string-shot ember water-gun vine-whip absorb bubble harden confusion fury-attack hypnosis peck withdraw scary-face acid agility amnesia poison-powder sleep-powder stun-spore double-slap fury-swipes leech-life constrict mud-shot slam sand-attack smokescreen sweet-scent leech-seed metal-sound supersonic sonic-boom thunder-wave spark screech rock-throw bubble-beam vice-grip barrier'''.split()
SUPPORTED_MOVES += ['psybeam', 'confuse-ray', 'swift', 'pound', 'meditate']
STATS = {'attack': 'attack', 'defense': 'defense', 'special-attack': 'specialAttack', 'special-defense': 'specialDefense', 'speed': 'speed', 'accuracy': 'accuracy', 'evasion': 'evasion'}


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def resource(kind, key, fetch=False):
    path = SOURCE / f'{kind}-{key}.json'
    if not path.exists():
        if not fetch:
            raise ValueError(f'Missing cached source: {path}. Run with --fetch.')
        SOURCE.mkdir(parents=True, exist_ok=True)
        url = f'{API}{kind}/{key}/'
        with urlopen(Request(url, headers={'User-Agent': 'Veloria-content-import/1.0'}), timeout=45) as response:
            path.write_bytes(response.read())
        time.sleep(.1)
    raw = path.read_bytes()
    return json.loads(raw), {'url': f'{API}{kind}/{key}/', 'path': path.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(raw).hexdigest()}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true', help='Download missing public API resources and cache them.')
    parser.add_argument('--check', action='store_true', help='Verify generated data without writing it or accessing the network.')
    args = parser.parse_args(argv)
    species = read_json(ROOT / 'content/battle/species.v1.json')['species']
    manifest = {}
    def get(kind, key):
        value, source = resource(kind, key, args.fetch and not args.check)
        manifest[f'{kind}/{key}'] = source
        return value

    selected_order = get('version-group', VERSION_GROUP)['order']
    moves = {}
    for name in SUPPORTED_MOVES:
        raw = get('move', name)
        values = {key: raw[key] for key in ('power', 'accuracy', 'pp', 'type', 'effect_chance', 'effect_entries')}
        changes = sorted(raw['past_values'], key=lambda change: get('version-group', change['version_group']['name'])['order'])
        for key in values:
            for change in changes:
                if get('version-group', change['version_group']['name'])['order'] > selected_order and change.get(key) is not None and change[key] != []:
                    values[key] = change[key]
                    break
        move = {'id': name, 'name': next(entry['name'] for entry in raw['names'] if entry['language']['name'] == 'it'),
                'type': values['type']['name'], 'category': raw['damage_class']['name'],
                'power': values['power'] or 0, 'accuracy': values['accuracy'] if values['accuracy'] is not None else 100,
                'priority': raw['priority'], 'maxPp': values['pp']}
        if values['accuracy'] is None:
            move['alwaysHits'] = True
        meta = raw['meta']
        if raw['stat_changes']:
            move['statChanges'] = [{'target': 'self' if raw['target']['name'] == 'user' else 'opponent',
                                    'stat': STATS[effect['stat']['name']], 'stages': effect['change']} for effect in raw['stat_changes']]
            # PokéAPI exposes this historical change as effect prose, not a stat_changes snapshot.
            historical_text = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').replace('\u2019', "'").replace('\ufffd', "'")
            if historical_text == "Lowers the target's Speed by one stage.":
                assert move['statChanges'] == [{'target': 'opponent', 'stat': 'speed', 'stages': -2}]
                move['statChanges'][0]['stages'] = -1
            if name == 'sweet-scent' and historical_text.lower() == "lowers the target's evasion by one stage.":
                assert move['statChanges'] == [{'target': 'opponent', 'stat': 'evasion', 'stages': -2}]
                move['statChanges'][0]['stages'] = -1
            if meta['stat_chance']:
                move['statChangeChance'] = meta['stat_chance']
        ailment = meta['ailment']['name']
        if ailment in ('burn', 'poison', 'paralysis', 'sleep', 'freeze'):
            move['inflictedStatus'] = ailment
            move['statusChance'] = values['effect_chance'] if values['effect_chance'] is not None else (meta['ailment_chance'] or 100)
            if meta['min_turns'] is not None and meta['max_turns'] is not None:
                move['minStatusTurns'] = meta['min_turns']
                move['maxStatusTurns'] = meta['max_turns']
        if ailment == 'leech-seed':
            effect_text = ' '.join(entry['effect'] for entry in values['effect_entries'] if entry['language']['name'] == 'en')
            assert 'drains 1/8 of its max HP' in effect_text
            move['leechSeedFraction'] = 1 / 8
        if ailment == 'confusion':
            move['inflictedConfusionChance'] = values['effect_chance'] if values['effect_chance'] is not None else (meta['ailment_chance'] or 100)
            move['minConfusionTurns'] = meta['min_turns']
            move['maxConfusionTurns'] = meta['max_turns']
        if name == 'sonic-boom':
            prose = next(entry['short_effect'] for entry in values['effect_entries'] if entry['language']['name'] == 'en')
            fixed = re.fullmatch(r'Inflicts (\d+) points of damage\.', prose)
            assert fixed is not None and values['power'] is None, 'Unsupported fixed-damage source semantics'
            move['fixedDamage'] = int(fixed.group(1))
        if name == 'thunder-wave':
            # PokéAPI describes paralysis but omits this selective type-immunity rule.
            # Verified against Showdown data/moves.ts thunderwave.ignoreImmunity=false;
            # HGSS accuracy still comes exclusively from the API past_values above.
            assert move['category'] == 'status' and move.get('inflictedStatus') == 'paralysis'
            move['statusAffectedByTypeImmunity'] = True
        if meta['drain']:
            assert meta['drain'] > 0
            move['drainPercent'] = meta['drain']
        if meta['min_hits'] is not None:
            move.update(minHits=meta['min_hits'], maxHits=meta['max_hits'])
        moves[name] = move

    full_learnsets, learning, pending = {}, {}, {}
    for species_id, definition in species.items():
        raw = get('pokemon', species_id)
        entries = []
        for move in raw['moves']:
            for detail in move['version_group_details']:
                if detail['version_group']['name'] == VERSION_GROUP and detail['move_learn_method']['name'] == 'level-up':
                    entries.append({'level': detail['level_learned_at'], 'moveId': move['move']['name'], 'order': detail.get('order')})
        entries.sort(key=lambda item: (item['level'], item['order'] if item['order'] is not None else 999, item['moveId']))
        full_learnsets[species_id] = entries
        supported = [{'level': item['level'], 'moveId': item['moveId']} for item in entries if item['moveId'] in moves]
        definition['officialLearnset'] = supported
        preview = []
        for entry in supported:
            if entry['level'] <= 5 and entry['moveId'] not in preview:
                preview.append(entry['moveId'])
        assert preview, f'No supported level-five moves for {species_id}'
        definition['defaultMoveIds'] = preview[-4:]
        seen = set()
        learning[species_id] = []
        for entry in supported:
            if entry['level'] < 2 or entry['moveId'] in seen:
                continue
            seen.add(entry['moveId'])
            learning[species_id].append(entry)
        pending[species_id] = [entry for entry in entries if entry['moveId'] not in moves]

    source = {'provider': 'PokeAPI', 'versionGroup': VERSION_GROUP, 'language': 'it', 'manifest': 'content/sources/pokeapi/manifest.json'}
    species_data = read_json(ROOT / 'content/battle/species.v1.json')
    species_data['species'] = species
    species_data['moveSource'] = source
    species_data['movePolicy'] = 'officialLearnset determines new creatures at their actual level; defaultMoveIds is a level-five preview. Prototype save compatibility is not required.'
    starters = read_json(ROOT / 'content/starters/starting-partners.v1.json')
    for starter in starters['starters']:
        starter['moves'] = [{'id': move_id, 'pp': moves[move_id]['maxPp']} for move_id in species[str(starter['speciesId'])]['defaultMoveIds']]
    starters['moveSource'] = source
    outputs = {
        ROOT / 'content/starters/starting-partners.v1.json': starters,
        ROOT / 'content/battle/moves.v1.json': {'version': 10, 'status': 'prototype', 'source': source,
            'notes': ['Generated by tools/import_pokeapi_battle.py from cached PokéAPI responses. No balance overrides.',
                      'Historical values apply before the past_values version_group change boundary. Null accuracy is represented by alwaysHits:true.',
                      'This is the implemented subset. Full source learnsets and unsupported moves remain in the source report; mechanics are not all complete.'], 'moves': moves},
        ROOT / 'content/battle/species.v1.json': species_data,
        ROOT / 'content/battle/level-up-moves.v1.json': {'version': 1, 'status': 'prototype', 'source': source,
            'note': 'Only implemented moves from the official HGSS level-up learnsets. All original entries, including unimplemented effects, are retained in source-learnsets.json.', 'species': learning},
        SOURCE / 'source-learnsets.json': {'source': source, 'species': full_learnsets, 'unimplemented': pending},
        SOURCE / 'manifest.json': {'versionGroup': VERSION_GROUP, 'resources': dict(sorted(manifest.items()))},
    }
    for path, value in outputs.items():
        rendered = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
        if args.check:
            if not path.exists() or path.read_text(encoding='utf-8') != rendered:
                raise ValueError(f'Stale generated data: {path.relative_to(ROOT)}')
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(rendered, encoding='utf-8')
    print(f'{"Verified" if args.check else "Imported"} {len(moves)} moves and {len(species)} source learnsets for {VERSION_GROUP}; {sum(map(len, pending.values()))} unimplemented learnset entries explicitly recorded.')


if __name__ == '__main__':
    main()
