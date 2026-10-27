"""Generate an illustration geometry reference; never changes the source Tiled map."""
import argparse
import json
import math
from pathlib import Path

BLOCKED = "#8da4b6"
FLOOR = "#e5cfa7"
HABITAT = "#76a879"
ICE = "#b8e8f2"


def covered_cells(obj, width, height, tile_width, tile_height):
    if obj.get("rotation", 0) or any(key in obj for key in ("polygon", "polyline", "ellipse")):
        raise ValueError("Geometry guides require unrotated rectangular objects")
    left = max(0, math.floor(obj["x"] / tile_width))
    top = max(0, math.floor(obj["y"] / tile_height))
    right = min(width, math.ceil((obj["x"] + obj.get("width", 0)) / tile_width))
    bottom = min(height, math.ceil((obj["y"] + obj.get("height", 0)) / tile_height))
    return {(x, y) for y in range(top, bottom) for x in range(left, right)}


def generate_svg(tiled, foot_margin=20):
    if tiled.get("orientation") != "orthogonal" or tiled.get("infinite"):
        raise ValueError("Expected a finite orthogonal Tiled map")
    if foot_margin < 0:
        raise ValueError("Foot margin cannot be negative")
    width, height = tiled["width"], tiled["height"]
    tw, th = tiled["tilewidth"], tiled["tileheight"]
    blocked, actors, habitats, ice = set(), set(), set(), set()
    collision_found = False
    for layer in tiled["layers"]:
        if layer.get("type") == "group":
            raise ValueError("Flatten group layers before generating a geometry guide")
        if layer.get("type") != "objectgroup":
            continue
        if any(layer.get(key, 0) for key in ("x", "y", "offsetx", "offsety")):
            raise ValueError("Offset object layers require an explicit geometry conversion")
        collision_found |= layer["name"] == "collision"
        for obj in layer.get("objects", []):
            props = {p["name"]: p["value"] for p in obj.get("properties", [])}
            target = None
            if layer["name"] == "collision":
                if {"width", "height"} & props.keys():
                    raise ValueError("Collision dimensions must use Tiled rectangle fields, not custom properties")
                target = blocked
            elif props.get("kind") in ("npc", "wild-pokemon"):
                target = actors
            elif props.get("kind") == "encounter-zone":
                target = habitats
            elif layer["name"] == "movement_surfaces" and props.get("surface") == "ice":
                target = ice
            if target is not None:
                target.update(covered_cells(obj, width, height, tw, th))
    if not collision_found:
        raise ValueError("Missing collision layer")
    blocked -= actors  # Actors are runtime sprites, never rocks baked into the artwork.
    free = {(x, y) for y in range(height) for x in range(width)} - blocked
    result = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width*tw}" height="{height*th}" viewBox="0 0 {width*tw} {height*th}">',
              f'<rect width="{width*tw}" height="{height*th}" fill="{BLOCKED}"/>']
    # Blocked base first: later floor extensions must remain visible under actor feet.
    for cells, color, margin in ((free, FLOOR, foot_margin), (habitats & free, HABITAT, foot_margin), (ice & free, ICE, 0)):
        for y in range(height):
            x = 0
            while x < width:
                if (x, y) not in cells:
                    x += 1
                    continue
                start = x
                while x < width and (x, y) in cells:
                    x += 1
                result.append(f'<rect x="{start*tw}" y="{y*th}" width="{(x-start)*tw}" height="{th+margin}" fill="{color}"/>')
    return "\n".join([*result, "</svg>", ""])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--foot-margin", type=int, default=20)
    args = parser.parse_args()
    if args.source.resolve() == args.output.resolve():
        parser.error("Output must differ from the source map")
    args.output.write_text(generate_svg(json.loads(args.source.read_text(encoding="utf-8-sig")), args.foot_margin), encoding="utf-8")


if __name__ == "__main__":
    main()
