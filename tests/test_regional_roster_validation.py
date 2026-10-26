import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from validate_regional_roster import validate_regional_roster


class RegionalRosterValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for directory in ('battle', 'regions', 'encounters', 'trainers', 'maps', 'quests'):
            shutil.copytree(ROOT / 'content' / directory, self.root / 'content' / directory)
        shutil.copytree(ROOT / 'public/tilemaps', self.root / 'public/tilemaps')

    def edit(self, path, mutate):
        file = self.root / path
        data = json.loads(file.read_text(encoding='utf-8'))
        mutate(data)
        file.write_text(json.dumps(data), encoding='utf-8')

    def test_complete_region(self):
        self.assertEqual(validate_regional_roster(self.root), 151)

    def test_foreign_habitat_is_rejected(self):
        self.edit('content/encounters/r01_tall_grass.encounter.json',
                  lambda data: data['timeBands']['night'][0].update(speciesId=161))
        with self.assertRaisesRegex(AssertionError, 'foreign regional species'):
            validate_regional_roster(self.root)

    def test_capture_event_must_match_visible_encounter(self):
        self.edit('content/encounters/special-pokemon.v1.json',
                  lambda data: data['encounters'][0].update(captureEvent='wrong/event'))
        with self.assertRaisesRegex(AssertionError, 'capture event'):
            validate_regional_roster(self.root)

    def test_visibility_must_match_unlock_flag(self):
        def mutate(data):
            for layer in data['layers']:
                for obj in layer.get('objects', []):
                    props = {prop['name']: prop for prop in obj.get('properties', [])}
                    if 'specialEncounterId' in props:
                        props['visibleWhenFlag']['value'] = 'wrong_flag'
        self.edit('public/tilemaps/r12_valle_vento.tmj', mutate)
        with self.assertRaisesRegex(AssertionError, 'visibility/capture mismatch'):
            validate_regional_roster(self.root)
