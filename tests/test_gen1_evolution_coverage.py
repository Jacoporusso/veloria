import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(relative):
    return json.loads((ROOT / relative).read_text(encoding='utf-8'))


class GenIEvolutionCoverageTests(unittest.TestCase):
    def setUp(self):
        self.species = read('content/battle/species.v1.json')['species']
        self.reference = read('content/battle/evolution-reference.v1.json')['species']
        self.level = read('content/battle/progression.v2.json')['evolutions']
        self.items = read('content/battle/item-evolutions.v1.json')['rules']
        self.trades = read('content/battle/trade-evolutions.v1.json')['rules']

    def test_runtime_and_rule_targets_are_exactly_scoped_to_gen1(self):
        self.assertEqual(set(map(int, self.species)), set(range(1, 152)))
        for collection in (self.level, self.items, self.trades):
            self.assertTrue(all(1 <= rule['fromSpeciesId'] <= 151 and 1 <= rule['toSpeciesId'] <= 151 for rule in collection))

    def test_all_official_gen1_level_item_and_trade_edges_are_present(self):
        expected = {'level-up': set(), 'use-item': set(), 'trade': set()}
        for from_id, definition in self.reference.items():
            if int(from_id) > 151:
                continue
            for edge in definition['evolutions']:
                if edge['targetSpeciesId'] > 151 or edge['trigger'] not in expected:
                    continue
                if edge['trigger'] == 'level-up':
                    expected['level-up'].add((int(from_id), edge['targetSpeciesId'], edge['minimumLevel']))
                elif edge['trigger'] == 'use-item':
                    expected['use-item'].add((int(from_id), edge['targetSpeciesId'], edge['itemId']))
                else:
                    expected['trade'].add((int(from_id), edge['targetSpeciesId']))
        actual = {
            'level-up': {(rule['fromSpeciesId'], rule['toSpeciesId'], rule['minimumLevel']) for rule in self.level},
            'use-item': {(rule['fromSpeciesId'], rule['toSpeciesId'], rule['itemId']) for rule in self.items},
            'trade': {(rule['fromSpeciesId'], rule['toSpeciesId']) for rule in self.trades},
        }
        self.assertEqual(expected, actual)
        self.assertEqual(tuple(map(len, (actual['level-up'], actual['use-item'], actual['trade']))), (52, 16, 4))


if __name__ == '__main__':
    unittest.main()
