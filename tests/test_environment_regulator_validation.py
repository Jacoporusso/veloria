import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from environment_regulator_validation import validate_environment_regulators


class EnvironmentRegulatorValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=ROOT)
        self.root = Path(self.temp.name)
        (self.root / 'content' / 'regulators').mkdir(parents=True)
        (self.root / 'public' / 'tilemaps').mkdir(parents=True)
        self.regulator = {
            'id': 'crystaltemp', 'name': 'Crystal temperature',
            'solvedFlag': 'regulator_solved', 'solvedEvent': 'cave/regulator/solved',
            'requiredFlags': ['badge_ice'],
            'controls': [{
                'id': 'height', 'label': 'Height', 'hint': 'Choose a level.',
                'min': 0, 'max': 2, 'initial': 0, 'target': 2,
                'levels': [
                    {'value': 0, 'label': 'Low', 'hint': 'Lower level.'},
                    {'value': 1, 'label': 'Mid', 'hint': 'Middle level.'},
                    {'value': 2, 'label': 'High', 'hint': 'Higher level.'},
                ],
            }],
        }
        self.tiled = {
            'width': 8, 'height': 8, 'tilewidth': 32, 'tileheight': 32,
            'layers': [
                {'name': 'interactions', 'objects': [{
                    'x': 64, 'y': 96, 'width': 32, 'height': 32,
                    'properties': [
                        {'name': 'kind', 'value': 'environment-regulator'},
                        {'name': 'regulatorId', 'value': 'crystaltemp'},
                    ],
                }]},
                {'name': 'collision', 'objects': [{'x': 64, 'y': 96, 'width': 32, 'height': 32}]},
            ],
        }
        self.maps = {'veloria/test': {'tiledAsset': 'tilemaps/test.tmj'}}
        self.flags = {'regulator_solved', 'badge_ice'}
        self.triggers = {'cave/regulator/solved'}
        self._write()

    def tearDown(self):
        self.temp.cleanup()

    def _write(self, regulator=None, tiled=None, name='one.v1.json'):
        path = self.root / 'content' / 'regulators' / name
        if regulator is not None:
            path.write_text(json.dumps(regulator), encoding='utf-8')
        elif not path.exists():
            path.write_text(json.dumps(self.regulator), encoding='utf-8')
        target = self.root / 'public' / 'tilemaps' / 'test.tmj'
        target.write_text(json.dumps(tiled if tiled is not None else self.tiled), encoding='utf-8')

    def _validate(self):
        validate_environment_regulators(self.root, self.maps, self.flags, self.triggers)

    def test_valid_catalog_and_map_do_not_mutate_inputs(self):
        before_regulator = copy.deepcopy(self.regulator)
        before_tiled = copy.deepcopy(self.tiled)
        self._validate()
        self.assertEqual(self.regulator, before_regulator)
        self.assertEqual(self.tiled, before_tiled)

    def test_levels_may_be_authored_out_of_order(self):
        self.regulator['controls'][0]['levels'].reverse()
        self._write(self.regulator)
        self._validate()

    def test_missing_catalog_directory_is_optional(self):
        (self.root / 'content' / 'regulators' / 'one.v1.json').unlink()
        (self.root / 'content' / 'regulators').rmdir()
        validate_environment_regulators(self.root, {}, set(), set())

    def test_terminal_is_rejected_when_catalog_is_missing(self):
        (self.root / 'content' / 'regulators' / 'one.v1.json').unlink()
        (self.root / 'content' / 'regulators').rmdir()
        with self.assertRaisesRegex(AssertionError, 'Unknown map environment regulator'):
            self._validate()

    def test_duplicate_regulator_and_control_ids_are_rejected(self):
        self._write(self.regulator, name='two.v1.json')
        with self.assertRaisesRegex(AssertionError, 'Duplicate environment regulator IDs'):
            self._validate()
        (self.root / 'content' / 'regulators' / 'two.v1.json').unlink()
        duplicate = copy.deepcopy(self.regulator)
        duplicate['controls'].append(copy.deepcopy(duplicate['controls'][0]))
        self._write(duplicate)
        with self.assertRaisesRegex(AssertionError, 'Duplicate environment regulator control IDs'):
            self._validate()

    def test_missing_level_is_rejected(self):
        self.regulator['controls'][0]['levels'].pop(1)
        self._write(self.regulator)
        with self.assertRaisesRegex(AssertionError, 'cover the full range'):
            self._validate()

    def test_unknown_solved_event_is_rejected(self):
        self.regulator['solvedEvent'] = 'unknown/event'
        self._write(self.regulator)
        with self.assertRaisesRegex(AssertionError, 'solved event'):
            self._validate()

    def test_orphan_regulator_is_rejected(self):
        self._write(tiled={**self.tiled, 'layers': [layer for layer in self.tiled['layers'] if layer['name'] != 'interactions']})
        with self.assertRaisesRegex(AssertionError, 'no runtime terminal'):
            self._validate()

    def test_terminal_without_full_collision_is_rejected(self):
        tiled = copy.deepcopy(self.tiled)
        tiled['layers'][1]['objects'] = []
        self._write(tiled=tiled)
        with self.assertRaisesRegex(AssertionError, 'full collision footprint'):
            self._validate()


if __name__ == '__main__':
    unittest.main()
