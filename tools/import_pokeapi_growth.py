"""Generate official per-species XP tables from cached PokéAPI growth-rate resources."""
import argparse
import json
from import_pokeapi_battle import ROOT, resource


def curve_id(names):
    return f"pokeapi_growth_{names['growth_rate']['name']}_v1"


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args(argv)
    registry_path = ROOT / 'content/battle/species.v1.json'
    progression_path = ROOT / 'content/battle/progression.v2.json'
    registry = json.loads(registry_path.read_text(encoding='utf-8'))
    progression = json.loads(progression_path.read_text(encoding='utf-8'))
    resources, curves = {}, {}

    def load(kind, key):
        raw, origin = resource(kind, key, args.fetch and not args.check)
        resources[f'{kind}/{key}'] = origin
        return raw

    for key, species in registry['species'].items():
        names = load('pokemon-species', key)
        curve_key = curve_id(names)
        if curve_key not in curves:
            growth_id = names['growth_rate']['url'].rstrip('/').split('/')[-1]
            growth = load('growth-rate', growth_id)
            if growth['name'] != names['growth_rate']['name']:
                raise ValueError(f'Growth resource mismatch: {key}')
            levels = sorted(growth['levels'], key=lambda entry: entry['level'])
            if [entry['level'] for entry in levels] != list(range(1, 101)):
                raise ValueError(f'Incomplete growth table: {curve_key}')
            totals = [entry['experience'] for entry in levels]
            if totals[0] != 0 or any(type(value) is not int or value < 0 for value in totals) or any(a >= b for a, b in zip(totals, totals[1:])):
                raise ValueError(f'Invalid growth thresholds: {curve_key}')
            curves[curve_key] = {'totalExperience': totals}
        if args.check and species.get('growthCurveId') != curve_key:
            raise ValueError(f'Species growth mismatch: {key}')
        species['growthCurveId'] = curve_key
    for rule in progression['evolutions']:
        if registry['species'][str(rule['fromSpeciesId'])]['growthCurveId'] != registry['species'][str(rule['toSpeciesId'])]['growthCurveId']:
            raise ValueError(f'Evolution changes growth rate: {rule}')
    progression['version'] = 2
    progression['growthCurves'] = dict(sorted(curves.items()))
    progression['note'] = 'Official per-species PokéAPI growth-rate thresholds, levels 1–100; defeat rewards are the separately versioned prototype rule.'
    manifest = {'resources': dict(sorted(resources.items()))}
    outputs = {registry_path: registry, progression_path: progression,
               ROOT / 'content/sources/pokeapi/growth-manifest.json': manifest}
    for path, data in outputs.items():
        expected = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
        if args.check:
            if path.read_text(encoding='utf-8') != expected:
                raise ValueError(f'Growth data drift: {path}')
        else:
            path.write_text(expected, encoding='utf-8')
    print(f"Verified {len(registry['species'])} species growth rates and {len(curves)} official XP tables.")


if __name__ == '__main__':
    main()
