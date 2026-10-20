import copy
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from signal_router_validation import validate_signal_router


class SignalRouterValidationTests(unittest.TestCase):
    def setUp(self):
        self.router = json.loads((ROOT / 'content/puzzles/gym04_magnetic.v1.json').read_text(encoding='utf-8'))
        self.tiled = json.loads((ROOT / 'public/tilemaps/gym04_ferraluce.tmj').read_text(encoding='utf-8'))
        self.steps = json.loads((ROOT / 'content/quests/gym04_magnetic.quest.json').read_text(encoding='utf-8'))['steps']

    def test_authored_puzzle_is_consistent(self):
        validate_signal_router(self.router, self.tiled, self.steps)

    def test_dangling_edge_and_wrong_arrow_are_rejected(self):
        for target, direction in [('missing', 'right'), ('first', 'left')]:
            router = copy.deepcopy(self.router)
            router['nodes'][0]['states'][0].update(nextNodeId=target, direction=direction)
            with self.assertRaises(AssertionError):
                validate_signal_router(router, self.tiled, self.steps)

    def test_missing_rotation_control_is_rejected(self):
        layer = next(layer for layer in self.tiled['layers'] if layer['name'] == 'interactions')
        layer['name'] = 'decorations'
        with self.assertRaisesRegex(AssertionError, 'must be interactions'):
            validate_signal_router(self.router, self.tiled, self.steps)
        layer['name'] = 'interactions'
        layer['objects'] = []
        with self.assertRaisesRegex(AssertionError, 'signal control'):
            validate_signal_router(self.router, self.tiled, self.steps)

    def test_unreachable_receiver_is_rejected(self):
        self.router['nodes'][3]['states'][1]['nextNodeId'] = None
        with self.assertRaisesRegex(AssertionError, 'no solution'):
            validate_signal_router(self.router, self.tiled, self.steps)

    def test_unknown_completion_and_outside_map_are_rejected(self):
        with self.assertRaisesRegex(AssertionError, 'quest event'):
            validate_signal_router(self.router, self.tiled, [])
        self.router['nodes'][1]['x'] = self.tiled['width']
        with self.assertRaisesRegex(AssertionError, 'outside map'):
            validate_signal_router(self.router, self.tiled, self.steps)

    def convergence(self):
        self.router['presentation'] = 'convergence'
        self.router['additionalSourceNodeIds'] = ['light']
        self.router['nodes'].append({
            'id': 'light', 'label': 'Luce della rete', 'x': 6, 'y': 14,
            'initialStateId': 'south', 'states': [
                {'id': 'south', 'label': 'Verso il canale condiviso', 'direction': 'down', 'nextNodeId': 'source'}],
        })
        next(layer for layer in self.tiled['layers'] if layer['name'] == 'collision')['objects'].append({
            'x': 6*32, 'y': 14*32, 'width': 32, 'height': 32,
        })

    def test_convergence_constructs_one_shared_configuration_through_shared_switches(self):
        self.convergence()
        validate_signal_router(self.router, self.tiled, self.steps)

    def test_primary_reachability_does_not_hide_an_unreachable_second_source(self):
        self.convergence()
        self.router['nodes'][-1]['states'][0]['nextNodeId'] = None
        with self.assertRaisesRegex(AssertionError, 'no solution for all sources'):
            validate_signal_router(self.router, self.tiled, self.steps)

    def test_duplicate_unknown_or_receiver_sources_are_rejected(self):
        self.convergence()
        for sources in [['source'], ['light', 'light'], ['missing'], ['goal']]:
            with self.subTest(sources=sources):
                self.router['additionalSourceNodeIds'] = sources
                with self.assertRaisesRegex(AssertionError, 'endpoints'):
                    validate_signal_router(self.router, self.tiled, self.steps)

    def test_closed_cycle_with_no_route_to_receiver_is_rejected(self):
        self.convergence()
        # The shared network can circulate through source/first forever, while
        # the receiver still exists and the remaining controls remain valid.
        self.router['nodes'][1]['states'][1].update(nextNodeId='source', direction='left')
        with self.assertRaisesRegex(AssertionError, 'no solution'):
            validate_signal_router(self.router, self.tiled, self.steps)


if __name__ == '__main__':
    unittest.main()
