import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
TEST_TEMP = ROOT / '.tmp/gen1-reference/unit-test-tmp'
TEST_TEMP.mkdir(parents=True, exist_ok=True)
import cache_gen1_reference as cache


def raw_record(resource_id):
    return json.dumps({'id': resource_id, 'name': f'record-{resource_id}'}, separators=(',', ':')).encode()


def seed_staging(root):
    resources = []
    for kind, resource_id in cache.expected_keys():
        path = f'{cache.STAGING.as_posix()}/{kind}/{resource_id}.json'
        raw = raw_record(resource_id)
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(raw)
        resources.append({
            'kind': kind, 'id': resource_id,
            'url': f'{cache.API}{kind}/{resource_id}/',
            'path': path, 'sha256': hashlib.sha256(raw).hexdigest(), 'source': 'fixture',
        })
    manifest = {
        'version': 1, 'provider': 'PokeAPI',
        'scope': 'Gen I reference resources (pokemon and pokemon-species IDs 1-151)',
        'resources': resources,
    }
    (root / cache.STAGING / 'manifest.json').write_text(json.dumps(manifest), encoding='utf-8')
    return manifest


class Gen1ReferenceCacheTests(unittest.TestCase):
    def test_publish_check_and_fetch_modes_are_mutually_exclusive(self):
        with self.assertRaises(SystemExit):
            cache.main(['--fetch', '--publish-reference'])

    def test_resource_range_and_names_cover_exactly_both_gen1_endpoints(self):
        keys = cache.expected_keys()
        self.assertEqual(len(keys), 302)
        self.assertEqual(keys[:3], [('pokemon', 1), ('pokemon', 2), ('pokemon', 3)])
        self.assertEqual(keys[150], ('pokemon', 151))
        self.assertEqual(keys[151], ('pokemon-species', 1))
        self.assertEqual(keys[-1], ('pokemon-species', 151))
        self.assertEqual(set(cache.KINDS), {'pokemon', 'pokemon-species'})
        with self.assertRaisesRegex(ValueError, 'expected resource id 4'):
            cache.resource_id(raw_record(3), 4, 'fixture')

    def test_stage_copies_canonical_cache_read_only_and_verifies_path_and_hash(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as temporary:
            root = Path(temporary)
            for kind, resource_id in cache.expected_keys():
                (root / cache.CANONICAL / f'{kind}-{resource_id}.json').parent.mkdir(parents=True, exist_ok=True)
                (root / cache.CANONICAL / f'{kind}-{resource_id}.json').write_bytes(raw_record(resource_id))
            canonical_before = hashlib.sha256((root / cache.CANONICAL / 'pokemon-1.json').read_bytes()).hexdigest()
            cached, fetched = cache.stage(root)
            self.assertEqual((cached, fetched), (302, 0))
            self.assertEqual(hashlib.sha256((root / cache.CANONICAL / 'pokemon-1.json').read_bytes()).hexdigest(), canonical_before)
            self.assertEqual(cache.verify_offline(root), 302)
            manifest = json.loads((root / cache.STAGING / 'manifest.json').read_text(encoding='utf-8'))
            entry = next(item for item in manifest['resources'] if item['kind'] == 'pokemon' and item['id'] == 1)
            self.assertEqual(entry['url'], f'{cache.API}pokemon/1/')
            self.assertEqual(entry['path'], '.tmp/gen1-reference/pokemon/1.json')
            self.assertEqual(entry['sha256'], hashlib.sha256(raw_record(1)).hexdigest())
            self.assertEqual(entry['source'], 'canonical-cache')
            staged = root / entry['path']
            staged.write_bytes(json.dumps({'id': 1, 'name': 'tampered'}).encode())
            with self.assertRaisesRegex(ValueError, 'SHA-256 mismatch'):
                cache.verify_offline(root)

    def test_fetch_is_opt_in_and_only_downloads_missing_resource(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as temporary:
            root = Path(temporary)
            missing_kind, missing_id = 'pokemon-species', 151
            for kind, resource_id in cache.expected_keys():
                if (kind, resource_id) == (missing_kind, missing_id):
                    continue
                path = root / cache.CANONICAL / f'{kind}-{resource_id}.json'
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(raw_record(resource_id))
            with self.assertRaisesRegex(ValueError, '1 Gen I resources are missing'):
                cache.stage(root)
            calls = []

            class Response:
                def __init__(self, body): self.body = body
                def __enter__(self): return self
                def __exit__(self, *_): pass
                def read(self): return self.body

            def opener(request, timeout):
                calls.append((request.full_url, timeout))
                return Response(raw_record(missing_id))

            cached, fetched = cache.stage(root, fetch=True, opener=opener, max_workers=1)
            self.assertEqual((cached, fetched), (301, 1))
            self.assertEqual(calls, [(f'{cache.API}{missing_kind}/{missing_id}/', 45)])
            self.assertEqual(cache.verify_offline(root), 302)
            manifest = json.loads((root / cache.STAGING / 'manifest.json').read_text(encoding='utf-8'))
            entry = next(item for item in manifest['resources'] if item['kind'] == missing_kind and item['id'] == missing_id)
            self.assertEqual(entry['source'], 'PokeAPI-fetch')
            self.assertEqual(entry['sha256'], hashlib.sha256(raw_record(missing_id)).hexdigest())

    def test_offline_check_rejects_missing_resource_or_manifest(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as temporary:
            root = Path(temporary)
            with self.assertRaisesRegex(ValueError, 'Missing staging manifest'):
                cache.verify_offline(root)
            (root / cache.STAGING / 'pokemon').mkdir(parents=True)
            (root / cache.STAGING / 'manifest.json').write_text(json.dumps({
                'provider': 'PokeAPI',
                'scope': 'Gen I reference resources (pokemon and pokemon-species IDs 1-151)',
                'resources': [],
            }), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'Expected 302 staging resources'):
                cache.verify_offline(root)

    def test_publish_reference_copies_staged_only_and_verifies_names_offline(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as temporary:
            root = Path(temporary)
            seed_staging(root)
            self.assertEqual(cache.publish_reference(root), 302)
            self.assertEqual(cache.verify_published_offline(root), 302)
            manifest_path = root / cache.PUBLISHED_MANIFEST
            manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
            self.assertEqual(manifest['speciesIds'], list(range(1, 152)))
            self.assertIn('Reference-only', manifest['scope'])
            self.assertEqual(len(manifest['resources']), 302)
            entry = manifest['resources'][0]
            self.assertEqual(entry['path'], 'content/sources/pokeapi/pokemon-1.json')
            self.assertEqual(entry['name'], 'record-1')
            self.assertEqual(entry['url'], f'{cache.API}pokemon/1/')
            entry['name'] = 'wrong-name'
            manifest_path.write_text(json.dumps(manifest), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'Resource name mismatch'):
                cache.verify_published_offline(root)

    def test_publish_refuses_conflicting_canonical_cache_without_overwriting(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as temporary:
            root = Path(temporary)
            seed_staging(root)
            existing = root / cache.CANONICAL / 'pokemon-1.json'
            existing.parent.mkdir(parents=True, exist_ok=True)
            conflicting = json.dumps({'id': 1, 'name': 'different'}).encode()
            existing.write_bytes(conflicting)
            with self.assertRaisesRegex(ValueError, 'refusing to overwrite'):
                cache.publish_reference(root)
            self.assertEqual(existing.read_bytes(), conflicting)
            self.assertFalse((root / cache.PUBLISHED_MANIFEST).exists())

    def test_staging_duplicate_entries_are_rejected_even_with_302_rows(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as temporary:
            root = Path(temporary)
            manifest = seed_staging(root)
            manifest['resources'][-1] = dict(manifest['resources'][0])
            (root / cache.STAGING / 'manifest.json').write_text(json.dumps(manifest), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'Duplicate staging manifest resource'):
                cache.verify_offline(root)


if __name__ == '__main__':
    unittest.main()






