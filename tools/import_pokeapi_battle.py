"""Reproducible PokéAPI battle import. Network is opt-in; raw responses are cached."""
from __future__ import annotations

import argparse
import csv
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
SUPPORTED_MOVES += ['wing-attack', 'water-pulse', 'thunder-punch', 'discharge']
SUPPORTED_MOVES += ['powder-snow', 'aurora-beam', 'ice-beam', 'icy-wind', 'ice-shard', 'feint-attack']
SUPPORTED_MOVES += ['mud-bomb']
SUPPORTED_MOVES += ['bug-buzz', 'poison-jab']
SUPPORTED_MOVES += ['flamethrower', 'psychic', 'crunch', 'shadow-ball', 'sludge-bomb']
SUPPORTED_MOVES += ['dragon-rage', 'dragon-breath', 'dragon-pulse', 'dragon-dance', 'dragon-rush', 'hydro-pump', 'aqua-tail']
SUPPORTED_MOVES += ['take-down']
SUPPORTED_MOVES += ['mega-drain', 'magical-leaf']
SUPPORTED_MOVES += ['bite', 'headbutt']
SUPPORTED_MOVES += ['ice-fang']
SUPPORTED_MOVES += ['body-slam', 'signal-beam']
SUPPORTED_MOVES += ['leer', 'comet-punch', 'splash', 'teleport', 'transform']
SUPPORTED_MOVES += '''vine-whip tackle seed-bomb scratch wing-attack dragon-claw water-gun hydro-pump aqua-tail quick-attack peck drill-peck slam horn-attack megahorn pound hyper-voice x-scissor power-gem aqua-jet extreme-speed rock-throw ice-shard vice-grip egg-bomb mega-kick mega-punch mach-punch vacuum-wave bullet-punch power-whip dragon-pulse'''.split()
SUPPORTED_MOVES += ['double-kick', 'double-hit', 'bonemerang']
SUPPORTED_MOVES += ['thrash']
SUPPORTED_MOVES += ['focus-energy']
SUPPORTED_MOVES += ['rest', 'refresh', 'aromatherapy']
SUPPORTED_MOVES += ['brine', 'assurance', 'avalanche', 'revenge', 'payback', 'flail', 'reversal', 'gyro-ball', 'wring-out', 'low-kick', 'punishment']
SUPPORTED_MOVES += ['dream-eater', 'false-swipe', 'wake-up-slap']
SUPPORTED_MOVES += ['bind', 'wrap', 'sand-tomb', 'fire-spin', 'clamp', 'whirlpool', 'disable']
SUPPORTED_MOVES += ['role-play']
SUPPORTED_MOVES += ['rain-dance', 'sunny-day', 'hail', 'sandstorm', 'reflect', 'light-screen', 'protect', 'detect', 'endure', 'feint', 'hyper-beam', 'giga-impact']
SUPPORTED_MOVES += ['moonlight', 'synthesis']
SUPPORTED_MOVES += ['solar-beam', 'razor-wind', 'skull-bash', 'sky-attack']
SUPPORTED_MOVES += ['brick-break', 'fake-out', 'flame-wheel']
SUPPORTED_MOVES += ['fly', 'dig', 'dive', 'bounce', 'earthquake', 'magnitude', 'gust', 'twister', 'surf']
SUPPORTED_MOVES += ['acupressure', 'belly-drum']
SUPPORTED_MOVES += ['block', 'mean-look']
SUPPORTED_MOVES += ['high-jump-kick', 'jump-kick', 'outrage', 'petal-dance']
SUPPORTED_MOVES += ['tri-attack', 'snore']
SUPPORTED_MOVES += ['fury-cutter', 'rollout']
SUPPORTED_MOVES += ['safeguard', 'yawn']
SUPPORTED_MOVES += ['twineedle', 'trump-card']
SUPPORTED_MOVES += ['taunt']
SUPPORTED_MOVES += ['splash']
SUPPORTED_MOVES += ['aqua-ring', 'ingrain']
SUPPORTED_MOVES += ['mud-sport', 'water-sport']
SUPPORTED_MOVES += ['mist', 'lucky-chant']
SUPPORTED_MOVES += ['guard-swap', 'power-swap', 'psych-up', 'haze']
SUPPORTED_MOVES += ['spite']
SUPPORTED_MOVES += ['charge']
SUPPORTED_MOVES += ['tailwind']
SUPPORTED_MOVES += ['counter', 'mirror-coat']
SUPPORTED_MOVES += ['foresight', 'odor-sleuth', 'miracle-eye']
SUPPORTED_MOVES += ['roost']
SUPPORTED_MOVES += ['lock-on', 'mind-reader']
SUPPORTED_MOVES += ['worry-seed']
SUPPORTED_MOVES += ['imprison']
SUPPORTED_MOVES += ['last-resort']
SUPPORTED_MOVES += ['stockpile', 'spit-up', 'swallow']
SUPPORTED_MOVES += ['conversion', 'conversion-2']
SUPPORTED_MOVES += ['captivate', 'memento', 'follow-me', 'helping-hand']
SUPPORTED_MOVES += ['sky-uppercut']
SUPPORTED_MOVES += ['sucker-punch']
SUPPORTED_MOVES += ['curse']
SUPPORTED_MOVES += ['roar', 'whirlwind']
SUPPORTED_MOVES += ['perish-song']
SUPPORTED_MOVES += ['rapid-spin', 'spikes', 'toxic-spikes']
SUPPORTED_MOVES += ['nightmare', 'poison-fang']
SUPPORTED_MOVES += ['mirror-move']
SUPPORTED_MOVES += ['copycat']
SUPPORTED_MOVES += ['encore']
SUPPORTED_MOVES += ['uproar']
SUPPORTED_MOVES += ['destiny-bond', 'grudge']
SUPPORTED_MOVES += ['future-sight']
SUPPORTED_MOVES += ['bug-bite', 'covet', 'fling', 'knock-off', 'natural-gift', 'pluck', 'recycle', 'switcheroo', 'trick']
SUPPORTED_MOVES += ['gastro-acid', 'magnet-rise', 'sleep-talk']
SUPPORTED_MOVES += ['mimic', 'metronome']
SUPPORTED_MOVES += ['rage']
SUPPORTED_MOVES += ['substitute']
SUPPORTED_MOVES += ['gravity']
SUPPORTED_MOVES += ['pay-day']
SUPPORTED_MOVES += ['magic-coat']
SUPPORTED_MOVES += ['baton-pass']
SUPPORTED_MOVES += ['healing-wish']
SUPPORTED_MOVES += ['pursuit']
SUPPORTED_MOVES += ['camouflage']
SUPPORTED_MOVES += ['me-first']
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


def read_move_flags():
    files = {
        'map': SOURCE / 'move-flag-map.csv',
        'flags': SOURCE / 'move-flags.csv',
    }
    urls = {
        'map': 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/move_flag_map.csv',
        'flags': 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/move_flags.csv',
    }
    resources = {}
    rows = {}
    for key, path in files.items():
        raw = path.read_bytes()
        resources[f'csv/move-flag-{key}'] = {'url': urls[key], 'path': path.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(raw).hexdigest()}
        with path.open(newline='', encoding='utf-8') as stream:
            rows[key] = list(csv.DictReader(stream))
    identifiers = {int(row['id']): row['identifier'] for row in rows['flags']}
    by_move = {}
    for row in rows['map']:
        move_id, flag_id = int(row['move_id']), int(row['move_flag_id'])
        if flag_id not in identifiers:
            raise ValueError(f'Unknown move flag ID {flag_id} in cached PokeAPI CSV')
        by_move.setdefault(move_id, set()).add(identifiers[flag_id])
    return by_move, resources


def supports_simple_source_move(raw):
    """Conservatively recognize official effects already represented by MoveDefinition."""
    meta = raw['meta']
    effect = ' '.join(entry.get('short_effect', '') for entry in raw.get('effect_entries', [])
                      if entry.get('language', {}).get('name') == 'en').lower().replace('\u2019', "'")
    full_effect = ' '.join(entry.get('effect', '') for entry in raw.get('effect_entries', [])
                           if entry.get('language', {}).get('name') == 'en').lower().replace('\u2019', "'")
    if (meta['category']['name'] == 'damage' and effect == 'inflicts regular damage with no additional effect.'
            and not raw['stat_changes'] and meta['ailment']['name'] == 'none'
            and not any(meta[key] for key in ('crit_rate', 'drain', 'healing', 'flinch_chance', 'stat_chance', 'ailment_chance'))):
        return True
    if (meta['category']['name'] == 'damage' and effect == 'never misses.' and not raw['stat_changes']
            and meta['ailment']['name'] == 'none' and not any(meta[key] for key in ('crit_rate', 'drain', 'healing', 'flinch_chance', 'stat_chance', 'ailment_chance'))):
        return True
    if (meta['category']['name'] == 'damage' and meta['crit_rate'] > 0
            and effect == 'has an increased chance for a critical hit.' and not raw['stat_changes']
            and meta['ailment']['name'] == 'none' and not any(meta[key] for key in ('drain', 'healing', 'flinch_chance', 'stat_chance', 'ailment_chance'))):
        return True
    if (meta['category']['name'] == 'damage-heal' and meta['drain'] > 0
            and effect == 'drains half the damage inflicted to heal the user.' and not raw['stat_changes']):
        return True
    if (meta['category']['name'] in {'damage', 'damage-ailment'} and meta['drain'] < 0
            and 'recoil' in effect and not raw['stat_changes']):
        return True
    if (meta['category']['name'] == 'heal' and meta['healing'] > 0
            and effect == 'heals the user by half its max hp.' and not raw['stat_changes']
            and 'flying type is ignored' not in full_effect):
        return True
    if (meta['category']['name'] == 'damage' and raw['power'] is None
            and re.fullmatch(r'inflicts (?:exactly )?\d+(?: points of)? damage\.', effect, re.I)):
        return True
    if meta['category']['name'] == 'damage' and effect == "inflicts damage equal to the user's level.":
        return True
    if meta['category']['name'] == 'damage' and effect == "inflicts damage equal to half the target's hp.":
        return True
    if meta['category']['name'] == 'damage' and effect == "lowers the target's hp to equal the user's.":
        return True
    if meta['category']['name'] == 'ohko' and effect == 'causes a one-hit ko.':
        return True
    if (meta['category']['name'] == 'damage' and effect == 'user faints.' and raw['power'] is not None
            and meta['ailment']['name'] == 'none' and not raw['stat_changes']):
        return True
    if raw['name'] == 'thrash':
        return meta['category']['name'] == 'damage' and 'hits every turn for 2-3 turns' in effect and 'then confuses the user' in effect
    if (raw['stat_changes'] and meta['category']['name'] in {'net-good-stats', 'damage-lower', 'damage-raise', 'swagger'}
            and not any(word in effect for word in ('faints', 'stores ', 'stockpile', 'electric moves', 'opposite gender', 'frees the user'))):
        return True
    if (meta['min_hits'] is not None and meta['max_hits'] is not None and meta['category']['name'] == 'damage'
            and 'hits ' in effect and 1 <= meta['min_hits'] <= meta['max_hits'] <= 5):
        return True
    if (meta['category']['name'] in {'damage', 'damage-ailment'} and meta['flinch_chance']
            and raw['name'] not in {'fake-out', 'snore', 'sky-attack'}
            and not raw['stat_changes'] and meta['ailment']['name'] in {'none', 'burn', 'freeze', 'paralysis', 'confusion'}):
        return True
    if meta['category']['name'] == 'damage-ailment' and not raw['stat_changes'] and not meta['drain'] and not meta['healing']:
        ailment = meta['ailment']['name']
        expected = {'burn': 'burn the target', 'poison': 'poison the target', 'paralysis': 'paralyze the target',
                    'sleep': 'put the target to sleep', 'freeze': 'freeze the target', 'confusion': 'confuse the target'}.get(ailment)
        simple_ailment = f'has a chance to {expected}.' if expected else ''
        high_crit_ailment = f'has an increased chance for a critical hit and a chance to {expected}.' if expected else ''
        if expected and effect in (simple_ailment, high_crit_ailment):
            return meta['ailment_chance'] == raw['effect_chance']
    if meta['category']['name'] == 'ailment' and not raw['stat_changes']:
        expected = {'burn': 'burns the target.', 'poison': 'poisons the target.', 'paralysis': 'paralyzes the target.',
                    'sleep': 'puts the target to sleep.', 'confusion': 'confuses the target.'}.get(meta['ailment']['name'])
        if expected and effect == expected and not meta['flinch_chance']:
            return True
    return False


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true', help='Download missing public API resources and cache them.')
    parser.add_argument('--check', action='store_true', help='Verify generated data without writing it or accessing the network.')
    parser.add_argument('--group', help=('Prefer species assigned to this artwork group while preserving other catalog entries. '
        'If a newly supported move appears in another registered species\' cached HGSS learnset, refresh every registered species.'))
    args = parser.parse_args(argv)
    species = read_json(ROOT / 'content/battle/species.v1.json')['species']
    imports = read_json(ROOT / 'content/battle/species-imports.v1.json')['imports']
    selected = {str(entry['speciesId']) for entry in imports if args.group and entry.get('artworkGroup') == args.group}
    if args.group and not selected:
        raise ValueError(f'No species imports found for group {args.group!r}')
    if not args.group:
        selected = set(species)
    manifest = {}
    def get(kind, key):
        value, source = resource(kind, key, args.fetch and not args.check)
        manifest[f'{kind}/{key}'] = source
        return value

    selected_order = get('version-group', VERSION_GROUP)['order']
    source_move_names = set(SUPPORTED_MOVES)
    for species_id in species:
        source_pokemon = get('pokemon', species_id)
        for source_move in source_pokemon['moves']:
            if any(detail['version_group']['name'] == VERSION_GROUP and detail['move_learn_method']['name'] == 'level-up'
                   for detail in source_move['version_group_details']):
                source_move_names.add(source_move['move']['name'])
    for name in sorted(source_move_names - set(SUPPORTED_MOVES)):
        if supports_simple_source_move(get('move', name)):
            SUPPORTED_MOVES.append(name)
    moves = {}
    move_flags, flag_resources = read_move_flags()
    manifest.update(flag_resources)
    for name in sorted(set(SUPPORTED_MOVES)):
        raw = get('move', name)
        flags = move_flags.get(raw['id'], set())
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
                'priority': raw['priority'], 'maxPp': values['pp'], 'target': raw['target']['name']}
        move['makesContact'] = 'contact' in flags
        move['soundMove'] = 'sound' in flags
        if 'reflectable' in flags:
            move['reflectable'] = True
        if values['accuracy'] is None:
            move['alwaysHits'] = True
        meta = raw['meta']
        if raw['stat_changes']:
            historical_text = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').replace('\u2019', "'").replace('\ufffd', "'")
            lower_effect = historical_text.lower()
            change_target = 'self' if raw['target']['name'] == 'user' or ('user' in lower_effect and 'target' not in lower_effect) else 'opponent'
            move['statChanges'] = [{'target': change_target,
                                    'stat': STATS[effect['stat']['name']], 'stages': effect['change']} for effect in raw['stat_changes']]
            # PokéAPI exposes this historical change as effect prose, not a stat_changes snapshot.
            if historical_text == "Lowers the target's Speed by one stage.":
                assert move['statChanges'] == [{'target': 'opponent', 'stat': 'speed', 'stages': -2}]
                move['statChanges'][0]['stages'] = -1
            if name == 'sweet-scent' and historical_text.lower() == "lowers the target's evasion by one stage.":
                assert move['statChanges'] == [{'target': 'opponent', 'stat': 'evasion', 'stages': -2}]
                move['statChanges'][0]['stages'] = -1
            if meta['stat_chance']:
                move['statChangeChance'] = meta['stat_chance']
        ailment = meta['ailment']['name']
        if name in ('body-slam', 'signal-beam'):
            assert meta['category']['name'] == 'damage-ailment' and not raw['stat_changes']
            assert meta['flinch_chance'] == meta['crit_rate'] == meta['drain'] == meta['healing'] == 0
            assert meta['min_hits'] is None and meta['max_hits'] is None
            assert ailment == ('paralysis' if name == 'body-slam' else 'confusion')
            assert values['effect_chance'] == meta['ailment_chance'], 'Unsupported secondary-effect source semantics'
        if meta['category']['name'] == 'damage-ailment' and meta['flinch_chance'] and ailment != 'none' and name != 'ice-fang':
            assert values['effect_chance'] == meta['ailment_chance'], 'Unsupported independent secondary-effect source semantics'
            short = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'chance to make the target flinch' in short, 'Unrecognized combined secondary-effect semantics'
        if ailment in ('burn', 'poison', 'paralysis', 'sleep', 'freeze'):
            if name == 'poison-fang':
                full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
                assert ailment == 'poison', (ailment, full_effect)
                assert 'badly poison the target' in full_effect, full_effect
                # The live meta endpoint is post-history (50%); HGSS past_values records 30%.
                assert meta['ailment_chance'] == 50 and values['effect_chance'] == 30
                move['inflictedBadlyPoisoned'] = True
            else:
                move['inflictedStatus'] = ailment
            move['statusTarget'] = 'self' if raw['target']['name'] == 'user' else 'opponent'
            move['statusChance'] = values['effect_chance'] if values['effect_chance'] is not None else (meta['ailment_chance'] or 100)
            if meta['min_turns'] is not None and meta['max_turns'] is not None:
                move['minStatusTurns'] = meta['min_turns']
                move['maxStatusTurns'] = meta['max_turns']
        if name == 'nightmare':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert raw['target']['name'] == 'selected-pokemon' and 'only works on sleeping' in full_effect and 'damaging it for 1/4 its max hp every turn' in full_effect and 'if the target wakes up or leaves the field, this effect ends' in full_effect
            move['nightmareMove'] = True
        if name == 'mirror-move':
            assert raw['target']['name'] == 'selected-pokemon' and 'uses the target' in ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            move['mirrorMove'] = True
        if name == 'copycat':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'uses the target' in effect and 'last move that was used successfully by any pokémon' in full_effect and 'nor roar nor whirlwind' in full_effect
            move['copyLastBattleMove'] = True
        if name == 'encore':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert raw['target']['name'] == 'selected-pokemon' and 'next 4–8 times' in full_effect and 'if the target hasn’t used a move since entering the field' in full_effect
            move['encoreTarget'] = True
        if name == 'uproar':
            short = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'forced to use this move for several turns' in short and 'none can fall to sleep until the lock-in ends' in full_effect
            assert values['power'] == 50 and raw['power'] == 90 and meta['category']['name'] == 'damage'
            move.update(uproar=True, lockInMinTurns=3, lockInMaxTurns=6, usableWhileAsleep=True)
        if name == 'destiny-bond':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'faints before its next move' in full_effect and 'end-of-turn damage is ignored' in full_effect
            move['destinyBond'] = True
        if name == 'grudge':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'faints before it next acts' in full_effect and 'end-of-turn damage does not trigger this effect' in full_effect
            move['grudge'] = True
        if name == 'future-sight':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert raw['target']['name'] == 'selected-pokemon' and 'typeless regular damage at the end of the third turn' in full_effect
            assert 'damage is calculated at the time this move is used' in full_effect and 'cannot score a critical hit' in full_effect
            assert values['power'] == 80 and raw['power'] == 120 and values['accuracy'] == 90 and values['pp'] == 15
            move.update(futureSight=True, typelessDamage=True)
        held_item_effects = {
            'bug-bite': ('consumeBerry', False), 'pluck': ('consumeBerry', False),
            'covet': ('steal', False), 'knock-off': ('remove', False),
            'fling': (None, True), 'natural-gift': (None, True), 'recycle': (None, True),
            'trick': (None, True), 'switcheroo': (None, True),
        }
        if name in held_item_effects:
            effect, requires_item_state = held_item_effects[name]
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            if name in {'bug-bite', 'pluck'}:
                assert 'if the target is holding a berry' in full_effect and 'double power' in full_effect and 'takes the berry' in full_effect
            elif name in {'covet', 'knock-off'}:
                assert 'item' in full_effect and raw['damage_class']['name'] in {'physical', 'special'}
            elif name == 'fling':
                assert 'if the user is not holding an item' in full_effect and 'this move will fail' in full_effect
            elif name == 'natural-gift':
                assert 'if the user is not holding a berry' in full_effect and 'this move will fail' in full_effect
            elif name == 'recycle':
                assert 'recovers the last item consumed' in full_effect
            else:
                assert 'swap held items' in full_effect
            if effect:
                move['heldItemSecondaryEffect'] = effect
            if requires_item_state:
                # The regional battle model has no Pokémon-held item state; fail instead of inventing one.
                move['requiresHeldItemContext'] = True
        if name == 'gastro-acid':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'ability is disabled as long as it remains on the field' in full_effect and raw['target']['name'] == 'selected-pokemon'
            move['suppressesAbility'] = True
        if name == 'magnet-rise':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'for five turns, the user is immune to ground moves' in full_effect and 'under the effect of ingrain or has levitate, this move will fail' in full_effect
            move['magnetRise'] = True
        if name == 'sleep-talk':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'only usable if the user is sleeping' in full_effect and 'randomly selects and uses one of the user’s other three moves' in full_effect
            move.update(sleepTalk=True, usableWhileAsleep=True)
        if name == 'mimic':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'replaced by the target’s last successfully used move' in full_effect and 'vanishes when the user leaves the field' in full_effect and 'if it tried to use a move this turn and failed' in full_effect and 'if chatter, metronome, mimic, sketch, or struggle is selected' in full_effect
            move['mimic'] = True
        if name == 'metronome':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'selects any move at random' in full_effect and 'moves the user already knows are not eligible' in full_effect and 'quick guard' in full_effect and 'wide guard' in full_effect
            move['metronome'] = True
        if name == 'rage':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'every time the user is hit after it uses this move but before its next action' in full_effect and 'attack raises by one stage' in full_effect
            move['rage'] = True
        if name == 'substitute':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'transfers 1/4 the user’s max hp into a doll' in full_effect and 'if the user leaves the field, the doll will vanish' in full_effect and 'the doll takes damage as normal' in full_effect
            move['substitute'] = True
        if name == 'gravity':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'for five turns' in full_effect and 'all immunities to ground moves are disabled' in full_effect and 'bounce, fly, sky drop, high jump kick, jump kick, and splash cannot be used' in full_effect
            # PokeAPI's current prose includes later-generation accuracy text. Gen IV's Gravity field condition applies a 5/3 accuracy modifier without changing evasion stages.
            move['gravity'] = True
        if name == 'pay-day':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'winner receives five times the user’s level in extra money' in full_effect and 'each time this move was used' in full_effect
            move['payDay'] = True
        if name == 'magic-coat':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'first non-damaging move targeting the user this turn' in full_effect and 'will be reflected at its user' in full_effect and 'defog, memento, and teeter dance are not reflected' in full_effect
            assert any('reflectable' in flags_for_move for flags_for_move in move_flags.values()), 'Cached official flag map has no reflectable moves'
            move['magicCoat'] = True
        if name == 'baton-pass':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'user switches out, and the trainer selects a replacement pokémon from the party' in full_effect and 'stat changes, confusion, and persistent move effects are passed' in full_effect
            move['batonPass'] = True
        if name == 'healing-wish':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'user faints' in full_effect and 'replacement’s hp is fully restored' in full_effect and 'major status effect is removed' in full_effect
            move['healingWish'] = True
        if name == 'pursuit':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'if the target attempts to switch out this turn before the user acts' in full_effect and 'hits the target before it leaves and has double power' in full_effect
            move['pursuit'] = True
        if name == 'camouflage':
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'user’s type changes according to the terrain' in full_effect
            # PokéAPI's current terrain table is later-generation prose; the Gen IV implementation sets Normal type.
            move['camouflage'] = True
        if name == 'me-first':
            full_effect = ' '.join(' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").split())
            assert 'if the target has selected a damaging move this turn' in full_effect and 'copy that move and use it against the target' in full_effect
            assert 'with a 50% increase in power' in full_effect and 'if the target moves before the user, this move will fail' in full_effect
            assert 'cannot be copied by mirror move' in full_effect and 'metronome, or sleep talk' in full_effect
            # Gen IV applies the bonus after damage calculation, including fixed-damage moves.
            move['meFirst'] = True
        if ailment == 'leech-seed':
            effect_text = ' '.join(entry['effect'] for entry in values['effect_entries'] if entry['language']['name'] == 'en')
            assert 'drains 1/8 of its max HP' in effect_text
            move['leechSeedFraction'] = 1 / 8
        if ailment == 'confusion':
            move['inflictedConfusionChance'] = values['effect_chance'] if values['effect_chance'] is not None else (meta['ailment_chance'] or 100)
            move['minConfusionTurns'] = meta['min_turns']
            move['maxConfusionTurns'] = meta['max_turns']
        fixed_damage_text = next((entry['short_effect'] for entry in values['effect_entries'] if entry['language']['name'] == 'en'), '')
        if raw['power'] is None and meta['category']['name'] == 'damage' and re.fullmatch(r'Inflicts (?:exactly )?(\d+)(?: points of)? damage\.', fixed_damage_text):
            fixed = re.fullmatch(r'Inflicts (?:exactly )?(\d+)(?: points of)? damage\.', fixed_damage_text)
            assert fixed is not None, 'Unsupported fixed-damage source semantics'
            move['fixedDamage'] = int(fixed.group(1))
        if meta['category']['name'] == 'damage' and fixed_damage_text.lower().replace('\u2019', "'") == "inflicts damage equal to the user's level.":
            move['damageByUserLevel'] = True
        if meta['category']['name'] == 'damage' and fixed_damage_text.lower().replace('\u2019', "'") == "inflicts damage equal to half the target's hp.":
            move['targetHpFraction'] = 0.5
        if meta['category']['name'] == 'damage' and fixed_damage_text.lower().replace('\u2019', "'") == "lowers the target's hp to equal the user's.":
            move['endeavorDamage'] = True
        if meta['category']['name'] == 'ohko':
            assert fixed_damage_text.lower() == 'causes a one-hit ko.'
            move['oneHitKO'] = True
        if meta['category']['name'] == 'damage' and fixed_damage_text.lower() == 'user faints.':
            assert raw['power'] is not None and meta['ailment']['name'] == 'none' and not raw['stat_changes']
            move['faintUserAfterMove'] = True
            move['damageDefenseMultiplier'] = 0.5
            if name in {'self-destruct', 'explosion'}:
                move['selfDestructs'] = True
        full_effect = ' '.join(' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").split())
        if name == 'memento':
            assert full_effect == "lowers the target's attack and special attack by two stages. user faints."
            assert move['statChanges'] == [{'target': 'opponent', 'stat': 'attack', 'stages': -2}, {'target': 'opponent', 'stat': 'specialAttack', 'stages': -2}]
            move['faintUserAfterMove'] = True
        if name == 'captivate':
            assert full_effect == "lowers the target's special attack by two stages. if the user and target are the same gender, or either is genderless, this move will fail."
            assert move['statChanges'] == [{'target': 'opponent', 'stat': 'specialAttack', 'stages': -2}]
            move['requiresOppositeGender'] = True
        if name == 'sucker-punch':
            assert 'target has not selected a damaging move this turn' in full_effect and 'already acted this turn' in full_effect
            move['requiresTargetDamagingMove'] = True
        if name == 'curse':
            assert "if the user is a ghost: user pays half its max hp to place a curse on the target, damaging it for 1/4 its max hp every turn. otherwise: lowers the user's speed by one stage, and raises its attack and defense by one stage each." in full_effect
            assert move['category'] == 'status' and raw['target']['name'] == 'specific-move'
            move.update(curseMove=True, alwaysHits=True)
        if name in {'roar', 'whirlwind'}:
            assert 'wild battles' in fixed_damage_text.lower() and 'forces trainers to switch' in fixed_damage_text.lower()
            assert move['category'] == 'status' and raw['target']['name'] == 'selected-pokemon'
            move.update(forceSwitchTarget=True)
        if name == 'perish-song':
            assert 'counter that starts at 3 and decreases by 1 at the end of every turn, including this one' in full_effect
            assert 'a pokémon that leaves the field will lose its counter' in full_effect and raw['target']['name'] == 'all-pokemon'
            move['perishSong'] = True
        if name == 'spikes':
            assert 'up to three layers of spikes may be laid down' in full_effect and '1/4 max hp' in full_effect
            assert raw['target']['name'] == 'opponents-field' and move['category'] == 'status'
            move['hazardEffect'] = 'setSpikes'
        if name == 'toxic-spikes':
            assert 'a second layer of these spikes may be laid down' in full_effect and 'badly poisoned' in full_effect
            assert 'does not trigger synchronize' in full_effect and raw['target']['name'] == 'opponents-field'
            move['hazardEffect'] = 'setToxicSpikes'
        if name == 'rapid-spin':
            assert 'removes leech seed from the user' in full_effect and 'frees the user from bind' in full_effect and 'clears spikes' in full_effect
            assert 'if this move misses or has no effect, its effect doesn' in full_effect and move['category'] == 'physical'
            move['hazardEffect'] = 'rapidSpin'
        if name == 'follow-me':
            assert raw['target']['name'] == 'user' and "user's ally" in full_effect
            move['alwaysFails'] = True  # Veloria battles are single battles and provide no ally target.
        if name == 'helping-hand':
            assert raw['target']['name'] == 'ally' and "target's moves" in full_effect
            move['alwaysFails'] = True  # Veloria battles are single battles and provide no ally target.
        if name == 'thunder-wave':
            # PokéAPI describes paralysis but omits this selective type-immunity rule.
            # Verified against Showdown data/moves.ts thunderwave.ignoreImmunity=false;
            # HGSS accuracy still comes exclusively from the API past_values above.
            assert move['category'] == 'status' and move.get('inflictedStatus') == 'paralysis'
            move['statusAffectedByTypeImmunity'] = True
        if name == 'teleport':
            assert move['category'] == 'status' and move['power'] == 0 and raw['target']['name'] == 'user'
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'")
            assert 'wild battles' in effect and 'no effect otherwise' in effect
            move['escapeBattle'] = True
        if name == 'transform':
            assert move['category'] == 'status' and move['power'] == 0 and raw['target']['name'] == 'selected-pokemon'
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en')
            assert 'copy of the target' in effect and 'until it leaves battle' in effect
            move['transformTarget'] = True
        if name == 'focus-energy':
            assert move['category'] == 'status' and raw['target']['name'] == 'user'
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'")
            assert effect == "increases the user's chance to score a critical hit."
            move['criticalStageChange'] = 2
        if name == 'thrash':
            assert move['category'] == 'physical' and meta['category']['name'] == 'damage'
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'")
            assert effect == 'hits every turn for 2-3 turns, then confuses the user.'
            move['lockInMinTurns'] = 2
            move['lockInMaxTurns'] = 3
            move['confusesUserAfterLockIn'] = True
        if name in {'outrage', 'petal-dance'}:
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == 'hits every turn for 2-3 turns, then confuses the user.' and move['category'] in {'physical', 'special'}
            move.update(lockInMinTurns=2, lockInMaxTurns=3, confusesUserAfterLockIn=True)
        if name in {'high-jump-kick', 'jump-kick'}:
            historical_effects = sorted(raw['effect_changes'], key=lambda change: get('version-group', change['version_group']['name'])['order'])
            applicable = [change for change in historical_effects if get('version-group', change['version_group']['name'])['order'] <= selected_order]
            assert applicable, f'Missing historical crash effect for {name}'
            historical_text = ' '.join(entry.get('effect', '') for entry in applicable[-1]['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert historical_text == 'if this move misses, the user takes 1 point of damage in recoil.' and move['category'] == 'physical'
            move['crashOnMoveFailure'] = True
        if name == 'fury-cutter':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == 'power doubles every turn this move is used in succession after the first, maxing out after five turns.'
            move['powerRule'] = 'furyCutter'
        if name == 'rollout':
            effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'user is forced to use this move for five turns' in effect and 'to a maximum of 16x' in effect and 'if the user has used defense curl since entering the field' in effect
            move.update(powerRule='rollout', lockInMinTurns=5, lockInMaxTurns=5, lockEndsOnMiss=True, doublesRolloutAfterDefenseCurl=True)
        if name == 'tri-attack':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'one of these effects is selected at random' in full and 'do not each have independent chances' in full
            assert meta['ailment']['name'] == 'unknown' and meta['ailment_chance'] == values['effect_chance'] == 20
            move['randomInflictedStatuses'] = ['burn', 'freeze', 'paralysis']
            move['statusChance'] = 20
        if name == 'snore':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'only usable if the user is sleeping' in full and meta['flinch_chance'] == 30
            move['usableWhileAsleep'] = True
            move['flinchChance'] = 30
        if name == 'safeguard':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'")
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == "protects the user's field from major status ailments and confusion for five turns." and raw['target']['name'] == 'users-field'
            assert 'for five turns' in full and 'confusion' in full
            move['safeguard'] = True
        if name == 'yawn':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'puts the target to sleep at the end of the next turn' in full and meta['min_turns'] == meta['max_turns'] == 2
            assert raw['target']['name'] == 'selected-pokemon'
            move.update(inflictsDrowsiness=True, requiresStatusFree=True, alwaysHits=True)
        if name == 'twineedle':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert full.startswith('inflicts regular damage.') and 'hits twice in the same turn' in full and 'chance to poison the target' in full
            assert meta['category']['name'] == 'damage-ailment' and ailment == 'poison' and meta['min_hits'] == meta['max_hits'] == 2 and values['effect_chance'] == 20
        if name == 'trump-card':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'power is determined by the pp remaining for this move, after its pp cost is deducted' in full
            assert '4 or more' in full and '200' in full and 'ignores accuracy and evasion modifiers' in full
            assert move['category'] == 'special' and meta['category']['name'] == 'damage' and raw['power'] is None
            move.update(powerRule='trumpCard', ignoresAccuracyEvasionStages=True)
        if name == 'taunt':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\ufffd', '-').replace('\u2013', '-')
            assert 'only use damaging moves for the next 3-5 turns' in full
            assert raw['target']['name'] == 'selected-pokemon' and meta['category']['name'] == 'unique'
            move.update(tauntsTarget=True, tauntMinTurns=3, tauntMaxTurns=5)
        if name == 'splash':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == 'does nothing.' and raw['target']['name'] == 'user' and meta['category']['name'] == 'unique'
            move['alwaysFails'] = True
        if name == 'aqua-ring':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").replace('\ufffd', "'")
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").replace('\ufffd', "'")
            assert effect == "restores 1/16 of the user's max hp each turn." and 'at the end of each turn' in full and 'if the user leaves the field, this effect ends' in full
            assert raw['target']['name'] == 'user' and meta['category']['name'] == 'unique'
            move['aquaRing'] = True
        if name == 'ingrain':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").replace('\ufffd', "'")
            assert 'prevents the user from switching out' in full and 'regains 1/16 of its max hp at the end of every turn' in full
            assert 'if the user was immune to ground attacks, it will now take normal damage' in full and meta['ailment']['name'] == 'ingrain'
            move['ingrain'] = True
        sport_moves = {'mud-sport': ('electric', 'halvesElectricDamage'), 'water-sport': ('fire', 'halvesFireDamage')}
        if name in sport_moves:
            damage_type, field = sport_moves[name]
            short = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert short == f'halves all {damage_type}-type damage.' and f'{damage_type} moves inflict half damage, regardless of target' in full and 'if the user leaves the field, this effect ends' in full
            assert meta['category']['name'] == 'whole-field-effect' and raw['target']['name'] in {'entire-field', 'user'}
            move[field] = True
        if name == 'mist':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\ufffd', "'")
            assert 'immune to stat-lowering effects for five turns' in full and raw['target']['name'] == 'users-field' and meta['category']['name'] == 'field-effect'
            move['mist'] = True
        if name == 'lucky-chant':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\ufffd', "'")
            assert 'for five turns, opposing pokémon cannot score critical hits' in full and raw['target']['name'] == 'users-field' and meta['category']['name'] == 'field-effect'
            move['luckyChant'] = True
        if name in {'guard-swap', 'power-swap'}:
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            stage_pair = ('defense', 'specialDefense') if name == 'guard-swap' else ('attack', 'specialAttack')
            names = ' and '.join(stat.lower() for stat in ('defense', 'special defense') if name == 'guard-swap') if name == 'guard-swap' else 'attack and special attack'
            assert 'swaps its' in full and 'modifiers with the target' in full and raw['target']['name'] == 'selected-pokemon' and meta['category']['name'] == 'unique'
            assert all(word in full for word in names.split())
            move['statStageSwap'] = list(stage_pair)
        if name == 'psych-up':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            full = full.replace('\u2019', "'")
            assert "discards the user's stat changes and copies the target's" in full
            assert raw['target']['name'] == 'selected-pokemon' and meta['category']['name'] == 'unique'
            move['copyTargetStatStages'] = True
        if name == 'haze':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\ufffd', "'")
            assert 'removes stat, accuracy, and evasion modifiers from every' in full
            assert raw['target']['name'] == 'entire-field' and meta['category']['name'] == 'whole-field-effect'
            move['clearAllStatStages'] = True
        if name == 'spite':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").replace('\ufffd', "'")
            assert effect == "lowers the pp of the target's last used move by 4." and raw['target']['name'] == 'selected-pokemon' and meta['category']['name'] == 'unique'
            move['reduceLastMovePp'] = 4
        if name == 'charge':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").replace('\ufffd', "'")
            assert "raises the user's special defense by one stage" in full and 'electric move next turn' in full and 'power will be doubled' in full
            assert raw['target']['name'] == 'user' and meta['category']['name'] == 'net-good-stats'
            assert move.get('statChanges') == [{'target': 'self', 'stat': 'specialDefense', 'stages': 1}]
            move['chargeElectricBoost'] = True
        if name == 'tailwind':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\ufffd', "'")
            short = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\ufffd', "'")
            assert 'next three turns' in full and 'their original speed doubled' in full and 'for three turns' in short and 'friendly pok' in short and 'doubled speed' in short
            assert 'effect remains if the user leaves the field' in full
            assert raw['target']['name'] == 'users-field' and meta['category']['name'] == 'field-effect'
            move['tailwind'] = True
        if name in {'counter', 'mirror-coat'}:
            expected_category = 'physical' if name == 'counter' else 'special'
            expected_type = 'fighting' if name == 'counter' else 'psychic'
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert f'last opposing pok' in full and f'with a {expected_category} move this turn' in full
            assert f'inflicts twice the damage that move did to the user' in full and 'if there is no eligible target, this move will fail' in full
            assert 'type immunity applies, but other type effects are ignored' in full
            assert move['category'] == expected_category and move['type'] == expected_type and raw['target']['name'] == 'specific-move'
            move['counterDamageCategory'] = expected_category
        if name in {'foresight', 'odor-sleuth', 'miracle-eye'}:
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").replace('\ufffd', "'")
            assert 'resets the target' in full and 'evasion to normal' in full and 'prevents any further boosting' in full and 'until the target leaves the field' in full
            assert 'this move itself ignores accuracy and evasion modifiers' in full
            assert move['category'] == 'status' and meta['category']['name'] == 'ailment' and raw['target']['name'] == 'selected-pokemon'
            if name == 'miracle-eye':
                assert 'dark pok' in full and 'takes normal damage from psychic moves' in full
                move['miracleEye'] = True
            else:
                assert 'ghost under this effect takes normal damage from normal and fighting moves' in full
                move['foresight'] = True
            move['alwaysHits'] = True
        if name == 'roost':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            short = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert full == 'heals the user for half its max hp.  if the user is flying, its flying type is ignored until the end of this turn.'
            assert short == 'heals the user by half its max hp.' and meta['category']['name'] == 'heal' and meta['healing'] == 50
            assert raw['target']['name'] == 'user'
            move.update(healingPercent=50, roost=True)
        if name in {'lock-on', 'mind-reader'}:
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'same target again before the end of the next turn' in full and 'guaranteed to hit' in full
            assert 'allows the user to hit pok' in full and 'off the field due to moves such as dig or fly' in full
            assert 'has a (100 - accuracy)% chance to break through the protection' in full
            assert raw['target']['name'] == 'selected-pokemon' and meta['category']['name'] == 'unique' and move['category'] == 'status'
            move.update(lockOn=True, alwaysHits=True)
        if name == 'worry-seed':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").replace('\ufffd', "'")
            full = ' '.join(full.split())
            assert full == "changes the target's ability to insomnia. if the target's ability is truant or multitype, this move will fail."
            assert raw['target']['name'] == 'selected-pokemon' and meta['category']['name'] == 'unique' and move['category'] == 'status'
            move['setTargetAbility'] = 'insomnia'
        if name == 'imprison':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'")
            full = ' '.join(full.split())
            assert 'prevents any pok' in full and 'opposing side of the field from using any move the user knows until the user leaves the field' in full
            assert 'if no opposing pok' in full and 'knows any of the user\'s moves when this move is used, this move will fail' in full
            assert raw['target']['name'] == 'user' and meta['category']['name'] == 'unique' and move['category'] == 'status'
            move['imprison'] = True
        if name == 'last-resort':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'")
            full = ' '.join(full.split())
            assert full == "inflicts regular damage. this move can only be used if each of the user's other moves has been used at least once since the user entered the field. if this is the user's only move, this move will fail."
            assert move['category'] == 'physical' and meta['category']['name'] == 'damage'
            move['lastResort'] = True
        if name == 'stockpile':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'")
            full = ' '.join(full.split())
            assert 'raises the user' in full and 'defense and special defense by one stage each' in full and 'up to three levels of energy can be stored' in full
            assert 'energy is still stored even if the stat boosts cannot be applied' in full and raw['target']['name'] == 'user'
            assert move['statChanges'] == [{'target': 'self', 'stat': 'defense', 'stages': 1}, {'target': 'self', 'stat': 'specialDefense', 'stages': 1}]
            move['stockpile'] = True
        if name == 'spit-up':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'")
            full = ' '.join(full.split())
            assert 'power is equal to 100 times the amount of energy stored by stockpile' in full and 'ignores the random factor in the damage formula' in full
            assert 'stored energy is consumed' in full and 'if the user has no energy stored, this move will fail' in full
            assert move['category'] in {'physical', 'special'} and meta['category']['name'] == 'damage' and raw['target']['name'] == 'selected-pokemon'
            move.update(power=0, powerRule='stockpile', stockpileConsumes=True, ignoresDamageVariance=True)
        if name == 'swallow':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'")
            full = ' '.join(full.split())
            assert 'heals the user depending on the amount of energy stored by stockpile' in full and '1/4 its max hp after one use' in full
            assert '1/2 its max hp after two uses' in full and 'fully after three uses' in full and 'stored energy is consumed' in full
            assert 'if the user has no energy stored, this move will fail' in full and meta['category']['name'] == 'heal' and raw['target']['name'] == 'user'
            move['swallow'] = True
        if name in {'conversion', 'conversion-2'}:
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'")
            full = ' '.join(full.split())
            if name == 'conversion':
                assert "user's type changes to the type of one of its moves, selected at random" in full
                assert 'only moves with a different type are eligible' in full and 'curse is never eligible' in full and 'if the user has no suitable moves, this move will fail' in full
                assert raw['target']['name'] == 'user'
                move['conversion'] = True
            else:
                assert "changes the user's type to a type either resistant or immune to the last damaging move that hit it" in full
                assert 'new type is selected at random and cannot be a type the user already is' in full
                assert 'if there is no eligible new type, this move will fail' in full and raw['target']['name'] == 'selected-pokemon'
                move['conversion2'] = True
            assert meta['category']['name'] == 'unique' and move['category'] == 'status'
        if name in ('dragon-rush', 'bite', 'headbutt') or (meta['flinch_chance'] and name not in {'fake-out', 'snore', 'sky-attack'}):
            assert move['category'] in ('physical', 'special') and meta['category']['name'] in ('damage', 'damage-ailment') and meta['crit_rate'] == 0
            assert 0 < meta['flinch_chance'] <= 100
            move['flinchChance'] = meta['flinch_chance']
        if name == 'ice-fang':
            assert move['category'] == 'physical' and meta['category']['name'] == 'damage-ailment'
            assert meta['ailment']['name'] == 'freeze' and meta['ailment_chance'] == 10 and meta['flinch_chance'] == 10
            assert meta['crit_rate'] == 0 and raw['target']['name'] == 'selected-pokemon' and not raw['stat_changes']
            prose = ' '.join(entry['effect'] for entry in values['effect_entries'] if entry['language']['name'] == 'en')
            assert 'separate chance' in prose, 'Ice Fang must retain independent source secondary effects'
            move['flinchChance'] = meta['flinch_chance']
        if meta['crit_rate']:
            assert meta['crit_rate'] <= 3 and meta['category']['name'] in ('damage', 'damage-ailment')
            move['criticalStageBoost'] = meta['crit_rate']
        if meta['drain']:
            if meta['drain'] < 0:
                prose = ' '.join(entry['short_effect'] for entry in values['effect_entries'] if entry['language']['name'] == 'en')
                assert move['category'] == 'physical' and meta['category']['name'] in ('damage', 'damage-ailment') and 'recoil' in prose.lower(), 'Unsupported recoil source semantics'
                move['recoilPercent'] = abs(meta['drain'])
            else:
                assert meta['drain'] > 0
                move['drainPercent'] = meta['drain']
        if name == 'rest':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\ufffd', "'")
            assert effect == 'user sleeps for two turns, completely healing itself.' and raw['target']['name'] == 'user'
            assert 'falls to sleep and immediately regains all its hp' in full and 'sleep will replace it' in full
            move.update(healingPercent=100, requiresMissingHp=True, inflictedStatus='sleep', statusTarget='self',
                        statusChance=100, minStatusTurns=2, maxStatusTurns=2, replacesUserStatusWithInflictedStatus=True)
        if meta['category']['name'] == 'heal' and meta['healing'] and name != 'swallow':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            if name in {'moonlight', 'synthesis'}:
                assert effect == 'heals the user by half its max hp.  affected by weather.'
                assert raw['target']['name'] == 'user' and meta['healing'] == 50
                move.update(healingPercent=50, weatherRecovery=True)
            else:
                assert effect == 'heals the user by half its max hp.', 'Unsupported direct recovery effect'
                assert raw['target']['name'] == 'user' and meta['healing'] == 50
                move['healingPercent'] = meta['healing']
        if name == 'refresh':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == 'cleanses the user of a burn, paralysis, or poison.' and raw['target']['name'] == 'user'
            move['curesUserStatuses'] = ['burn', 'paralysis', 'poison']
        if name == 'aromatherapy':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == 'cures the entire party of major status effects.' and raw['target']['name'] == 'user-and-allies'
            move['curesPartyStatuses'] = True
        if name == 'dream-eater':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").replace('\ufffd', "'")
            assert re.fullmatch(r'only works on sleeping .+ drains half the damage inflicted to heal the user\.', effect)
            assert move['category'] == 'special' and meta['category']['name'] == 'damage-heal' and meta['drain'] == 50
            move.update(drainPercent=50, requiresSleepingTarget=True)
        if name == 'false-swipe':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").replace('\ufffd', "'")
            assert effect == "cannot lower the target's hp below 1." and move['category'] == 'physical' and meta['category']['name'] == 'damage'
            move['leavesTargetAtOneHp'] = True
        if name == 'wake-up-slap':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\ufffd', "'")
            assert effect == 'if the target is asleep, has double power and wakes it up.' and move['category'] == 'physical' and meta['category']['name'] == 'damage'
            move.update(powerRule='targetAsleep', wakesTargetIfAsleep=True)
        if name in {'bind', 'wrap', 'sand-tomb', 'fire-spin', 'clamp', 'whirlpool'}:
            effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert meta['ailment']['name'] == 'trap' and meta['category']['name'] == 'damage-ailment'
            assert 'for the next 2–5 turns' in effect and 'damaged for 1/16 its max hp at the end of each turn' in effect
            move['trapTarget'] = {'minTurns': 2, 'maxTurns': 5, 'damageFraction': 1 / 16}
        if name == 'disable':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").replace('\u2013', '-').replace('\ufffd', "'")
            assert "disables the target's last used move, preventing its use for 4-7 turns, selected at random" in full and meta['category']['name'] == 'unique'
            move.update(disableLastMove=True, disableMinTurns=4, disableMaxTurns=7)
        if name == 'role-play':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").replace('\ufffd', "'")
            assert effect == "copies the target's ability." and raw['target']['name'] == 'selected-pokemon' and meta['category']['name'] == 'unique'
            move['copyTargetAbility'] = True
        weather_moves = {'rain-dance': ('rain', 'changes the weather to rain for five turns.'),
                         'sunny-day': ('sun', 'changes the weather to sunny for five turns.'),
                         'hail': ('hail', 'changes the weather to a hailstorm for five turns.'),
                         'sandstorm': ('sandstorm', 'changes the weather to a sandstorm for five turns.')}
        if name in weather_moves:
            weather, expected_effect = weather_moves[name]
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == expected_effect and raw['target']['name'] == 'entire-field' and meta['category']['name'] == 'whole-field-effect'
            move['weather'] = weather
        if name in {'reflect', 'light-screen'}:
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            expected = 'reduces damage from physical attacks by half.' if name == 'reflect' else 'reduces damage from special attacks by 50% for five turns.'
            full_effect = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == expected and 'for five turns' in full_effect and raw['target']['name'] == 'users-field'
            move['screen'] = 'reflect' if name == 'reflect' else 'lightScreen'
        if name in {'protect', 'detect'}:
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == 'prevents any moves from hitting the user this turn.' and raw['target']['name'] == 'user'
            move['protectUser'] = True
        if name == 'endure':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'").replace('\ufffd', "'")
            assert effect == "prevents the user's hp from lowering below 1 this turn." and raw['target']['name'] == 'user'
            move['endureUser'] = True
        if name == 'feint':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == 'hits through protect and detect.' and raw['target']['name'] == 'selected-pokemon'
            move['ignoresProtection'] = True
        if name == 'brick-break':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == 'destroys reflect and light screen.' and 'destroys any light screen or reflect on the target' in full
            move['breaksScreens'] = True
        if name == 'fake-out':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == 'can only be used as the first move after the user enters battle.  causes the target to flinch.' and meta['flinch_chance'] == 100
            move['requiresFirstTurnAfterEntry'] = True
            move['flinchChance'] = 100
        if name == 'flame-wheel':
            full = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert 'frozen pokémon may use this move, in which case they will thaw.' in full or 'frozen pokemon may use this move, in which case they will thaw.' in full
            move['thawsUserIfFrozen'] = True
        if name == 'acupressure':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower().replace('\u2019', "'")
            assert effect == "raises one of a friendly pokémon's stats at random by two stages." or effect == "raises one of a friendly pokemon's stats at random by two stages."
            assert raw['target']['name'] in {'user', 'user-or-ally'} and move['category'] == 'status'
            move['randomStatBoost'] = True
        if name == 'belly-drum':
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == "user pays half its max hp to max out its attack." and raw['target']['name'] == 'user'
            move['bellyDrum'] = True
        if name in {'block', 'mean-look'}:
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == 'prevents the target from leaving battle.' and raw['target']['name'] == 'selected-pokemon'
            move['preventsEscape'] = True
        if name in {'hyper-beam', 'giga-impact'}:
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert effect == 'user foregoes its next turn to recharge.' and raw['target']['name'] == 'selected-pokemon'
            move['rechargesNextTurn'] = True
        charge_moves = {
            'solar-beam': ('Requires a turn to charge before attacking.', True, True, 0),
            'razor-wind': ('Requires a turn to charge before attacking.', False, False, 0),
            'skull-bash': ("Raises the user's Defense by one stage.  User charges for one turn before attacking.", False, False, 1),
            'sky-attack': ('User charges for one turn before attacking.  Has a chance to make the target flinch.', False, False, 0),
        }
        if name in charge_moves:
            expected, skips_in_sun, halves_outside_sun, defense_boost = charge_moves[name]
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en')
            assert ' '.join(effect.replace('\u2019', "'").split()).lower() == ' '.join(expected.split()).lower(), f'Unsupported charge semantics: {name}: {effect}'
            assert move['category'] in ('physical', 'special') and raw['target']['name'] in {'selected-pokemon', 'all-opponents'}
            move['chargesBeforeAttack'] = True
            if skips_in_sun:
                move['skipsChargeInSun'] = True
            if halves_outside_sun:
                move['weatherHalvesPower'] = True
            if defense_boost:
                move['chargeDefenseBoost'] = defense_boost
            if name == 'sky-attack':
                assert meta['flinch_chance'] == 30 and meta['crit_rate'] == 1
                move['flinchChance'] = meta['flinch_chance']
        semi_moves = {'fly': ('air', 'flies high into the air'), 'bounce': ('air', 'bounces high into the air'),
                      'dig': ('underground', 'digs underground'), 'dive': ('underwater', 'dives underwater')}
        if name in semi_moves:
            mode, phrase = semi_moves[name]
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert phrase in effect and 'hits next turn' in effect and raw['target']['name'] == 'selected-pokemon'
            move['chargesBeforeAttack'] = True
            move['semiInvulnerableWhileCharging'] = mode
        bypass_moves = {'gust': ('air',), 'twister': ('air',), 'sky-uppercut': ('air',), 'earthquake': ('underground',),
                        'magnitude': ('underground',), 'surf': ('underwater',), 'whirlpool': ('underwater',)}
        if name in bypass_moves:
            modes = bypass_moves[name]
            prose = ' '.join(entry.get('effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            assert any(('fly' in prose or 'bounce' in prose) if mode == 'air' else ('dig' in prose) if mode == 'underground' else ('dive' in prose) for mode in modes), f'Unrecognized semi-invulnerable bypass for {name}: {prose}'
            move['hitsSemiInvulnerable'] = list(modes)
            if name != 'sky-uppercut':
                move['doublesDamageAgainstSemiInvulnerable'] = True
        power_rules = {
            'brine': ('brine', None),
            'assurance': ('targetDamaged', 'power is doubled if the target has already received damage this turn.'),
            'avalanche': ('userDamaged', 'inflicts double damage if the user takes damage before attacking this turn.'),
            'revenge': ('userDamaged', 'inflicts double damage if the user takes damage before attacking this turn.'),
            'payback': ('targetActed', 'power is doubled if the target has already moved this turn.'),
            'flail': ('lowHp', 'inflicts more damage when the user has less hp remaining, with a maximum of 200 power.'),
            'reversal': ('lowHp', 'inflicts more damage when the user has less hp remaining, with a maximum of 200 power.'),
            'gyro-ball': ('gyroBall', 'power raises when the user has lower speed, up to a maximum of 150.'),
            'wring-out': ('wringOut', 'power increases against targets with more hp remaining, up to a maximum of 121 power.'),
            'low-kick': ('lowKick', 'inflicts more damage to heavier targets, with a maximum of 120 power.'),
            'punishment': ('punishment', 'power increases against targets with more raised stats, up to a maximum of 200.'),
        }
        if name in power_rules:
            power_rule, expected_effect = power_rules[name]
            effect = ' '.join(entry.get('short_effect', '') for entry in values['effect_entries'] if entry['language']['name'] == 'en').lower()
            effect_matches = re.fullmatch(r'has double power against .+ that have less than half their max hp remaining\.', effect) if name == 'brine' else effect == expected_effect
            assert effect_matches and move['category'] in ('physical', 'special') and (move['power'] > 0 or power_rule in {'lowHp', 'gyroBall', 'wringOut', 'lowKick', 'punishment'})
            move['powerRule'] = power_rule
        if meta['min_hits'] is not None:
            move.update(minHits=meta['min_hits'], maxHits=meta['max_hits'])
        moves[name] = move

    if args.group:
        previous_learnsets_path = SOURCE / 'source-learnsets.json'
        if not previous_learnsets_path.exists():
            selected.update(species)
            print('No complete cached learnset report exists; refreshing all registered species.')
        else:
            previous_source_learnsets = read_json(previous_learnsets_path)
            previous_unimplemented = previous_source_learnsets.get('unimplemented', {})
            supported_move_ids = set(moves)
            newly_supported = {
                species_id for species_id, entries in previous_unimplemented.items()
                if species_id in species and any(entry.get('moveId') in supported_move_ids for entry in entries)
            }
            missing_reports = set(species) - set(previous_source_learnsets.get('species', {}))
            if newly_supported or missing_reports:
                selected.update(species)
                if newly_supported:
                    print('Newly supported moves occur in cached learnsets outside the requested group; refreshing all registered species.')
                if missing_reports:
                    print('The cached learnset report omits registered species; refreshing all registered species.')

    full_learnsets, learning, pending = {}, {}, {}
    for species_id, definition in species.items():
        if species_id not in selected:
            continue
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
        assert supported, f'No implemented official level-up move at any level for registered species {species_id}.'
        # An empty level-five preview is accurate when the first implemented move is learned later;
        # never replace the source move with Tackle or a fabricated fallback.
        definition['defaultMoveIds'] = preview[-4:]
        seen = set()
        learning[species_id] = []
        for entry in supported:
            key = (entry['level'], entry['moveId'])
            if entry['level'] < 2 or key in seen:
                continue
            seen.add(key)
            learning[species_id].append(entry)
        pending[species_id] = [entry for entry in entries if entry['moveId'] not in moves]

    # Preserve and verify cached research sources as well as runtime sources.
    # Candidate species/moves can be deferred without losing their provenance.
    previous_manifest_path = SOURCE / 'manifest.json'
    if previous_manifest_path.exists():
        for resource_id in read_json(previous_manifest_path)['resources']:
            if resource_id not in manifest:
                kind, key = resource_id.split('/', 1)
                get(kind, key)

    source = {'provider': 'PokeAPI', 'versionGroup': VERSION_GROUP, 'language': 'it', 'manifest': 'content/sources/pokeapi/manifest.json'}
    species_data = read_json(ROOT / 'content/battle/species.v1.json')
    species_data['species'] = species
    species_data['moveSource'] = source
    species_data['movePolicy'] = 'officialLearnset determines new creatures at their actual level; defaultMoveIds is a level-five preview. Prototype save compatibility is not required.'
    species_data['genderPolicy'] = 'Battle gender is selected deterministically from the official PokéAPI female ratio in eighths and the stable creature instance ID; genderless species remain genderless.'
    if args.group:
        previous_learnsets = read_json(SOURCE / 'source-learnsets.json') if (SOURCE / 'source-learnsets.json').exists() else {'species': {}, 'unimplemented': {}}
        previous_learnsets['species'].update(full_learnsets)
        previous_learnsets['unimplemented'].update(pending)
        full_learnsets = previous_learnsets['species']
        pending = previous_learnsets['unimplemented']
        previous_manifest = read_json(SOURCE / 'manifest.json') if (SOURCE / 'manifest.json').exists() else {'resources': {}}
        previous_manifest['resources'].update(manifest)
        manifest = previous_manifest['resources']
        previous_moves = read_json(ROOT / 'content/battle/moves.v1.json')['moves']
        previous_moves.update(moves)
        moves = previous_moves
        previous_learning = read_json(ROOT / 'content/battle/level-up-moves.v1.json')['species']
        previous_learning.update(learning)
        learning = previous_learning
    starters = None
    if not args.group:
        starters = read_json(ROOT / 'content/starters/starting-partners.v1.json')
        for starter in starters['starters']:
            starter['moves'] = [{'id': move_id, 'pp': moves[move_id]['maxPp']} for move_id in species[str(starter['speciesId'])]['defaultMoveIds']]
        starters['moveSource'] = source
    outputs = {
        ROOT / 'content/battle/moves.v1.json': {'version': 12, 'status': 'prototype', 'source': source,
            'notes': ['Generated by tools/import_pokeapi_battle.py from cached PokéAPI responses. No balance overrides.',
                      'Historical values apply before the past_values version_group change boundary. Null accuracy is represented by alwaysHits:true.',
                      'Contact and sound properties come from the cached official PokéAPI move_flag_map.csv and move_flags.csv, with hashes in the source manifest.',
                      'Veloria has no Pokémon-held item state; item-dependent moves explicitly fail or retain only their ordinary damage effect instead of inventing item effects.',
                      'Metronome draws from the current Veloria move catalog; its official excluded-move list is enforced, and the pool does not expand the catalog beyond this regional release.',
                      'Gravity follows the Gen IV field rule: 5/3 accuracy multiplier without evasion-stage mutation; its Ground grounding effects and five-turn duration use the official source mechanics.',
                      'Full source learnsets and remaining unsupported move mechanics are tracked by content/sources/pokeapi/gen1-move-coverage.json.'], 'moves': moves},
        ROOT / 'content/battle/species.v1.json': species_data,
        ROOT / 'content/battle/level-up-moves.v1.json': {'version': 1, 'status': 'prototype', 'source': source,
            'note': 'Only implemented moves from the official HGSS level-up learnsets. All original entries, including unimplemented effects, are retained in source-learnsets.json.', 'species': learning},
        SOURCE / 'source-learnsets.json': {'source': source, 'species': full_learnsets, 'unimplemented': pending},
        SOURCE / 'manifest.json': {'versionGroup': VERSION_GROUP, 'resources': dict(sorted(manifest.items()))},
    }
    if starters is not None:
        outputs[ROOT / 'content/starters/starting-partners.v1.json'] = starters
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
