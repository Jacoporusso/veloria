import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from import_pokeapi_evolutions import build_evolution_entries


def species_record(name, chain_id, generation=2):
    return {
        'name': name,
        'generation': {'url': f'https://pokeapi.co/api/v2/generation/{generation}/'},
        'evolution_chain': {'url': f'https://pokeapi.co/api/v2/evolution-chain/{chain_id}/'},
        'names': [{'name': name.title(), 'language': {'name': 'it'}}],
    }


def edge(target_id, target_name, details):
    return {
        'species': {'name': target_name, 'url': f'https://pokeapi.co/api/v2/pokemon-species/{target_id}/'},
        'evolution_details': details,
        'evolves_to': [],
    }


def level_detail(level=33, **extra):
    return {
        'trigger': {'name': 'level-up'}, 'min_level': level, 'item': None,
        'location': None, 'near_special_rock': False, 'held_item': None,
        'min_happiness': None, 'time_of_day': '', 'version_group': None,
        'is_default': True, 'required_pokemon_form': None,
        'evolved_pokemon_form': None, **extra,
    }


class EvolutionScopeTests(unittest.TestCase):
    def test_mamoswine_and_weavile_edges_skip_conditions_but_keep_chain_urls(self):
        sources = {
            ('pokemon-species', 215): species_record('sneasel', 109),
            ('pokemon-species', 221): species_record('piloswine', 112),
            ('evolution-chain', 109): {'chain': {
                'species': {'name': 'sneasel', 'url': 'https://pokeapi.co/api/v2/pokemon-species/215/'},
                'evolves_to': [edge(461, 'weavile', [level_detail(None, turn_upside_down=True)])],
            }},
            ('evolution-chain', 112): {'chain': {
                'species': {'name': 'swinub', 'url': 'https://pokeapi.co/api/v2/pokemon-species/220/'},
                'evolves_to': [{'species': {'name': 'piloswine', 'url': 'https://pokeapi.co/api/v2/pokemon-species/221/'},
                    'evolution_details': [level_detail()], 'evolves_to': [edge(473, 'mamoswine', [level_detail(None, known_move={'name': 'ancient-power'})])]}],
            }},
        }
        loaded = []

        def load(kind, key):
            loaded.append((kind, key))
            return sources[(kind, key)]

        entries = build_evolution_entries({'215': {}, '221': {}}, {'id': 15}, load)
        self.assertEqual(entries['215']['evolutions'], [])
        self.assertEqual(entries['221']['evolutions'], [])
        self.assertNotIn(('pokemon-species', 461), loaded)
        self.assertNotIn(('pokemon-species', 473), loaded)
        self.assertEqual(sources[('evolution-chain', 109)]['chain']['evolves_to'][0]['species']['url'],
                         'https://pokeapi.co/api/v2/pokemon-species/461/')
        self.assertEqual(sources[('evolution-chain', 112)]['chain']['evolves_to'][0]['evolves_to'][0]['species']['url'],
                         'https://pokeapi.co/api/v2/pokemon-species/473/')

    def test_supported_in_scope_level_evolution_is_kept(self):
        sources = {
            ('pokemon-species', 220): species_record('swinub', 112),
            ('pokemon-species', 221): species_record('piloswine', 112),
            ('evolution-chain', 112): {'chain': {
                'species': {'name': 'swinub', 'url': 'https://pokeapi.co/api/v2/pokemon-species/220/'},
                'evolves_to': [edge(221, 'piloswine', [level_detail()])],
            }},
        }
        entries = build_evolution_entries({'220': {}}, {'id': 15}, lambda kind, key: sources[(kind, key)])
        self.assertEqual(entries['220']['evolutions'][0]['targetSpeciesId'], 221)
        self.assertEqual(entries['220']['evolutions'][0]['minimumLevel'], 33)

    def test_unsupported_conditions_for_in_scope_target_still_fail_closed(self):
        sources = {
            ('pokemon-species', 220): species_record('swinub', 112),
            ('pokemon-species', 221): species_record('piloswine', 112),
            ('evolution-chain', 112): {'chain': {
                'species': {'name': 'swinub', 'url': 'https://pokeapi.co/api/v2/pokemon-species/220/'},
                'evolves_to': [edge(221, 'piloswine', [level_detail(known_move={'name': 'ancient-power'})])],
            }},
        }
        with self.assertRaisesRegex(ValueError, 'Unsupported evolution conditions for 220'):
            build_evolution_entries({'220': {}}, {'id': 15}, lambda kind, key: sources[(kind, key)])


if __name__ == '__main__':
    unittest.main()
