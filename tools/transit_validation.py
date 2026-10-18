"""Cross-reference transit catalogs against authored map terminals and safe arrivals."""
import json
from pathlib import Path
from json_schema_validation import validate_json_schema


def _check(condition, message):
    if not condition:
        raise AssertionError(message)


def _properties(obj):
    return {prop['name']: prop['value'] for prop in obj.get('properties', [])}


def _overlap(a, b):
    return (a['x'] < b['x'] + b['width'] and a['x'] + a['width'] > b['x']
            and a['y'] < b['y'] + b['height'] and a['y'] + a['height'] > b['y'])


def validate_transit_network(network, maps, tiled_by_id, quest_flags, schema):
    """Validate supplied documents without modifying them or accessing the filesystem."""
    validate_json_schema(network, schema, 'Transit catalog')
    stations = network['stations']
    ids = [station['id'] for station in stations]
    _check(len(set(ids)) == len(ids), 'Duplicate transit station ID')
    map_ids = [station['mapId'] for station in stations]
    _check(len(set(map_ids)) == len(map_ids), 'Duplicate transit station map')
    _check('badge_circuito_awarded' in network['requiredFlags'], 'Transit must require the Circuito flag')
    _check(set(network['requiredFlags']) <= set(quest_flags), 'Unknown transit required flag')
    terminals = []
    for map_id, tiled in tiled_by_id.items():
        for layer in tiled['layers']:
            for obj in layer.get('objects', []):
                props = _properties(obj)
                if props.get('kind') == 'transit-terminal' or props.get('serviceId') == 'monorail':
                    _check(layer['name'] == 'interactions', 'Transit terminal must be in interactions')
                    _check(props.get('kind') == 'transit-terminal' and props.get('serviceId') == 'monorail', 'Invalid transit terminal service')
                    station = next((item for item in stations if item['id'] == props.get('stationId')), None)
                    _check(station is not None and station['mapId'] == map_id, 'Orphan transit terminal or wrong station map')
                    terminals.append((map_id, obj, props))
    for station in stations:
        map_id = station['mapId']
        _check(map_id in maps and map_id in tiled_by_id, 'Unknown transit station map: ' + map_id)
        spawns = [spawn for spawn in maps[map_id]['spawns'] if spawn['id'] == station['spawnPointId']]
        _check(len(spawns) == 1, 'Unknown or duplicate transit arrival spawn')
        matches = [obj for mid, obj, props in terminals if mid == map_id and props['stationId'] == station['id']]
        _check(len(matches) == 1, 'Station must have exactly one matching terminal')
        terminal, spawn, tiled = matches[0], spawns[0], tiled_by_id[map_id]
        tile = tiled['tilewidth']
        _check(tile == tiled['tileheight'] == 32, 'Transit requires square 32px map tiles')
        _check(terminal['width'] == terminal['height'] == tile and terminal['x'] % tile == terminal['y'] % tile == 0, 'Terminal footprint must be one aligned tile')
        sx, sy = spawn['x'], spawn['y']
        _check(isinstance(sx, int) and isinstance(sy, int) and 0 <= sx < tiled['width'] and 0 <= sy < tiled['height'], 'Transit arrival outside map')
        delta = (terminal['x'] / tile - sx, terminal['y'] / tile - sy)
        facing = {(0, -1): 'up', (0, 1): 'down', (-1, 0): 'left', (1, 0): 'right'}
        _check(delta in facing and spawn['facing'] == facing[delta], 'Transit arrival must be adjacent and face its terminal')
        arrival = {'x': sx * tile, 'y': sy * tile, 'width': tile, 'height': tile}
        collisions = [obj for layer in tiled['layers'] if layer['name'] == 'collision' for obj in layer.get('objects', [])]
        _check(any(obj['x'] <= terminal['x'] and obj['y'] <= terminal['y'] and obj['x'] + obj['width'] >= terminal['x'] + tile and obj['y'] + obj['height'] >= terminal['y'] + tile for obj in collisions), 'Transit terminal lacks a full collision footprint')
        _check(not any(_overlap(arrival, obj) for obj in collisions), 'Transit arrival overlaps collision')
        hazards = [obj for layer in tiled['layers'] for obj in layer.get('objects', []) if _properties(obj).get('kind') in {'map-exit', 'encounter-zone'}]
        _check(not any(_overlap(arrival, obj) for obj in hazards), 'Transit arrival overlaps exit or encounter zone')


def validate_transit(root: Path, runtime_maps, quest_flags):
    network = json.loads((root / 'content/transit/monorail.v1.json').read_text(encoding='utf-8'))
    schema = json.loads((root / 'specs/schemas/transit.v1.schema.json').read_text(encoding='utf-8'))
    tiled = {mid: json.loads((root / 'public' / metadata['tiledAsset']).read_text(encoding='utf-8')) for mid, metadata in runtime_maps.items()}
    validate_transit_network(network, runtime_maps, tiled, quest_flags, schema)
