from pathlib import Path


LEGACY_V1_RENDER_ASSETS = [
    {"kind": "tileset", "key": "veloria-ground", "path": "assets/tilesets/veloria-ground-v1.png", "tiledName": "veloria_terrain", "tileWidth": 32, "tileHeight": 32},
    {"kind": "image", "key": "borgofonte-house", "path": "assets/sprites/borgofonte-house-01.png"},
    {"kind": "image", "key": "borgofonte-tree", "path": "assets/sprites/borgofonte-tree-01.png"},
    {"kind": "image", "key": "veloria-bosco-ancient-tree-v1", "path": "assets/sprites/veloria-bosco-ancient-tree-v1.png"},
]


def validate_map_render_assets(metadata, tiled, tiled_path: Path, public_dir: Path,
                               registered_asset_paths: set[Path], shared_registry: dict,
                               offline_precache: str) -> dict:
    version = metadata.get("version")
    if version == 1:
        if "renderAssets" in metadata:
            raise AssertionError(f"MapDefinition v1 must not contain renderAssets: {metadata['id']}")
        render_assets = LEGACY_V1_RENDER_ASSETS
    elif version == 2:
        render_assets = metadata.get("renderAssets")
    else:
        raise AssertionError(f"Unsupported MapDefinition version: {metadata['id']} v{version}")
    if not isinstance(render_assets, list):
        raise AssertionError(f"renderAssets must be a list in {metadata['id']}")

    assets_by_key = {}
    tilesets_by_name = {}
    for asset in render_assets:
        kind, key, asset_path = asset.get("kind"), asset.get("key"), asset.get("path")
        if kind not in {"image", "tileset"} or not isinstance(key, str) or not key:
            raise AssertionError(f"Malformed render asset in {metadata['id']}")
        if not isinstance(asset_path, str) or not asset_path.startswith("assets/") or ".." in Path(asset_path).parts:
            raise AssertionError(f"Invalid public render asset path in {metadata['id']}: {asset_path}")
        resolved_asset_path = (public_dir / asset_path).resolve()
        try:
            resolved_asset_path.relative_to(public_dir.resolve())
        except ValueError as error:
            raise AssertionError(f"Render asset outside public/: {asset_path}") from error
        if not resolved_asset_path.is_file():
            raise AssertionError(f"Render asset file is missing: {asset_path}")
        if resolved_asset_path not in registered_asset_paths:
            raise AssertionError(f"Render asset is missing from assets/ASSET_REGISTER.csv: {asset_path}")
        if asset_path not in offline_precache:
            raise AssertionError(f"Render asset missing from the offline precache: {metadata['id']} -> {asset_path}")
        definition = (kind, asset_path, asset.get("tiledName"), asset.get("tileWidth"), asset.get("tileHeight"))
        previous = shared_registry.get(key)
        if previous is not None and previous != definition:
            raise AssertionError(f"Render asset key has conflicting definitions: {key}")
        shared_registry[key] = definition
        if key in assets_by_key:
            raise AssertionError(f"Duplicate render asset key in {metadata['id']}: {key}")
        assets_by_key[key] = asset
        if kind == "tileset":
            tiled_name = asset.get("tiledName")
            if not isinstance(tiled_name, str) or not tiled_name or tiled_name in tilesets_by_name:
                raise AssertionError(f"Missing or duplicate declared Tiled tileset name in {metadata['id']}: {tiled_name}")
            if not isinstance(asset.get("tileWidth"), int) or asset["tileWidth"] < 1 or not isinstance(asset.get("tileHeight"), int) or asset["tileHeight"] < 1:
                raise AssertionError(f"Invalid render tileset dimensions in {metadata['id']}: {key}")
            tilesets_by_name[tiled_name] = asset

    tiled_tilesets = {tileset.get("name"): tileset for tileset in tiled.get("tilesets", [])}
    if not tiled_tilesets:
        raise AssertionError(f"Tiled map has no tilesets: {metadata['id']}")
    if set(tilesets_by_name) != set(tiled_tilesets):
        raise AssertionError(f"Declared tilesets do not match Tiled tilesets in {metadata['id']}")
    for tiled_name, asset in tilesets_by_name.items():
        tiled_set = tiled_tilesets[tiled_name]
        tiled_image_path = (tiled_path.parent / tiled_set.get("image", "")).resolve()
        if tiled_image_path != (public_dir / asset["path"]).resolve():
            raise AssertionError(f"Tiled image does not match render asset {asset['key']} in {metadata['id']}")
        if tiled_set.get("tilewidth") != asset["tileWidth"] or tiled_set.get("tileheight") != asset["tileHeight"]:
            raise AssertionError(f"Tiled tile size does not match render asset {asset['key']} in {metadata['id']}")

    for layer in tiled.get("layers", []):
        if layer.get("name") != "decorations":
            continue
        for obj in layer.get("objects", []):
            if obj.get("class") != "scenery-image":
                continue
            raw_properties = obj.get("properties", [])
            properties = ({item.get("name"): item.get("value") for item in raw_properties}
                          if isinstance(raw_properties, list) else raw_properties)
            sprite_key = properties.get("sprite") if isinstance(properties, dict) else None
            sprite_asset = assets_by_key.get(sprite_key)
            if not sprite_asset or sprite_asset.get("kind") != "image":
                raise AssertionError(f"Scenery image references undeclared image asset in {metadata['id']}: {sprite_key}")
            if any(not isinstance(obj.get(dimension), (int, float)) or obj[dimension] <= 0
                   for dimension in ("width", "height")):
                raise AssertionError(f"Scenery image has invalid display bounds in {metadata['id']}: {obj.get('name')}")
    return assets_by_key
