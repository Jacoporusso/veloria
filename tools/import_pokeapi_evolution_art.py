"""Cache official artwork for declared species imports and register WebP runtime assets."""
import argparse
import csv
from datetime import date
import hashlib
import json
from urllib.request import Request, urlopen
from import_pokeapi_battle import ROOT, resource


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def download_artwork(url, source_path, fetch):
    """Download an approved public artwork URL into its independent source cache."""
    if not source_path.exists():
        if not fetch:
            raise ValueError(f'Missing cached artwork: {source_path}')
        source_path.parent.mkdir(parents=True, exist_ok=True)
        with urlopen(Request(url, headers={'User-Agent': 'Veloria-content-import/1.0'}), timeout=45) as response:
            source_path.write_bytes(response.read())
    return source_path


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args(argv)
    imports = json.loads((ROOT / 'content/battle/species-imports.v1.json').read_text(encoding='utf-8'))['imports']
    species = json.loads((ROOT / 'content/battle/species.v1.json').read_text(encoding='utf-8'))['species']
    manifest_path = ROOT / 'assets/pokeapi-evolution-artwork-v1.json'
    previous = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
    artworks, rows = [], []
    for entry in imports:
        if entry.get('artworkGroup', 'evolution') != 'evolution':
            continue
        species_id = entry['speciesId']
        pokemon, _ = resource('pokemon', species_id, args.fetch and not args.check)
        url = pokemon['sprites']['other']['official-artwork']['front_default']
        if not url:
            raise ValueError(f'Missing official artwork for {species_id}')
        source = ROOT / f'assets/sources/pokeapi/evolutions/{species_id}.png'
        runtime_path = f'assets/creatures/pokeapi-evolution-{species_id}-v1.webp'
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
        for suffix, filename, creator in [('', source.relative_to(ROOT / 'assets').as_posix(), 'The Pokemon Company via PokeAPI'),
                                         ('-webp', '../public/' + runtime_path, 'The Pokemon Company via PokeAPI (lossless WebP runtime derivative; original PNG retained)')]:
            rows.append({'asset_id': f'pokeapi-evolution-{species_id}-v1{suffix}', 'filename': filename,
                         'creator': creator, 'source_url': url,
                         'license': 'Image copyright The Pokemon Company; see PokeAPI sprites LICENCE.txt',
                         'usage_permission': 'Private prototype artwork authorized by user 2026-10-17; not a public redistribution clearance', 'status': 'prototype-use'})
    manifest = {'version': 1, 'retrievedAt': previous.get('retrievedAt', date.today().isoformat()),
                'scope': 'Private prototype; follows the user-approved PokeAPI artwork method',
                'rights': 'Image contents copyright The Pokemon Company. PokeAPI hosting does not transfer these rights.',
                'licenseSource': 'https://github.com/PokeAPI/sprites/blob/master/LICENCE.txt', 'artworks': artworks}
    if args.check:
        if previous != manifest:
            raise ValueError('Evolution artwork manifest or checksum drift')
    else:
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        register = ROOT / 'assets/ASSET_REGISTER.csv'
        with register.open(encoding='utf-8-sig', newline='') as handle:
            reader = csv.DictReader(handle)
            columns, registered = reader.fieldnames, {row['asset_id'] for row in reader}
        with register.open('a', encoding='utf-8', newline='') as handle:
            writer = csv.DictWriter(handle, fieldnames=columns, lineterminator='\n')
            writer.writerows(row for row in rows if row['asset_id'] not in registered)
    print(f'Verified {len(artworks)} local evolution artworks and source checksums.')


if __name__ == '__main__':
    main()
