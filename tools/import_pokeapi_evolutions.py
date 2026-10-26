"""Import reference evolutions for the current species catalog; offline and reproducible."""
import argparse
import csv
import json
from import_pokeapi_battle import ROOT, resource

MAX_REFERENCE_GENERATION = 4


def build_evolution_entries(registry, version_group, load):
    """Describe Gen-IV evolution methods without extending the runtime roster.

    Reference targets may be outside Gen I–II. Only progression.v2.json enables
    actual evolutions; this catalog also explains official unavailable methods.
    """
    def key_of(reference):
        return int(reference['url'].rstrip('/').split('/')[-1])

    def find(node, species_id):
        if key_of(node['species']) == species_id:
            return node
        for child in node['evolves_to']:
            match = find(child, species_id)
            if match is not None:
                return match
        return None

    entries = {}
    for species_id in sorted(map(int, registry)):
        species = load('pokemon-species', species_id)
        chain = load('evolution-chain', key_of(species['evolution_chain']))
        current = find(chain['chain'], species_id)
        if current is None:
            raise ValueError(f'Species {species_id} missing from its evolution chain')
        evolutions = []
        for child in current['evolves_to']:
            target_id = key_of(child['species'])
            target = load('pokemon-species', target_id)
            if key_of(target['generation']) > MAX_REFERENCE_GENERATION:
                continue
            for detail in child['evolution_details']:
                if detail.get('version_group') and key_of(detail['version_group']) > version_group['id']:
                    continue  # HGSS and earlier; exclude later methods and regional forms.
                if detail.get('region'):
                    continue
                if detail.get('required_pokemon_form') and detail['required_pokemon_form']['name'] != species['name']:
                    continue
                if detail.get('evolved_pokemon_form') and detail['evolved_pokemon_form']['name'] != target['name']:
                    continue
                # Reference-only location evolutions do not enable runtime rules.
                # Fail closed if upstream introduces a condition we cannot explain.
                extra = {key: value for key, value in detail.items()
                         if key not in {'trigger', 'min_level', 'item', 'location', 'near_special_rock', 'held_item', 'known_move', 'min_happiness', 'time_of_day', 'version_group', 'is_default', 'required_pokemon_form', 'evolved_pokemon_form'}
                         and value is not None and value is not False and value != '' and value != []}
                if extra:
                    raise ValueError(f'Unsupported evolution conditions for {species_id}: {extra}')
                trigger = detail['trigger']['name']
                item_name = None
                item_id = None
                location_name = None
                held_item_name = None
                known_move_name = None
                if detail.get('near_special_rock') and not detail.get('location'):
                    raise ValueError(f'Special-rock evolution lacks its reference location for {species_id}')
                happiness = detail.get('min_happiness')
                time_of_day = detail.get('time_of_day') or None
                if happiness is not None and (not isinstance(happiness, int) or happiness < 1):
                    raise ValueError(f'Invalid friendship condition for {species_id}')
                if time_of_day not in (None, 'day', 'night'):
                    raise ValueError(f'Unsupported time-of-day condition for {species_id}: {time_of_day}')
                if detail.get('held_item'):
                    held_item = load('item', key_of(detail['held_item']))
                    held_item_name = next(name['name'] for name in held_item['names'] if name['language']['name'] == 'it')
                if detail.get('known_move'):
                    known_move = load('move', key_of(detail['known_move']))
                    known_move_name = next(name['name'] for name in known_move['names'] if name['language']['name'] == 'it')
                    if trigger != 'level-up':
                        raise ValueError(f'Unsupported known-move trigger for {species_id}: {detail}')
                if detail.get('location'):
                    if trigger != 'level-up':
                        raise ValueError(f'Unsupported location trigger for {species_id}: {detail}')
                    location = load('location', key_of(detail['location']))
                    location_names = {name['language']['name']: name['name'] for name in location['names']}
                    location_name = location_names.get('it') or location_names.get('en')
                    if not location_name:
                        raise ValueError(f'Missing Italian/English location name for {species_id}')
                if trigger == 'use-item' and detail['item']:
                    item = load('item', key_of(detail['item']))
                    item_id = item['name']
                    item_name = next(name['name'] for name in item['names'] if name['language']['name'] == 'it')
                elif trigger == 'trade':
                    pass  # Reference only; this does not enable a multiplayer evolution.
                elif trigger != 'level-up' or not (detail['min_level'] or location_name or happiness or held_item_name or known_move_name):
                    raise ValueError(f'Unsupported evolution trigger for {species_id}: {detail}')
                entry = {'targetSpeciesId': target_id,
                         'targetName': next(name['name'] for name in target['names'] if name['language']['name'] == 'it'),
                         'trigger': trigger, 'minimumLevel': detail['min_level'], 'itemName': item_name}
                if item_id:
                    entry['itemId'] = item_id
                if location_name:
                    entry['locationName'] = location_name
                if detail.get('near_special_rock'):
                    entry['nearSpecialRock'] = True
                if held_item_name:
                    entry['heldItemName'] = held_item_name
                if known_move_name:
                    entry['knownMoveName'] = known_move_name
                if happiness:
                    entry['minimumHappiness'] = happiness
                if time_of_day:
                    entry['timeOfDay'] = time_of_day
                if entry not in evolutions:
                    evolutions.append(entry)
        entries[str(species_id)] = {'evolutions': evolutions}
    return entries


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args(argv)
    registry = json.loads((ROOT / 'content/battle/species.v1.json').read_text(encoding='utf-8'))['species']
    resources = {}

    def load(kind, key):
        data, origin = resource(kind, key, args.fetch)
        resources[f'{kind}/{key}'] = origin
        return data

    version_group = load('version-group', 'heartgold-soulsilver')
    entries = build_evolution_entries(registry, version_group, load)

    progression_path = ROOT / 'content/battle/progression.v2.json'
    progression = json.loads(progression_path.read_text(encoding='utf-8'))
    with (ROOT / 'assets/ASSET_REGISTER.csv').open(encoding='utf-8', newline='') as handle:
        registered_assets = {row['asset_id'] for row in csv.DictReader(handle)}
    previous_rules = {(rule['fromSpeciesId'], rule['toSpeciesId']): rule
                      for rule in progression['evolutions']}
    level_rules = []
    trade_rules = []
    for species_id, species_entry in entries.items():
        source_id = int(species_id)
        if source_id > 151:
            continue
        for evolution in species_entry['evolutions']:
            target_id = evolution['targetSpeciesId']
            if target_id > 151:
                continue
            if evolution['trigger'] == 'level-up':
                if (not isinstance(evolution['minimumLevel'], int) or evolution.get('locationName') or evolution.get('heldItemName')
                        or evolution.get('knownMoveName') or evolution.get('minimumHappiness') or evolution.get('timeOfDay')):
                    raise ValueError(f'Gen I level evolution has unsupported conditions: {source_id} -> {target_id}: {evolution}')
                rule = {'fromSpeciesId': source_id, 'toSpeciesId': target_id, 'minimumLevel': evolution['minimumLevel']}
                previous = previous_rules.get((source_id, target_id))
                if previous and previous.get('assetId'):
                    rule['assetId'] = previous['assetId']
                else:
                    candidate = f'pokeapi-gen1-{target_id}-v1-webp'
                    if candidate not in registered_assets:
                        raise ValueError(f'Evolution target {target_id} has no registered official Gen-I artwork asset: {candidate}')
                    rule['assetId'] = candidate
                level_rules.append(rule)
            elif evolution['trigger'] == 'trade':
                trade_rules.append({'fromSpeciesId': source_id, 'toSpeciesId': target_id})
    progression['evolutions'] = sorted(level_rules, key=lambda rule: (rule['fromSpeciesId'], rule['toSpeciesId']))
    trade_catalog = {'version': 1, 'versionGroup': 'heartgold-soulsilver',
                     'note': 'Official trade-trigger branches whose source and target are both National Dex 1–151; an NPC trade service can enable these in the single-player region.',
                     'rules': sorted(trade_rules, key=lambda rule: (rule['fromSpeciesId'], rule['toSpeciesId'])),
                     'sourceManifest': 'content/sources/pokeapi/evolution-manifest.json'}
    for rule in progression['evolutions']:
        if not any(entry['targetSpeciesId'] == rule['toSpeciesId'] and entry['trigger'] == 'level-up'
                   and entry['minimumLevel'] == rule['minimumLevel']
                   for entry in entries[str(rule['fromSpeciesId'])]['evolutions']):
            raise ValueError(f'Runtime evolution disagrees with its API source: {rule}')

    outputs = {
        progression_path: progression,
        ROOT / 'content/battle/trade-evolutions.v1.json': trade_catalog,
        ROOT / 'content/battle/evolution-reference.v1.json': {
            'version': 1, 'source': 'PokeAPI', 'scope': 'Evolution reference through Generation IV for the registered species; informational targets do not extend the Gen I–II runtime roster',
            'sourceManifest': 'content/sources/pokeapi/evolution-manifest.json', 'species': entries,
        },
        ROOT / 'content/sources/pokeapi/evolution-manifest.json': {'resources': dict(sorted(resources.items()))},
    }
    for path, data in outputs.items():
        expected = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
        if args.check:
            if not path.exists() or path.read_text(encoding='utf-8') != expected:
                raise ValueError(f'Evolution source or generated data drift: {path}')
        else:
            path.write_text(expected, encoding='utf-8')
    print(f'Verified evolution reference for {len(entries)} species from {len(resources)} cached API resources.')


if __name__ == '__main__':
    main()
