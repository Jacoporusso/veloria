import json
import shutil
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path
from tools.import_item_evolutions import ROOT, build


class ItemEvolutionImportTest(unittest.TestCase):
    def test_duplicate_item_endpoints_do_not_depend_on_filesystem_order(self):
        expected = build()['itemSources']
        original_glob = Path.glob
        def reverse_items(path, pattern):
            entries = list(original_glob(path, pattern))
            return iter(reversed(entries)) if pattern == 'item-*.json' else iter(entries)
        with patch.object(Path, 'glob', reverse_items):
            self.assertEqual(build()['itemSources'], expected)

    def fixture(self):
        temp = tempfile.TemporaryDirectory(dir=ROOT / '.tmp')
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        for relative in ('content/battle/species.v1.json', 'content/battle/species-imports.v1.json',
                         'content/battle/evolution-reference.v1.json', 'content/items/items.v1.json'):
            target = root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, target)
        source = root / 'content/sources/pokeapi'
        source.mkdir(parents=True)
        for pattern in ('pokemon-species-*.json', 'evolution-chain-*.json', 'item-*.json'):
            for path in (ROOT / 'content/sources/pokeapi').glob(pattern):
                shutil.copyfile(path, source / path.name)
        return root

    def test_all_sixteen_official_gen1_stone_branches_are_enabled(self):
        rules = build()['rules']
        self.assertEqual(len(rules), 16)
        self.assertIn({'fromSpeciesId': 61, 'toSpeciesId': 62, 'itemId': 'water-stone'}, rules)
        self.assertIn({'fromSpeciesId': 30, 'toSpeciesId': 31, 'itemId': 'moon-stone'}, rules)
        self.assertFalse(any(rule['toSpeciesId'] == 186 for rule in rules))

    def test_botanical_branches_are_distinct_and_source_items_are_recorded(self):
        result = build()
        for parent, target, item in [(44, 45, 'leaf-stone'), (70, 71, 'leaf-stone')]:
            self.assertIn({'fromSpeciesId': parent, 'toSpeciesId': target, 'itemId': item}, result['rules'])
        self.assertEqual(len(result['itemSources']), 5)

    def test_item_name_must_match_official_source(self):
        root = self.fixture()
        path = root / 'content/items/items.v1.json'
        data = json.loads(path.read_text(encoding='utf-8'))
        data['items']['leaf-stone']['name'] = 'Invented stone'
        path.write_text(json.dumps(data), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'official source'):
            build(root)
