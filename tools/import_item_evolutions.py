"""Import every Gen I stone branch from the cached, official HGSS evolution reference."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'content/sources/pokeapi'
TARGET = ROOT / 'content/battle/item-evolutions.v1.json'
STONES = {'fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'sun-stone', 'moon-stone'}


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def source_record(path, root=ROOT):
    raw = path.read_bytes()
    stem = path.stem
    resource_id = stem.removeprefix('evolution-chain-') if stem.startswith('evolution-chain-') else stem.removeprefix('item-')
    kind = 'evolution-chain' if stem.startswith('evolution-chain-') else 'item'
    return {'url': f'https://pokeapi.co/api/v2/{kind}/{resource_id}/',
            'path': path.relative_to(root).as_posix(), 'sha256': hashlib.sha256(raw).hexdigest()}


def build(root=ROOT):
    source = root / 'content/sources/pokeapi'
    species = read(root / 'content/battle/species.v1.json')['species']
    if set(map(int, species)) != set(range(1, 152)):
        raise ValueError('Stone evolution import requires the exact Gen I runtime catalog.')
    reference = read(root / 'content/battle/evolution-reference.v1.json')['species']
    imports = read(root / 'content/battle/species-imports.v1.json')['imports']
    if {entry['speciesId'] for entry in imports} != set(range(1, 152)):
        raise ValueError('Stone evolution import requires official imports for IDs 1–151.')
    rules = []
    source_species = set()
    used_items = set()
    for from_id, definition in reference.items():
        source_id = int(from_id)
        if source_id > 151:
            continue
        for edge in definition['evolutions']:
            if edge['targetSpeciesId'] > 151 or edge['trigger'] != 'use-item':
                continue
            item_id = edge.get('itemId')
            if item_id not in STONES:
                raise ValueError(f'Unsupported Gen I item evolution {source_id}->{edge["targetSpeciesId"]}: {edge}')
            rule = {'fromSpeciesId': source_id, 'toSpeciesId': edge['targetSpeciesId'], 'itemId': item_id}
            if rule in rules:
                raise ValueError(f'Duplicate item evolution: {rule}')
            rules.append(rule)
            source_species.add(source_id)
            used_items.add(item_id)

    items = read(root / 'content/items/items.v1.json')['items']
    item_records = {}
    # Numeric and named endpoints can cache the same item. Prefer the named
    # snapshot deterministically, independent of filesystem enumeration order.
    for path in sorted(source.glob('item-*.json')):
        raw = read(path)
        if raw.get('name') in used_items:
            item_records[raw['name']] = (path, raw)
    item_sources = []
    for item_id in sorted(used_items):
        if item_id not in item_records:
            raise ValueError(f'Missing cached official item resource: {item_id}')
        path, raw = item_records[item_id]
        italian = next((name['name'] for name in raw.get('names', []) if name['language']['name'] == 'it'), None)
        if raw['category']['name'] != 'evolution' or not italian or items.get(item_id, {}).get('name') != italian or items[item_id].get('evolutionStone') is not True:
            raise ValueError(f'Evolution item differs from its official source/runtime definition: {item_id}')
        item_sources.append(source_record(path, root))

    chain_ids = set()
    for species_id in source_species:
        raw = read(root / f'content/sources/pokeapi/pokemon-species-{species_id}.json')
        chain_ids.add(int(raw['evolution_chain']['url'].rstrip('/').split('/')[-1]))
    sources = []
    for chain_id in sorted(chain_ids):
        path = source / f'evolution-chain-{chain_id}.json'
        if not path.exists():
            raise ValueError(f'Missing cached official evolution chain: {chain_id}')
        sources.append(source_record(path, root))
    rules.sort(key=lambda rule: (rule['fromSpeciesId'], rule['toSpeciesId']))
    return {'version': 1, 'versionGroup': 'heartgold-soulsilver', 'rules': rules, 'sources': sources,
            'itemSources': item_sources}
def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args(argv)
    value=build()
    if args.check:
        if read(TARGET)!=value: raise SystemExit('Item evolution catalog differs from cached source')
    else: TARGET.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"Verified {len(value['rules'])} official Gen I stone branches with cached source checksums.")


if __name__ == '__main__':
    main()
