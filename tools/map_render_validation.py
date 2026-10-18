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

    terrain_base = metadata.get("terrainBase")
    if terrain_base is not None:
        if not isinstance(terrain_base, dict):
            raise AssertionError(f"Malformed terrainBase in {metadata['id']}")
        asset_key = terrain_base.get("assetKey")
        tileset_name = terrain_base.get("tilesetName")
        tile_index = terrain_base.get("tileIndex")
        if (not isinstance(asset_key, str) or asset_key not in assets_by_key or assets_by_key[asset_key].get("kind") != "image" or
                not isinstance(tileset_name, str) or tileset_name not in tiled_tilesets or
                not isinstance(tile_index, int) or tile_index < 0):
            raise AssertionError(f"terrainBase must reference an image and a local Tiled tile in {metadata['id']}")
        ground_layer = next((layer for layer in tiled.get("layers", []) if layer.get("name") == "ground"), None)
        ground_data = ground_layer.get("data") if isinstance(ground_layer, dict) else None
        if not isinstance(ground_data, list):
            raise AssertionError(f"terrainBase requires a finite ground layer in {metadata['id']}")
        expected_gid = tiled_tilesets[tileset_name].get("firstgid", 1) + tile_index
        ground_gids = {int(gid) & 0x1FFFFFFF for gid in ground_data if gid}
        if ground_gids - {expected_gid}:
            raise AssertionError(f"terrainBase cannot replace mixed ground materials in {metadata['id']}: {sorted(ground_gids)}")

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

    for layer in tiled.get("layers", []):
        if layer.get("name") != "characters":
            continue
        for obj in layer.get("objects", []):
            raw_properties = obj.get("properties", [])
            properties = ({item.get("name"): item.get("value") for item in raw_properties}
                          if isinstance(raw_properties, list) else raw_properties)
            if not isinstance(properties, dict) or properties.get("kind") != "npc":
                continue
            sprite_key = properties.get("sprite")
            sprite_asset = assets_by_key.get(sprite_key)
            if not sprite_asset or sprite_asset.get("kind") != "image":
                raise AssertionError(f"NPC references an undeclared image asset in {metadata['id']}: {obj.get('name')} -> {sprite_key}")
            frame = properties.get("spriteFrame", 0)
            atlas = sprite_asset.get("atlas")
            if atlas is not None and (not isinstance(atlas, dict) or type(atlas.get("columns")) is not int or
                                      type(atlas.get("rows")) is not int or atlas["columns"] < 1 or atlas["rows"] < 1):
                raise AssertionError(f"NPC image has malformed atlas metadata in {metadata['id']}: {sprite_key}")
            if type(frame) is not int or frame < 0 or (atlas is not None and frame >= atlas["columns"] * atlas["rows"]) or (atlas is None and frame != 0):
                raise AssertionError(f"NPC references an invalid sprite frame in {metadata['id']}: {obj.get('name')} -> {frame}")
    return assets_by_key
