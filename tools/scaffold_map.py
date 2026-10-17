#!/usr/bin/env python3
"""Scaffold an isolated, contract-compliant Veloria MapDefinition v2 and Tiled map."""
import argparse
from pathlib import Path

from map_scaffold import create_map_draft


ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id", required=True, help="Stable ID, e.g. veloria/r03_terrazze_muschio")
    parser.add_argument("--name", required=True, help="Visible Italian map name")
    parser.add_argument("--biome", required=True, help="Stable biome ID, e.g. forest")
    parser.add_argument("--tileset-key", required=True, help="Phaser texture key")
    parser.add_argument("--tileset-path", required=True, help="Registered path under public/assets/tilesets/")
    parser.add_argument("--tiled-name", required=True, help="Tileset name in the generated Tiled JSON")
    parser.add_argument("--tile-width", type=int, default=32, help="Tile width in pixels (project contract: 32)")
    parser.add_argument("--tile-height", type=int, default=32, help="Tile height in pixels (project contract: 32)")
    parser.add_argument("--width", type=int, default=24, help="Map width in tiles")
    parser.add_argument("--height", type=int, default=16, help="Map height in tiles")
    parser.add_argument("--music-id", default="ambient_borgofonte")
    args = parser.parse_args()

    metadata_path, tiled_path = create_map_draft(
        ROOT,
        map_id=args.id,
        display_name=args.name,
        biome_id=args.biome,
        tileset_key=args.tileset_key,
        tileset_path=args.tileset_path,
        tiled_name=args.tiled_name,
        tile_width=args.tile_width,
        tile_height=args.tile_height,
        width=args.width,
        height=args.height,
        music_id=args.music_id,
    )
    print(f"Created map draft metadata: {metadata_path.relative_to(ROOT)}")
    print(f"Created Tiled draft: {tiled_path.relative_to(ROOT)}")
    print("Before runtime integration: add connections/content, move metadata to content/maps/, rename the Tiled file, then update offline cache and content version.")


if __name__ == "__main__":
    main()
