"""Verify recorded official media independently from a region's live roster.

Retained reference artwork for future regions is still checked; changing the
playable catalog must not rewrite its import batch or weaken provenance.
"""
import hashlib
import json
from pathlib import Path


def validate_pokeapi_artwork(root: Path):
    root = root.resolve()
    registered = set()
    count = 0
    for manifest in sorted((root / 'assets').glob('pokeapi-*-artwork-v1.json')):
        data = json.loads(manifest.read_text(encoding='utf-8'))
        for art in data['artworks']:
            species_id = art['speciesId']
            if species_id in registered:
                raise AssertionError(f'Duplicate official artwork for species {species_id}')
            registered.add(species_id)
            source_data = json.loads((root / f'content/sources/pokeapi/pokemon-{species_id}.json').read_text(encoding='utf-8'))
            if source_data['id'] != species_id or art['sourceUrl'] != source_data['sprites']['other']['official-artwork']['front_default']:
                raise AssertionError(f'Official artwork source drift: {species_id}')
            species_data = json.loads((root / f'content/sources/pokeapi/pokemon-species-{species_id}.json').read_text(encoding='utf-8'))
            names = {source_data['name'].casefold(), *[entry['name'].casefold() for entry in species_data['names']
                                                    if entry['language']['name'] == 'it']}
            if art['name'].casefold() not in names:
                raise AssertionError(f'Official artwork name drift: {species_id}')
            for field, checksum in [('sourcePath', 'sourceSha256'), ('path', 'sha256')]:
                path = (root / art[field] if field == 'sourcePath' else root / 'public' / art[field]).resolve()
                if not path.is_relative_to(root) or not path.is_file():
                    raise AssertionError(f'Missing or escaped artwork {species_id}: {path}')
                if hashlib.sha256(path.read_bytes()).hexdigest() != art[checksum]:
                    raise AssertionError(f'Artwork checksum drift {species_id}: {field}')
            count += 1
    species = json.loads((root / 'content/battle/species.v1.json').read_text(encoding='utf-8'))['species']
    missing = set(map(int, species)) - registered
    if missing:
        raise AssertionError(f'Runtime species missing official artwork: {sorted(missing)}')
    return count
