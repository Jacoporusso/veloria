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
    networks = [json.loads(path.read_text(encoding='utf-8')) for path in (root / 'content/transit').glob('*.transport.json')]
    validate_local_transports(networks, runtime_maps, tiled, quest_flags)


def validate_local_transports(networks, maps, tiled_by_id, quest_flags):
    """Check local route references and safe terminal arrivals against actual maps."""
    ids = [network['id'] for network in networks]
    _check(len(ids) == len(set(ids)), 'Duplicate local transport network')
    terminals = {}
    for mid, tiled in tiled_by_id.items():
        for layer in tiled['layers']:
            for obj in layer.get('objects', []):
                props = _properties(obj)
                if props.get('kind') != 'local-transport':
                    continue
                network = next((n for n in networks if n['id'] == props.get('networkId')), None)
                _check(network is not None, 'Orphan local transport network')
                stop = next((s for s in network['stops'] if s['id'] == props.get('stopId')), None)
                _check(stop is not None and stop['mapId'] == mid, 'Orphan local transport stop')
                _check(layer['name'] == 'interactions', 'Local terminal must be in interactions')
                terminals.setdefault((network['id'], stop['id']), []).append(obj)
    for network in networks:
        _check(network.get('kind') in {'ferry', 'cable-car'}, 'Invalid local transport kind')
        _check(isinstance(network.get('lockedMessage'), str) and network['lockedMessage'].strip(), 'Missing local transport locked message')
        stops = {s['id']: s for s in network['stops']}
        _check(len(stops) == len(network['stops']) and len(stops) >= 2, 'Invalid local transport stops')
        routes = set()
        for item in [network, *network['stops'], *network['routes']]:
            flags = item.get('requiredFlags', [])
            _check(isinstance(flags, list) and all(isinstance(f, str) for f in flags) and set(flags) <= set(quest_flags), 'Unknown local transport required flag')
        for route in network['routes']:
            pair = (route['fromStopId'], route['toStopId'])
            _check(all(s in stops for s in pair) and pair[0] != pair[1] and pair not in routes, 'Invalid local transport route')
            routes.add(pair)
        _check(routes and all(any(pair[0] == sid for pair in routes) for sid in stops), 'Local transport stop has no departure')
        for stop in stops.values():
            mid = stop['mapId']
            _check(mid in maps and mid in tiled_by_id, 'Unknown local transport map')
            arrivals = [s for s in maps[mid]['spawns'] if s['id'] == stop['spawnPointId']]
            matches = terminals.get((network['id'], stop['id']), [])
            _check(len(arrivals) == len(matches) == 1, 'Local transport needs exactly one arrival and terminal')
            arrival, terminal, tiled = arrivals[0], matches[0], tiled_by_id[mid]
            tile = tiled['tilewidth']
            _check(tile == tiled['tileheight'] == 32 and terminal['width'] == terminal['height'] == tile and terminal['x'] % tile == terminal['y'] % tile == 0, 'Invalid local terminal footprint')
            sx, sy = arrival['x'], arrival['y']
            _check(isinstance(sx, int) and isinstance(sy, int) and 0 <= sx < tiled['width'] and 0 <= sy < tiled['height'], 'Local arrival outside map')
            delta = (terminal['x'] / tile - sx, terminal['y'] / tile - sy)
            facing = {(0, -1): 'up', (0, 1): 'down', (-1, 0): 'left', (1, 0): 'right'}
            _check(delta in facing and arrival['facing'] == facing[delta], 'Local arrival must face adjacent terminal')
            footprint = {'x': sx * tile, 'y': sy * tile, 'width': tile, 'height': tile}
            collisions = [o for l in tiled['layers'] if l['name'] == 'collision' for o in l.get('objects', [])]
            _check(any(o['x'] <= terminal['x'] and o['y'] <= terminal['y'] and o['x'] + o['width'] >= terminal['x'] + tile and o['y'] + o['height'] >= terminal['y'] + tile for o in collisions), 'Local terminal lacks full collision')
            _check(not any(_overlap(footprint, o) for o in collisions), 'Local arrival overlaps collision')
            hazards = [o for l in tiled['layers'] for o in l.get('objects', []) if _properties(o).get('kind') in {'map-exit', 'encounter-zone'}]
            _check(not any(_overlap(footprint, o) for o in hazards), 'Local arrival overlaps exit or encounter')
