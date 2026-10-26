"""Import legal Gen IV slot-1 abilities for the registered regional species."""
import argparse
import json
from pathlib import Path

from import_pokeapi_battle import ROOT, SOURCE, resource

GENERATION = 4
BATTLE_SCOPE_POLICY = ('Battle effects follow HGSS mechanics in Veloria single battles: Lightning Rod only redirects Electric moves in doubles, so it supplies no single-battle immunity or Special Attack boost; Stench has no HGSS battle effect; Illuminate and Pickup are out-of-battle-only effects.')


def ability_by_slot(raw, slot):
    candidates = []
    for snapshot in raw.get('past_abilities', []):
        generation = int(snapshot['generation']['url'].rstrip('/').split('/')[-1])
        if generation < GENERATION:
            continue
        for entry in snapshot.get('abilities', []):
            if entry['slot'] == slot:
                ability = entry.get('ability')
                candidates.append((generation, ability.get('name') if ability else None))
    if candidates:
        return min(candidates)[1]
    return next((entry['ability']['name'] for entry in raw['abilities'] if entry['slot'] == slot and entry.get('ability')), None)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args(argv)
    species_path = ROOT / 'content/battle/species.v1.json'
    species_data = json.loads(species_path.read_text(encoding='utf-8'))
    species = species_data['species']
    if set(map(int, species)) != set(range(1, 152)):
        raise ValueError('Ability import requires the exact registered Gen I roster.')

    resources = {}
    abilities = {}
    choices = {}

    def get(kind, key):
        raw, origin = resource(kind, key, args.fetch and not args.check)
        resources[f'{kind}/{key}'] = origin
        return raw

    selected_order = get('version-group', 'heartgold-soulsilver')['order']
    for species_id in range(1, 152):
        pokemon = get('pokemon', species_id)
        ability_name = ability_by_slot(pokemon, 1)
        if not ability_name:
            raise ValueError(f'No official legal slot-1 ability for species {species_id}.')
        ability = get('ability', ability_name)
        ability_id = ability['name']
        choices[str(species_id)] = ability_id
        names = ability.get('names', [])
        historical_effects = []
        for change in ability.get('effect_changes', []):
            version_group = change['version_group']['name']
            order = get('version-group', version_group)['order']
            if order <= selected_order:
                historical_effects.append((order, change.get('effect_entries', [])))
        effects = max(historical_effects, key=lambda entry: entry[0])[1] if historical_effects else ability.get('effect_entries', [])
        english_effect = next((entry for entry in effects if entry['language']['name'] == 'en'), None)
        italian_effect = next((entry for entry in effects if entry['language']['name'] == 'it'), None)
        english_name = next((entry['name'] for entry in names if entry['language']['name'] == 'en'), ability_id.replace('-', ' ').title())
        italian_name = next((entry['name'] for entry in names if entry['language']['name'] == 'it'), english_name)
        if not english_effect:
            raise ValueError(f'Ability {ability_id} has no official English effect entry.')
        italian_flavor = [entry for entry in ability.get('flavor_text_entries', []) if entry.get('language', {}).get('name') == 'it']
        description_it = next((entry for entry in italian_flavor
                               if entry.get('version_group', {}).get('name') == 'heartgold-soulsilver'), None)
        if description_it is None:
            fallback_flavors = []
            for entry in italian_flavor:
                group_name = entry.get('version_group', {}).get('name')
                if group_name not in {'platinum', 'diamond-pearl'}:
                    continue
                group = get('version-group', group_name)
                if group.get('generation', {}).get('name') == 'generation-iv':
                    fallback_flavors.append((group['order'], entry))
            if fallback_flavors:
                description_it = max(fallback_flavors, key=lambda item: item[0])[1]
        italian_description = ' '.join(description_it['flavor_text'].split()) if description_it else None
        description_group = description_it['version_group']['name'] if description_it else None
        abilities[ability_id] = {
            'id': ability_id,
            'name': italian_name,
            'englishName': english_name,
            'effect': english_effect['effect'],
            **({'shortEffect': english_effect['short_effect']} if english_effect.get('short_effect') else {}),
            **({'shortEffectIt': italian_effect['short_effect'], 'effectIt': italian_effect['effect']} if italian_effect else {}),
            **({'descriptionIt': italian_description, 'descriptionItSourceVersionGroup': description_group} if italian_description else {}),
        }

    manifest = {
        'versionGroup': 'heartgold-soulsilver',
        'generation': GENERATION,
        'selectionPolicy': 'Each species receives its official non-hidden slot-1 ability; this is the deterministic Veloria prototype ability-selection rule.',
        'battleScopePolicy': BATTLE_SCOPE_POLICY,
        'resources': dict(sorted(resources.items())),
    }
    ability_path = ROOT / 'content/battle/abilities.v1.json'
    manifest_path = SOURCE / 'ability-manifest.json'
    expected_species = {species_id: {'defaultAbilityId': ability_id} for species_id, ability_id in choices.items()}
    if args.check:
        old_abilities = json.loads(ability_path.read_text(encoding='utf-8'))
        if old_abilities != {'version': 1, 'source': 'PokeAPI', 'selectionPolicy': manifest['selectionPolicy'], 'battleScopePolicy': BATTLE_SCOPE_POLICY, 'abilities': dict(sorted(abilities.items()))}:
            raise ValueError('Ability registry drift.')
        old_manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        if old_manifest != manifest:
            raise ValueError('Ability source manifest drift.')
        for species_id, fields in expected_species.items():
            if any(species[species_id].get(key) != value for key, value in fields.items()):
                raise ValueError(f'Ability choice drift for species {species_id}.')
    else:
        for species_id, fields in expected_species.items():
            species[species_id].update(fields)
        species_path.write_text(json.dumps(species_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        ability_path.write_text(json.dumps({'version': 1, 'source': 'PokeAPI', 'selectionPolicy': manifest['selectionPolicy'], 'battleScopePolicy': BATTLE_SCOPE_POLICY, 'abilities': dict(sorted(abilities.items()))}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"Verified slot-1 abilities for {len(choices)} species ({len(abilities)} unique ability resources).")


if __name__ == '__main__':
    main()
