import copy
import unittest
import xml.etree.ElementTree as ET

from tools.generate_map_layout_guide import BLOCKED, FLOOR, HABITAT, ICE, generate_svg


def rectangle(x, y, width=32, height=32, kind=None):
    return dict(x=x, y=y, width=width, height=height,
                properties=[] if kind is None else [dict(name="kind", value=kind)])


class MapLayoutGuideTest(unittest.TestCase):
    def setUp(self):
        self.tiled = dict(orientation="orthogonal", infinite=False, width=3, height=3,
                          tilewidth=32, tileheight=32, layers=[
                              dict(name="collision", type="objectgroup", objects=[rectangle(0, 32, 96, 64)]),
                              dict(name="characters", type="objectgroup", objects=[rectangle(32, 32, kind="npc")]),
                              dict(name="triggers", type="objectgroup", objects=[rectangle(64, 0, kind="encounter-zone")])])

    def color_at(self, svg, x, y):
        color = None
        for item in ET.fromstring(svg):
            left, top = float(item.get("x", 0)), float(item.get("y", 0))
            if left <= x < left+float(item.get("width")) and top <= y < top+float(item.get("height")):
                color = item.get("fill")
        return color

    def test_floor_foot_margin_survives_adjacent_collision(self):
        svg = generate_svg(self.tiled)
        self.assertEqual(self.color_at(svg, 16, 51), FLOOR)
        self.assertEqual(self.color_at(svg, 16, 52), BLOCKED)

    def test_actor_removes_only_its_cell_from_coalesced_collision(self):
        svg = generate_svg(self.tiled, foot_margin=0)
        self.assertEqual(self.color_at(svg, 48, 48), FLOOR)
        self.assertEqual(self.color_at(svg, 16, 48), BLOCKED)
        self.assertEqual(self.color_at(svg, 80, 48), BLOCKED)

    def test_habitat_geometry_and_source_are_preserved(self):
        original = copy.deepcopy(self.tiled)
        svg = generate_svg(self.tiled)
        self.assertEqual(self.color_at(svg, 80, 16), HABITAT)
        self.assertEqual(self.color_at(svg, 48, 16), FLOOR)
        self.assertEqual(ET.fromstring(svg).get("viewBox"), "0 0 96 96")
        self.assertEqual(self.tiled, original)
        self.assertEqual(svg, generate_svg(self.tiled))

    def test_unsupported_geometry_fails_instead_of_guessing(self):
        self.tiled["layers"][0]["objects"][0]["rotation"] = 45
        with self.assertRaises(ValueError):
            generate_svg(self.tiled)

    def test_ambiguous_custom_collision_dimensions_are_rejected(self):
        self.tiled["layers"][0]["objects"][0]["properties"] = [dict(name="width", value=3)]
        with self.assertRaisesRegex(ValueError, "Tiled rectangle fields"):
            generate_svg(self.tiled)

    def test_ice_stays_on_free_surface_cells_without_recoloring_dry_landings(self):
        surface = rectangle(0, 0, 32, 64)
        surface["properties"] = [dict(name="surface", value="ice")]
        self.tiled["layers"].append(dict(name="movement_surfaces", type="objectgroup", objects=[surface]))
        original = copy.deepcopy(self.tiled)
        svg = generate_svg(self.tiled)
        self.assertEqual(self.color_at(svg, 16, 16), ICE)
        self.assertEqual(self.color_at(svg, 16, 33), FLOOR)  # foot margin, not another ice cell
        self.assertEqual(self.color_at(svg, 16, 55), BLOCKED)
        self.assertEqual(self.color_at(svg, 48, 16), FLOOR)
        self.assertEqual(self.tiled, original)


if __name__ == "__main__":
    unittest.main()
