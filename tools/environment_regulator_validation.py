"""Validate authored environment regulators and their Tiled terminals."""
import json
import re


_IDENTIFIER = re.compile(r'^[a-z][a-z0-9]*$')
_TILE = 32
_MAX_SAFE_INTEGER = 2**53 - 1


def _check(condition, message):
    if not condition:
        raise AssertionError(message)


def _identifier(value):
    return isinstance(value, str) and _IDENTIFIER.fullmatch(value) is not None


def _string(value):
    return isinstance(value, str) and bool(value.strip())


def _integer(value):
    return isinstance(value, int) and not isinstance(value, bool)


def _props(obj):
    return {entry['name']: entry['value'] for entry in obj.get('properties', [])}


def _validate_document(regulator, quest_flags, quest_triggers):
    _check(isinstance(regulator, dict), 'Invalid environment regulator document')
    _check(_identifier(regulator.get('id')), 'Invalid environment regulator ID')
    _check(_string(regulator.get('name')), 'Invalid environment regulator name')
    _check(_string(regulator.get('solvedFlag')), 'Invalid environment regulator solvedFlag')
    _check(_string(regulator.get('solvedEvent')), 'Invalid environment regulator solvedEvent')
    _check(not regulator['solvedFlag'].startswith(f"regulator_{regulator['id']}_"),
           'Environment regulator solvedFlag uses its reserved control flag namespace')
    _check(regulator['solvedFlag'] in quest_flags, 'Unknown environment regulator solved flag')
    _check(regulator['solvedEvent'] in quest_triggers, 'Unknown environment regulator solved event')
    required = regulator.get('requiredFlags')
    _check(isinstance(required, list) and all(_string(flag) for flag in required), 'Invalid environment regulator requiredFlags')
    _check(len(set(required)) == len(required), 'Duplicate environment regulator required flag')
    _check(set(required) <= set(quest_flags), 'Unknown environment regulator required flag')

    controls = regulator.get('controls')
    _check(isinstance(controls, list) and 1 <= len(controls) <= 4, 'Environment regulator needs one to four controls')
    control_ids = []
    generated_flags = []
    for control in controls:
        _check(isinstance(control, dict), 'Invalid environment regulator control')
        _check(_identifier(control.get('id')), 'Invalid environment regulator control ID')
        control_ids.append(control['id'])
        _check(_string(control.get('label')) and _string(control.get('hint')), 'Invalid environment regulator control text')
        low, high = control.get('min'), control.get('max')
        _check(_integer(low) and _integer(high) and
               -_MAX_SAFE_INTEGER <= low <= _MAX_SAFE_INTEGER and
               -_MAX_SAFE_INTEGER <= high <= _MAX_SAFE_INTEGER and low < high,
               'Invalid environment regulator range')
        _check(high - low + 1 <= 16, 'Environment regulator range exceeds sixteen levels')
        generated_flags.extend(
            f"regulator_{regulator['id']}_{control['id']}_level{value - low}"
            for value in range(low, high + 1)
        )
        levels = control.get('levels')
        _check(isinstance(levels, list) and 1 <= len(levels) <= 16, 'Environment regulator levels must contain one to sixteen entries')
        _check(high - low + 1 == len(levels), 'Environment regulator levels must cover the full range')
        level_values = []
        for level in levels:
            _check(isinstance(level, dict) and _integer(level.get('value')), 'Invalid environment regulator level')
            level_values.append(level['value'])
            _check(_string(level.get('label')) and _string(level.get('hint')), 'Invalid environment regulator level text')
        _check(len(set(level_values)) == len(level_values) and set(level_values) == set(range(low, high + 1)),
               'Environment regulator levels must cover every integer exactly once')
        for key in ('initial', 'target'):
            value = control.get(key)
            _check(_integer(value) and low <= value <= high, f'Environment regulator {key} is outside its range')
    _check(len(set(control_ids)) == len(control_ids), 'Duplicate environment regulator control IDs')
    _check(len(set(generated_flags)) == len(generated_flags), 'Duplicate environment regulator control flags')
    _check(not (set(generated_flags) & set(quest_flags)), 'Environment regulator control flag collides with a quest flag')


def validate_environment_regulators(root, runtime_maps, quest_flags, quest_triggers):
    """Validate catalog documents and one-tile terminals on every runtime map.

    ``runtime_maps`` maps map IDs to metadata objects containing ``tiledAsset``.
    Quest flags and triggers are iterable collections of registered identifiers.
    """
    paths = sorted((root / 'content' / 'regulators').glob('*.v1.json'))
    flags, triggers = set(quest_flags), set(quest_triggers)
    regulators = [json.loads(path.read_text(encoding='utf-8')) for path in paths]
    for regulator in regulators:
        _validate_document(regulator, flags, triggers)
    ids = [regulator['id'] for regulator in regulators]
    _check(len(set(ids)) == len(ids), 'Duplicate environment regulator IDs')
    by_id = {regulator_id: regulator for regulator_id, regulator in zip(ids, regulators)}
    placements = {regulator_id: 0 for regulator_id in by_id}

    for metadata in runtime_maps.values():
        tiled_path = root / 'public' / metadata['tiledAsset']
        tiled = json.loads(tiled_path.read_text(encoding='utf-8'))
        layers = tiled.get('layers', [])
        collisions = [layer for layer in layers if layer.get('name') == 'collision']
        for layer in layers:
            for obj in layer.get('objects', []):
                props = _props(obj)
                if props.get('kind') != 'environment-regulator':
                    continue
                _check(layer.get('name') == 'interactions', 'Environment regulator terminal must be in interactions')
                regulator_id = props.get('regulatorId')
                _check(regulator_id in by_id, 'Unknown map environment regulator')
                _check(_integer(obj.get('x')) and _integer(obj.get('y')) and
                       obj['x'] % _TILE == 0 and obj['y'] % _TILE == 0,
                       'Environment regulator terminal must be tile-aligned')
                _check(obj.get('width') == _TILE and obj.get('height') == _TILE,
                       'Environment regulator terminal must occupy one 32px tile')
                x, y = obj['x'], obj['y']
                _check(any(c.get('x', 0) <= x and c.get('y', 0) <= y and
                           c.get('x', 0) + c.get('width', 0) >= x + _TILE and
                           c.get('y', 0) + c.get('height', 0) >= y + _TILE
                           for layer in collisions for c in layer.get('objects', [])),
                       'Environment regulator terminal lacks full collision footprint')
                placements[regulator_id] += 1

    _check(all(count > 0 for count in placements.values()), 'Orphan environment regulator has no runtime terminal')
