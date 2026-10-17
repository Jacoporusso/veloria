#!/usr/bin/env python3
"""Validate Veloria content, versioned map schemas, and referential coherence.
Run: python tools/validate_examples.py
"""
import json
import hashlib
import re
from collections import deque
from math import ceil
from pathlib import Path
from map_render_validation import validate_map_render_assets
from asset_register_validation import validate_asset_register
from dependency_license_validation import validate_dependency_register
from json_schema_validation import validate_json_schema

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "content" / "examples"
MAPS = ROOT / "content" / "maps"
SCHEMAS = ROOT / "specs" / "schemas"
PUBLIC = ROOT / "public"
DIALOGUE_FILE = ROOT / "content" / "dialogue" / "world.v1.json"
STARTER_FILE = ROOT / "content" / "starters" / "starting-partners.v1.json"
SPECIES_FILE = ROOT / "content" / "battle" / "species.v1.json"
MOVE_FILE = ROOT / "content" / "battle" / "moves.v1.json"
TYPE_CHART_FILE = ROOT / "content" / "battle" / "type-chart.v1.json"
OPPONENT_POLICIES_FILE = ROOT / "content" / "battle" / "opponent-policies.v1.json"
PROGRESSION_FILE = ROOT / "content" / "battle" / "progression.v1.json"
ENCOUNTERS = ROOT / "content" / "encounters"
QUESTS = ROOT / "content" / "quests"
TRAINERS = ROOT / "content" / "trainers"
ITEMS_FILE = ROOT / "content" / "items" / "items.v1.json"
SHOPS = ROOT / "content" / "shops"
ASSET_REGISTER = ROOT / "assets" / "ASSET_REGISTER.csv"
CONTENT_MANIFEST = ROOT / "content" / "manifest.json"

def read(name):
    return json.loads((EXAMPLES / name).read_text(encoding="utf-8"))

def check(condition, why):
    if not condition:
        raise AssertionError(why)

def reachable_tiles(start, width, height, blocked):
    pending = deque([start])
    visited = {start}
    while pending:
        x, y = pending.popleft()
        for point in ((x, y - 1), (x + 1, y), (x, y + 1), (x - 1, y)):
            px, py = point
            if (0 <= px < width and 0 <= py < height and point not in blocked and point not in visited):
                visited.add(point)
                pending.append(point)
    return visited

files = sorted(EXAMPLES.glob("*.json"))
for file in files:
    json.loads(file.read_text(encoding="utf-8"))

example_map_schema = json.loads((SCHEMAS / "map.v1.schema.json").read_text(encoding="utf-8"))
maps = [json.loads(f.read_text(encoding="utf-8")) for f in EXAMPLES.glob("*.map.json")]
for example_map in maps:
    validate_json_schema(example_map, example_map_schema, f"Example map {example_map.get('id', '<missing id>')}")
by_id = {m["id"]:m for m in maps}
check(len(by_id) == len(maps), "Duplicate map IDs")
for m in maps:
    check(m["id"].startswith("veloria/"), "Map not in region")
    spawns = {s["id"] for s in m["spawns"]}
    check(len(spawns) == len(m["spawns"]), "Duplicate spawn ID")
    for c in m["connections"]:
        check(c["viaSpawnId"] in spawns, f"Invalid local spawn: {m['id']}")
        check(c["toMapId"] in by_id, f"Map connection missing target: {c['toMapId']}")
        target = by_id[c["toMapId"]]
        check(c["targetSpawnId"] in {s["id"] for s in target["spawns"]}, "Invalid target spawn")
        check(any(back["toMapId"] == m["id"] for back in target["connections"]), "Missing reciprocal link")

# Runtime map metadata points to authorable Tiled JSON files. Validate both sides
# of that boundary so a map can be added without changing renderer code.
runtime_maps = sorted(MAPS.glob("*.map.json"))
map_schemas = {
    version: json.loads((SCHEMAS / f"map.v{version}.schema.json").read_text(encoding="utf-8"))
    for version in (1, 2)
}
for map_path in runtime_maps:
    metadata = json.loads(map_path.read_text(encoding="utf-8"))
    version = metadata.get("version")
    check(version in map_schemas, f"Unsupported runtime MapDefinition version in {map_path.name}: {version}")
    validate_json_schema(metadata, map_schemas[version], f"Runtime map {map_path.name}")
music_content = json.loads((ROOT / "content/audio/themes.v1.json").read_text(encoding="utf-8"))
check(music_content.get("version") == 1 and music_content.get("status") == "prototype",
      "Music themes must stay explicitly versioned and provisional")
music_theme_ids = set(music_content.get("themes", {}))
for theme_id, theme in music_content.get("themes", {}).items():
    check(theme.get("wave") in {"sine", "triangle", "square", "sawtooth"}, f"Unsupported audio wave in {theme_id}")
    check(200 <= theme.get("beatMs", 0) <= 2500 and len(theme.get("notes", [])) >= 4,
          f"Invalid procedural theme timing or phrase: {theme_id}")
    check(all(isinstance(note, (int, float)) and 20 <= note <= 4000 for note in theme["notes"]),
          f"Invalid note frequency in {theme_id}")
runtime_by_id = {}
trigger_destinations_by_id = {}
runtime_navigation = {}
render_asset_registry = {}
zone_encounter_refs = set()
required_layers = {"ground", "terrain_detail", "collision", "characters", "canopy_overhead", "interactions", "triggers"}
dialogues = json.loads(DIALOGUE_FILE.read_text(encoding="utf-8"))
starter_data = json.loads(STARTER_FILE.read_text(encoding="utf-8"))
starters = starter_data["starters"]
species_registry = json.loads(SPECIES_FILE.read_text(encoding="utf-8"))["species"]
progression = json.loads(PROGRESSION_FILE.read_text(encoding="utf-8"))
content_manifest = json.loads(CONTENT_MANIFEST.read_text(encoding="utf-8"))
check(content_manifest.get("manifestVersion") == 1, "Unsupported content manifest schema version")
check(content_manifest.get("status") == "prototype", "Content manifest must remain explicitly marked as prototype")
check(re.fullmatch(r"veloria-content-[a-z0-9.-]+", content_manifest.get("contentVersion", "")), "Invalid contentVersion in manifest")
growth_curves = progression["growthCurves"]
check(progression.get("status") == "prototype", "Progression rules must remain explicitly marked as prototype")
for curve_id, curve in growth_curves.items():
    check(curve.get("exponent", 0) > 0 and curve.get("multiplier", 0) > 0, f"Invalid growth curve: {curve_id}")
for species in species_registry.values():
    check(species.get("growthCurveId") in growth_curves, f"Unknown growth curve for species {species.get('speciesId')}")
evolution_entries = progression.get("evolutions", [])
check(isinstance(evolution_entries, list), "Evolution rules must be a list")
evolution_pairs = set()
evolution_sources = set()
evolution_edges = {}
for entry in evolution_entries:
    source, target, minimum_level, asset_id = entry.get("fromSpeciesId"), entry.get("toSpeciesId"), entry.get("minimumLevel"), entry.get("assetId")
    check(str(source) in species_registry, f"Unknown evolution source species: {source}")
    check(str(target) in species_registry, f"Unknown evolution target species: {target}")
    check(source != target and isinstance(minimum_level, int) and 2 <= minimum_level <= 100, f"Invalid evolution rule: {source} -> {target}")
    check((source, target) not in evolution_pairs, f"Duplicate evolution rule: {source} -> {target}")
    check(source not in evolution_sources, f"Multiple level evolution targets are not supported for source species {source}")
    evolution_pairs.add((source, target))
    evolution_sources.add(source)
    evolution_edges.setdefault(source, []).append(target)
move_registry = json.loads(MOVE_FILE.read_text(encoding="utf-8"))["moves"]
for move_id, move in move_registry.items():
    check(move.get("id") == move_id, f"Move key mismatch: {move_id}")
    effects = move.get("statChanges", [])
    check(isinstance(effects, list), f"Invalid statChanges in {move_id}")
    for effect in effects:
        check(isinstance(effect, dict), f"Invalid stat change in {move_id}")
        check(effect.get("target") in {"self", "opponent"}, f"Invalid stat target in {move_id}")
        check(effect.get("stat") in {"attack", "defense", "specialAttack", "specialDefense", "speed"}, f"Invalid stat in {move_id}")
        change = effect.get("stages")
        check(type(change) is int and -6 <= change <= 6 and change != 0, f"Invalid stage change in {move_id}")
type_chart_data = json.loads(TYPE_CHART_FILE.read_text(encoding="utf-8"))
expected_battle_types = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel"]
check(type_chart_data.get("version") == 1 and type_chart_data.get("id") == "veloria-type-chart-gen2-v1" and
      type_chart_data.get("generation") == 2, "Unsupported or malformed generation II type chart")
check(type_chart_data.get("types") == expected_battle_types, "Generation II type chart must list all 17 supported types in battle order")
type_chart = type_chart_data.get("chart")
check(isinstance(type_chart, dict) and set(type_chart) == set(expected_battle_types) and len(type_chart) == 17,
      "Generation II type chart must contain exactly 17 attacking types")
for attacking_type in expected_battle_types:
    row = type_chart.get(attacking_type, {}) if isinstance(type_chart, dict) else {}
    check(isinstance(row, dict) and set(row) == set(expected_battle_types) and len(row) == 17,
          f"Generation II type chart row must contain all 17 defending types: {attacking_type}")
    for defending_type in expected_battle_types:
        factor = row.get(defending_type) if isinstance(row, dict) else None
        check(type(factor) in (int, float) and factor in (0, 0.5, 1, 2),
              f"Invalid type efficacy {attacking_type} -> {defending_type}: {factor}")
source = type_chart_data.get("source", {})
source_hashes = source.get("sha256", {}) if isinstance(source, dict) else {}
for hash_name in ("efficacy", "historicalEfficacy", "types"):
    check(isinstance(source_hashes.get(hash_name), str) and re.fullmatch(r"[0-9a-f]{64}", source_hashes[hash_name]),
          f"Missing or malformed type chart source SHA-256: {hash_name}")
item_registry = json.loads(ITEMS_FILE.read_text(encoding="utf-8"))["items"]
trainer_files = sorted(TRAINERS.glob("*.trainer.json"))
trainers = [json.loads(file.read_text(encoding="utf-8")) for file in trainer_files]
trainer_registry = {trainer["id"]: trainer for trainer in trainers}
opponent_policies_data = json.loads(OPPONENT_POLICIES_FILE.read_text(encoding="utf-8"))
opponent_profiles = opponent_policies_data.get("profiles", {})
required_opponent_profiles = {"wild", "route_young", "route_cautious", "gym_beginner"}
check(opponent_policies_data.get("version") == 1 and opponent_policies_data.get("status") == "prototype",
      "Opponent policies must remain explicitly versioned and provisional")
check(isinstance(opponent_profiles, dict) and required_opponent_profiles <= set(opponent_profiles),
      "Opponent policy registry is missing a required profile")
for profile_id, profile in opponent_profiles.items():
    check(isinstance(profile, dict), f"Invalid opponent policy: {profile_id}")
    check(profile.get("id") == profile_id, f"Opponent profile ID mismatch: {profile_id}")
    cadence = profile.get("statusEveryTurns")
    check(type(cadence) is int and 0 <= cadence <= 100, f"Invalid status cadence in opponent profile {profile_id}")
    setup_cap = profile.get("maxSetupStage")
    check(type(setup_cap) is int and 1 <= setup_cap <= 6, f"Invalid setup stage cap in opponent profile {profile_id}")
    check(profile.get("damageSelection") in {"best", "cycle"}, f"Invalid damage selection in opponent profile {profile_id}")
for trainer in trainers:
    check(trainer.get("aiProfileId") in opponent_profiles,
          f"Trainer references unknown opponent AI profile: {trainer['id']}")
shop_files = sorted(SHOPS.glob("*.shop.json"))
shops = [json.loads(file.read_text(encoding="utf-8")) for file in shop_files]
shop_registry = {shop["id"]: shop for shop in shops}
asset_rows, registered_asset_paths = validate_asset_register(ASSET_REGISTER, ROOT, PUBLIC)
starter_art = json.loads((ROOT / "assets" / "pokeapi-starter-artwork-v1.json").read_text(encoding="utf-8"))
check({entry["speciesId"] for entry in starter_art["artworks"]} == {1, 4, 7, 25}, "Starter artwork IDs are incomplete")
for entry in starter_art["artworks"]:
    expected_path = f"assets/creatures/pokeapi-starter-{entry['speciesId']}-v1.png"
    check(entry["path"] == expected_path, "Unexpected starter artwork path")
    content = (PUBLIC / expected_path).read_bytes()
    check(hashlib.sha256(content).hexdigest() == entry["sha256"], f"Starter artwork checksum mismatch: {expected_path}")
    check(expected_path in (PUBLIC / "sw.js").read_text(encoding="utf-8"), f"Starter artwork missing from offline cache: {expected_path}")

dependency_rows = validate_dependency_register(ROOT / "package-lock.json", ROOT / "assets" / "DEPENDENCY_LICENSES.csv")
asset_registry = {asset["asset_id"]: asset for asset in asset_rows}
for entry in evolution_entries:
    asset = asset_registry.get(entry.get("assetId"))
    check(asset is not None and asset.get("status") in {"prototype-use", "approved"}, f"Evolution target artwork is missing or not approved: {entry.get('assetId')}")
visiting, visited = set(), set()
def visit_evolution(species_id):
    if species_id in visiting:
        raise AssertionError(f"Evolution rules contain a cycle at species {species_id}")
    if species_id in visited:
        return
    visiting.add(species_id)
    for next_species_id in evolution_edges.get(species_id, []):
        visit_evolution(next_species_id)
    visiting.remove(species_id)
    visited.add(species_id)
for species_id in evolution_edges:
    visit_evolution(species_id)
quest_files = sorted(QUESTS.glob("*.quest.json"))
quests = [json.loads(file.read_text(encoding="utf-8")) for file in quest_files]
quest_triggers = {step["trigger"] for quest in quests for step in quest["steps"]}
quest_flags = {step["setFlag"] for quest in quests for step in quest["steps"]}
check(starter_data.get("selectionFlag") == "q_starter_selected", "Starter selection flag is missing or unsupported")
quest_flags.add(starter_data["selectionFlag"])
check(len({quest["id"] for quest in quests}) == len(quests), "Duplicate quest ID")
for quest in quests:
    step_flags = [step["setFlag"] for step in quest["steps"]]
    check(len(step_flags) == len(set(step_flags)), f"Duplicate quest flags: {quest['id']}")
    for step in quest["steps"]:
        check(step["trigger"], f"Quest step has no trigger: {quest['id']}")
    check((quest.get("reward", {}).get("money", 0) >= 0), f"Negative quest reward: {quest['id']}")
    for item_id, quantity in quest.get("reward", {}).get("items", {}).items():
        check(item_id in item_registry, f"Unknown quest reward item in {quest['id']}: {item_id}")
        check(isinstance(quantity, int) and quantity >= 0, f"Invalid quest reward quantity in {quest['id']}: {item_id}")
check(len(starters) == 4, "Expected four starter partners")
check(len({starter["speciesId"] for starter in starters}) == len(starters), "Duplicate starter species")
for species_key, species in species_registry.items():
    check(str(species["speciesId"]) == species_key, f"Species registry key mismatch: {species_key}")
    check(all(move_id in move_registry for move_id in species["defaultMoveIds"]), f"Unknown default move in species {species_key}")
for starter in starters:
    check(1 <= starter["hp"] <= 100 and 1 <= len(starter["moves"]) <= 4, f"Invalid starter data: {starter['name']}")
check(len(trainer_registry) == len(trainers), "Duplicate trainer IDs")
for trainer in trainers:
    check(1 <= len(trainer["team"]) <= 6, f"Invalid trainer team: {trainer['id']}")
    check(trainer["rewardMoney"] >= 0, f"Negative trainer reward: {trainer['id']}")
    check(bool(trainer.get("victoryMessage")), f"Trainer has no localized victory message: {trainer['id']}")
    for member in trainer["team"]:
        check(str(member["speciesId"]) in species_registry, f"Unknown trainer species: {trainer['id']}")
        check(1 <= member["level"] <= 100 and 1 <= len(member["moveIds"]) <= 4, f"Invalid trainer creature: {trainer['id']}")
        check(all(move_id in move_registry for move_id in member["moveIds"]), f"Unknown trainer move: {trainer['id']}")
for item_id, item in item_registry.items():
    check(item["id"] == item_id and item["price"] >= 0 and item["maxStack"] > 0, f"Invalid item definition: {item_id}")
check(len(shop_registry) == len(shops), "Duplicate shop IDs")
for shop in shops:
    check(len(shop["items"]) == len(set(shop["items"])), f"Duplicate stock item in {shop['id']}")
    check(all(item_id in item_registry for item_id in shop["items"]), f"Unknown stock item in {shop['id']}")
for dialogue_id, dialogue in dialogues.items():
    for stage in dialogue.get("stages", []):
        if stage.get("questEvent"):
            check(stage["questEvent"] in quest_triggers, f"Unregistered quest event in dialogue {dialogue_id}")
for file in runtime_maps:
    metadata = json.loads(file.read_text(encoding="utf-8"))
    check(metadata.get("version") == 2, f"New runtime maps must use MapDefinition v2: {metadata['id']}")
    check(metadata.get("musicId") in music_theme_ids, f"Map references an unknown music theme: {metadata['id']}")
    check(metadata["id"] not in runtime_by_id, f"Duplicate runtime map ID: {metadata['id']}")
    runtime_by_id[metadata["id"]] = metadata
    tiled_path = PUBLIC / metadata["tiledAsset"]
    check(tiled_path.is_file(), f"Tiled map asset missing: {metadata['tiledAsset']}")
    check(metadata["tiledAsset"] in (PUBLIC / "sw.js").read_text(encoding="utf-8"),
          f"Runtime map is missing from the offline precache: {metadata['id']}")
    tiled = json.loads(tiled_path.read_text(encoding="utf-8"))
    assets_by_key = validate_map_render_assets(
        metadata, tiled, tiled_path, PUBLIC, registered_asset_paths,
        render_asset_registry, (PUBLIC / "sw.js").read_text(encoding="utf-8"),
    )
    if metadata.get("battleBackgroundKey") is not None:
        background = assets_by_key.get(metadata["battleBackgroundKey"])
        check(background is not None and background.get("kind") == "image",
              f"battleBackgroundKey must reference a declared image asset: {metadata['id']}")
    check(tiled.get("orientation") == "orthogonal", f"Map must be orthogonal: {tiled_path.name}")
    check(tiled.get("tilewidth") == 32 and tiled.get("tileheight") == 32, f"Map must use 32px tiles: {tiled_path.name}")
    check(tiled.get("width", 0) > 0 and tiled.get("height", 0) > 0, f"Map dimensions invalid: {tiled_path.name}")
    layers = {layer.get("name"): layer for layer in tiled.get("layers", [])}
    ambient_effects = metadata.get("ambientEffects", [])
    check(isinstance(ambient_effects, list), f"ambientEffects must be a list: {metadata['id']}")
    for effect in (ambient_effects if isinstance(ambient_effects, list) else []):
        effect_data = effect if isinstance(effect, dict) else {}
        area = effect_data.get("area", {})
        colors = effect_data.get("colors", [])
        if effect_data.get("kind") == "fireflies":
            check(isinstance(effect_data.get("count"), int) and 1 <= effect_data["count"] <= 64,
                  f"Invalid firefly effect in {metadata['id']}")
            check(isinstance(area, dict) and all(isinstance(area.get(key), int) for key in ("x", "y", "width", "height")) and
                  area.get("x", -1) >= 0 and area.get("y", -1) >= 0 and area.get("width", 0) > 0 and area.get("height", 0) > 0 and
                  area.get("x", 0) + area.get("width", 0) <= tiled["width"] * tiled["tilewidth"] and
                  area.get("y", 0) + area.get("height", 0) <= tiled["height"] * tiled["tileheight"],
                  f"Firefly effect area is outside {metadata['id']}")
        elif effect_data.get("kind") == "water-shimmer":
            check(isinstance(effect_data.get("count"), int) and 1 <= effect_data["count"] <= 64,
                  f"Invalid water-shimmer effect in {metadata['id']}")
            check(isinstance(area, dict) and all(isinstance(area.get(key), int) for key in ("x", "y", "width", "height")) and
                  area.get("x", -1) >= 0 and area.get("y", -1) >= 0 and area.get("width", 0) > 0 and area.get("height", 0) > 0 and
                  area.get("x", 0) + area.get("width", 0) <= tiled["width"] * tiled["tilewidth"] and
                  area.get("y", 0) + area.get("height", 0) <= tiled["height"] * tiled["tileheight"] and
                  all(area.get(key, 1) % tiled["tilewidth"] == 0 for key in ("x", "width")) and
                  all(area.get(key, 1) % tiled["tileheight"] == 0 for key in ("y", "height")),
                  f"Water-shimmer effect area is invalid or outside {metadata['id']}")
            water_layer = layers.get("collision", {})
            water_tiles = set()
            for obj in water_layer.get("objects", []):
                name = obj.get("name", "")
                if not (name.startswith("water-") or name.startswith("pool-water-")):
                    continue
                if all(isinstance(obj.get(key), (int, float)) for key in ("x", "y", "width", "height")) and \
                        obj["x"] % tiled["tilewidth"] == 0 and obj["y"] % tiled["tileheight"] == 0 and \
                        obj["width"] == tiled["tilewidth"] and obj["height"] == tiled["tileheight"]:
                    water_tiles.add((int(obj["x"] // tiled["tilewidth"]), int(obj["y"] // tiled["tileheight"])))
            area_tiles = {(x, y)
                          for y in range(area["y"] // tiled["tileheight"], (area["y"] + area["height"]) // tiled["tileheight"])
                          for x in range(area["x"] // tiled["tilewidth"], (area["x"] + area["width"]) // tiled["tilewidth"])}
            check(bool(area_tiles) and area_tiles <= water_tiles,
                  f"Water-shimmer effect must be fully contained by named water collision tiles in {metadata['id']}")
        elif effect_data.get("kind") == "grass-sway":
            trigger_ids = effect_data.get("triggerIds", [])
            check(isinstance(effect_data.get("tuftsPerArea"), int) and 1 <= effect_data["tuftsPerArea"] <= 16 and
                  isinstance(trigger_ids, list) and trigger_ids and all(isinstance(item, str) and item for item in trigger_ids) and
                  len(set(trigger_ids)) == len(trigger_ids),
                  f"Invalid grass-sway effect in {metadata['id']}")
            trigger_objects = {obj.get("name"): obj for obj in layers.get("triggers", {}).get("objects", [])}
            for trigger_id in trigger_ids if isinstance(trigger_ids, list) else []:
                trigger = trigger_objects.get(trigger_id)
                trigger_properties = {item["name"]: item.get("value") for item in trigger.get("properties", [])} if trigger else {}
                check(trigger is not None and trigger_properties.get("kind") == "encounter-zone" and
                      all(isinstance(trigger.get(key), (int, float)) and trigger[key] % tiled["tilewidth"] == 0
                          for key in ("x", "y", "width", "height")) and
                      trigger.get("width", 0) > 0 and trigger.get("height", 0) > 0,
                      f"Grass-sway must reference grid-aligned encounter-zone triggers in {metadata['id']}: {trigger_id}")
        else:
            check(False, f"Unsupported ambient effect in {metadata['id']}: {effect_data.get('kind')}")
        check(isinstance(colors, list) and colors and all(isinstance(color, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", color) for color in colors),
              f"Invalid ambient effect palette in {metadata['id']}")
    check(required_layers <= layers.keys(), f"Tiled layers missing in {tiled_path.name}: {required_layers - layers.keys()}")
    for name in ("ground", "terrain_detail"):
        layer = layers[name]
        check(layer.get("type") == "tilelayer", f"{name} must be a tile layer in {tiled_path.name}")
        check(len(layer.get("data", [])) == tiled["width"] * tiled["height"], f"{name} dimensions mismatch in {tiled_path.name}")
    quest_interaction_objects = []
    quest_flag_by_trigger = {step["trigger"]: step["setFlag"] for quest in quests for step in quest["steps"]}
    for layer_name in ("characters", "canopy_overhead", "interactions"):
        for obj in layers[layer_name].get("objects", []):
            properties = {prop["name"]: prop.get("value") for prop in obj.get("properties", [])}
            kind = properties.get("kind", obj.get("class", obj.get("type", "")))
            if kind == "tree":
                sprite_key = properties.get("sprite", "borgofonte-tree")
                check(sprite_key in assets_by_key and assets_by_key[sprite_key]["kind"] == "image",
                      f"Tree sprite is not declared as a map image asset in {metadata['id']}: {sprite_key}")
            if kind == "house":
                sprite_key = properties.get("houseSprite", "borgofonte-house")
                check(sprite_key in assets_by_key and assets_by_key[sprite_key]["kind"] == "image",
                      f"House sprite is not declared as a map image asset in {metadata['id']}: {sprite_key}")
            if kind == "npc":
                check(properties.get("dialogueId") in dialogues, f"Unknown dialogue ID in {metadata['id']}: {properties.get('dialogueId')}")
                if properties.get("trainerId"):
                    trainer = trainer_registry.get(properties["trainerId"])
                    check(trainer is not None, f"Unknown trainer ID in {metadata['id']}: {properties['trainerId']}")
                    check(properties.get("battleOnceFlag") == trainer.get("battleOnceFlag"), f"Trainer battle-once flag mismatch: {properties['trainerId']}")
                    if properties.get("battleRequiredFlag"):
                        check(properties["battleRequiredFlag"] in quest_flags, f"Trainer requires an unregistered quest flag: {properties['trainerId']}")
            elif kind in {"house", "sign", "mill-wheel", "rock", "hotspot"}:
                check(isinstance(properties.get("message"), str), f"Missing interaction message in {metadata['id']}: {obj.get('name')}")
            if kind == "pickup":
                check(properties.get("itemId") in item_registry, f"Unknown pickup item in {metadata['id']}: {obj.get('name')}")
                check(properties.get("questEvent") in quest_triggers, f"Unknown pickup quest event in {metadata['id']}: {obj.get('name')}")
                check(properties.get("collectedFlag") == quest_flag_by_trigger.get(properties.get("questEvent")),
                      f"Pickup collectedFlag does not match its quest event in {metadata['id']}: {obj.get('name')}")
                quest_interaction_objects.append((properties["questEvent"], obj))
            if properties.get("serviceId"):
                check(properties["serviceId"] in {"pokemon_center", "rest_point"}, f"Unknown map service in {metadata['id']}: {properties['serviceId']}")
            if properties.get("shopId"):
                check(properties["shopId"] in shop_registry, f"Unknown shop in {metadata['id']}: {properties['shopId']}")
            if properties.get("questEvent"):
                check(properties["questEvent"] in quest_triggers, f"Unregistered quest event in {metadata['id']}: {properties['questEvent']}")
    spawn_ids = {spawn["id"] for spawn in metadata["spawns"]}
    check(len(spawn_ids) == len(metadata["spawns"]), f"Duplicate runtime spawn in {metadata['id']}")
    collision_layer = layers["collision"]
    check(collision_layer.get("type") == "objectgroup", f"collision must be an object layer in {tiled_path.name}")
    blocked = set()
    for obj in collision_layer.get("objects", []):
        left, top = max(0, int(obj.get("x", 0) // 32)), max(0, int(obj.get("y", 0) // 32))
        right = min(tiled["width"], ceil((obj.get("x", 0) + max(1, obj.get("width", 32))) / 32))
        bottom = min(tiled["height"], ceil((obj.get("y", 0) + max(1, obj.get("height", 32))) / 32))
        blocked.update((x, y) for y in range(top, bottom) for x in range(left, right))
    for spawn in metadata["spawns"]:
        check(0 <= spawn["x"] < tiled["width"] and 0 <= spawn["y"] < tiled["height"], f"Spawn outside {metadata['id']}: {spawn['id']}")
        check((spawn["x"], spawn["y"]) not in blocked, f"Spawn blocked by collision in {metadata['id']}: {spawn['id']}")
    quest_interaction_targets = []
    for event, obj in quest_interaction_objects:
        left, top = int(obj.get("x", 0) // 32), int(obj.get("y", 0) // 32)
        right = ceil((obj.get("x", 0) + max(1, obj.get("width", 32))) / 32)
        bottom = ceil((obj.get("y", 0) + max(1, obj.get("height", 32))) / 32)
        item_tiles = {(x, y) for y in range(top, bottom) for x in range(left, right)}
        adjacent = {(x + dx, y + dy) for x, y in item_tiles for dx, dy in ((0, -1), (1, 0), (0, 1), (-1, 0))}
        targets = {(x, y) for x, y in adjacent if 0 <= x < tiled["width"] and 0 <= y < tiled["height"] and (x, y) not in blocked}
        quest_interaction_targets.append((event, targets))
    trigger_destinations = set()
    map_exits = []
    quest_trigger_targets = []
    for trigger in layers["triggers"].get("objects", []):
        properties = {prop["name"]: prop.get("value") for prop in trigger.get("properties", [])}
        check(properties.get("kind") in {"map-exit", "message", "quest", "encounter-zone"}, f"Unknown trigger kind in {metadata['id']}: {trigger.get('name')}")
        is_encounter_zone = properties.get("kind") == "encounter-zone"
        check(properties.get("message") or properties.get("destinationMapId") or properties.get("questEvent") or is_encounter_zone, f"Trigger has no message, quest event, encounter or destination in {metadata['id']}: {trigger.get('name')}")
        if is_encounter_zone:
            check(properties.get("encounterTableId") in metadata["encounterTableIds"], f"Encounter zone references an unregistered table in {metadata['id']}")
            check(isinstance(properties.get("encounterChance"), (int, float)) and 0 <= properties["encounterChance"] <= 1, f"Invalid encounter chance in {metadata['id']}: {trigger.get('name')}")
            zone_encounter_refs.add(properties.get("encounterTableId"))
        if properties.get("questEvent"):
            check(properties["questEvent"] in quest_triggers, f"Unregistered quest trigger in {metadata['id']}: {properties['questEvent']}")
            left = max(0, int(trigger.get("x", 0) // 32))
            top = max(0, int(trigger.get("y", 0) // 32))
            right = min(tiled["width"], ceil((trigger.get("x", 0) + max(1, trigger.get("width", 32))) / 32))
            bottom = min(tiled["height"], ceil((trigger.get("y", 0) + max(1, trigger.get("height", 32))) / 32))
            targets = {(x, y) for y in range(top, bottom) for x in range(left, right)
                       if (x, y) not in blocked}
            quest_trigger_targets.append((properties["questEvent"], targets))
        check(0 <= trigger.get("x", 0) < tiled["width"] * 32 and 0 <= trigger.get("y", 0) < tiled["height"] * 32, f"Trigger outside {metadata['id']}: {trigger.get('name')}")
        if properties.get("destinationMapId") and properties.get("destinationSpawnId"):
            destination = (properties["destinationMapId"], properties["destinationSpawnId"])
            trigger_destinations.add(destination)
            map_exits.append((destination, trigger))
        if properties.get("requiredFlag"):
            check(properties["requiredFlag"] in quest_flags,
                  f"Map trigger requires an unregistered quest flag in {metadata['id']}: {properties['requiredFlag']}")
    map_quest_events = {
        prop.get("value")
        for trigger in layers["triggers"].get("objects", [])
        for prop in trigger.get("properties", [])
        if prop.get("name") == "questEvent"
    }
    for plate in layers["interactions"].get("objects", []):
        properties = {prop["name"]: prop.get("value") for prop in plate.get("properties", [])}
        if properties.get("kind") == "resonance-plate":
            event = f"gym01/resonance/{properties.get('plateId', '')}"
            check(event in quest_triggers and event in map_quest_events, f"Resonance plate has no matching ordered quest event in {metadata['id']}: {plate.get('name')}")
    trigger_destinations_by_id[metadata["id"]] = trigger_destinations
    runtime_navigation[metadata["id"]] = {
        "width": tiled["width"], "height": tiled["height"], "blocked": blocked,
        "spawns": {spawn["id"]: (spawn["x"], spawn["y"]) for spawn in metadata["spawns"]},
        "exits": map_exits, "quest_triggers": quest_trigger_targets,
        "quest_interactions": quest_interaction_targets,
    }

for metadata in runtime_by_id.values():
    connections = {(connection["toMapId"], connection["targetSpawnId"]) for connection in metadata["connections"]}
    check(trigger_destinations_by_id[metadata["id"]] <= connections, f"Tiled exit lacks a matching MapDefinition connection in {metadata['id']}")
    for connection in metadata["connections"]:
        check(connection["viaSpawnId"] in {s["id"] for s in metadata["spawns"]}, f"Invalid local spawn in {metadata['id']}")
        target = runtime_by_id.get(connection["toMapId"])
        if target:
            check(connection["targetSpawnId"] in {s["id"] for s in target["spawns"]}, f"Invalid destination spawn in {metadata['id']}")
            reciprocal = any(
                back["toMapId"] == metadata["id"]
                and back["viaSpawnId"] == connection["targetSpawnId"]
                and back["targetSpawnId"] == connection["viaSpawnId"]
                for back in target["connections"]
            )
            check(reciprocal, f"Map connection is not reciprocal between {metadata['id']} and {target['id']}")

    navigation = runtime_navigation[metadata["id"]]
    for event, targets in navigation["quest_triggers"]:
        reachable = set()
        for spawn in navigation["spawns"].values():
            reachable.update(reachable_tiles(spawn, navigation["width"], navigation["height"], navigation["blocked"]))
        check(bool(targets & reachable), f"Quest trigger {event} is unreachable from every spawn in {metadata['id']}")
    for event, targets in navigation["quest_interactions"]:
        reachable = set()
        for spawn in navigation["spawns"].values():
            reachable.update(reachable_tiles(spawn, navigation["width"], navigation["height"], navigation["blocked"]))
        check(bool(targets & reachable), f"Quest interaction {event} is unreachable from every spawn in {metadata['id']}")
    for destination, trigger in navigation["exits"]:
        connection = next((item for item in metadata["connections"]
                           if (item["toMapId"], item["targetSpawnId"]) == destination), None)
        check(connection is not None, f"Map exit has no connection in {metadata['id']}: {trigger.get('name')}")
        start = navigation["spawns"][connection["viaSpawnId"]]
        left = max(0, int(trigger.get("x", 0) // 32))
        top = max(0, int(trigger.get("y", 0) // 32))
        right = min(navigation["width"], ceil((trigger.get("x", 0) + max(1, trigger.get("width", 32))) / 32))
        bottom = min(navigation["height"], ceil((trigger.get("y", 0) + max(1, trigger.get("height", 32))) / 32))
        targets = {(x, y) for y in range(top, bottom) for x in range(left, right)
                   if (x, y) not in navigation["blocked"]}
        pending = deque([start])
        visited = {start}
        while pending:
            x, y = pending.popleft()
            for point in ((x, y - 1), (x + 1, y), (x, y + 1), (x - 1, y)):
                px, py = point
                if (0 <= px < navigation["width"] and 0 <= py < navigation["height"]
                        and point not in navigation["blocked"] and point not in visited):
                    visited.add(point)
                    pending.append(point)
        check(bool(targets & visited),
              f"Map exit is unreachable from spawn {connection['viaSpawnId']} in {metadata['id']}: {trigger.get('name')}")

enc = read("r01_tall_grass.encounter.json")
check(enc["mapId"] in by_id, "Encounter table refers to unknown map")
check(enc["id"] in by_id[enc["mapId"]]["encounterTableIds"], "Encounter table not registered")
runtime_encounters = sorted(ENCOUNTERS.glob("*.encounter.json"))
check(runtime_encounters, "No runtime encounter tables found")
runtime_encounter_ids = set()
for encounter_file in runtime_encounters:
    table = json.loads(encounter_file.read_text(encoding="utf-8"))
    check(table["id"] not in runtime_encounter_ids, f"Duplicate runtime encounter ID: {table['id']}")
    runtime_encounter_ids.add(table["id"])
    check(table.get("status") == "prototype", f"Encounter balance must remain explicitly provisional: {table['id']}")
    check(table.get("method") in {"tall-grass", "cave", "surf", "fishing", "special", "woodland-understory"}, f"Unsupported encounter method: {table['id']}")
    runtime_map = runtime_by_id.get(table["mapId"])
    check(runtime_map is not None, f"Runtime encounter refers to an unknown map: {table['id']}")
    check(table["id"] in runtime_map.get("encounterTableIds", []), f"Runtime encounter not registered: {table['id']}")
    check({"morning", "day", "night"} <= table["timeBands"].keys(), f"Encounter table needs morning/day/night bands: {table['id']}")
    for band, entries in table["timeBands"].items():
        check(entries, f"Empty encounter band {band}")
        for entry in entries:
            check(1 <= entry["speciesId"] <= 251, "Out of supported national dex")
            check(str(entry["speciesId"]) in species_registry, f"Encounter species missing from battle registry: {entry['speciesId']}")
            check(1 <= entry["minLevel"] <= entry["maxLevel"] <= 100, "Bad encounter level")
            check(entry["weight"] > 0, "Bad encounter weight")
check(zone_encounter_refs <= runtime_encounter_ids, f"Encounter zone references missing table(s): {sorted(zone_encounter_refs - runtime_encounter_ids)}")

quest = read("quest_prologue.quest.json")
steps = {s["id"] for s in quest["steps"]}
check(len(steps) == len(quest["steps"]), "Duplicate quest steps")
flags = [s["setFlag"] for s in quest["steps"]]
check(len(flags) == len(set(flags)), "Duplicate quest flags")
check(quest["completionFlag"] in flags, "Completion flag never set")

trainer=read("gym01_mira.trainer.json")
check(1 <= len(trainer["team"]) <= 6, "Invalid trainer team length")
for mon in trainer["team"]:
    check(1 <= mon["level"] <= 100 and 1 <= len(mon["moveIds"]) <= 4, "Invalid trainer creature")

save=read("save.v1.example.json")
check(save["schemaVersion"] == 1, "Wrong save schema")
check(save["player"]["mapId"] in by_id, "Save unknown map")
check(save["player"]["spawnPointId"] in {s["id"] for s in by_id[save["player"]["mapId"]]["spawns"]}, "Unknown save spawn")
check(len(save["party"]) <= 6, "Party overflow")
ids = [p["instanceId"] for p in save["party"]] + [p["instanceId"] for p in save["storage"]]
check(len(set(ids)) == len(ids), "Duplicated creature instances")
for p in save["party"]:
    check(0 <= p["hp"] <= p["maxHp"], "HP invalid")

region=read("region.veloria.json")
check(set(region["primaryProgression"]) <= set(by_id.keys()), "Region route refers to missing map")
check(len(region["gymOrder"]) == 8, "Gym order count invalid")
check(save["contentVersion"] == region["contentVersion"], "Content version mismatch")
print(f"OK: {len(asset_rows)} registered assets; all public media files are accounted for.")
print(f"OK: {len(dependency_rows)} locked npm dependencies have a current license/source inventory.")
print(f"OK: {len(files)} example JSON files, {len(maps)} example maps, {len(runtime_maps)} Tiled runtime maps, {len(quests)} runtime quests, {len(trainers)} runtime trainers, {len(shops)} shops, content links, encounter, region and save validated")
