"""Create an isolated MapDefinition v2 and Tiled JSON draft from a registered tileset."""
import json
import posixpath
import re
import struct
from pathlib import Path

from asset_register_validation import validate_asset_register
from json_schema_validation import validate_json_schema


MAP_ID_PATTERN = re.compile(r"^veloria/([a-z0-9_]+)$")
BIOME_ID_PATTERN = re.compile(r"^[a-z0-9_]+$")
LAYER_NAMES = (
    ("ground", "tilelayer"),
    ("terrain_detail", "tilelayer"),
    ("shadows", "tilelayer"),
    ("collision", "objectgroup"),
    ("characters", "objectgroup"),
    ("canopy_overhead", "objectgroup"),
    ("interactions", "objectgroup"),
    ("triggers", "objectgroup"),
    ("decorations", "objectgroup"),
)


def png_dimensions(path: Path) -> tuple[int, int]:
    with path.open("rb") as handle:
        header = handle.read(24)
    if len(header) != 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise AssertionError(f"Tileset must be a PNG with a readable IHDR header: {path}")
    width, height = struct.unpack(">II", header[16:24])
    if width < 1 or height < 1:
        raise AssertionError(f"Tileset has invalid dimensions: {path}")
    return width, height


def _map_layers(width: int, height: int) -> list[dict]:
    layers = []
    for layer_id, (name, layer_type) in enumerate(LAYER_NAMES, start=1):
        if layer_type == "tilelayer":
            layer = {
                "data": [0] * (width * height), "height": height, "id": layer_id,
                "name": name, "opacity": 1, "type": "tilelayer", "visible": True,
                "width": width, "x": 0, "y": 0,
            }
        else:
            layer = {
                "draworder": "topdown", "id": layer_id, "name": name,
                "objects": [], "opacity": 1, "type": "objectgroup", "visible": True,
                "x": 0, "y": 0,
            }
        layers.append(layer)
    return layers


def create_map_draft(
    repository_root: Path,
    *,
    map_id: str,
    display_name: str,
    biome_id: str,
    tileset_key: str,
    tileset_path: str,
    tiled_name: str,
    tile_width: int = 32,
    tile_height: int = 32,
    width: int = 24,
    height: int = 16,
    music_id: str = "ambient_borgofonte",
) -> tuple[Path, Path]:
    """Write metadata and Tiled drafts outside the runtime map glob and return their paths."""
    repository_root = repository_root.resolve()
    match = MAP_ID_PATTERN.fullmatch(map_id)
    if not match:
        raise AssertionError("Map ID must use the stable form veloria/lowercase_slug.")
    slug = match.group(1)
    if not display_name.strip():
        raise AssertionError("Map display name must not be empty.")
    if not BIOME_ID_PATTERN.fullmatch(biome_id):
        raise AssertionError("Biome ID must contain lowercase letters, digits, or underscores.")
    if not tileset_key.strip() or not tiled_name.strip():
        raise AssertionError("Tileset key and Tiled name must not be empty.")
    if (tile_width, tile_height) != (32, 32):
        raise AssertionError("Playable Veloria maps use 32 x 32 px tiles.")
    if any(not isinstance(value, int) or value < 1 for value in (tile_width, tile_height, width, height)):
        raise AssertionError("Map and tile dimensions must be positive integers.")
    if not tileset_path.startswith("assets/tilesets/") or ".." in Path(tileset_path).parts:
        raise AssertionError("Tileset path must stay inside public/assets/tilesets/.")

    draft_metadata = repository_root / "content" / "map-drafts" / f"{slug}.map.json"
    draft_tiled = repository_root / "public" / "tilemaps" / f"_draft_{slug}.tmj"
    if draft_metadata.exists() or draft_tiled.exists():
        raise AssertionError(f"Map draft already exists for {map_id}.")

    runtime_maps = repository_root / "content" / "maps"
    for map_path in runtime_maps.glob("*.map.json"):
        current = json.loads(map_path.read_text(encoding="utf-8"))
        if current.get("id") == map_id:
            raise AssertionError(f"Runtime map ID already exists: {map_id}.")

    public_root = repository_root / "public"
    register_path = repository_root / "assets" / "ASSET_REGISTER.csv"
    _, registered_paths = validate_asset_register(register_path, repository_root, public_root)
    tileset_file = public_root / tileset_path
    if not tileset_file.is_file() or tileset_file.resolve() not in registered_paths:
        raise AssertionError(f"Tileset must exist and be registered in assets/ASSET_REGISTER.csv: {tileset_path}")
    image_width, image_height = png_dimensions(tileset_file)
    if image_width % tile_width or image_height % tile_height:
        raise AssertionError("Tileset image dimensions must be multiples of tileWidth/tileHeight.")

    shared_key = tileset_key
    definition = ("tileset", tileset_path, tiled_name, tile_width, tile_height)
    for map_path in runtime_maps.glob("*.map.json"):
        current = json.loads(map_path.read_text(encoding="utf-8"))
        for asset in current.get("renderAssets", []):
            if asset.get("key") == shared_key:
                previous = (
                    asset.get("kind"), asset.get("path"), asset.get("tiledName"),
                    asset.get("tileWidth"), asset.get("tileHeight"),
                )
                if previous != definition:
                    raise AssertionError(f"Tileset key conflicts with an existing map definition: {shared_key}")

    theme_file = repository_root / "content" / "audio" / "themes.v1.json"
    themes = json.loads(theme_file.read_text(encoding="utf-8")).get("themes", {})
    if music_id not in themes:
        raise AssertionError(f"Unknown musicId {music_id}; add a versioned theme before scaffolding this map.")

    metadata = {
        "id": map_id,
        "version": 2,
        "displayName": display_name.strip(),
        "biomeId": biome_id,
        "tiledAsset": f"tilemaps/{slug}.tmj",
        "renderAssets": [{
            "kind": "tileset", "key": tileset_key, "path": tileset_path,
            "tiledName": tiled_name, "tileWidth": tile_width, "tileHeight": tile_height,
        }],
        "spawns": [{"id": "start", "x": width // 2, "y": height // 2, "facing": "down"}],
        "connections": [],
        "encounterTableIds": [],
        "npcRefs": [],
        "scriptRefs": [],
        "musicId": music_id,
    }
    tileset = {
        "columns": image_width // tile_width,
        "firstgid": 1,
        "image": posixpath.relpath(tileset_path, "tilemaps"),
        "imageheight": image_height,
        "imagewidth": image_width,
        "margin": 0,
        "name": tiled_name,
        "spacing": 0,
        "tilecount": (image_width // tile_width) * (image_height // tile_height),
        "tileheight": tile_height,
        "tilewidth": tile_width,
    }
    tiled = {
        "compressionlevel": -1,
        "height": height,
        "infinite": False,
        "layers": _map_layers(width, height),
        "nextlayerid": len(LAYER_NAMES) + 1,
        "nextobjectid": 1,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.10.2",
        "tileheight": tile_height,
        "tilesets": [tileset],
        "tilewidth": tile_width,
        "type": "map",
        "version": "1.10",
        "width": width,
    }

    project_root = Path(__file__).resolve().parents[1]
    schema = json.loads((project_root / "specs" / "schemas" / "map.v2.schema.json").read_text(encoding="utf-8"))
    validate_json_schema(metadata, schema, f"Map draft {map_id}")

    draft_metadata.parent.mkdir(parents=True, exist_ok=True)
    try:
        draft_metadata.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        draft_tiled.write_text(json.dumps(tiled, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    except OSError:
        draft_metadata.unlink(missing_ok=True)
        draft_tiled.unlink(missing_ok=True)
        raise
    return draft_metadata, draft_tiled
