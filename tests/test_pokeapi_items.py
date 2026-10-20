import copy
import io
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import import_pokeapi_items as importer


def item_fixture(slug, hgss_text, modern_text='Restores the HP of one Pokémon by 999 points.', italian_text='Descrizione\nitaliana.'):
    names = {
        'super-potion': 'Superpozione',
        'hyper-potion': 'Iperpozione',
        'paralyze-heal': 'Antiparalisi',
    }
    return {
        'id': {'super-potion': 26, 'hyper-potion': 25, 'paralyze-heal': 22}[slug],
        'name': slug,
        'cost': None,
        'names': [
            {'name': names[slug], 'language': {'name': 'it'}},
            {'name': slug.replace('-', ' ').title(), 'language': {'name': 'en'}},
        ],
        'flavor_text_entries': [
            {'text': modern_text, 'language': {'name': 'en'}, 'version_group': {'name': 'scarlet-violet'}},
            {'text': hgss_text, 'language': {'name': 'en'}, 'version_group': {'name': 'heartgold-soulsilver'}},
            {'text': italian_text, 'language': {'name': 'it'}, 'version_group': {'name': 'heartgold-soulsilver'}},
        ],
    }


class PokeApiItemsTests(unittest.TestCase):
    def test_hgss_flavor_amount_wins_over_modern_text(self):
        super_potion = importer.parse_item(item_fixture('super-potion', 'A spray medicine.\nIt restores HP by 50 points.'), 'super-potion', 700)
        hyper_potion = importer.parse_item(item_fixture('hyper-potion', 'It restores the HP of one Pokémon by\n200 points.', modern_text='It restores HP by 120 points.'), 'hyper-potion', 1500)
        self.assertEqual(super_potion['battle'], {'healHp': 50})
        self.assertEqual(hyper_potion['battle'], {'healHp': 200})
        self.assertEqual(super_potion['description'], 'Descrizione italiana.')

    def test_paralyze_heal_uses_only_supported_hgss_cure(self):
        item = importer.parse_item(item_fixture('paralyze-heal', 'It eliminates paralysis from a single Pokémon.'), 'paralyze-heal', 200)
        self.assertEqual(item['name'], 'Antiparalisi')
        self.assertEqual(item['battle'], {'cures': ['paralysis']})

    def test_missing_hgss_effect_does_not_fall_back_to_modern_flavor(self):
        raw = item_fixture('hyper-potion', 'It restores HP by 200 points.')
        raw['flavor_text_entries'] = [entry for entry in raw['flavor_text_entries']
                                      if entry['version_group']['name'] != 'heartgold-soulsilver']
        raw['flavor_text_entries'].append({'text': 'It restores HP by 999 points.', 'language': {'name': 'en'},
                                           'version_group': {'name': 'scarlet-violet'}})
        with self.assertRaisesRegex(ValueError, 'Missing English heartgold-soulsilver'):
            importer.parse_item(raw, 'hyper-potion', 1500)

    def test_catalog_generation_preserves_existing_items_without_mutation(self):
        existing = {'version': 1, 'status': 'prototype', 'items': {'potion': {'id': 'potion', 'name': 'Pozione'}}}
        original = copy.deepcopy(existing)
        entries = {
            slug: {'raw': item_fixture(slug, text), 'origin': {'url': f'https://pokeapi.co/api/v2/item/{slug}/', 'path': f'content/sources/pokeapi/item-{slug}.json', 'sha256': 'a' * 64}}
            for slug, text in [('super-potion', 'It restores HP by 50 points.'),
                               ('hyper-potion', 'It restores HP by 200 points.'),
                               ('paralyze-heal', 'It eliminates paralysis.')]
        }
        with tempfile.TemporaryDirectory(dir=importer.ROOT) as temp:
            csv_path = Path(temp) / 'items.csv'
            csv_path.write_text('id,identifier,cost\n26,super-potion,700\n25,hyper-potion,1500\n22,paralyze-heal,200\n', encoding='utf-8')
            catalog, manifest = importer.build_outputs(existing, entries, csv_path, {'super-potion': 700, 'hyper-potion': 1500, 'paralyze-heal': 200})
        self.assertEqual(existing, original)
        self.assertEqual(catalog['items']['potion'], original['items']['potion'])
        self.assertEqual(catalog['items']['hyper-potion']['price'], 1500)
        self.assertEqual(manifest['items']['hyper-potion']['selectedVersionGroup'], 'heartgold-soulsilver')
        self.assertIn('not asserted as HGSS price', manifest['items']['hyper-potion']['priceSource'])

    def test_check_reproduces_cached_outputs_without_network(self):
        for slug in importer.ITEMS:
            self.assertTrue((importer.SOURCE / f'item-{slug}.json').exists())
        self.assertTrue((importer.SOURCE / 'items.csv').exists())
        with patch.object(importer, 'urlopen', side_effect=AssertionError('--check attempted network access')):
            with redirect_stdout(io.StringIO()):
                importer.main(['--check'])


if __name__ == '__main__':
    unittest.main()
