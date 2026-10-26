import unittest
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from import_pokeapi_species_art import artwork_group_paths, select_group_imports, validate_group, parse_species_ids


class SpeciesArtworkGroupTests(unittest.TestCase):
    def test_explicit_media_batch_is_positive_unique_and_ordered(self):
        self.assertEqual(parse_species_ids('129, 130,143'), [129, 130, 143])
        for value in ('', '0', '-1', '1,1', '1,no', '1,'):
            with self.subTest(value=value), self.assertRaises(argparse.ArgumentTypeError):
                parse_species_ids(value)

    def test_group_paths(self):
        self.assertEqual(artwork_group_paths('urban', 25), {
            'manifest': 'assets/pokeapi-urban-artwork-v1.json',
            'source': 'assets/sources/pokeapi/urban/25.png',
            'runtime': 'assets/creatures/pokeapi-urban-25-v1.webp',
            'asset_ids': ('pokeapi-urban-25-v1', 'pokeapi-urban-25-v1-webp'),
        })
        self.assertEqual(artwork_group_paths('coastal-zone', 7)['source'],
                         'assets/sources/pokeapi/coastal-zone/7.png')

    def test_group_name_rejects_path_segments(self):
        for value in ('../urban', 'Urban', 'a/b', '', '1group'):
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_group(value)

    def test_selects_only_requested_group_and_requires_match(self):
        entries = [{'speciesId': 1, 'artworkGroup': 'urban'},
                   {'speciesId': 2, 'artworkGroup': 'cave'},
                   {'speciesId': 3}]
        self.assertEqual(select_group_imports(entries, 'cave'), [entries[1]])
        with self.assertRaisesRegex(ValueError, 'No species imports'):
            select_group_imports(entries, 'forest')


if __name__ == '__main__':
    unittest.main()
