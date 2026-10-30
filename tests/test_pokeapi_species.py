import json
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from import_pokeapi_species import parameters_for_generation
from import_pokeapi_species import capture_rate_for_species, drift_fields, main as import_species


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

    def test_capture_rate_matches_all_cached_pokemon_species_sources_and_catalog(self):
        catalog = json.loads((ROOT / 'content/battle/species.v1.json').read_text(encoding='utf-8'))['species']
        for species_id in range(1, 152):
            with self.subTest(species_id=species_id):
                source = json.loads((ROOT / f'content/sources/pokeapi/pokemon-species-{species_id}.json').read_text(encoding='utf-8'))
                rate = capture_rate_for_species(source, species_id)
                self.assertEqual(source['id'], species_id)
                self.assertIsInstance(rate, int)
                self.assertGreaterEqual(rate, 1)
                self.assertLessEqual(rate, 255)
                self.assertEqual(catalog[str(species_id)]['captureRate'], rate)

    def test_sourced_capture_rates_for_key_gen_one_species(self):
        expected = {16: 255, 143: 25, 144: 3, 145: 3, 146: 3, 150: 3, 151: 45}
        catalog = json.loads((ROOT / 'content/battle/species.v1.json').read_text(encoding='utf-8'))['species']
        for species_id, rate in expected.items():
            with self.subTest(species_id=species_id):
                self.assertEqual(catalog[str(species_id)]['captureRate'], rate)

    def test_capture_rate_source_is_validated_and_check_detects_catalog_drift(self):
        for invalid in (None, True, 0, 256, '45'):
            with self.subTest(invalid=invalid):
                with self.assertRaises(ValueError):
                    capture_rate_for_species({'capture_rate': invalid}, 25)
        self.assertEqual(drift_fields({'captureRate': 254}, {'captureRate': 255}), ['captureRate'])
        with redirect_stdout(StringIO()):
            import_species(['--check'])


if __name__ == '__main__':
    unittest.main()
