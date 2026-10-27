"""Validate provenance and map integration for illustrated full-map artwork."""
import csv
import hashlib
import json
import re
import struct
from pathlib import Path


MANIFEST_RELATIVE = Path("assets/map-parity-v2.json")
EXPECTED_GENERATOR = "built-in imagegen"


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _properties(obj):
    properties = obj.get("properties", [])
    if isinstance(properties, dict):
        return properties
    if isinstance(properties, list):
        return {entry.get("name"): entry.get("value") for entry in properties if isinstance(entry, dict)}
    return {}


def _image_dimensions(path: Path) -> tuple[int, int]:
    """Read PNG or WebP dimensions from their headers without third-party packages."""
    with path.open("rb") as handle:
        header = handle.read(30)
        if header.startswith(b"\x89PNG\r\n\x1a\n"):
            if len(header) < 24 or header[12:16] != b"IHDR":
                raise AssertionError(f"PNG has no readable IHDR dimensions: {path}")
            width, height = struct.unpack(">II", header[16:24])
            if width < 1 or height < 1:
                raise AssertionError(f"PNG dimensions are invalid: {path}")
            return width, height
        if len(header) < 20 or header[:4] != b"RIFF" or header[8:12] != b"WEBP":
            raise AssertionError(f"Expected PNG source or WebP runtime image: {path}")
        handle.seek(12)
        riff_size = struct.unpack("<I", header[4:8])[0]
        offset = 12
        while offset + 8 <= min(riff_size + 8, path.stat().st_size):
            handle.seek(offset)
            chunk_header = handle.read(8)
            if len(chunk_header) != 8:
                break
            chunk, chunk_size = chunk_header[:4], struct.unpack("<I", chunk_header[4:])[0]
            payload = handle.read(min(chunk_size, 30))
            if chunk == b"VP8X" and len(payload) >= 10:
                width = 1 + int.from_bytes(payload[4:7], "little")
                height = 1 + int.from_bytes(payload[7:10], "little")
            elif chunk == b"VP8L" and len(payload) >= 5 and payload[0] == 0x2f:
                bits = int.from_bytes(payload[1:5], "little")
                width = 1 + (bits & 0x3FFF)
                height = 1 + ((bits >> 14) & 0x3FFF)
            elif chunk == b"VP8 " and len(payload) >= 10 and payload[3:6] == b"\x9d\x01\x2a":
                width = int.from_bytes(payload[6:8], "little") & 0x3FFF
                height = int.from_bytes(payload[8:10], "little") & 0x3FFF
            else:
                width = height = 0
            if width and height:
                return width, height
            offset += 8 + chunk_size + (chunk_size & 1)
    raise AssertionError(f"Could not read PNG/WebP dimensions: {path}")


def validate_full_map_binding(metadata, tiled, asset_key, map_id):
    """Validate scenery and/or terrainBase without inventing a duplicate scenery layer."""
    whole_map = [obj for layer in tiled.get("layers", []) if layer.get("name") == "decorations"
                 for obj in layer.get("objects", [])
                 if (obj.get("class") or obj.get("type") or _properties(obj).get("kind")) == "scenery-image"
                 and _properties(obj).get("sprite") == asset_key]
    terrain = metadata.get("terrainBase", {})
    terrain_matches = terrain.get("assetKey") == asset_key
    if len(whole_map) > 1 or not (whole_map or terrain_matches):
        raise AssertionError(f"Expected one full-map scenery and/or terrainBase binding for {map_id}")
    if terrain_matches:
        name, index = terrain.get("tilesetName"), terrain.get("tileIndex")
        declared = [asset for asset in metadata.get("renderAssets", [])
                    if asset.get("kind") == "tileset" and asset.get("tiledName") == name]
        tilesets = [tileset for tileset in tiled.get("tilesets", []) if tileset.get("name") == name]
        grounds = [layer for layer in tiled.get("layers", []) if layer.get("name") == "ground" and layer.get("type") == "tilelayer"]
        if len(declared) != 1 or len(tilesets) != 1 or len(grounds) != 1 or type(index) is not int or index < 0:
            raise AssertionError(f"Invalid full-map terrainBase tileset/ground binding for {map_id}")
        gid = tilesets[0].get("firstgid", 0) + index
        data = grounds[0].get("data", [])
        if gid < 1 or len(data) != tiled["width"] * tiled["height"] or any(tile not in (0, gid) for tile in data):
            raise AssertionError(f"Full-map terrainBase may only replace its declared ground tile for {map_id}")
    if whole_map:
        background = whole_map[0]
        if (background.get("x") != 0 or background.get("y") != 0 or
                abs(background.get("width", 0) - tiled["width"] * tiled["tilewidth"]) > 1 or
                abs(background.get("height", 0) - tiled["height"] * tiled["tileheight"]) > 1):
            raise AssertionError(f"Full-map artwork bounds do not cover the world for {map_id}")


def validate_map_parity_art(repository_root: Path) -> int:
    """Validate manifest hashes, dimensions, map bindings, registry and precache."""
    root = repository_root.resolve()
    manifest_path = root / MANIFEST_RELATIVE
    if not manifest_path.is_file():
        raise AssertionError(f"Map artwork provenance manifest is missing: {manifest_path}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("version") != 2 or manifest.get("generator") != EXPECTED_GENERATOR:
        raise AssertionError("Map artwork provenance must use version 2 and the built-in imagegen generator.")
    artworks = manifest.get("artworks")
    if not isinstance(artworks, list) or not artworks:
        raise AssertionError("Map artwork provenance must contain artwork records.")

    # Grow with the maps actually bound to versioned illustrated scenery. A
    # fixed count blocked new maps and could not detect a missing specific map.
    required_maps = {
        metadata["id"]
        for path in (root / "content" / "maps").glob("*.map.json")
        for metadata in [json.loads(path.read_text(encoding="utf-8"))]
        if any(re.fullmatch(r"veloria-.+-illustrated-v\d+", asset.get("key", ""))
               for asset in metadata.get("renderAssets", []))
    }
    recorded_maps = {record.get("mapId") for record in artworks}
    if required_maps - recorded_maps:
        raise AssertionError(f"Illustrated maps missing artwork provenance: {sorted(required_maps - recorded_maps)}")

    register_path = root / "assets" / "ASSET_REGISTER.csv"
    with register_path.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    registered = {}
    for row in rows:
        file_path = (register_path.parent / (row.get("filename") or "")).resolve()
        registered[file_path] = row
    precache = (root / "public" / "sw.js").read_text(encoding="utf-8")
    asset_keys = set()
    map_ids = set()

    for record in artworks:
        map_id = record.get("mapId")
        asset_key = record.get("assetKey")
        if not isinstance(map_id, str) or map_id in map_ids:
            raise AssertionError(f"Missing or duplicate mapId in map artwork provenance: {map_id!r}")
        if not isinstance(asset_key, str) or asset_key in asset_keys:
            raise AssertionError(f"Missing or duplicate assetKey in map artwork provenance: {asset_key!r}")
        map_ids.add(map_id)
        asset_keys.add(asset_key)
        if not isinstance(record.get("prompt"), str) or not record["prompt"].strip():
            raise AssertionError(f"Artwork prompt is missing for {map_id}")
        if not isinstance(record.get("revisions"), list):
            raise AssertionError(f"Artwork revisions must be a list for {map_id}")

        source_rel = Path(record.get("sourcePath", ""))
        runtime_rel = Path(record.get("runtimePath", ""))
        expected_source = Path("assets/sources") / f"{asset_key}.png"
        expected_runtime = Path("public/assets/scenery") / f"{asset_key}.webp"
        if source_rel != expected_source or runtime_rel != expected_runtime:
            raise AssertionError(f"Unexpected source/runtime artwork path for {map_id}")
        source_path, runtime_path = root / source_rel, root / runtime_rel
        if not source_path.is_file() or not runtime_path.is_file():
            raise AssertionError(f"Source or runtime artwork file is missing for {map_id}")
        if _sha256(source_path) != record.get("sourceSha256"):
            raise AssertionError(f"Source artwork checksum mismatch for {map_id}")
        if _sha256(runtime_path) != record.get("runtimeSha256"):
            raise AssertionError(f"Runtime artwork checksum mismatch for {map_id}")

        source_size = _image_dimensions(source_path)
        runtime_size = _image_dimensions(runtime_path)
        expected_size = (record.get("width"), record.get("height"))
        if source_size != runtime_size or source_size != expected_size:
            raise AssertionError(f"Source/runtime/manifest dimensions disagree for {map_id}: {source_size}, {runtime_size}, {expected_size}")

        metadata_matches = [
            path for path in (root / "content" / "maps").glob("*.map.json")
            if json.loads(path.read_text(encoding="utf-8")).get("id") == map_id
        ]
        if len(metadata_matches) != 1:
            raise AssertionError(f"Expected one runtime map definition for artwork {map_id}")
        metadata = json.loads(metadata_matches[0].read_text(encoding="utf-8"))
        if metadata.get("tiledAsset") != record.get("tiledAsset"):
            raise AssertionError(f"Tiled map binding mismatch for {map_id}")
        declared = [asset for asset in metadata.get("renderAssets", []) if asset.get("key") == asset_key]
        if len(declared) != 1 or declared[0].get("kind") != "image" or declared[0].get("path") != runtime_rel.relative_to("public").as_posix():
            raise AssertionError(f"Map metadata does not bind the full-map artwork key/path for {map_id}")

        tiled_path = root / "public" / record["tiledAsset"]
        tiled = json.loads(tiled_path.read_text(encoding="utf-8"))
        expected_aspect = (tiled["width"] * tiled["tilewidth"]) / (tiled["height"] * tiled["tileheight"])
        actual_aspect = source_size[0] / source_size[1]
        if abs(actual_aspect / expected_aspect - 1) > 0.005:
            raise AssertionError(f"Artwork aspect ratio differs from map world by more than 0.5%: {map_id}")
        validate_full_map_binding(metadata, tiled, asset_key, map_id)

        for path in (source_path, runtime_path):
            row = registered.get(path.resolve())
            if row is None:
                raise AssertionError(f"Source/runtime artwork missing from assets/ASSET_REGISTER.csv: {path.relative_to(root)}")
            if not row.get("asset_id", "").strip() or not row.get("creator", "").strip():
                raise AssertionError(f"Artwork register provenance is incomplete: {path.relative_to(root)}")
        if record["runtimePath"].removeprefix("public/") not in precache:
            raise AssertionError(f"Runtime full-map artwork is missing from service worker precache: {map_id}")

    return len(artworks)


if __name__ == "__main__":
    repo = Path(__file__).resolve().parents[1]
    print(f"OK: {validate_map_parity_art(repo)} full-map artworks have valid provenance and bindings.")
