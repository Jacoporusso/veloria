"""Authoring and grid reachability helpers for Tiled ice surfaces."""
from collections import deque
from math import ceil, isfinite


def collect_movement_surfaces(layer, width, height, tilewidth=32, tileheight=32):
    """Validate optional movement_surfaces layer and return its ice tile set."""
    if layer is None:
        return set()
    if layer.get("type") != "objectgroup":
        raise AssertionError("movement_surfaces must be an object layer")
    if any(layer.get(key, 0) != 0 for key in ("x", "y", "offsetx", "offsety")):
        raise AssertionError("movement_surfaces must not offset the world grid")
    dimensions = (width, height, tilewidth, tileheight)
    if (any(not isinstance(v, int) or isinstance(v, bool) for v in dimensions)
            or width <= 0 or height <= 0 or tilewidth != 32 or tileheight != 32):
        raise AssertionError("Movement surfaces require positive map dimensions and 32px tiles")
    ice = set()
    for obj in layer.get("objects", []):
        if any(shape in obj for shape in ("ellipse", "polygon", "polyline", "point")):
            raise AssertionError(f"Movement surface must be a rectangle: {obj.get('name')}")
        raw_props = obj.get("properties", [])
        if isinstance(raw_props, list):
            props = {p.get("name"): p.get("value") for p in raw_props if isinstance(p, dict)}
        elif isinstance(raw_props, dict):
            props = raw_props
        else:
            props = {}
        if props.get("surface") != "ice":
            raise AssertionError(f"Movement surface must declare surface='ice': {obj.get('name')}")
        values = [obj.get(k) for k in ("x", "y", "width", "height")]
        if any(not isinstance(v, (int, float)) or isinstance(v, bool) or not isfinite(v) for v in values):
            raise AssertionError(f"Movement surface rectangle is invalid: {obj.get('name')}")
        x, y, w, h = values
        rotation = obj.get("rotation", 0)
        if (not isinstance(rotation, (int, float)) or isinstance(rotation, bool) or not isfinite(rotation)
                or rotation != 0 or w <= 0 or h <= 0 or any(v % 32 for v in values)
                or x < 0 or y < 0 or x + w > width * 32 or y + h > height * 32):
            raise AssertionError(f"Movement surface must be positive, 32px aligned and inside the map: {obj.get('name')}")
        ice.update((tx, ty) for ty in range(int(y // 32), int((y + h) // 32))
                   for tx in range(int(x // 32), int((x + w) // 32)))
    return ice


def object_tiles(objects, width, height, tile_size=32):
    tiles = set()
    for obj in objects:
        x, y = obj.get("x", 0), obj.get("y", 0)
        w, h = max(1, obj.get("width", tile_size)), max(1, obj.get("height", tile_size))
        left, top = max(0, int(x // tile_size)), max(0, int(y // tile_size))
        right, bottom = min(width, ceil((x + w) / tile_size)), min(height, ceil((y + h) / tile_size))
        tiles.update((tx, ty) for ty in range(top, bottom) for tx in range(left, right))
    return tiles


def validate_ice_triggers(objects, width, height, ice):
    """A single-tile interruption has the same meaning on repeated entry."""
    for obj in objects:
        if object_tiles([obj], width, height) & ice:
            if (obj.get("width") != 32 or obj.get("height") != 32
                    or obj.get("x", 0) % 32 or obj.get("y", 0) % 32):
                raise AssertionError("Triggers crossing ice must occupy one grid-aligned tile")


def reachable_tiles(start, width, height, blocked, ice=(), triggers=()):
    """Return (tiles traversed, tiles where movement can choose a new direction)."""
    ice, triggers = set(ice), set(triggers)
    pending, stops, traversed = deque([start]), {start}, {start}
    while pending:
        x, y = pending.popleft()
        for dx, dy in ((0, -1), (1, 0), (0, 1), (-1, 0)):
            point = (x + dx, y + dy)
            if point in blocked or not (0 <= point[0] < width and 0 <= point[1] < height):
                continue
            while True:
                traversed.add(point)
                # The runtime processes triggers after each tile, then can accept a new direction.
                if point not in ice or point in triggers:
                    if point not in stops:
                        stops.add(point)
                        pending.append(point)
                    break
                next_point = (point[0] + dx, point[1] + dy)
                if next_point in blocked or not (0 <= next_point[0] < width and 0 <= next_point[1] < height):
                    if point not in stops:
                        stops.add(point)
                        pending.append(point)
                    break
                point = next_point
    return traversed, stops
