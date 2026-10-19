import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from fishing_validation import validate_fishing_spot


class FishingValidationTests(unittest.TestCase):
    def validate(self, **overrides):
        properties = dict(encounterTableId='shore', requiredItemId='rod', biteChance=0.6,
                          requiredFlag='ready')
        properties.update(overrides)
        validate_fishing_spot(properties, 'coast',
                              {'shore': {'mapId': 'coast', 'method': 'fishing'},
                               'grass': {'mapId': 'coast', 'method': 'tall-grass'},
                               'foreign': {'mapId': 'other', 'method': 'fishing'}},
                              {'rod': {}}, {'ready'})

    def test_valid_spot_and_probability_boundaries(self):
        for chance in (0, 0.6, 1):
            self.validate(biteChance=chance)

    def test_rejects_wrong_table_map_or_method(self):
        for table in ('missing', 'grass', 'foreign'):
            with self.subTest(table=table), self.assertRaises(ValueError):
                self.validate(encounterTableId=table)

    def test_rejects_invalid_requirements_and_probabilities(self):
        for override in ({'requiredItemId': 'missing'}, {'requiredFlag': 'unknown'},
                         *({'biteChance': chance} for chance in (True, -1, 2, float('nan'), float('inf'), '0.5'))):
            with self.subTest(override=override), self.assertRaises(ValueError):
                self.validate(**override)
