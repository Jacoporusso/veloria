"""Authoring checks for persistent quest gates in Tiled collision layers."""


def validate_collision_gates(objects, quest_flags):
    for obj in objects:
        raw = obj.get('properties', [])
        props = {item['name']: item.get('value') for item in raw} if isinstance(raw, list) else raw
        if not isinstance(props, dict):
            continue
        for field in ('blocksUntilFlag', 'blocksWhenFlag'):
            if field not in props:
                continue
            flag = props[field]
            assert isinstance(flag, str) and flag.strip(), f'Collision {field} must be a non-empty flag'
            assert flag in quest_flags, f'Collision gate references undeclared quest flag: {flag}'
