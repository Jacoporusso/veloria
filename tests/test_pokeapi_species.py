import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from import_pokeapi_species import parameters_for_generation


class SpeciesParameterTests(unittest.TestCase):
    def test_generation_one_special_does_not_override_hgss_split_stats(self):
        for species_id, attack, defense in [(5, 80, 65), (8, 65, 80)]:
            raw = json.loads((ROOT / f'content/sources/pokeapi/pokemon-{species_id}.json').read_text(encoding='utf-8'))
            stats, _ = parameters_for_generation(raw, 4)
            self.assertEqual(stats['specialAttack'], attack)
            self.assertEqual(stats['specialDefense'], defense)

    def test_past_stat_and_type_boundaries_are_applied_per_field(self):
        raw = json.loads((ROOT / 'content/sources/pokeapi/pokemon-5.json').read_text(encoding='utf-8'))
        snapshot = lambda generation, entries: {'generation': {'url': f'https://pokeapi.co/api/v2/generation/{generation}/'}, 'stats': entries}
        value = lambda name, amount: {'stat': {'name': name}, 'base_stat': amount}
        raw['past_stats'] = [snapshot(6, [value('attack', 40)]), snapshot(9, [value('attack', 50)]), snapshot(3, [value('defense', 10)])]
        raw['past_types'] = [{'generation': {'url': 'https://pokeapi.co/api/v2/generation/5/'}, 'types': [{'slot': 1, 'type': {'name': 'normal'}}]}]
        old, old_types = parameters_for_generation(raw, 4)
        boundary, _ = parameters_for_generation(raw, 6)
        later, later_types = parameters_for_generation(raw, 10)
        self.assertEqual(old['attack'], 40)
        self.assertEqual(old['defense'], 58)
        self.assertEqual(boundary['attack'], 40)
        self.assertEqual(later['attack'], 64)
        self.assertEqual(old_types, ['normal'])
        self.assertEqual(later_types, ['fire'])


if __name__ == '__main__':
    unittest.main()
