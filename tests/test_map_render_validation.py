import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from map_render_validation import validate_map_render_assets


class MapRenderValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.public = self.root / "public"
        self.tilemap_path = self.public / "tilemaps" / "forest.tmj"
        self.tilemap_path.parent.mkdir(parents=True)
        self.asset_path = self.public / "assets" / "tilesets" / "forest.png"
        self.asset_path.parent.mkdir(parents=True)
        self.asset_path.write_bytes(b"test asset")
        self.sprite_path = self.public / "assets" / "sprites" / "pond.png"
        self.sprite_path.parent.mkdir(parents=True)
        self.sprite_path.write_bytes(b"pond asset")
        self.metadata = {
            "id": "veloria/test_forest",
            "version": 2,
            "renderAssets": [{
                "kind": "tileset", "key": "forest-ground", "path": "assets/tilesets/forest.png",
                "tiledName": "forest_tiles", "tileWidth": 32, "tileHeight": 32,
            }],
        }
        self.tiled = {"tilesets": [{
            "name": "forest_tiles", "image": "../assets/tilesets/forest.png",
            "tilewidth": 32, "tileheight": 32,
        }]}
        self.registered = {self.asset_path.resolve(), self.sprite_path.resolve()}
        self.shared = {}

    def tearDown(self):
        self.temp_dir.cleanup()

    def validate(self, metadata=None, tiled=None, registered=None):
        return validate_map_render_assets(
            metadata or self.metadata,
            tiled or self.tiled,
            self.tilemap_path,
            self.public,
            registered if registered is not None else self.registered,
            self.shared,
            "./assets/tilesets/forest.png ./assets/sprites/pond.png",
        )

    def test_matching_tileset_asset_and_tiled_name_validate(self):
        assets = self.validate()
        self.assertEqual(assets["forest-ground"]["tiledName"], "forest_tiles")

    def test_tileset_reference_must_match_tiled_name_and_registered_path(self):
        tiled = {"tilesets": [{**self.tiled["tilesets"][0], "name": "wrong_name"}]}
        with self.assertRaisesRegex(AssertionError, "do not match Tiled tilesets"):
            self.validate(tiled=tiled)
        with self.assertRaisesRegex(AssertionError, "missing from assets/ASSET_REGISTER"):
            self.validate(registered=set())

    def test_assets_must_be_precached_and_stay_inside_public(self):
        with self.assertRaisesRegex(AssertionError, "offline precache"):
            validate_map_render_assets(self.metadata, self.tiled, self.tilemap_path, self.public,
                                       self.registered, {}, "./index.html")
        unsafe_metadata = {
            "id": self.metadata["id"], "version": 2,
            "renderAssets": [{"kind": "image", "key": "escape", "path": "assets/../secret.png"}],
        }
        with self.assertRaisesRegex(AssertionError, "Invalid public render asset path"):
            self.validate(metadata=unsafe_metadata)

    def test_scenery_images_must_reference_declared_image_assets(self):
        pond_asset = {"kind": "image", "key": "pond", "path": "assets/sprites/pond.png"}
        metadata = {**self.metadata, "renderAssets": [*self.metadata["renderAssets"], pond_asset]}
        tiled = {**self.tiled, "layers": [{
            "name": "decorations",
            "objects": [{
                "class": "scenery-image", "name": "Pool", "x": 32, "y": 64, "width": 160, "height": 96,
                "properties": [{"name": "sprite", "value": "pond"}],
            }],
        }]}
        assets = self.validate(metadata=metadata, tiled=tiled)
        self.assertEqual(assets["pond"]["kind"], "image")

        invalid_metadata = {**self.metadata, "renderAssets": self.metadata["renderAssets"]}
        with self.assertRaisesRegex(AssertionError, "undeclared image asset"):
            self.validate(metadata=invalid_metadata, tiled=tiled)


if __name__ == "__main__":
    unittest.main()
