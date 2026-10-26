"""Report potential acquisition paths from active authored data, not completion.

Graph closure only counts implemented level/item evolution rules. It does not
prove geography, quest reachability, item supply, or a successful playthrough.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def audit():
    roster = load('content/regions/veloria.roster.v1.json')['speciesIds']
    paths = {species_id: [] for species_id in roster}
    foreign = []
    active_tables = set()
    for tilemap in sorted((ROOT / 'public/tilemaps').glob('*.tmj')):
        for layer in load(tilemap.relative_to(ROOT)).get('layers', []):
            for obj in layer.get('objects', []):
                for prop in obj.get('properties', []):
                    if prop['name'] in ('encounterTableId', 'fishingTableId'):
                        active_tables.add(prop['value'])
    for file in sorted((ROOT / 'content/encounters').glob('*.json')):
        table = load(file.relative_to(ROOT))
        if table.get('id') not in active_tables:
            continue
        for band, entries in table.get('timeBands', {}).items():
            for entry in entries:
                species_id = entry['speciesId']
                source = {'method': table['method'], 'tableId': table['id'], 'mapId': table['mapId'],
                          'timeBand': band, 'minLevel': entry['minLevel'], 'maxLevel': entry['maxLevel']}
                if species_id in paths:
                    paths[species_id].append(source)
                else:
                    foreign.append({'path': file.relative_to(ROOT).as_posix(), 'speciesId': species_id})
    for starter in load('content/starters/starting-partners.v1.json')['starters']:
        if starter['speciesId'] in paths:
            paths[starter['speciesId']].append({'method': 'starter-choice'})
    for file in sorted((ROOT / 'content/quests').glob('*.quest.json')):
        quest = load(file.relative_to(ROOT))
        for gift in quest.get('reward', {}).get('pokemon', []):
            if gift['speciesId'] in paths:
                paths[gift['speciesId']].append({'method': 'quest-gift', 'questId': quest['id'], 'level': gift['level']})
    for encounter in load('content/encounters/special-pokemon.v1.json')['encounters']:
        if encounter['speciesId'] in paths:
            paths[encounter['speciesId']].append({'method': 'visible-special-encounter',
                'encounterId': encounter['id'], 'mapId': encounter['mapId'], 'level': encounter['level'],
                'requiredFlag': encounter['requiredFlag']})
    edges = [*load('content/battle/progression.v2.json')['evolutions'],
             *load('content/battle/item-evolutions.v1.json')['rules'],
             *[{**rule, 'trade': True} for rule in load('content/battle/trade-evolutions.v1.json')['rules']]]
    changed = True
    while changed:
        changed = False
        for edge in edges:
            source, target = edge['fromSpeciesId'], edge['toSpeciesId']
            if source in paths and target in paths and paths[source]:
                path = {'method': 'trade-evolution' if edge.get('trade') else 'item-evolution' if 'itemId' in edge else 'level-evolution',
                        'fromSpeciesId': source,
                        **{key: edge[key] for key in ('minimumLevel', 'itemId') if key in edge}}
                if path not in paths[target]:
                    paths[target].append(path)
                    changed = True
    for file in sorted((ROOT / 'content/trainers').glob('*.json')):
        for member in load(file.relative_to(ROOT)).get('team', []):
            if member['speciesId'] not in paths:
                foreign.append({'path': file.relative_to(ROOT).as_posix(), 'speciesId': member['speciesId']})
    art_ids = {art['speciesId'] for file in (ROOT / 'assets').glob('pokeapi-*-artwork-v1.json')
               for art in load(file.relative_to(ROOT))['artworks']}
    names = load('content/battle/species.v1.json')['species']
    return {
        'regionId': 'veloria', 'speciesCount': len(roster),
        'scope': 'Potential paths only; no claim of reachable items, quests, geography or campaign completion.',
        'activeTableIds': sorted(active_tables), 'foreignActiveReferences': foreign,
        'missingAcquisitionPaths': [species_id for species_id in roster if not paths[species_id]],
        'missingOfficialArtwork': [species_id for species_id in roster if species_id not in art_ids],
        'species': [{'speciesId': species_id, 'name': names.get(str(species_id), {}).get('name'),
                     'potentialPaths': paths[species_id], 'playthroughVerified': False} for species_id in roster],
    }


if __name__ == '__main__':
    result = audit()
    destination = ROOT / 'docs/art/gen1-availability-audit.json'
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in result.items() if key != 'species'}, ensure_ascii=False))
