"""Import supported item evolutions from cached official chains; no network or invented level gates."""
import argparse
import hashlib
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'content/sources/pokeapi'
TARGET = ROOT / 'content/battle/item-evolutions.v1.json'
STONES = ('fire-stone', 'water-stone', 'thunder-stone')
def read(path): return json.loads(path.read_text(encoding='utf-8'))
def build():
    species = read(ROOT / 'content/battle/species.v1.json')['species']
    rules, sources = [], []
    def walk(node):
        parent = int(node['species']['url'].strip('/').split('/')[-1])
        for child in node['evolves_to']:
            target = int(child['species']['url'].strip('/').split('/')[-1])
            if str(parent) in species and str(target) in species:
                for detail in child['evolution_details']:
                    item = (detail.get('item') or {}).get('name')
                    if detail['trigger']['name'] != 'use-item' or item not in STONES: continue
                    # Current data includes regional forms introduced after HGSS.
                    form = (detail.get('required_pokemon_form') or {}).get('name')
                    if form and form != node['species']['name']: continue
                    if detail.get('evolved_pokemon_form') or detail.get('region') or detail.get('location'): continue
                    if int(detail['version_group']['url'].strip('/').split('/')[-1]) > 11: continue
                    keys = ('min_level','gender','held_item','known_move','known_move_type','min_happiness','min_beauty','min_affection','party_species','party_type','relative_physical_stats','trade_species','used_move','min_move_count','min_steps','min_damage_taken','condition_expression')
                    if any(detail.get(key) is not None for key in keys) or detail.get('time_of_day') or any(detail.get(k) for k in ('needs_multiplayer','needs_overworld_rain','turn_upside_down','near_special_rock','allowed_natures')):
                        raise ValueError('Unsupported stone evolution conditions')
                    rule = {'fromSpeciesId': parent, 'toSpeciesId': target, 'itemId': item}
                    if rule not in rules: rules.append(rule)
            walk(child)
    for chain in (10,67):
        path = SOURCE / f'evolution-chain-{chain}.json'
        walk(read(path)['chain'])
        sources.append({'url': f'https://pokeapi.co/api/v2/evolution-chain/{chain}/', 'path': path.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    if len(rules) != 4: raise ValueError('Expected the four registered Pikachu/Eevee stone branches')
    return {'version':1,'versionGroup':'heartgold-soulsilver','rules':sorted(rules,key=lambda r:(r['fromSpeciesId'],r['toSpeciesId'])),'sources':sources}
def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args(argv)
    value=build()
    if args.check:
        if read(TARGET)!=value: raise SystemExit('Item evolution catalog differs from cached source')
    else: TARGET.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Verified four official stone branches with cached source checksums.')


if __name__ == '__main__':
    main()
