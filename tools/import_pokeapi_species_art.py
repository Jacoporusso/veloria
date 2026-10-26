"""Cache approved official artwork for declared species import groups."""
import argparse
import csv
from datetime import date
import json
import re
from urllib.parse import urlparse

from import_pokeapi_battle import ROOT, resource
from import_pokeapi_evolution_art import digest, download_artwork


GROUP_PATTERN = re.compile(r'^[a-z][a-z0-9-]*$')


def validate_group(group):
    """Return a safe artwork group name or raise ValueError."""
    if not isinstance(group, str) or not GROUP_PATTERN.fullmatch(group):
        raise ValueError(f'Invalid artwork group: {group!r}')
    return group


def artwork_group_paths(group, species_id):
    """Return manifest, source, and runtime paths for a species artwork group."""
    group = validate_group(group)
    if not isinstance(species_id, int) or isinstance(species_id, bool) or species_id <= 0:
        raise ValueError(f'Invalid species ID: {species_id!r}')
    runtime_path = f'assets/creatures/pokeapi-{group}-{species_id}-v1.webp'
    return {
        'manifest': f'assets/pokeapi-{group}-artwork-v1.json',
        'source': f'assets/sources/pokeapi/{group}/{species_id}.png',
        'runtime': runtime_path,
        'asset_ids': (f'pokeapi-{group}-{species_id}-v1', f'pokeapi-{group}-{species_id}-v1-webp'),
    }


def select_group_imports(imports, group):
    """Select species imports explicitly assigned to group, requiring a match."""
    group = validate_group(group)
    selected = [entry for entry in imports if entry.get('artworkGroup') == group]
    if not selected:
        raise ValueError(f'No species imports found for artwork group {group!r}')
    return selected


def parse_species_ids(value):
    """Explicit media batches are independent of habitat/import grouping."""
    try:
        ids = [int(part.strip()) for part in value.split(',')]
    except ValueError as error:
        raise argparse.ArgumentTypeError('Species IDs must be comma-separated integers') from error
    if not ids or any(species_id <= 0 for species_id in ids) or len(set(ids)) != len(ids):
        raise argparse.ArgumentTypeError('Species IDs must be positive and unique')
    return ids


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--group', default='urban', help='species artwork group (default: urban)')
    parser.add_argument('--species-ids', type=parse_species_ids,
                        help='explicit complete media batch, independent of species import groups')
    parser.add_argument('--fetch', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args(argv)
    group = validate_group(args.group)
    imports = json.loads((ROOT / 'content/battle/species-imports.v1.json').read_text(encoding='utf-8'))['imports']
    group_imports = ([{'speciesId': species_id} for species_id in args.species_ids]
                     if args.species_ids else select_group_imports(imports, group))
    species = json.loads((ROOT / 'content/battle/species.v1.json').read_text(encoding='utf-8'))['species']
    manifest_rel = artwork_group_paths(group, group_imports[0]['speciesId'])['manifest']
    manifest_path = ROOT / manifest_rel
    previous = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
    artworks, rows = [], []
    for entry in group_imports:
        species_id = entry['speciesId']
        if str(species_id) not in species:
            raise ValueError(f'Species parameters are not imported for {group} artwork {species_id}')
        pokemon, _ = resource('pokemon', species_id, args.fetch and not args.check)
        url = pokemon['sprites']['other']['official-artwork']['front_default']
        if not url or urlparse(url).scheme != 'https':
            raise ValueError(f'Missing HTTPS official artwork URL for {species_id}')
        paths = artwork_group_paths(group, species_id)
        source = ROOT / paths['source']
        runtime_path = paths['runtime']
        runtime = ROOT / 'public' / runtime_path
        download_artwork(url, source, args.fetch and not args.check)
        if not args.check:
            from PIL import Image
            with Image.open(source) as artwork:
                artwork.convert('RGBA').save(runtime, 'WEBP', lossless=True, method=6)
        if not runtime.exists():
            raise ValueError(f'Missing runtime artwork: {runtime}')
        artworks.append({'speciesId': species_id, 'name': species[str(species_id)]['name'], 'path': runtime_path,
                         'sourceUrl': url, 'sourcePath': source.relative_to(ROOT).as_posix(),
                         'sourceSha256': digest(source), 'sha256': digest(runtime)})
        for asset_id, filename, creator in [
                (paths['asset_ids'][0], source.relative_to(ROOT / 'assets').as_posix(), 'The Pokemon Company via PokeAPI'),
                (paths['asset_ids'][1], '../public/' + runtime_path,
                 'The Pokemon Company via PokeAPI (lossless WebP runtime derivative; original PNG retained)')]:
            rows.append({'asset_id': asset_id, 'filename': filename,
                         'creator': creator, 'source_url': url,
                         'license': 'Image copyright The Pokemon Company; see PokeAPI sprites LICENCE.txt',
                         'usage_permission': 'Private prototype artwork authorized by user 2026-10-18; not a public redistribution clearance',
                         'status': 'prototype-use'})
    manifest = {'version': 1, 'retrievedAt': previous.get('retrievedAt', date.today().isoformat()),
                'scope': f'Private prototype {group}-species artwork; follows the user-approved PokeAPI artwork method',
                'rights': 'Image contents copyright The Pokemon Company. PokeAPI hosting does not transfer these rights.',
                'licenseSource': 'https://github.com/PokeAPI/sprites/blob/master/LICENCE.txt', 'artworks': artworks}
    if args.check:
        if previous != manifest:
            raise ValueError(f'{group.capitalize()} artwork manifest or checksum drift')
    else:
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        register = ROOT / 'assets/ASSET_REGISTER.csv'
        with register.open(encoding='utf-8-sig', newline='') as handle:
            reader = csv.DictReader(handle)
            columns, registered = reader.fieldnames, {row['asset_id'] for row in reader}
        with register.open('a', encoding='utf-8', newline='') as handle:
            writer = csv.DictWriter(handle, fieldnames=columns, lineterminator='\n')
            writer.writerows(row for row in rows if row['asset_id'] not in registered)
    print(f"{'Verified' if args.check else 'Imported'} {len(artworks)} local {group} artworks and source checksums.")


if __name__ == '__main__':
    main()
