"""Convert authored Veloria opponents/habitats; never rewrite player saves.

Replacement choices are regional game design, not facts supplied by PokéAPI.
Trainer replacement moves come from cached official HGSS learnsets.
"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Keep family stages and biome/team roles where a Gen I analogue exists.
REPLACEMENTS = {161: 19, 162: 20, 163: 21, 164: 22, 167: 46, 168: 47,
                170: 72, 171: 73, 177: 96, 178: 97, 179: 100, 180: 81,
                181: 26, 182: 45, 194: 27, 195: 55, 196: 64, 197: 93,
                208: 95, 215: 124, 220: 86, 221: 87, 227: 142, 230: 117}


def official_moves(species_id, level, previous=()):
    raw = json.loads((ROOT / f'content/sources/pokeapi/pokemon-{species_id}.json').read_text(encoding='utf-8'))
    legal, learned = set(), []
    for entry in raw['moves']:
        for detail in entry['version_group_details']:
            if detail['version_group']['name'] != 'heartgold-soulsilver':
                continue
            name = entry['move']['name']
            if detail['move_learn_method']['name'] == 'level-up':
                if detail['level_learned_at'] <= level:
                    legal.add(name)
                    learned.append((detail['level_learned_at'], detail.get('order') or 0, name))
    # Preserve the project's authored level-up-only trainer policy, then
    # fill from actual level-up moves. No imported-species template fallback.
    selected = list(dict.fromkeys(move for move in previous if move in legal))[:4]
    for _, _, move in reversed(sorted(learned)):
        if move not in selected and len(selected) < 4:
            selected.append(move)
    if not selected:
        raise ValueError(f'No official HGSS moves at level {level}: {species_id}')
    return selected


def convert(value):
    changes = []
    if isinstance(value, list):
        for entry in value:
            changes.extend(convert(entry))
    elif isinstance(value, dict):
        old = value.get('speciesId')
        if isinstance(old, int) and old > 151:
            if old not in REPLACEMENTS:
                raise ValueError(f'No reviewed regional replacement for {old}')
            new = REPLACEMENTS[old]
            value['speciesId'] = new
            if 'moveIds' in value:
                value['moveIds'] = official_moves(new, value['level'], value['moveIds'])
            changes.append({'from': old, 'to': new})
        for child in value.values():
            if isinstance(child, (dict, list)):
                changes.extend(convert(child))
    return changes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='write reviewed regional content conversion')
    args = parser.parse_args()
    changes = []
    # Drafts mirror their chapter sources; convert them too to avoid restoring
    # Gen II accidentally when a chapter content generator is rerun.
    files = sorted({*ROOT.glob('content/encounters/*.json'), *ROOT.glob('content/trainers/*.json'),
                    *ROOT.glob('content/drafts/**/*.encounter.json'), *ROOT.glob('content/drafts/**/*.trainer.json')})
    for path in files:
        data = json.loads(path.read_text(encoding='utf-8'))
        converted = convert(data)
        if not converted:
            continue
        changes.append({'path': path.relative_to(ROOT).as_posix(), 'replacements': converted})
        if args.apply:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'applied': args.apply, 'files': changes}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
