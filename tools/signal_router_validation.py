"""Cross-check authored signal circuits, their controls, and quest completion."""
import json
import re


def _check(condition, message):
    if not condition:
        raise AssertionError(message)


def _props(obj):
    return {entry['name']: entry['value'] for entry in obj.get('properties', [])}


def validate_signal_router(router, tiled, quest_steps):
    _check(router.get('presentation', 'circuit') in {'circuit', 'reflection', 'convergence'}, 'Invalid signal presentation')
    valid_id = lambda value: isinstance(value, str) and re.fullmatch(r'[a-z][a-z0-9]*', value)
    _check(valid_id(router.get('id')), 'Invalid signal router ID')
    nodes = router.get('nodes', [])
    by_id = {node['id']: node for node in nodes}
    _check(nodes and len(by_id) == len(nodes), 'Duplicate or empty signal nodes')
    additional = router.get('additionalSourceNodeIds', [])
    _check(isinstance(additional, list) and all(valid_id(source) for source in additional), 'Invalid additional signal sources')
    sources = [router['sourceNodeId'], *additional]
    _check(len(set(sources)) == len(sources) and router['goalNodeId'] in by_id and
           all(source in by_id and source != router['goalNodeId'] for source in sources), 'Invalid signal endpoints')
    _check(any(step['trigger'] == router['solvedEvent'] and step['setFlag'] == router['solvedFlag'] for step in quest_steps), 'Signal completion has no matching quest event/flag')
    objects = [(layer['name'], obj, _props(obj)) for layer in tiled['layers'] for obj in layer.get('objects', [])]
    _check(all(layer == 'interactions' for layer, obj, props in objects if props.get('kind') == 'signal-router-switch'), 'Signal controls must be interactions')
    controls = [(obj, props) for layer, obj, props in objects if props.get('kind') == 'signal-router-switch' and props.get('routerId') == router['id']]
    _check(all(props.get('nodeId') in by_id for obj, props in controls), 'Unknown signal control node')
    rotations = 0
    for node in nodes:
        _check(valid_id(node['id']) and isinstance(node.get('label'), str) and node['label'].strip(), 'Invalid signal node identity')
        _check(all(isinstance(node.get(key), int) and 0 <= node[key] < tiled[limit] for key, limit in [('x', 'width'), ('y', 'height')]), 'Signal node outside map')
        states = {state['id']: state for state in node['states']}
        _check(states and len(states) == len(node['states']) and node['initialStateId'] in states, 'Invalid signal initial state or duplicate state')
        for state in states.values():
            if router.get('presentation') == 'reflection' and len(states) > 1:
                _check(state.get('mirror') in {'/', '\\'}, 'Invalid mirror inclination')
            _check(valid_id(state['id']) and isinstance(state.get('label'), str) and state['label'].strip() and state['direction'] in {'up', 'down', 'left', 'right'}, 'Invalid signal orientation')
            target_id = state['nextNodeId']
            if target_id is not None:
                _check(target_id in by_id, 'Dangling signal route')
                target = by_id[target_id]
                dx, dy = target['x'] - node['x'], target['y'] - node['y']
                expected = 'right' if dx > 0 and dy == 0 else 'left' if dx < 0 and dy == 0 else 'down' if dy > 0 and dx == 0 else 'up' if dy < 0 and dx == 0 else None
                _check(state['direction'] == expected, 'Signal arrow disagrees with its destination')
        matches = [obj for obj, props in controls if props['nodeId'] == node['id']]
        if len(states) > 1:
            rotations += 1
            _check(len(matches) == 1 and matches[0]['x'] == node['x'] * 32 and matches[0]['y'] == node['y'] * 32, 'Missing, duplicate or misplaced signal control')
            _check(matches[0]['width'] == matches[0]['height'] == 32, 'Signal control must occupy one tile')
        else:
            _check(not matches, 'Fixed signal node must not offer rotation')
        _check(any(layer == 'collision' and obj['x'] <= node['x'] * 32 and obj['y'] <= node['y'] * 32 and
                   obj['x'] + obj['width'] >= (node['x'] + 1) * 32 and obj['y'] + obj['height'] >= (node['y'] + 1) * 32
                   for layer, obj, props in objects), 'Signal control has no collision footprint')
    _check(rotations > 0, 'Signal puzzle has no adjustable controls')
    # Construct ONE shared configuration. Each chosen edge strictly reduces the
    # distance to the receiver, so shared switches cannot create conflicting
    # source-specific choices or cycles. This is linear in nodes plus edges.
    reverse = {node_id: [] for node_id in by_id}
    for node in nodes:
        for state in node['states']:
            if state['nextNodeId'] is not None:
                reverse[state['nextNodeId']].append(node['id'])
    distances, pending = {router['goalNodeId']: 0}, [router['goalNodeId']]
    for current in pending:
        for predecessor in reverse[current]:
            if predecessor not in distances:
                distances[predecessor] = distances[current] + 1
                pending.append(predecessor)
    _check(all(source in distances for source in sources), 'Signal puzzle has no solution for all sources')
    solution = {
        node['id']: next((state['nextNodeId'] for state in node['states']
                          if state['nextNodeId'] in distances and distances[state['nextNodeId']] < distances.get(node['id'], -1)), None)
        for node in nodes
    }
    for source in sources:
        current, seen = source, set()
        while current is not None and current not in seen and current != router['goalNodeId']:
            seen.add(current)
            current = solution[current]
        _check(current == router['goalNodeId'], 'Signal puzzle has no shared solution')


def validate_signal_routers(root, maps, quests):
    routers = [json.loads(path.read_text(encoding='utf-8')) for path in sorted((root / 'content/puzzles').glob('*.v1.json'))]
    _check(len({router['id'] for router in routers}) == len(routers), 'Duplicate signal router IDs')
    by_id = {router['id']: router for router in routers}
    placements = {router_id: [] for router_id in by_id}
    for metadata in maps.values():
        tiled = json.loads((root / 'public' / metadata['tiledAsset']).read_text(encoding='utf-8'))
        for layer in tiled['layers']:
            for obj in layer.get('objects', []):
                props = _props(obj)
                if props.get('kind') in {'signal-router', 'signal-router-switch'}:
                    _check(props.get('routerId') in by_id, 'Unknown map signal router')
                if props.get('kind') == 'signal-router':
                    _check(layer['name'] == 'decorations', 'Signal circuit must be a decoration')
                    placements[props['routerId']].append(tiled)
    steps = [step for quest in quests for step in quest['steps']]
    for router in routers:
        _check(len(placements[router['id']]) == 1, 'Signal router must have exactly one map placement')
        validate_signal_router(router, placements[router['id']][0], steps)
