#!/usr/bin/env python3
"""Build the current full-world art redesign inventory from runtime source data.

This is a read-only inventory generator. It reads MapDefinition/Tiled content,
appearance profiles, and map parity provenance; it writes only the JSON report.
"""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "art" / "full-redesign-inventory.json"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def props(obj):
    raw = obj.get("properties", [])
    if isinstance(raw, dict):
        return raw
    return {item.get("name"): item.get("value") for item in raw if item.get("name")}


def cell_rect(obj):
    return {
        "x": round(obj.get("x", 0) / 32, 4),
        "y": round(obj.get("y", 0) / 32, 4),
        "width": round(obj.get("width", 0) / 32, 4),
        "height": round(obj.get("height", 0) / 32, 4),
    }


def main():
    map_paths = sorted((ROOT / "content/maps").glob("*.map.json"))
    parity_path = ROOT / "assets/map-parity-v2.json"
    parity = read_json(parity_path) if parity_path.exists() else {"artworks": []}
    # MapDefinition IDs are authoritative: some Tiled filenames (notably
    # c01_brumalta) deliberately differ from their persistent map IDs.
    parity_by_id = {a.get("mapId"): a for a in parity.get("artworks", [])}
    appearances = read_json(ROOT / "content/characters/appearances.v1.json")
    dialogue_path = ROOT / "content/dialogue/world.v1.json"
    dialogue_data = read_json(dialogue_path) if dialogue_path.exists() else {}
    profile_by_npc = {}
    profile_by_dialogue = {}
    profiles = appearances.get("profiles", [])
    for profile in profiles:
        for key in profile.get("npcIds", []):
            profile_by_npc[key] = profile["id"]
        for key in profile.get("dialogueIds", []):
            profile_by_dialogue[key] = profile["id"]

    maps = []
    people = []
    total_npcs = 0
    for path in map_paths:
        meta = read_json(path)
        tiled_path = ROOT / "public" / meta["tiledAsset"]
        tiled = read_json(tiled_path) if tiled_path.exists() else {}
        layers = {layer.get("name"): layer for layer in tiled.get("layers", [])}
        scenery_refs = []
        for layer_name, layer in layers.items():
            if layer.get("type") != "objectgroup":
                continue
            for obj in layer.get("objects", []):
                p = props(obj)
                if p.get("kind") == "scenery-image" or obj.get("class") == "scenery-image":
                    scenery_refs.append({"layer": layer_name, "stableObjectId": obj.get("id"),
                                         "name": obj.get("name"), "spriteKey": p.get("sprite") or p.get("image"),
                                         "cell": cell_rect(obj)})
        objects = {}
        for layer_name in ("characters", "interactions", "triggers", "decorations"):
            objects[layer_name] = layers.get(layer_name, {}).get("objects", [])

        npcs = []
        for obj in objects["characters"]:
            p = props(obj)
            npc_id = p.get("npcId")
            # The Tiled characters layer also contains two non-person service
            # landmarks (Portolume center/shop). Count authored NPC IDs only.
            if not npc_id:
                continue
            dialogue_id = p.get("dialogueId")
            appearance_id = p.get("characterAppearanceId")
            profile_id = appearance_id or profile_by_npc.get(npc_id) or profile_by_dialogue.get(dialogue_id)
            identity_key = f"profile:{profile_id}" if profile_id else f"npc:{npc_id}"
            record = {
                "stableObjectId": obj.get("id"), "name": obj.get("name"), "npcId": npc_id,
                "dialogueId": dialogue_id, "characterAppearanceId": appearance_id,
                "identityKey": identity_key, "profileMatch": profile_id,
                "narrativeSpeaker": dialogue_data.get(dialogue_id, {}).get("speaker"),
                "kind": p.get("kind") or obj.get("class"), "sprite": p.get("sprite"), "spriteFrame": p.get("spriteFrame"),
                "spriteOrigin": {"x": p.get("spriteOriginX"), "y": p.get("spriteOriginY")} if p.get("spriteOriginX") is not None else None,
                "trainerId": p.get("trainerId"), "battleOnceFlag": p.get("battleOnceFlag"),
                "frame": p.get("frame"), "cell": cell_rect(obj),
            }
            npcs.append(record)
            people.append({"mapId": meta.get("id"), **record})
        total_npcs += len(npcs)

        exits, encounters, services = [], [], []
        for obj in objects["triggers"]:
            p = props(obj)
            kind = p.get("kind") or obj.get("class")
            if kind == "map-exit":
                exits.append({"stableObjectId": obj.get("id"), "name": obj.get("name"),
                              "cell": cell_rect(obj), "destinationMapId": p.get("destinationMapId"),
                              "destinationSpawnId": p.get("destinationSpawnId"),
                              "requiredFlag": p.get("requiredFlag")})
            elif kind == "encounter-zone":
                encounters.append({"stableObjectId": obj.get("id"), "name": obj.get("name"),
                                   "cell": cell_rect(obj), "encounterTableId": p.get("encounterTableId"),
                                   "encounterChance": p.get("encounterChance")})
        for layer_name, layer in layers.items():
            if layer.get("type") != "objectgroup":
                continue
            for obj in layer.get("objects", []):
                p = props(obj)
                if p.get("serviceId") or p.get("shopId") or p.get("networkId") or p.get("stopId"):
                    services.append({"layer": layer_name, "stableObjectId": obj.get("id"), "name": obj.get("name"),
                                     "kind": p.get("kind") or obj.get("class"), "serviceId": p.get("serviceId"),
                                     "shopId": p.get("shopId"), "networkId": p.get("networkId"), "stopId": p.get("stopId"),
                                     "serviceRequiredFlag": p.get("serviceRequiredFlag"), "cell": cell_rect(obj)})

        art = parity_by_id.get(meta.get("id"), {})
        render_assets = []
        for asset in meta.get("renderAssets", []):
            asset_path = asset.get("path", "")
            runtime_file = ROOT / "public" / asset_path
            render_assets.append({**asset, "extension": Path(asset_path).suffix.lower(),
                                  "runtimeFilePresent": runtime_file.exists()})
        image_assets_by_key = {a.get("key"): a for a in render_assets if a.get("kind") == "image"}
        scene_images = []
        for ref in scenery_refs:
            asset = image_assets_by_key.get(ref["spriteKey"], {})
            scene_images.append({**ref, "assetPath": asset.get("path"), "extension": asset.get("extension"),
                                 "runtimeFilePresent": asset.get("runtimeFilePresent", False)})
        used_scene_keys = {x.get("spriteKey") for x in scenery_refs}
        ground_layer = layers.get("ground", {})
        ground_data = ground_layer.get("data", [])
        ground_tile_count = len([gid for gid in ground_data if gid]) if isinstance(ground_data, list) else 0
        registered_scenery = [a for a in render_assets if a.get("kind") == "image" and "assets/scenery/" in a.get("path", "")]
        unreferenced_scenery = [a for a in registered_scenery if a.get("key") not in used_scene_keys]
        maps.append({
            "mapId": meta.get("id"), "displayName": meta.get("displayName"), "biomeId": meta.get("biomeId"),
            "tiledAsset": meta.get("tiledAsset"), "tileSizePx": 32,
            "dimensionsTiles": {"width": tiled.get("width"), "height": tiled.get("height")},
            "aspect": round(tiled.get("width", 0) / tiled.get("height", 1), 4) if tiled.get("height") else None,
            "terrainBase": meta.get("terrainBase"),
            "groundLayer": {"exists": ground_layer.get("type") == "tilelayer", "nonEmptyTileCount": ground_tile_count,
                            "tilesetNames": sorted({t.get("name") for t in tiled.get("tilesets", []) if t.get("name")})},
            "sceneryImageObjects": scenery_refs, "sceneImages": scene_images,
            "registeredSceneryImageAssets": registered_scenery,
            "registeredSceneryAssetsNotReferencedBySceneObjects": unreferenced_scenery,
            "allRenderAssets": render_assets,
            "sceneStatus": "tile-ground-plus-scenery-image-needs-review" if scene_images else
                           ("tile-ground-plus-terrainBase-needs-review" if meta.get("terrainBase") else "tile-ground-needs-review"),
            "parityArtwork": art or None,
            "parityArtworkRecord": bool(art),
            "encounterZones": encounters, "encounterZoneCount": len(encounters),
            "exits": exits, "services": services, "npcInstances": npcs,
            "tiledLayerNames": list(layers),
        })

    unique_keys = sorted({p["identityKey"] for p in people})
    counts_by_npc = Counter(p["npcId"] for p in people)
    unresolved_reused = [{"npcId": key, "presenceCount": count} for key, count in sorted(counts_by_npc.items())
                         if count > 1 and not profile_by_npc.get(key)]
    unresolved_same_dialogue = defaultdict(set)
    unresolved_same_speaker = defaultdict(list)
    for p in people:
        if p.get("dialogueId") and not p.get("profileMatch"):
            unresolved_same_dialogue[p["dialogueId"]].add(p["npcId"])
        if p.get("narrativeSpeaker") and not p.get("profileMatch"):
            unresolved_same_speaker[p["narrativeSpeaker"]].append({"mapId": p["mapId"], "npcId": p["npcId"], "dialogueId": p["dialogueId"]})
    possible_aliases = [{"speaker": speaker, "appearances": sorted(rows, key=lambda x: x["npcId"]),
                         "evidence": "same speaker label in separate dialogue entries; this is a candidate for narrative review, not proof of one person", "status": "unresolved"}
                        for speaker, rows in sorted(unresolved_same_speaker.items())
                        if len({row["npcId"] for row in rows}) > 1]

    # Progression cluster for the opening district: three connected routes plus
    # the first town and first gym; these are the first eight outdoor/primary maps
    # named in the world-design route, with interiors kept as adjacent subgroups.
    first_eight_ids = ["borgofonte", "r01_sentiero_alba", "d01_bosco_veli", "r02_viale_fronde",
                       "brumalta", "gym01_brumalta", "r03_terrazze_muschio", "radicelmo"]
    by_slug = {m["mapId"].split("/")[-1]: m for m in maps}
    first_eight = [{"mapId": slug, "displayName": by_slug[slug]["displayName"]} for slug in first_eight_ids if slug in by_slug]

    result = {
        "title": "Inventario autorevole del redesign completo del mondo",
        "generatedBy": "tools/audit_redesign_inventory.py",
        "scope": "Tutte le mappe e tutti i personaggi vanno rifatti o verificati rispetto alla direzione 2D illustrata moderna. Presenza di una scena o copertura di una mappa non equivale a completamento: ogni scena richiede review di leggibilità/allineamento; ogni personaggio richiede identità, silhouette, scala, direzioni e animazioni verificate.",
        "counts": {"mapDefinitions": len(maps), "mapsWithGroundTileLayer": sum(m["groundLayer"]["exists"] for m in maps),
                   "mapsWithNonEmptyGroundTileData": sum(m["groundLayer"]["nonEmptyTileCount"] > 0 for m in maps),
                   "mapsWithExplicitSceneryImage": sum(bool(m["sceneImages"]) and all(x["runtimeFilePresent"] for x in m["sceneImages"]) for m in maps),
                   "mapsWithRegisteredSceneryPath": sum(bool(m["registeredSceneryImageAssets"]) for m in maps),
                   "mapsWithTerrainBase": sum(bool(m["terrainBase"]) for m in maps),
                   "mapsWithSceneryImageOrTerrainBase": sum(bool(m["sceneImages"]) or bool(m["terrainBase"]) for m in maps),
                   "mapsWithBothSceneryImageAndTerrainBase": sum(bool(m["sceneImages"]) and bool(m["terrainBase"]) for m in maps),
                   "mapsWithSceneryImageOnly": sum(bool(m["sceneImages"]) and not m["terrainBase"] for m in maps),
                   "mapsWithTerrainBaseOnly": sum(bool(m["terrainBase"]) and not m["sceneImages"] for m in maps),
                   "mapsWithNeitherSceneryImageNorTerrainBase": sum(not m["sceneImages"] and not m["terrainBase"] for m in maps),
                   "registeredSceneryImageAssets": sum(len(m["registeredSceneryImageAssets"]) for m in maps),
                   "registeredSceneryAssetsNotReferencedBySceneObjects": sum(len(m["registeredSceneryAssetsNotReferencedBySceneObjects"]) for m in maps),
                   "mapsWithUnreferencedSceneryRegistration": sum(bool(m["registeredSceneryAssetsNotReferencedBySceneObjects"]) for m in maps),
                   "parityArtworkEntries": sum(m["parityArtworkRecord"] for m in maps),
                   "npcPresences": total_npcs, "distinctIdentityKeys": len(unique_keys),
                   "registeredAppearanceProfiles": len(profiles), "unboundCharacterStudies": len(appearances.get("unboundStudies", [])),
                   "possibleNarrativeAliasesUnresolved": len(possible_aliases)},
        "identityRules": {"source": "content/characters/appearances.v1.json", "grouping": "Only an explicit shared characterAppearanceId/profile npcIds/dialogueIds mapping consolidates different NPC IDs. Repeated stable npcId is the same content identity. Same display name alone is never treated as identity evidence.",
                          "confirmedNarrativeAliases": [{"profileId": profile["id"], "description": profile["description"], "npcIds": profile.get("npcIds", []), "dialogueIds": profile.get("dialogueIds", []), "narrativeSource": profile.get("narrativeSource")} for profile in profiles],
                          "unresolvedRepeatedNpcIds": unresolved_reused, "possibleAliasesBySharedSpeaker": possible_aliases},
        "firstEightCoherentGroup": {"rationale": "A connected opening slice from the starting town through R01/Bosco/R02 to Brumalta, the first gym, R03 and Radicelmo; aligns with the route in docs/02 and the opening district priorities in docs/08.", "maps": first_eight},
        "artDirectionAndConstraints": [
            {"source": "world-design-prototype.html", "role": "User-approved visual direction for the modern illustrated 2D world; reference direction, not map-aligned production assets."},
            {"source": "assets/concept/Veloria_World_Map_Concept_v0.1.webp", "role": "Earlier regional layout concept; not a tile-aligned runtime scene."},
            {"source": "assets/prompts/world-readability-v1.md", "role": "Prior map readability direction, superseded by the approved concept direction."},
            {"source": "assets/prompts/world-readability-v2.md", "role": "Approved map readability principles."},
            {"source": "assets/prompts/characters-direction-v1.md", "role": "Character design concept reference; board is not a runtime animation atlas."},
            {"source": "docs/32_EARLY_MAP_ART_CONSTRAINTS_v0.1.md", "role": "Coordinates and gameplay constraints for first maps; route, exits, services, collision and runtime props."},
            {"source": "docs/57_NPC_IDENTITIES_AND_EARLY_PASSAGES_v0.1.md", "role": "Stable identity guidance, opening passages, current threshold changes and known art quality limits."},
            {"source": "docs/02_WORLD_MAP_DESIGN_Veloria_v0.2.md", "role": "Regional progression and biome/world role."},
            {"source": "content/maps/README.md", "role": "MapDefinition/Tiled contract: art and navigation are independent; stable IDs, exits, layers, services, triggers."},
            {"source": "content/characters/README.md", "role": "Appearance profile identity and atlas integration contract."},
            {"source": "content/characters/appearances.v1.json", "role": "Explicit NPC/profile aliases; unbound studies are not placed identities."},
            {"source": "assets/map-parity-v2.json", "role": "Current scene-art provenance and checksums; a recorded artwork is not proof of visual acceptance."}
        ],
        "characterAssetContract": {"atlas": appearances.get("atlas"), "atlasCapacityFrames": appearances.get("atlas", {}).get("columns", 0) * appearances.get("atlas", {}).get("rows", 0),
                                    "unboundStudies": appearances.get("unboundStudies", []),
                                    "acceptance": "The six-frame board is a design sheet, not evidence of four-direction walk/idle animations or finished runtime coverage."},
        "profiles": appearances,
        "maps": maps,
        "npcPresences": people,
        "completionPolicy": "All 48 maps stay open until each scene is visually verified against its actual Tiled dimensions, exits, routes, service/NPC access and collision footprints. All character instances stay open until identity is resolved from narrative sources and the character asset is verified for runtime scale, frame/directions/animation and interaction. No completion claim from image coverage, manifest hashes, or name matching alone."
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(maps)} maps, {total_npcs} NPC presences, {len(unique_keys)} identity keys")


if __name__ == "__main__":
    main()
