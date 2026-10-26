"""Validate regional species membership and visible encounter wiring, offline."""
import json
from pathlib import Path


def validate_regional_roster(root: Path) -> int:
    def read(path):
        return json.loads((root / path).read_text(encoding='utf-8'))

    def require(condition, message):
        if not condition:
            raise AssertionError(message)

    roster = read('content/regions/veloria.roster.v1.json')
    ids = roster['speciesIds']
    require(ids == list(range(1, 152)), 'Veloria must contain exactly National Dex 1–151')
    allowed = set(ids)
    species = read('content/battle/species.v1.json')['species']
    require(set(map(int, species)) == allowed, 'Runtime species differ from the Veloria roster')
    for directory, field in [('encounters', 'timeBands'), ('trainers', 'team')]:
        for file in (root / 'content' / directory).glob('*.json'):
            data = json.loads(file.read_text(encoding='utf-8'))
            entries = (entry for band in data.get(field, {}).values() for entry in band) if field == 'timeBands' else data.get(field, [])
            for entry in entries:
                require(entry['speciesId'] in allowed, f'{file.name}: foreign regional species {entry["speciesId"]}')
    for file, field in [('progression.v2.json', 'evolutions'), ('item-evolutions.v1.json', 'rules'), ('trade-evolutions.v1.json', 'rules')]:
        for edge in read(f'content/battle/{file}')[field]:
            require(edge['fromSpeciesId'] in allowed and edge['toSpeciesId'] in allowed, f'{file}: foreign evolution branch')

    maps = {data['id']: data for file in (root / 'content/maps').glob('*.map.json')
            for data in [json.loads(file.read_text(encoding='utf-8'))]}
    quests = [json.loads(file.read_text(encoding='utf-8')) for file in (root / 'content/quests').glob('*.quest.json')]
    steps = [step for quest in quests for step in quest['steps']]
    flags = {step['setFlag'] for step in steps if 'setFlag' in step}
    encounters = read('content/encounters/special-pokemon.v1.json')['encounters']
    require(len({entry['id'] for entry in encounters}) == len(encounters), 'Duplicate special encounter IDs')
    require(len({entry['capturedFlag'] for entry in encounters}) == len(encounters), 'Duplicate special capture flags')
    for entry in encounters:
        label = entry['id']
        require(entry['speciesId'] in allowed and 1 <= entry['level'] <= 100, f'{label}: invalid species/level')
        require(entry['requiredFlag'] in flags and entry['capturedFlag'] in flags, f'{label}: undeclared flags')
        require(entry['mapId'] in maps, f'{label}: unknown map')
        metadata = maps[entry['mapId']]
        tiled = read('public/' + metadata['tiledAsset'])
        objects = [obj for layer in tiled['layers'] for obj in layer.get('objects', [])]
        props = lambda obj: {prop['name']: prop['value'] for prop in obj.get('properties', [])}
        matches = [obj for obj in objects if props(obj).get('specialEncounterId') == label]
        require(len(matches) == 1, f'{label}: must have exactly one visible object')
        obj = matches[0]
        properties = props(obj)
        require(properties.get('kind') == 'wild-pokemon', f'{label}: invalid interaction kind')
        require(properties.get('visibleWhenFlag') == entry['requiredFlag'] and properties.get('collectedFlag') == entry['capturedFlag'], f'{label}: visibility/capture mismatch')
        require(obj['x'] == entry['x'] * tiled['tilewidth'] and obj['y'] == entry['y'] * tiled['tileheight'], f'{label}: position mismatch')
        require(any(asset['key'] == properties.get('sprite') for asset in metadata.get('renderAssets', [])), f'{label}: unregistered sprite')
        gates = [obj for layer in tiled['layers'] if layer['name'] == 'collision' for obj in layer.get('objects', [])
                 if obj['x'] == entry['x'] * tiled['tilewidth'] and obj['y'] == entry['y'] * tiled['tileheight']]
        require(any(props(gate).get('blocksWhenFlag') == entry['requiredFlag'] and props(gate).get('blocksUntilFlag') == entry['capturedFlag'] for gate in gates), f'{label}: missing conditional collision')
        require(any(step.get('trigger') == entry['captureEvent'] and step.get('setFlag') == entry['capturedFlag'] and entry['requiredFlag'] in step.get('requiresFlags', []) for step in steps), f'{label}: capture event does not settle its flag')
    return len(ids)
