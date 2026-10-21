import copy
import json
from pathlib import Path
import sys
import unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from json_schema_validation import validate_json_schema
SCHEMA = json.loads((ROOT / 'specs/schemas/progression.v2.schema.json').read_text(encoding='utf-8'))
DATA = json.loads((ROOT / 'content/battle/progression.v2.json').read_text(encoding='utf-8'))

class ProgressionSchemaTests(unittest.TestCase):
    def test_current_progression_and_every_species_have_versioned_curve_contract(self):
        validate_json_schema(DATA, SCHEMA)
        species = json.loads((ROOT / 'content/battle/species.v1.json').read_text(encoding='utf-8'))['species']
        self.assertTrue(all(entry['growthCurveId'] in DATA['growthCurves'] for entry in species.values()))

    def test_wrong_version_empty_curves_and_incomplete_or_extra_levels_are_rejected(self):
        invalid = []
        version = copy.deepcopy(DATA); version['version'] = 1; invalid.append(version)
        empty = copy.deepcopy(DATA); empty['growthCurves'] = {}; invalid.append(empty)
        for count in [99, 101]:
            changed = copy.deepcopy(DATA)
            next(iter(changed['growthCurves'].values()))['totalExperience'] = list(range(count))
            invalid.append(changed)
        for document in invalid:
            with self.subTest(document=str(document)[:80]), self.assertRaises(AssertionError):
                validate_json_schema(document, SCHEMA)

    def test_formula_floats_and_negative_thresholds_are_rejected_in_runtime_tables(self):
        for value in [{'exponent': 3, 'multiplier': 1}, {'totalExperience': [0.5] * 100}, {'totalExperience': [-1] * 100}]:
            changed = copy.deepcopy(DATA); changed['growthCurves'] = {'bad': value}
            with self.subTest(value=str(value)[:80]), self.assertRaises(AssertionError):
                validate_json_schema(changed, SCHEMA)
