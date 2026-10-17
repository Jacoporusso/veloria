import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from json_schema_validation import validate_json_schema


MAP_V2_SCHEMA = json.loads((ROOT / "specs" / "schemas" / "map.v2.schema.json").read_text(encoding="utf-8"))
MAP_V1_SCHEMA = json.loads((ROOT / "specs" / "schemas" / "map.v1.schema.json").read_text(encoding="utf-8"))


def valid_map():
    return {
        "id": "veloria/test_map",
        "version": 2,
        "displayName": "Test Map",
        "biomeId": "forest",
        "tiledAsset": "tilemaps/test_map.tmj",
        "renderAssets": [{
            "kind": "tileset", "key": "forest", "path": "assets/tilesets/forest.png",
            "tiledName": "forest", "tileWidth": 32, "tileHeight": 32,
        }],
        "spawns": [{"id": "start", "x": 1, "y": 1}],
        "connections": [],
        "encounterTableIds": [],
        "npcRefs": [],
        "scriptRefs": [],
        "musicId": "ambient_forest",
    }


class JsonSchemaValidationTests(unittest.TestCase):
    def test_accepts_a_valid_map_definition_v2(self):
        validate_json_schema(valid_map(), MAP_V2_SCHEMA, "fixture")

    def test_rejects_missing_required_and_unknown_properties(self):
        missing = valid_map()
        del missing["musicId"]
        with self.assertRaisesRegex(AssertionError, "missing required property 'musicId'"):
            validate_json_schema(missing, MAP_V2_SCHEMA, "fixture")

        extra = valid_map()
        extra["legacyTextureKey"] = "hardcoded"
        with self.assertRaisesRegex(AssertionError, "additional property 'legacyTextureKey'"):
            validate_json_schema(extra, MAP_V2_SCHEMA, "fixture")

    def test_rejects_malformed_render_assets_and_ambient_effects(self):
        malformed_asset = valid_map()
        malformed_asset["renderAssets"][0]["tileWidth"] = 0
        with self.assertRaisesRegex(AssertionError, "oneOf schema"):
            validate_json_schema(malformed_asset, MAP_V2_SCHEMA, "fixture")

        malformed_effect = valid_map()
        malformed_effect["ambientEffects"] = [{"kind": "fireflies", "count": 2, "area": {"x": 0, "y": 0, "width": 2, "height": 2}, "colors": ["green"]}]
        with self.assertRaisesRegex(AssertionError, "oneOf schema"):
            validate_json_schema(malformed_effect, MAP_V2_SCHEMA, "fixture")

    def test_rejects_schema_changes_that_the_dependency_free_validator_cannot_cover(self):
        unsupported = copy.deepcopy(MAP_V2_SCHEMA)
        unsupported["properties"]["id"]["format"] = "uri"
        with self.assertRaisesRegex(AssertionError, "Unsupported JSON Schema keyword"):
            validate_json_schema(valid_map(), unsupported, "fixture")

        unsupported_type = copy.deepcopy(MAP_V2_SCHEMA)
        unsupported_type["properties"]["optionalField"] = {"type": "date"}
        with self.assertRaisesRegex(AssertionError, "Unsupported JSON Schema type"):
            validate_json_schema(valid_map(), unsupported_type, "fixture")

        malformed_bound = copy.deepcopy(MAP_V2_SCHEMA)
        malformed_bound["properties"]["optionalField"] = {"type": "string", "minLength": "1"}
        with self.assertRaisesRegex(AssertionError, "Invalid minLength declaration"):
            validate_json_schema(valid_map(), malformed_bound, "fixture")

    def test_v1_schema_rejects_documents_mislabeled_as_another_version(self):
        v1_map = {
            "id": "veloria/example", "version": 2, "displayName": "Example", "biomeId": "forest",
            "tiledAsset": "tilemaps/example.tmj", "spawns": [{"id": "start", "x": 0, "y": 0}],
            "connections": [], "encounterTableIds": [], "npcRefs": [], "scriptRefs": [], "musicId": "ambient_forest",
        }
        with self.assertRaisesRegex(AssertionError, "expected constant 1"):
            validate_json_schema(v1_map, MAP_V1_SCHEMA, "fixture")


if __name__ == "__main__":
    unittest.main()
