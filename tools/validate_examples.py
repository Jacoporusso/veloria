#!/usr/bin/env python3
"""Validate Veloria example content without third-party packages.
Validates document shape basics and referential/semantic coherence;
full JSON Schema validation can be added in the future with jsonschema.
Run: python tools/validate_examples.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "content" / "examples"

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
print(f"OK: {len(files)} JSON files, {len(maps)} maps, reciprocal links, encounter, quest, trainer, region and save validated")
