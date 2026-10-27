from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from collision_gate_validation import validate_collision_gates


class CollisionGateValidationTests(unittest.TestCase):
    def test_declared_gate_and_fixed_walls_are_accepted(self):
        validate_collision_gates([
            {'properties': [{'name': 'blocksUntilFlag', 'value': 'sluice_open'}]},
            {'properties': {'blocksUntilFlag': 'sluice_open'}},
            {'name': 'Fixed wall'},
        ], {'sluice_open'})

    def test_typo_cannot_create_a_permanently_closed_gate(self):
        with self.assertRaisesRegex(AssertionError, 'undeclared quest flag'):
            validate_collision_gates([{'properties': {'blocksUntilFlag': 'sluce_open'}}], {'sluice_open'})

    def test_custom_dimensions_cannot_silently_leave_a_one_cell_wall(self):
        for props in ({'width': 14, 'height': 1}, [{'name': 'width', 'value': 14}]):
            with self.assertRaisesRegex(AssertionError, 'Tiled rectangle fields'):
                validate_collision_gates([{'x': 0, 'y': 0, 'width': 32, 'height': 32, 'properties': props}], set())
        validate_collision_gates([{'x': 0, 'y': 0, 'width': 448, 'height': 32}], set())

    def test_empty_and_non_string_flags_are_rejected(self):
        for value in ['', ' ', None, 1, []]:
            with self.assertRaisesRegex(AssertionError, 'non-empty flag'):
                validate_collision_gates([{'properties': {'blocksUntilFlag': value}}], {'sluice_open'})
