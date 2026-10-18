import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from transit_validation import validate_transit, validate_transit_network


class TransitValidationTests(unittest.TestCase):
    def setUp(self):
        self.schema = json.loads((ROOT / 'specs/schemas/transit.v1.schema.json').read_text(encoding='utf-8'))
        self.network = {'version': 1, 'id': 'veloria/monorail', 'name': 'Monorotaia', 'requiredFlags': ['badge_circuito_awarded'], 'stations': []}
        self.maps, self.tiled = {}, {}
        for name in ['alpha', 'beta']:
            mid = 'veloria/' + name
            self.network['stations'].append({'id': name, 'name': name, 'mapId': mid, 'spawnPointId': 'arrival'})
            self.maps[mid] = {'spawns': [{'id': 'arrival', 'x': 2, 'y': 3, 'facing': 'up'}]}
            terminal = {'x': 64, 'y': 64, 'width': 32, 'height': 32, 'properties': [
                {'name': 'kind', 'value': 'transit-terminal'}, {'name': 'serviceId', 'value': 'monorail'}, {'name': 'stationId', 'value': name}]}
            self.tiled[mid] = {'width': 6, 'height': 6, 'tilewidth': 32, 'tileheight': 32, 'layers': [
                {'name': 'interactions', 'objects': [terminal]},
                {'name': 'collision', 'objects': [{'x': 64, 'y': 64, 'width': 32, 'height': 32}]},
                {'name': 'triggers', 'objects': []}]}

    def validate(self):
        validate_transit_network(self.network, self.maps, self.tiled, {'badge_circuito_awarded'}, self.schema)

    def test_valid_network_is_not_mutated(self):
        before = copy.deepcopy((self.network, self.maps, self.tiled))
        self.validate()
        self.assertEqual(before, (self.network, self.maps, self.tiled))

    def test_committed_network_matches_runtime_maps(self):
        maps = {m['id']: m for p in (ROOT / 'content/maps').glob('*.map.json') for m in [json.loads(p.read_text(encoding='utf-8'))]}
        flags = {s['setFlag'] for p in (ROOT / 'content/quests').glob('*.quest.json') for q in [json.loads(p.read_text(encoding='utf-8'))] for s in q['steps']}
        validate_transit(ROOT, maps, flags)

    def test_unknown_map(self):
        self.network['stations'][0]['mapId'] = 'veloria/missing'
        with self.assertRaisesRegex(AssertionError, 'Orphan|Unknown.*map'): self.validate()

    def test_unknown_spawn(self):
        self.network['stations'][0]['spawnPointId'] = 'missing'
        with self.assertRaisesRegex(AssertionError, 'arrival spawn'): self.validate()

    def test_duplicate_station(self):
        self.network['stations'].append(copy.deepcopy(self.network['stations'][0]))
        with self.assertRaisesRegex(AssertionError, 'Duplicate.*ID'): self.validate()

    def test_orphan_terminal(self):
        self.tiled['veloria/alpha']['layers'][0]['objects'][0]['properties'][-1]['value'] = 'missing'
        with self.assertRaisesRegex(AssertionError, 'Orphan'): self.validate()

    def test_duplicate_or_missing_terminal(self):
        objects = self.tiled['veloria/alpha']['layers'][0]['objects']
        objects.append(copy.deepcopy(objects[0]))
        with self.assertRaisesRegex(AssertionError, 'exactly one'): self.validate()
        objects.clear()
        with self.assertRaisesRegex(AssertionError, 'exactly one'): self.validate()

    def test_arrival_must_be_adjacent_and_face_terminal(self):
        spawn = self.maps['veloria/alpha']['spawns'][0]
        spawn['facing'] = 'down'
        with self.assertRaisesRegex(AssertionError, 'adjacent and face'): self.validate()
        spawn.update(y=4, facing='up')
        with self.assertRaisesRegex(AssertionError, 'adjacent and face'): self.validate()

    def test_arrival_cannot_overlap_collision_exit_or_encounter(self):
        for kind in ['collision', 'map-exit', 'encounter-zone']:
            with self.subTest(kind=kind):
                layer = self.tiled['veloria/alpha']['layers'][1 if kind == 'collision' else 2]
                layer['objects'].append({'x': 64, 'y': 96, 'width': 32, 'height': 32, 'properties': [{'name': 'kind', 'value': kind}]})
                with self.assertRaisesRegex(AssertionError, 'arrival overlaps'): self.validate()
                layer['objects'].pop()

    def test_terminal_needs_full_collision(self):
        self.tiled['veloria/alpha']['layers'][1]['objects'][0]['width'] = 16
        with self.assertRaisesRegex(AssertionError, 'full collision'): self.validate()

    def test_unlock_cannot_be_removed_or_reference_unknown_flag(self):
        self.network['requiredFlags'] = ['unknown']
        with self.assertRaisesRegex(AssertionError, 'Circuito'): self.validate()
        self.network['requiredFlags'] = ['badge_circuito_awarded', 'unknown']
        with self.assertRaisesRegex(AssertionError, 'Unknown.*flag'): self.validate()


if __name__ == '__main__':
    unittest.main()
