import copy
import unittest
from tools.validate_map_parity_art import validate_full_map_binding


class MapArtBindingTest(unittest.TestCase):
    def setUp(self):
        self.metadata = dict(renderAssets=[dict(kind="tileset", tiledName="terrain")],
                             terrainBase=dict(assetKey="room", tilesetName="terrain", tileIndex=0))
        self.tiled = dict(width=2, height=2, tilewidth=32, tileheight=32,
                          tilesets=[dict(name="terrain", firstgid=1)],
                          layers=[dict(name="ground", type="tilelayer", data=[1, 1, 1, 1])])

    def add_scenery(self, width=64):
        self.tiled["layers"].append(dict(name="decorations", objects=[dict(x=0, y=0, width=width, height=64,
            properties=[dict(name="kind", value="scenery-image"), dict(name="sprite", value="room")])]))

    def validate(self):
        validate_full_map_binding(self.metadata, self.tiled, "room", "test/room")

    def test_terrain_base_preserves_sources_and_requires_exact_ground(self):
        before = copy.deepcopy((self.metadata, self.tiled))
        self.validate()
        self.assertEqual((self.metadata, self.tiled), before)
        self.tiled["layers"][0]["data"][2] = 2
        with self.assertRaisesRegex(AssertionError, "declared ground tile"):
            self.validate()

    def test_scenery_must_cover_world_and_cannot_be_duplicated(self):
        self.add_scenery()
        self.validate()  # Existing maps may use the same art as base and scenery.
        self.add_scenery()
        with self.assertRaisesRegex(AssertionError, "Expected one"):
            self.validate()
        self.tiled["layers"].pop()
        del self.metadata["terrainBase"]
        self.validate()
        self.tiled["layers"][-1]["objects"][0]["width"] = 32
        with self.assertRaisesRegex(AssertionError, "bounds"):
            self.validate()

    def test_missing_binding_or_tileset_is_rejected(self):
        self.metadata["terrainBase"]["assetKey"] = "other"
        with self.assertRaisesRegex(AssertionError, "Expected one"):
            self.validate()
        self.metadata["terrainBase"]["assetKey"] = "room"
        self.tiled["tilesets"].clear()
        with self.assertRaisesRegex(AssertionError, "tileset/ground"):
            self.validate()

    def test_full_scenery_can_cover_an_independent_terrain_base(self):
        # Centrale composes its industrial floor separately from the full-room art.
        self.metadata["terrainBase"]["assetKey"] = "industrial-floor"
        self.add_scenery()
        before = copy.deepcopy((self.metadata, self.tiled))
        self.validate()
        self.assertEqual((self.metadata, self.tiled), before)
        self.tiled["layers"][-1]["objects"][0]["width"] = 32
        with self.assertRaisesRegex(AssertionError, "bounds"):
            self.validate()
        self.tiled["layers"].pop()
        with self.assertRaisesRegex(AssertionError, "Expected one"):
            self.validate()


if __name__ == "__main__":
    unittest.main()
