"""Import declared species parameters from cached PokéAPI resources."""
import argparse
import json
from import_pokeapi_battle import ROOT, resource

STATS = {'hp': 'hp', 'attack': 'attack', 'defense': 'defense', 'special-attack': 'specialAttack', 'special-defense': 'specialDefense', 'speed': 'speed'}


def parameters_for_generation(raw, generation):
    """Past snapshots apply through their stated generation; choose the closest per field."""
    generation_id = lambda snapshot: int(snapshot['generation']['url'].rstrip('/').split('/')[-1])
    stats = {STATS[entry['stat']['name']]: entry['base_stat'] for entry in raw['stats']}
    for api_name, field in STATS.items():
        historical = [(generation_id(snapshot), entry['base_stat']) for snapshot in raw.get('past_stats', [])
                      if generation_id(snapshot) >= generation for entry in snapshot['stats'] if entry['stat']['name'] == api_name]
        if historical:
            stats[field] = min(historical)[1]
    type_snapshots = [snapshot for snapshot in raw.get('past_types', []) if generation_id(snapshot) >= generation]
    types = min(type_snapshots, key=generation_id)['types'] if type_snapshots else raw['types']
    return stats, [item['type']['name'] for item in sorted(types, key=lambda item: item['slot'])]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args(argv)
    path = ROOT / 'content/battle/species.v1.json'
    data = json.loads(path.read_text(encoding='utf-8'))
    config = json.loads((ROOT / 'content/battle/species-imports.v1.json').read_text(encoding='utf-8'))
    ids = [entry['speciesId'] for entry in config['imports']]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate species imports')
    origins = {}
    def get(kind, species_id):
        raw, origin = resource(kind, species_id, args.fetch and not args.check)
        origins[f'{kind}/{species_id}'] = origin
        return raw
    group = get('version-group', config['versionGroup'])
    generation = int(group['generation']['url'].rstrip('/').split('/')[-1])
    for entry in config['imports']:
        species_id = entry['speciesId']
        parent = data['species'][str(entry['templateSpeciesId'])]
        raw = get('pokemon', species_id)
        base_stats, types = parameters_for_generation(raw, generation)
        names = get('pokemon-species', species_id)
        expected = {
            'speciesId': species_id,
            'name': next(name['name'] for name in names['names'] if name['language']['name'] == 'it'),
            'types': types,
            'baseStats': base_stats,
            'experienceYield': raw['base_experience'],
            'growthCurveId': f"pokeapi_growth_{names['growth_rate']['name']}_v1",
        }
        current = data['species'].get(str(species_id), {})
        if args.check:
            if any(current.get(key) != value for key, value in expected.items()):
                raise ValueError(f'Species parameter drift for {species_id}')
        else:
            data['species'][str(species_id)] = {**expected,
                'defaultMoveIds': current.get('defaultMoveIds', parent['defaultMoveIds']),
                **({'officialLearnset': current['officialLearnset']} if 'officialLearnset' in current else {}),
            }
    manifest_path = ROOT / 'content/sources/pokeapi/species-manifest.json'
    manifest = {'resources': dict(sorted(origins.items())), 'note': config['note']}
    if args.check:
        if json.loads(manifest_path.read_text(encoding='utf-8')) != manifest:
            raise ValueError('Species source manifest drift')
    else:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"Verified {len(config['imports'])} imported species parameters from cached API resources.")


if __name__ == '__main__':
    main()
