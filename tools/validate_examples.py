#!/usr/bin/env python3
"""Validate Veloria example content without third-party packages.
Validates document shape basics and referential/semantic coherence;
full JSON Schema validation can be added in the future with jsonschema.
Run: python tools/validate_examples.py
"""
import json
from math import ceil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "content" / "examples"
MAPS = ROOT / "content" / "maps"
PUBLIC = ROOT / "public"

def read(name):
    return json.loads((EXAMPLES / name).read_text(encoding="utf-8"))

def check(condition, why):
    if not condition:
        raise AssertionError(why)

files = sorted(EXAMPLES.glob("*.json"))
for file in files:
    json.loads(file.read_text(encoding="utf-8"))

maps = [json.loads(f.read_text(encoding="utf-8")) for f in EXAMPLES.glob("*.map.json")]
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
runtime_by_id = {}
trigger_destinations_by_id = {}
required_layers = {"ground", "terrain_detail", "collision", "characters", "canopy_overhead", "interactions", "triggers"}
for file in runtime_maps:
    metadata = json.loads(file.read_text(encoding="utf-8"))
    check(metadata["id"] not in runtime_by_id, f"Duplicate runtime map ID: {metadata['id']}")
    runtime_by_id[metadata["id"]] = metadata
    tiled_path = PUBLIC / metadata["tiledAsset"]
    check(tiled_path.is_file(), f"Tiled map asset missing: {metadata['tiledAsset']}")
    tiled = json.loads(tiled_path.read_text(encoding="utf-8"))
    check(tiled.get("orientation") == "orthogonal", f"Map must be orthogonal: {tiled_path.name}")
    check(tiled.get("tilewidth") == 32 and tiled.get("tileheight") == 32, f"Map must use 32px tiles: {tiled_path.name}")
    check(tiled.get("width", 0) > 0 and tiled.get("height", 0) > 0, f"Map dimensions invalid: {tiled_path.name}")
    layers = {layer.get("name"): layer for layer in tiled.get("layers", [])}
    check(required_layers <= layers.keys(), f"Tiled layers missing in {tiled_path.name}: {required_layers - layers.keys()}")
    for name in ("ground", "terrain_detail"):
        layer = layers[name]
        check(layer.get("type") == "tilelayer", f"{name} must be a tile layer in {tiled_path.name}")
        check(len(layer.get("data", [])) == tiled["width"] * tiled["height"], f"{name} dimensions mismatch in {tiled_path.name}")
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
    trigger_destinations = set()
    for trigger in layers["triggers"].get("objects", []):
        properties = {prop["name"]: prop.get("value") for prop in trigger.get("properties", [])}
        check(properties.get("kind") in {"map-exit", "message"}, f"Unknown trigger kind in {metadata['id']}: {trigger.get('name')}")
        check(properties.get("message") or properties.get("destinationMapId"), f"Trigger has no message or destination in {metadata['id']}: {trigger.get('name')}")
        check(0 <= trigger.get("x", 0) < tiled["width"] * 32 and 0 <= trigger.get("y", 0) < tiled["height"] * 32, f"Trigger outside {metadata['id']}: {trigger.get('name')}")
        if properties.get("destinationMapId") and properties.get("destinationSpawnId"):
            trigger_destinations.add((properties["destinationMapId"], properties["destinationSpawnId"]))
    trigger_destinations_by_id[metadata["id"]] = trigger_destinations

for metadata in runtime_by_id.values():
    connections = {(connection["toMapId"], connection["targetSpawnId"]) for connection in metadata["connections"]}
    check(trigger_destinations_by_id[metadata["id"]] <= connections, f"Tiled exit lacks a matching MapDefinition connection in {metadata['id']}")
    for connection in metadata["connections"]:
        check(connection["viaSpawnId"] in {s["id"] for s in metadata["spawns"]}, f"Invalid local spawn in {metadata['id']}")
        target = runtime_by_id.get(connection["toMapId"])
        if target:
            check(connection["targetSpawnId"] in {s["id"] for s in target["spawns"]}, f"Invalid destination spawn in {metadata['id']}")

enc = read("r01_tall_grass.encounter.json")
check(enc["mapId"] in by_id, "Encounter table refers to unknown map")
check(enc["id"] in by_id[enc["mapId"]]["encounterTableIds"], "Encounter table not registered")
for band, entries in enc["timeBands"].items():
    check(entries, f"Empty encounter band {band}")
    for e in entries:
        check(1 <= e["speciesId"] <= 251, "Out of supported national dex")
        check(1 <= e["minLevel"] <= e["maxLevel"] <= 100, "Bad encounter level")
        check(e["weight"] > 0, "Bad encounter weight")

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
print(f"OK: {len(files)} example JSON files, {len(maps)} example maps, {len(runtime_maps)} Tiled runtime maps, content links, encounter, quest, trainer, region and save validated")
