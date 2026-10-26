import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from validate_pokeapi_artwork import validate_pokeapi_artwork


class OfficialArtworkValidationTests(unittest.TestCase):
    def setUp(self):
        (ROOT / '.tmp').mkdir(exist_ok=True)
        self.folder = tempfile.TemporaryDirectory(dir=ROOT / '.tmp')
        self.root = Path(self.folder.name)
        for path in ['assets', 'public/assets', 'content/battle', 'content/sources/pokeapi']:
            (self.root / path).mkdir(parents=True, exist_ok=True)
        self.write('content/battle/species.v1.json', {'species': {'1': {'speciesId': 1}}})
        self.art = []
        for species_id in [1, 152]:
            url = f'https://example.invalid/official/{species_id}.png'
            source, runtime = f'assets/{species_id}.png', f'assets/{species_id}.webp'
            (self.root / source).write_bytes(b'cached source')
            (self.root / 'public' / runtime).write_bytes(b'cached runtime')
            self.write(f'content/sources/pokeapi/pokemon-{species_id}.json', {
                'id': species_id, 'name': str(species_id), 'sprites': {'other': {'official-artwork': {'front_default': url}}}})
            self.write(f'content/sources/pokeapi/pokemon-species-{species_id}.json', {'names': [{'name': str(species_id), 'language': {'name': 'it'}}]})
            self.art.append({'speciesId': species_id, 'name': str(species_id), 'sourceUrl': url,
                             'sourcePath': source, 'path': runtime,
                             'sourceSha256': hashlib.sha256(b'cached source').hexdigest(),
                             'sha256': hashlib.sha256(b'cached runtime').hexdigest()})
        self.write_manifest()

    def tearDown(self):
        self.folder.cleanup()

    def write(self, path, value):
        (self.root / path).write_text(json.dumps(value), encoding='utf-8')

    def write_manifest(self):
        self.write('assets/pokeapi-test-artwork-v1.json', {'artworks': self.art})

    def test_future_region_reference_is_checked_even_when_not_in_runtime(self):
        self.assertEqual(validate_pokeapi_artwork(self.root), 2)
        (self.root / 'public/assets/152.webp').write_bytes(b'tampered future reference')
        with self.assertRaisesRegex(AssertionError, 'checksum drift'):
            validate_pokeapi_artwork(self.root)

    def test_every_runtime_species_must_have_a_recorded_artwork(self):
        self.write('content/battle/species.v1.json', {'species': {'1': {}, '2': {}}})
        with self.assertRaisesRegex(AssertionError, 'missing official artwork'):
            validate_pokeapi_artwork(self.root)

    def test_source_url_cannot_be_silently_reassigned(self):
        self.art[0]['sourceUrl'] = 'https://example.invalid/unrelated.png'
        self.write_manifest()
        with self.assertRaisesRegex(AssertionError, 'source drift'):
            validate_pokeapi_artwork(self.root)
