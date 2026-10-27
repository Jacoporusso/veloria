import json
import unittest
from tools.build_atlas_quest_targets import OUTPUT, build


class AtlasQuestTargetsTest(unittest.TestCase):
    def test_committed_index_matches_authored_event_sources(self):
        self.assertEqual(json.loads(OUTPUT.read_text(encoding='utf-8')), build())

    def test_crystal_station_uses_actual_tile_contact_and_source_identity(self):
        point = build()['events']['d05/low/read']
        self.assertEqual(len(point), 1)
        self.assertEqual((point[0]['mapId'], point[0]['x'], point[0]['y']), ('veloria/d05_grotte_cristallo', 176, 451))
        self.assertTrue(point[0]['source'].endswith('d05_grotte_cristallo.tmj#object-169'))

    def test_router_objectives_bind_only_to_their_authored_gym(self):
        targets = build()['events']
        for event, map_id in [('gym04/magnetic/aligned', 'veloria/gym04_ferraluce'),
                              ('gym06/reflections/aligned', 'veloria/gym06_acquariva'),
                              ('gym08/convergence/connected', 'veloria/gym08_concordia')]:
            self.assertTrue(targets[event])
            self.assertEqual({point['mapId'] for point in targets[event]}, {map_id})
