"""Apply the reviewed Gen I biome pools, keeping authored levels/methods.

Habitat choices/weights are Veloria design; species and learnsets use PokéAPI.
"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEIGHTS = {6: [30, 24, 18, 14, 10, 4], 7: [28, 22, 18, 14, 8, 6, 4]}


def build_table(table, species_ids):
    if len(species_ids) != len(set(species_ids)) or any(not 1 <= species_id <= 151 for species_id in species_ids):
        raise ValueError(f'Invalid Gen I habitat pool: {species_ids}')
    weights = WEIGHTS[len(species_ids)]
    for band, entries in table['timeBands'].items():
        minimum = min(entry['minLevel'] for entry in entries)
        maximum = max(entry['maxLevel'] for entry in entries)
        # Preserve the last three rare choices while varying common companions
        # by time. Rotation changes frequency, never the table's biome roster.
        order = list(species_ids)
        common = order[:3]
        offset = {'morning': 0, 'day': 1, 'night': 2}.get(band, 0)
        order[:3] = common[offset:] + common[:offset]
        table['timeBands'][band] = [
            {'speciesId': species_id, 'weight': weight, 'minLevel': minimum, 'maxLevel': maximum}
            for species_id, weight in zip(order, weights)
        ]
    table['version'] = 2
    return table


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    config = json.loads((ROOT / 'content/regions/veloria.habitats.v1.json').read_text(encoding='utf-8'))
    count = 0
    for path in [*ROOT.glob('content/encounters/*.json'), *ROOT.glob('content/drafts/**/*.encounter.json')]:
        data = json.loads(path.read_text(encoding='utf-8'))
        if data.get('id') not in config['tables']:
            continue
        expected = build_table(json.loads(json.dumps(data)), config['tables'][data['id']]['speciesIds'])
        if args.check:
            if expected != data:
                raise ValueError(f'Habitat drift: {path.relative_to(ROOT)}')
        else:
            path.write_text(json.dumps(expected, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        count += 1
    print(f'{count} active/draft habitat tables {"verified" if args.check else "updated"}')
