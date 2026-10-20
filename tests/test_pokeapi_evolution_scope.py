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
    def test_generation_four_conditions_are_informative_not_runtime_rules(self):
        sources = {
            ('pokemon-species', 215): species_record('sneasel', 109),
            ('pokemon-species', 221): species_record('piloswine', 112),
            ('pokemon-species', 461): species_record('weavile', 109, 4),
            ('pokemon-species', 473): species_record('mamoswine', 112, 4),
            ('item', 303): {'names': [{'name': 'Affilartigli', 'language': {'name': 'it'}}]},
            ('move', 246): {'names': [{'name': 'Forzantica', 'language': {'name': 'it'}}]},
            ('evolution-chain', 109): {'chain': {
                'species': {'name': 'sneasel', 'url': 'https://pokeapi.co/api/v2/pokemon-species/215/'},
                'evolves_to': [edge(461, 'weavile', [level_detail(None, held_item={'url': 'https://pokeapi.co/api/v2/item/303/'}, time_of_day='night')])],
            }},
            ('evolution-chain', 112): {'chain': {
                'species': {'name': 'piloswine', 'url': 'https://pokeapi.co/api/v2/pokemon-species/221/'},
                'evolves_to': [edge(473, 'mamoswine', [level_detail(None, known_move={'url': 'https://pokeapi.co/api/v2/move/246/'})])],
            }},
        }
        entries = build_evolution_entries({'215': {}, '221': {}}, {'id': 10}, lambda kind, key: sources[(kind, key)])
        weavile = entries['215']['evolutions'][0]
        self.assertEqual((weavile['targetSpeciesId'], weavile['heldItemName'], weavile['timeOfDay']), (461, 'Affilartigli', 'night'))
        mamoswine = entries['221']['evolutions'][0]
        self.assertEqual((mamoswine['targetSpeciesId'], mamoswine['knownMoveName']), (473, 'Forzantica'))
        self.assertIsNone(weavile['minimumLevel'])
        self.assertIsNone(mamoswine['minimumLevel'])

    def test_generation_five_target_is_excluded_before_parsing_its_conditions(self):
        sources = {
            ('pokemon-species', 1): species_record('fixture', 1),
            ('pokemon-species', 500): species_record('future', 1, 5),
            ('evolution-chain', 1): {'chain': {
                'species': {'url': 'https://pokeapi.co/api/v2/pokemon-species/1/'},
                'evolves_to': [edge(500, 'future', [level_detail(turn_upside_down=True)])],
            }},
        }
        self.assertEqual(build_evolution_entries({'1': {}}, {'id': 10}, lambda kind, key: sources[(kind, key)])['1']['evolutions'], [])

    def test_generation_four_target_with_unknown_condition_fails_closed(self):
        sources = {
            ('pokemon-species', 221): species_record('piloswine', 112),
            ('pokemon-species', 473): species_record('mamoswine', 112, 4),
            ('evolution-chain', 112): {'chain': {
                'species': {'url': 'https://pokeapi.co/api/v2/pokemon-species/221/'},
                'evolves_to': [edge(473, 'mamoswine', [level_detail(None, turn_upside_down=True)])],
            }},
        }
        with self.assertRaisesRegex(ValueError, 'Unsupported evolution conditions for 221'):
            build_evolution_entries({'221': {}}, {'id': 10}, lambda kind, key: sources[(kind, key)])

    def test_cached_official_reference_restores_magnezone_and_eevee_without_runtime_expansion(self):
        import json
        from import_pokeapi_battle import resource
        progression_path = ROOT / 'content/battle/progression.v1.json'
        before = progression_path.read_bytes()
        registry = json.loads((ROOT / 'content/battle/species.v1.json').read_text(encoding='utf-8'))['species']
        entries = build_evolution_entries(registry, resource('version-group', 'heartgold-soulsilver')[0], lambda kind, key: resource(kind, key)[0])
        magnezone = entries['82']['evolutions']
        self.assertEqual([entry['targetSpeciesId'] for entry in magnezone], [462])
        self.assertEqual(magnezone[0]['locationName'], 'Mt. Coronet')
        eevee = {entry['targetSpeciesId']: entry for entry in entries['133']['evolutions']}
        self.assertEqual(set(eevee), {134, 135, 136, 196, 197, 470, 471})
        self.assertTrue(eevee[470]['nearSpecialRock'])
        self.assertTrue(eevee[471]['nearSpecialRock'])
        self.assertNotIn(700, eevee)
        self.assertEqual(entries['221']['evolutions'][0]['knownMoveName'], 'Forzantica')
        self.assertEqual(entries['215']['evolutions'][0]['heldItemName'], 'Affilartigli')
        rules = json.loads(before)['evolutions']
        self.assertTrue(all(rule['toSpeciesId'] <= 251 for rule in rules))
        for rule in rules:
            self.assertTrue(any(entry['targetSpeciesId'] == rule['toSpeciesId'] and entry['minimumLevel'] == rule['minimumLevel'] for entry in entries[str(rule['fromSpeciesId'])]['evolutions']))
        self.assertEqual(progression_path.read_bytes(), before)


if __name__ == '__main__':
    unittest.main()
