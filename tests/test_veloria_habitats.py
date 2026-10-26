import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from build_veloria_habitats import build_table


class HabitatGenerationTests(unittest.TestCase):
    def test_level_envelope_and_method_survive_time_variation(self):
        original = {'id': 'test', 'method': 'fishing', 'timeBands': {
            band: [{'speciesId': 194, 'weight': 100, 'minLevel': 22, 'maxLevel': 26}]
            for band in ['morning', 'day', 'night']}}
        built = build_table(copy.deepcopy(original), [129, 72, 98, 116, 120, 90])
        self.assertEqual(built['method'], 'fishing')
        self.assertEqual([entries[0]['speciesId'] for entries in built['timeBands'].values()], [129, 72, 98])
        for entries in built['timeBands'].values():
            self.assertEqual(sum(entry['weight'] for entry in entries), 100)
            self.assertEqual({(entry['minLevel'], entry['maxLevel']) for entry in entries}, {(22, 26)})
        self.assertEqual(build_table(copy.deepcopy(built), [129, 72, 98, 116, 120, 90]), built)

    def test_foreign_or_duplicate_species_are_rejected(self):
        for ids in ([129, 72, 98, 116, 120, 194], [129, 72, 98, 116, 120, 129]):
            with self.subTest(ids=ids), self.assertRaises(ValueError):
                build_table({'timeBands': {}}, ids)


if __name__ == '__main__':
    unittest.main()
