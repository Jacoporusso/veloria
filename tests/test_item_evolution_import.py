import json
import shutil
import tempfile
import unittest
from pathlib import Path
from tools.import_item_evolutions import ROOT, build


class ItemEvolutionImportTest(unittest.TestCase):
    def fixture(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        for relative in ('content/battle/species.v1.json', 'content/battle/species-imports.v1.json'):
            target = root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, target)
        source = root / 'content/sources/pokeapi'
        source.mkdir(parents=True)
        for pattern in ('pokemon-species-*.json', 'evolution-chain-*.json'):
            for path in (ROOT / 'content/sources/pokeapi').glob(pattern):
                shutil.copyfile(path, source / path.name)
        return root

    def test_official_poliwrath_branch(self):
        rules = build()['rules']
        self.assertEqual(len(rules), 5)
        self.assertIn({'fromSpeciesId': 61, 'toSpeciesId': 62, 'itemId': 'water-stone'}, rules)
        self.assertFalse(any(rule['toSpeciesId'] == 186 for rule in rules))

    def test_undeclared_branch_is_not_enabled(self):
        root = self.fixture()
        path = root / 'content/battle/species-imports.v1.json'
        data = json.loads(path.read_text(encoding='utf-8'))
        next(entry for entry in data['imports'] if entry['speciesId'] == 62).pop('evolutionItemId')
        path.write_text(json.dumps(data), encoding='utf-8')
        self.assertEqual(len(build(root)['rules']), 4)

    def test_unsupported_declared_item_fails_closed(self):
        root = self.fixture()
        path = root / 'content/battle/species-imports.v1.json'
        data = json.loads(path.read_text(encoding='utf-8'))
        next(entry for entry in data['imports'] if entry['speciesId'] == 62)['evolutionItemId'] = 'leaf-stone'
        path.write_text(json.dumps(data), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Unsupported'):
            build(root)
