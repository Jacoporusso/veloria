"""Provenance follows actual map bindings as the illustrated world grows."""
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from validate_map_parity_art import validate_map_parity_art


class MapArtProvenanceGrowth(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        manifest = json.loads((ROOT / 'assets/map-parity-v2.json').read_text(encoding='utf-8'))
        record = next(row for row in manifest['artworks'] if row['mapId'] == 'veloria/borgofonte')
        manifest['artworks'] = [record]
        paths = ['assets/ASSET_REGISTER.csv', 'content/maps/borgofonte.map.json',
                 'public/tilemaps/bg_borgofonte.tmj', 'public/sw.js',
                 record['sourcePath'], record['runtimePath']]
        for relative in paths:
            target = self.root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, target)
        (self.root / 'assets/map-parity-v2.json').write_text(json.dumps(manifest), encoding='utf-8')

    def test_accepts_actual_coverage_without_a_fixed_artwork_count(self):
        self.assertEqual(validate_map_parity_art(self.root), 1)

    def test_new_illustrated_map_requires_its_own_provenance(self):
        path = self.root / 'content/maps/new-map.map.json'
        metadata = json.loads((self.root / 'content/maps/borgofonte.map.json').read_text(encoding='utf-8'))
        metadata['id'] = 'veloria/new-map'
        path.write_text(json.dumps(metadata), encoding='utf-8')
        with self.assertRaisesRegex(AssertionError, 'missing artwork provenance.*veloria/new-map'):
            validate_map_parity_art(self.root)

    def test_still_rejects_changed_artwork_bytes(self):
        manifest = json.loads((self.root / 'assets/map-parity-v2.json').read_text(encoding='utf-8'))
        source = self.root / manifest['artworks'][0]['sourcePath']
        source.write_bytes(source.read_bytes() + b'changed')
        with self.assertRaisesRegex(AssertionError, 'checksum mismatch'):
            validate_map_parity_art(self.root)


if __name__ == '__main__':
    unittest.main()
