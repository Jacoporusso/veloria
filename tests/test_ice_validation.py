import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from ice_validation import collect_movement_surfaces, object_tiles, reachable_tiles, validate_ice_triggers


def surface(x, y, w, h, value="ice"):
    return {"x": x * 32, "y": y * 32, "width": w * 32, "height": h * 32,
            "properties": [{"name": "surface", "value": value}]}


class IceValidationTests(unittest.TestCase):
    def test_ice_interruptions_are_single_tiles_and_layers_cannot_shift_geometry(self):
        validate_ice_triggers([surface(1,1,1,1)],5,5,{(1,1)})
        validate_ice_triggers([surface(0,0,3,1)],5,5,{(1,1)})
        with self.assertRaisesRegex(AssertionError,'one grid-aligned tile'):
            validate_ice_triggers([surface(1,1,2,1)],5,5,{(1,1),(2,1)})
        with self.assertRaisesRegex(AssertionError,'offset'):
            collect_movement_surfaces({'type':'objectgroup','offsetx':32,'objects':[surface(1,1,1,1)]},5,5)

    def test_optional_layer_and_valid_rectangles(self):
        self.assertEqual(collect_movement_surfaces(None, 5, 5), set())
        ice = collect_movement_surfaces({"type": "objectgroup", "objects": [surface(1, 1, 2, 2)]}, 5, 5)
        self.assertEqual(ice, {(1, 1), (2, 1), (1, 2), (2, 2)})
        direct_props = surface(0, 0, 1, 1)
        direct_props["properties"] = {"surface": "ice"}
        self.assertEqual(collect_movement_surfaces({"type": "objectgroup", "objects": [direct_props]}, 5, 5), {(0, 0)})

    def test_rejects_bad_layer_rectangles_and_properties(self):
        invalid = [
            ({"type": "tilelayer", "objects": []}, 5, 5),
            ({"type": "objectgroup", "objects": [surface(0, 0, 1, 1, "water")]}, 5, 5),
            ({"type": "objectgroup", "objects": [dict(surface(0, 0, 1, 1), x=1)]}, 5, 5),
            ({"type": "objectgroup", "objects": [surface(-1, 0, 1, 1)]}, 5, 5),
            ({"type": "objectgroup", "objects": [surface(4, 4, 2, 2)]}, 5, 5),
            ({"type": "objectgroup", "objects": [surface(1, 1, 0, 1)]}, 5, 5),
            ({"type": "objectgroup", "objects": [{**surface(0, 0, 1, 1), "rotation": 90}]}, 5, 5),
            ({"type": "objectgroup", "objects": [{**surface(0, 0, 1, 1), "ellipse": True}]}, 5, 5),
            ({"type": "objectgroup", "objects": [surface(0, 0, 1, 1)]}, True, 5),
            ({"type": "objectgroup", "objects": [surface(0, 0, 1, 1)]}, 0, 5),
        ]
        for layer, width, height in invalid:
            with self.subTest(layer=layer), self.assertRaises(AssertionError):
                collect_movement_surfaces(layer, width, height)

    def test_ice_requires_straight_slide_and_landing_at_dry_or_trigger_tile(self):
        ice = {(1, 1), (2, 1), (3, 1)}
        traversed, stops = reachable_tiles((0, 1), 5, 3, set(), ice)
        self.assertIn((3, 1), traversed)
        self.assertNotIn((2, 1), stops)  # cannot turn halfway across ice
        self.assertIn((4, 1), stops)  # slide ends on dry tile
        _, wall_stops = reachable_tiles((0, 1), 5, 3, {(4, 1)}, ice)
        self.assertIn((3, 1), wall_stops)  # wall stops slide on its last ice tile
        _, trigger_stops = reachable_tiles((0, 1), 5, 3, set(), ice, {(2, 1)})
        self.assertIn((2, 1), trigger_stops)  # runtime handles trigger after each tile

    def test_corridor_branch_is_inaccessible_mid_slide_until_trigger_stops_player(self):
        # A branch touches the second ice tile. Ordinary BFS reaches it; legal
        # slide reachability does not allow changing direction there.
        width, height = 6, 4
        start, branch = (0, 2), (2, 1)
        ice = {(1, 2), (2, 2), (3, 2)}
        floor = {start, *ice, (4, 2), branch}
        blocked = {(x, y) for x in range(width) for y in range(height)} - floor
        naive = {start, (1, 2), (2, 2), branch}
        self.assertIn(branch, naive)

        traversed, stops = reachable_tiles(start, width, height, blocked, ice)
        self.assertNotIn(branch, traversed)
        self.assertNotIn((2, 2), stops)

        triggered_path, triggered_stops = reachable_tiles(start, width, height, blocked, ice, {(2, 2)})
        self.assertIn(branch, triggered_path)
        self.assertIn((2, 2), triggered_stops)

    def test_no_ice_preserves_normal_grid_walk(self):
        traversed, stops = reachable_tiles((1, 1), 3, 3, set())
        self.assertEqual(traversed, {(x, y) for x in range(3) for y in range(3)})
        self.assertEqual(stops, traversed)

    def test_object_tiles_uses_ceil_for_fractional_bounds(self):
        self.assertEqual(object_tiles([{"x": 0.5, "y": 0, "width": 32, "height": 32}], 3, 2),
                         {(0, 0), (1, 0)})


if __name__ == "__main__":
    unittest.main()
