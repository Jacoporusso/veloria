import csv
import json
import struct
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from map_render_validation import validate_map_render_assets
from map_scaffold import create_map_draft
from asset_register_validation import validate_asset_register


class MapScaffoldTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        (self.root / "content" / "maps").mkdir(parents=True)
        (self.root / "content" / "audio").mkdir(parents=True)
        (self.root / "public" / "assets" / "tilesets").mkdir(parents=True)
        (self.root / "public" / "tilemaps").mkdir(parents=True)
        (self.root / "assets").mkdir()
        (self.root / "content" / "audio" / "themes.v1.json").write_text(
            json.dumps({"themes": {"ambient_forest": {}}}), encoding="utf-8",
        )
        self.tileset = self.root / "public" / "assets" / "tilesets" / "forest.png"
        self.tileset.write_bytes(self.png_header(192, 64))
        with (self.root / "assets" / "ASSET_REGISTER.csv").open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=["asset_id", "filename", "creator", "source_url", "license", "usage_permission", "status"])
            writer.writeheader()
            writer.writerow({
                "asset_id": "forest-ground-v1", "filename": "../public/assets/tilesets/forest.png",
                "creator": "Veloria project", "source_url": "", "license": "Original prototype art",
                "usage_permission": "Use in prototype", "status": "prototype-use",
            })
        self.options = {
            "map_id": "veloria/r03_muschio",
            "display_name": "Terrazze di Muschio",
            "biome_id": "forest",
            "tileset_key": "veloria-forest-ground",
            "tileset_path": "assets/tilesets/forest.png",
            "tiled_name": "veloria_terrain",
            "music_id": "ambient_forest",
        }

    def tearDown(self):
        self.temp_dir.cleanup()

    @staticmethod
    def png_header(width, height):
        return b"\x89PNG\r\n\x1a\n" + struct.pack(">I", 13) + b"IHDR" + struct.pack(">II", width, height) + bytes([8, 6, 0, 0, 0]) + b"\0\0\0\0"

    def test_creates_a_draft_that_satisfies_map_render_asset_contract(self):
        metadata_path, tiled_path = create_map_draft(self.root, **self.options, width=12, height=8)
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        tiled = json.loads(tiled_path.read_text(encoding="utf-8"))
        registered_paths = validate_asset_register(self.root / "assets" / "ASSET_REGISTER.csv", self.root, self.root / "public")[1]

        self.assertEqual(metadata["tiledAsset"], "tilemaps/r03_muschio.tmj")
        self.assertEqual(metadata["spawns"], [{"id": "start", "x": 6, "y": 4, "facing": "down"}])
        self.assertEqual(tiled_path.name, "_draft_r03_muschio.tmj")
        self.assertEqual([layer["name"] for layer in tiled["layers"]], [
            "ground", "terrain_detail", "shadows", "collision", "characters",
            "canopy_overhead", "interactions", "triggers", "decorations",
        ])
        self.assertEqual(len(tiled["layers"][0]["data"]), 12 * 8)
        self.assertEqual(tiled["tilesets"][0]["image"], "../assets/tilesets/forest.png")
        rendered_assets = validate_map_render_assets(
            metadata, tiled, tiled_path, self.root / "public", registered_paths,
            {}, "./assets/tilesets/forest.png",
        )
        self.assertEqual(rendered_assets["veloria-forest-ground"]["kind"], "tileset")

    def test_rejects_invalid_ids_unknown_music_and_non_grid_tileset_dimensions(self):
        with self.assertRaisesRegex(AssertionError, "stable form"):
            create_map_draft(self.root, **{**self.options, "map_id": "veloria/Forest-03"})
        with self.assertRaisesRegex(AssertionError, "Unknown musicId"):
            create_map_draft(self.root, **{**self.options, "music_id": "not-a-theme"})
        with self.assertRaisesRegex(AssertionError, "32 x 32"):
            create_map_draft(self.root, **self.options, tile_width=64)

    def test_refuses_existing_drafts_and_runtime_map_ids(self):
        metadata_path, _ = create_map_draft(self.root, **self.options)
        with self.assertRaisesRegex(AssertionError, "draft already exists"):
            create_map_draft(self.root, **self.options)

        metadata_path.unlink()
        (self.root / "public" / "tilemaps" / "_draft_r03_muschio.tmj").unlink()
        (self.root / "content" / "maps" / "existing.map.json").write_text(
            json.dumps({"id": self.options["map_id"]}), encoding="utf-8",
        )
        with self.assertRaisesRegex(AssertionError, "Runtime map ID already exists"):
            create_map_draft(self.root, **self.options)


if __name__ == "__main__":
    unittest.main()
