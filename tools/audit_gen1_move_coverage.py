"""Audit official HGSS level-up move coverage for the Gen I regional catalog."""
import json
from collections import defaultdict
from pathlib import Path

from import_pokeapi_battle import ROOT, SOURCE, resource

RUNTIME_MOVE_IDS = set(json.loads((ROOT / 'content/battle/moves.v1.json').read_text(encoding='utf-8'))['moves'])


def implemented(raw):
    return raw['name'] in RUNTIME_MOVE_IDS


def main():
    imports = json.loads((ROOT / 'content/battle/species-imports.v1.json').read_text(encoding='utf-8'))['imports']
    registry = json.loads((ROOT / 'content/battle/species.v1.json').read_text(encoding='utf-8'))['species']
    if {entry['speciesId'] for entry in imports} != set(range(1, 152)) or set(map(int, registry)) != set(range(1, 152)):
        raise ValueError('The Gen I move coverage audit requires an exact 1–151 import and runtime roster.')

    uses = defaultdict(list)
    missing_preview = []
    missing_any_level = []
    for species_id in range(1, 152):
        raw, _ = resource('pokemon', species_id)
        level_moves = []
        for move in raw['moves']:
            for detail in move['version_group_details']:
                if detail['version_group']['name'] == 'heartgold-soulsilver' and detail['move_learn_method']['name'] == 'level-up':
                    entry = {'level': detail['level_learned_at'], 'speciesId': species_id}
                    uses[move['move']['name']].append(entry)
                    if entry['level'] <= 5 and implemented(resource('move', move['move']['name'])[0]):
                        level_moves.append(move['move']['name'])
        implemented_levels = [move['move']['name'] for move in raw['moves'] for detail in move['version_group_details']
                              if detail['version_group']['name'] == 'heartgold-soulsilver' and detail['move_learn_method']['name'] == 'level-up'
                              and implemented(resource('move', move['move']['name'])[0])]
        if not implemented_levels:
            missing_any_level.append(species_id)
        if not level_moves:
            missing_preview.append(species_id)

    moves = {}
    resources = {}
    for move_id, entries in sorted(uses.items()):
        raw, source = resource('move', move_id)
        resources[f'move/{move_id}'] = source
        effect = next((entry for entry in raw['effect_entries'] if entry['language']['name'] == 'en'), {})
        moves[move_id] = {
            'implementationStatus': 'implemented' if implemented(raw) else 'unsupported',
            'speciesIds': sorted({entry['speciesId'] for entry in entries}),
            'levelUpEntryCount': len(entries),
            'type': raw['type']['name'],
            'category': raw['damage_class']['name'],
            'power': raw['power'],
            'accuracy': raw['accuracy'],
            'pp': raw['pp'],
            'target': raw['target']['name'],
            'metaCategory': raw['meta']['category']['name'],
            'englishShortEffect': effect.get('short_effect', ''),
            'source': source,
        }

    unsupported = [key for key, value in moves.items() if value['implementationStatus'] == 'unsupported']
    result = {
        'version': 1,
        'source': 'PokeAPI',
        'versionGroup': 'heartgold-soulsilver',
        'scope': 'National Dex IDs 1–151, official HGSS level-up moves',
        'runtimeSpeciesCount': len(registry),
        'uniqueLevelUpMoveCount': len(moves),
        'implementedMoveCount': len(moves) - len(unsupported),
        'unsupportedMoveCount': len(unsupported),
        'speciesWithoutImplementedMoveAtLevelFiveOrEarlier': missing_preview,
        'speciesWithoutAnyImplementedLevelUpMove': missing_any_level,
        'moves': moves,
        'note': 'Unsupported source moves are retained here with their official metadata and provenance; they are not added to the runtime learnset or replaced with a fabricated fallback.',
    }
    path = SOURCE / 'gen1-move-coverage.json'
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"Audited {len(registry)} species, {len(moves)} official moves; {len(unsupported)} move mechanics unsupported; {len(missing_preview)} species lack an implemented move by level five.")


if __name__ == '__main__':
    main()
