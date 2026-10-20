"""Cross-validate declarative challenge sequences, maps and official trainer teams."""
import json
import math
import re


def _check(condition, message):
    if not condition:
        raise AssertionError(message)


def _matches(value, pattern):
    return isinstance(value, str) and re.fullmatch(pattern, value) is not None


def _props(obj):
    return {entry['name']: entry['value'] for entry in obj.get('properties', [])}


def _objects(tiled, name):
    return next((layer.get('objects', []) for layer in tiled.get('layers', []) if layer.get('name') == name), [])


def _documents(root):
    return [json.loads(path.read_text(encoding='utf-8')) for path in sorted((root / 'content/challenges').glob('*.sequence.json'))]


def _shape(sequence):
    identifier = r'[a-z][a-z0-9]*'
    flag = r'[a-z][a-z0-9_]*'
    reference = r'[a-z][a-z0-9_-]*(?:/[a-z0-9_-]+)*'
    _check(isinstance(sequence, dict) and _matches(sequence.get('id'), identifier), 'Invalid challenge ID')
    _check(sequence.get('version') == 1 and isinstance(sequence.get('name'), str) and sequence['name'].strip(), 'Invalid challenge version/name')
    for field, pattern in [('requiredFlags', flag), ('requiredBadgeIds', flag), ('memberMapIds', reference)]:
        values = sequence.get(field)
        _check(isinstance(values, list) and all(_matches(value, pattern) for value in values) and len(values) == len(set(values)), f'Invalid challenge {field}')
    _check(sequence['memberMapIds'], 'Challenge needs member maps')
    checkpoint = sequence.get('checkpoint', {})
    _check(isinstance(checkpoint, dict) and all(_matches(checkpoint.get(key), reference) for key in ['mapId', 'spawnId']), 'Invalid challenge checkpoint')
    _check(checkpoint['mapId'] not in sequence['memberMapIds'], 'Challenge checkpoint must be outside member maps')
    _check(_matches(sequence.get('completionEvent'), reference), 'Invalid challenge completionEvent')
    _check(sequence.get('servicePolicy') == {'healing': 'forbidden', 'storage': 'forbidden', 'battleItems': 'allowed'}, 'Invalid challenge servicePolicy')
    stages = sequence.get('stages')
    _check(isinstance(stages, list) and stages, 'Challenge needs stages')
    for stage in stages:
        _check(isinstance(stage, dict) and _matches(stage.get('id'), identifier), 'Invalid challenge stage ID')
        _check(all(_matches(stage.get(key), reference) for key in ['trainerId', 'mapId', 'spawnId']), 'Invalid challenge stage references')
        _check(stage['mapId'] in sequence['memberMapIds'], 'Challenge stage map is not a member')
        _check(all(_matches(stage.get(key), flag) for key in ['attemptWonFlag', 'firstRewardFlag']), 'Invalid challenge stage flags')
        _check('battleOnceFlag' not in stage or _matches(stage['battleOnceFlag'], flag), 'Invalid challenge battleOnceFlag')
    for field in ['id', 'trainerId']:
        _check(len({stage[field] for stage in stages}) == len(stages), f'Duplicate challenge stage {field}')
    owned = [sequence.get('activeFlag'), sequence.get('pendingBattleFlag'), sequence.get('completedFlag')]
    owned += [value for stage in stages for key in ['attemptWonFlag', 'firstRewardFlag', 'battleOnceFlag'] if (value := stage.get(key)) is not None]
    _check(all(_matches(value, flag) for value in owned), 'Invalid challenge flags')
    _check(len(owned) == len(set(owned)), 'Duplicate challenge flags')
    _check(not set(owned) & set(sequence['requiredFlags']), 'Challenge requirements overlap owned flags')
    return set(owned) - {sequence['completedFlag']}


def challenge_sequence_flags(root, quest_flags):
    """Return core-owned flags, rejecting collisions before extending global known flags."""
    result, identities, completions, member_maps, trainers = set(), set(), set(), set(), set()
    for sequence in _documents(root):
        flags = _shape(sequence)
        _check(sequence['id'] not in identities, 'Duplicate challenge sequence ID')
        _check(sequence['completedFlag'] not in completions, 'Duplicate challenge completedFlag')
        _check(not flags & (set(quest_flags) | result | completions), 'Challenge flags overlap quest or another challenge')
        _check(sequence['completedFlag'] not in result, 'Challenge completedFlag overlaps another challenge flag')
        _check(not member_maps & set(sequence['memberMapIds']), 'Challenge member maps overlap another sequence')
        stage_trainers = {stage['trainerId'] for stage in sequence['stages']}
        _check(not trainers & stage_trainers, 'Challenge trainer belongs to multiple sequences')
        identities.add(sequence['id']); completions.add(sequence['completedFlag'])
        member_maps.update(sequence['memberMapIds']); trainers.update(stage_trainers); result.update(flags)
    return result


def _tiles(obj):
    return {(x, y) for x in range(math.floor(obj.get('x', 0) / 32), math.ceil((obj.get('x', 0) + max(1, obj.get('width', 32))) / 32))
            for y in range(math.floor(obj.get('y', 0) / 32), math.ceil((obj.get('y', 0) + max(1, obj.get('height', 32))) / 32))}


def _spawn(metadata, tiled, spawn_id, flags):
    spawn = next((item for item in metadata.get('spawns', []) if item['id'] == spawn_id), None)
    _check(spawn is not None, 'Unknown challenge spawn')
    tile = (spawn['x'], spawn['y'])
    blocked = set().union(*[_tiles(obj) for obj in _objects(tiled, 'collision') if _props(obj).get('blocksUntilFlag') not in flags]) if _objects(tiled, 'collision') else set()
    _check(0 <= tile[0] < tiled['width'] and 0 <= tile[1] < tiled['height'] and tile not in blocked, 'Challenge spawn must be safe walkable floor')
    _check(not any(tile in _tiles(obj) for obj in _objects(tiled, 'triggers') if _props(obj).get('kind') in ['map-exit', 'encounter-zone']), 'Challenge spawn overlaps portal or habitat')
    seen, queue = set(), [tile]
    for x, y in queue:
        if (x, y) in seen or (x, y) in blocked or not (0 <= x < tiled['width'] and 0 <= y < tiled['height']):
            continue
        seen.add((x, y)); queue.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
    return seen


def validate_challenge_sequences(root, runtime_maps, quest_flags, quest_triggers, badges, trainers, species, moves):
    challenge_sequence_flags(root, quest_flags)
    sequences = _documents(root)
    quests = [json.loads(path.read_text(encoding='utf-8')) for path in (root / 'content/quests').glob('*.quest.json')]
    placements = []
    tiled_maps = {}
    for map_id, metadata in runtime_maps.items():
        tiled = json.loads((root / 'public' / metadata['tiledAsset']).read_text(encoding='utf-8'))
        tiled_maps[map_id] = tiled
        placements.extend((map_id, obj, _props(obj)) for layer in tiled.get('layers', []) for obj in layer.get('objects', []) if _props(obj).get('challengeId'))
    sequence_registry = {sequence['id']: sequence for sequence in sequences}
    for map_id, obj, properties in placements:
        sequence = sequence_registry.get(properties['challengeId'])
        _check(sequence is not None, 'Map references unknown challengeId')
        if properties.get('challengeStageId'):
            _check(any(stage['id'] == properties['challengeStageId'] and stage['mapId'] == map_id and stage['trainerId'] == properties.get('trainerId') for stage in sequence['stages']), 'Map references unknown or mismatched challenge stage')
    for sequence in sequences:
        _check(set(sequence['requiredFlags']) <= set(quest_flags), 'Unknown challenge required flag')
        _check(set(sequence['requiredBadgeIds']) <= set(badges), 'Unknown challenge badge ID')
        _check(sequence['completedFlag'] in quest_flags and sequence['completionEvent'] in quest_triggers, 'Unregistered challenge completion')
        _check(any(step['setFlag'] == sequence['completedFlag'] and step['trigger'] == sequence['completionEvent'] for quest in quests for step in quest['steps']), 'Challenge completion event must set completedFlag')
        checkpoint = sequence['checkpoint']
        _check(checkpoint['mapId'] in runtime_maps, 'Unknown challenge checkpoint map')
        _spawn(runtime_maps[checkpoint['mapId']], tiled_maps[checkpoint['mapId']], checkpoint['spawnId'], sequence['requiredFlags'])
        for map_id in sequence['memberMapIds']:
            _check(map_id in runtime_maps, 'Unknown challenge member map')
            tiled = tiled_maps[map_id]
            exits = [obj for obj in _objects(tiled, 'triggers') if _props(obj).get('kind') == 'map-exit']
            _check(exits, 'Challenge member map needs a return exit')
            for layer in tiled.get('layers', []):
                for obj in layer.get('objects', []):
                    properties = _props(obj)
                    _check(properties.get('kind') != 'transit-terminal' and not properties.get('stationId') and properties.get('serviceId') not in ['pokemon_center', 'rest_point', 'healing', 'storage', 'monorail', 'transit'], 'Forbidden healing/storage/transit service inside challenge')
        for stage in sequence['stages']:
            trainer = trainers.get(stage['trainerId'])
            _check(trainer is not None, 'Unknown challenge trainer')
            _check(trainer.get('battleOnceFlag') == stage.get('battleOnceFlag'), 'Challenge trainer battleOnceFlag mismatch')
            metadata, tiled = runtime_maps[stage['mapId']], tiled_maps[stage['mapId']]
            prior = sequence['stages'][:sequence['stages'].index(stage)]
            flags = set(sequence['requiredFlags']) | {sequence['activeFlag']} | {value for item in prior for key in ['attemptWonFlag', 'battleOnceFlag'] if (value := item.get(key)) is not None}
            seen = _spawn(metadata, tiled, stage['spawnId'], flags)
            matches = [obj for map_id, obj, properties in placements if map_id == stage['mapId'] and properties.get('challengeId') == sequence['id'] and properties.get('challengeStageId') == stage['id'] and properties.get('trainerId') == stage['trainerId']]
            _check(len(matches) == 1, 'Challenge stage needs exactly one matching NPC placement')
            _check(any((x+dx,y+dy) in seen for x,y in _tiles(matches[0]) for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]), 'Challenge trainer is unreachable from stage spawn')
            _check(any(seen & _tiles(obj) for obj in _objects(tiled, 'triggers') if _props(obj).get('kind') == 'map-exit'), 'Challenge return exit unreachable from stage spawn')
            for member in trainer['team']:
                definition = species.get(str(member['speciesId']))
                _check(definition is not None, 'Unknown challenge trainer species')
                legal = {entry['moveId'] for entry in definition.get('officialLearnset', []) if entry['level'] <= member['level']}
                _check(set(member['moveIds']) <= set(moves) and set(member['moveIds']) <= legal, 'Challenge trainer has unsupported or level-illegal moves')
