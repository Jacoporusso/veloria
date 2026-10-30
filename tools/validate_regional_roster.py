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
    researches = read('content/encounters/legendary-research.v1.json')['researches']
    research_by_encounter = {research['encounterId']: research for research in researches}
    require(len(research_by_encounter) == len(researches), 'Duplicate research encounter IDs')
    require(len({research['id'] for research in researches}) == len(researches), 'Duplicate research IDs')
    quests_by_id = {quest['id']: quest for quest in quests}
    for research in researches:
        label = research['id']
        require(research['encounterId'] in {entry['id'] for entry in encounters}, f'{label}: unknown encounter')
        require(research['questId'] in quests_by_id, f'{label}: unknown quest')
        require(research['requiredFlag'] in flags and research['revealedFlag'] in flags, f'{label}: undeclared gate/reveal flag')
        quest = quests_by_id[research['questId']]
        clue_ids = {clue['id'] for clue in research['clues']}
        require(len(clue_ids) == len(research['clues']) and len(clue_ids) >= 2, f'{label}: duplicate or insufficient clues')
        for clue in research['clues']:
            require(clue['mapId'] in maps, f'{label}/{clue["id"]}: unknown map')
            require(any(step.get('trigger') == clue['event'] and step.get('setFlag') == clue['flag'] for step in quest['steps']),
                    f'{label}/{clue["id"]}: quest event/flag mismatch')
        puzzle = research['puzzle']
        option_ids = {option['id'] for option in puzzle['options']}
        require(len(option_ids) == len(puzzle['options']) and len(option_ids) >= 2, f'{label}: invalid puzzle options')
        require(puzzle['solution'] and all(option_id in option_ids for option_id in puzzle['solution']), f'{label}: invalid puzzle solution')
        reveal = next((step for step in quest['steps'] if step.get('trigger') == puzzle['event']), None)
        require(reveal is not None and reveal.get('setFlag') == research['revealedFlag'], f'{label}: reveal event/flag mismatch')
        require(research['requiredFlag'] in reveal.get('requiresFlags', []), f'{label}: reveal does not require its gate')
        for clue in research['clues']:
            require(clue['flag'] in reveal.get('requiresFlags', []), f'{label}: reveal does not require clue {clue["id"]}')
        require(quest.get('completionFlag') == research['revealedFlag'], f'{label}: quest completion flag mismatch')
    require(len({entry['id'] for entry in encounters}) == len(encounters), 'Duplicate special encounter IDs')
    require(len({entry['capturedFlag'] for entry in encounters}) == len(encounters), 'Duplicate special capture flags')
    for entry in encounters:
        label = entry['id']
        require(entry['speciesId'] in allowed and 1 <= entry['level'] <= 100, f'{label}: invalid species/level')
        require(entry['requiredFlag'] in flags and entry['capturedFlag'] in flags and
                all(flag in flags for flag in entry.get('routeRequiredFlags', [])), f'{label}: undeclared flags')
        research = research_by_encounter.get(label)
        if entry.get('researchRequiredFlag'):
            require(entry['researchRequiredFlag'] in flags, f'{label}: undeclared research gate')
            require(research is not None, f'{label}: research gate has no investigation definition')
            require(entry['researchRequiredFlag'] == research['revealedFlag'], f'{label}: research gate/reveal mismatch')
            require(research['capturedFlag'] == entry['capturedFlag'], f'{label}: research capture flag mismatch')
        elif research is not None:
            require(research['capturedFlag'] == entry['capturedFlag'], f'{label}: research capture flag mismatch')
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
        visible_flag = entry.get('researchRequiredFlag') or entry['requiredFlag']
        require(properties.get('visibleWhenFlag') == visible_flag and properties.get('collectedFlag') == entry['capturedFlag'], f'{label}: visibility/capture mismatch')
        require(obj['x'] == entry['x'] * tiled['tilewidth'] and obj['y'] == entry['y'] * tiled['tileheight'], f'{label}: position mismatch')
        require(any(asset['key'] == properties.get('sprite') for asset in metadata.get('renderAssets', [])), f'{label}: unregistered sprite')
        gates = [obj for layer in tiled['layers'] if layer['name'] == 'collision' for obj in layer.get('objects', [])
                 if obj['x'] == entry['x'] * tiled['tilewidth'] and obj['y'] == entry['y'] * tiled['tileheight']]
        require(any(props(gate).get('blocksWhenFlag') == visible_flag and props(gate).get('blocksUntilFlag') == entry['capturedFlag'] for gate in gates), f'{label}: missing conditional collision')
        require(any(step.get('trigger') == entry['captureEvent'] and step.get('setFlag') == entry['capturedFlag'] and entry['requiredFlag'] in step.get('requiresFlags', []) for step in steps), f'{label}: capture event does not settle its flag')
    return len(ids)
