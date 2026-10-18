"""Import reference evolutions for the current species catalog; offline and reproducible."""
import argparse
import json
from import_pokeapi_battle import ROOT, resource


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

    def key_of(reference):
        return int(reference['url'].rstrip('/').split('/')[-1])

    version_group = load('version-group', 'heartgold-soulsilver')

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
            if key_of(target['generation']) > 4:
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
                # Current catalog only needs simple levels and evolution stones.
                # Fail closed if upstream introduces a condition we cannot explain.
                extra = {key: value for key, value in detail.items()
                         if key not in {'trigger', 'min_level', 'item', 'version_group', 'is_default', 'required_pokemon_form', 'evolved_pokemon_form'}
                         and value is not None and value is not False and value != '' and value != []}
                if extra:
                    raise ValueError(f'Unsupported evolution conditions for {species_id}: {extra}')
                trigger = detail['trigger']['name']
                item_name = None
                if trigger == 'use-item' and detail['item']:
                    item = load('item', key_of(detail['item']))
                    item_name = next(name['name'] for name in item['names'] if name['language']['name'] == 'it')
                elif trigger != 'level-up' or not detail['min_level']:
                    raise ValueError(f'Unsupported evolution trigger for {species_id}: {detail}')
                entry = {'targetSpeciesId': target_id,
                         'targetName': next(name['name'] for name in target['names'] if name['language']['name'] == 'it'),
                         'trigger': trigger, 'minimumLevel': detail['min_level'], 'itemName': item_name}
                if entry not in evolutions:
                    evolutions.append(entry)
        entries[str(species_id)] = {'evolutions': evolutions}

    progression = json.loads((ROOT / 'content/battle/progression.v1.json').read_text(encoding='utf-8'))
    for rule in progression['evolutions']:
        if not any(entry['targetSpeciesId'] == rule['toSpeciesId'] and entry['trigger'] == 'level-up'
                   and entry['minimumLevel'] == rule['minimumLevel']
                   for entry in entries[str(rule['fromSpeciesId'])]['evolutions']):
            raise ValueError(f'Runtime evolution disagrees with its API source: {rule}')

    outputs = {
        ROOT / 'content/battle/evolution-reference.v1.json': {
            'version': 1, 'source': 'PokeAPI', 'scope': 'Species and evolution methods available through Generation IV',
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
