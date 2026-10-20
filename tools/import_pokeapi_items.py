"""Import supported medicine from cached PokéAPI item and price sources."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from pathlib import Path
from urllib.request import Request, urlopen

from import_pokeapi_battle import ROOT, SOURCE, resource

VERSION_GROUP = 'heartgold-soulsilver'
PRICE_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/items.csv'
ITEMS = ('super-potion', 'hyper-potion', 'paralyze-heal')
MAX_STACK = 99


def normalize_flavor(text: str) -> str:
    """Normalize upstream line wraps without rewriting the source wording."""
    return re.sub(r'\s+', ' ', text).strip()


def flavor_text(raw: dict, language: str, version_group: str) -> str | None:
    entries = [entry for entry in raw.get('flavor_text_entries', [])
               if entry.get('language', {}).get('name') == language
               and entry.get('version_group', {}).get('name') == version_group]
    return normalize_flavor(entries[0]['text']) if entries else None


def parse_item(raw: dict, slug: str, cost: int, version_group: str = VERSION_GROUP) -> dict:
    """Derive one runtime medicine entry only from explicit source text."""
    if raw.get('name') != slug:
        raise ValueError(f'Expected item {slug!r}, got {raw.get("name")!r}')
    if not isinstance(cost, int) or isinstance(cost, bool) or cost < 0:
        raise ValueError(f'Invalid PokéAPI cost for {slug}: {cost!r}')
    names = [entry['name'] for entry in raw.get('names', [])
             if entry.get('language', {}).get('name') == 'it']
    if not names:
        raise ValueError(f'Missing official Italian name for {slug}')

    effect = flavor_text(raw, 'en', version_group)
    if not effect:
        raise ValueError(f'Missing English {version_group} flavor text for {slug}')
    battle: dict
    if slug in {'super-potion', 'hyper-potion'}:
        amount = re.search(r'\bby\s+(\d+)\s+points?\b', effect, flags=re.IGNORECASE)
        if not amount:
            raise ValueError(f'No explicit HP amount in {version_group} flavor text for {slug}: {effect!r}')
        battle = {'healHp': int(amount.group(1))}
    elif slug == 'paralyze-heal':
        if not re.search(r'paralys', effect, flags=re.IGNORECASE):
            raise ValueError(f'No paralysis effect in {version_group} flavor text for {slug}: {effect!r}')
        battle = {'cures': ['paralysis']}
    else:
        raise ValueError(f'Unsupported item slug: {slug}')

    item = {'id': slug, 'name': names[0], 'price': cost, 'maxStack': MAX_STACK, 'battle': battle}
    description = flavor_text(raw, 'it', version_group)
    if description:
        item['description'] = description
    return item


def read_costs(path: Path) -> dict[str, int]:
    with path.open(encoding='utf-8', newline='') as handle:
        rows = csv.DictReader(handle)
        if not rows.fieldnames or not {'identifier', 'cost'} <= set(rows.fieldnames):
            raise ValueError(f'PokéAPI item costs CSV lacks identifier/cost columns: {path}')
        costs = {}
        for row in rows:
            if row['identifier'] in ITEMS:
                try:
                    costs[row['identifier']] = int(row['cost'])
                except (TypeError, ValueError) as error:
                    raise ValueError(f'Missing or invalid PokéAPI cost for {row["identifier"]!r}') from error
    missing = set(ITEMS) - set(costs)
    if missing:
        raise ValueError(f'PokéAPI item costs CSV lacks requested items: {sorted(missing)}')
    return costs


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_prices(fetch: bool) -> tuple[Path, dict[str, int]]:
    path = SOURCE / 'items.csv'
    if not path.exists():
        if not fetch:
            raise ValueError(f'Missing cached PokéAPI item costs: {path}. Run with --fetch.')
        path.parent.mkdir(parents=True, exist_ok=True)
        with urlopen(Request(PRICE_URL, headers={'User-Agent': 'Veloria-content-import/1.0'}), timeout=45) as response:
            path.write_bytes(response.read())
    return path, read_costs(path)


def build_outputs(existing: dict, resources: dict, cost_path: Path, costs: dict[str, int]) -> tuple[dict, dict]:
    """Build catalog and provenance without mutating caller-owned data."""
    catalog = json.loads(json.dumps(existing, ensure_ascii=False))
    if not isinstance(catalog.get('items'), dict):
        raise ValueError('Items catalog must contain an items object')
    derived = {}
    for slug in ITEMS:
        raw = resources[slug]['raw']
        item = parse_item(raw, slug, costs[slug])
        catalog['items'][slug] = item
        derived[slug] = {
            'source': resources[slug]['origin'],
            'selectedVersionGroup': VERSION_GROUP,
            'englishEffectFlavor': flavor_text(raw, 'en', VERSION_GROUP),
            'italianDescriptionFlavor': flavor_text(raw, 'it', VERSION_GROUP),
            'derivedFields': item,
            'priceSource': 'PokéAPI items.csv cost; current source value used as a prototype economy price, not asserted as HGSS price.',
        }
    cost_manifest = {
        'url': PRICE_URL,
        'path': cost_path.relative_to(ROOT).as_posix(),
        'sha256': sha256(cost_path),
        'selectedField': 'cost',
        'note': 'Current PokéAPI source cost is used for prototype economy; this value is not versioned as an HGSS price.',
    }
    manifest = {
        'version': 1,
        'provider': 'PokeAPI',
        'selectedVersionGroup': VERSION_GROUP,
        'rightsNote': 'Source data attributed to PokéAPI; upstream game names and flavor text remain the property of their respective rights holders.',
        'priceSource': cost_manifest,
        'items': derived,
    }
    return catalog, manifest


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true', help='Download missing item and cost sources.')
    parser.add_argument('--check', action='store_true', help='Verify generated catalog and manifest without writing or accessing the network.')
    args = parser.parse_args(argv)

    costs_path, costs = load_prices(args.fetch and not args.check)
    resources = {}
    for slug in ITEMS:
        raw, origin = resource('item', slug, args.fetch and not args.check)
        resources[slug] = {'raw': raw, 'origin': origin}

    catalog_path = ROOT / 'content/items/items.v1.json'
    manifest_path = SOURCE / 'item-manifest.json'
    existing = json.loads(catalog_path.read_text(encoding='utf-8'))
    catalog, manifest = build_outputs(existing, resources, costs_path, costs)
    outputs = {catalog_path: catalog, manifest_path: manifest}
    for path, value in outputs.items():
        rendered = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
        if args.check:
            if not path.exists() or path.read_text(encoding='utf-8') != rendered:
                raise ValueError(f'Stale generated item data: {path.relative_to(ROOT)}')
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(rendered, encoding='utf-8')
    print(f"{'Verified' if args.check else 'Imported'} {len(ITEMS)} medicine items from cached PokéAPI HGSS flavor and current cost sources.")


if __name__ == '__main__':
    main()
