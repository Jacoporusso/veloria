import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from migrate_veloria_gen1 import convert, official_moves


class RegionalMigrationTests(unittest.TestCase):
    def test_replacement_uses_official_moves_without_overlevel_quick_attack(self):
        moves = official_moves(19, 3, ['scratch', 'quick-attack'])
        self.assertNotIn('scratch', moves)
        self.assertNotIn('quick-attack', moves)
        self.assertIn('tackle', moves)
        self.assertLessEqual(len(moves), 4)

    def test_conversion_preserves_encounter_balance_and_is_idempotent(self):
        encounter = {'speciesId': 180, 'weight': 30, 'minLevel': 28, 'maxLevel': 32}
        self.assertEqual(convert(encounter), [{'from': 180, 'to': 81}])
        self.assertEqual(encounter, {'speciesId': 81, 'weight': 30, 'minLevel': 28, 'maxLevel': 32})
        self.assertEqual(convert(encounter), [])

    def test_unreviewed_foreign_species_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'No reviewed regional replacement'):
            convert({'speciesId': 999})


if __name__ == '__main__':
    unittest.main()
