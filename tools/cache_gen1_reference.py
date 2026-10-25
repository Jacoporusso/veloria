"""Stage Gen I PokéAPI reference responses without touching runtime or canonical caches.

Network access is opt-in with --fetch. Cached canonical responses are read-only inputs;
all outputs are confined to .tmp/gen1-reference/.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
from typing import Callable
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = Path('content/sources/pokeapi')
STAGING = Path('.tmp/gen1-reference')
PUBLISHED_MANIFEST = CANONICAL / 'gen1-reference-manifest.json'
API = 'https://pokeapi.co/api/v2/'
KINDS = ('pokemon', 'pokemon-species')
IDS = range(1, 152)
USER_AGENT = 'Veloria-Gen1-reference-cache/1.0'


def resource_id(raw: bytes, expected_id: int, label: str) -> None:
    try:
        value = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ValueError(f'{label}: invalid JSON') from error
    if not isinstance(value, dict) or value.get('id') != expected_id:
        raise ValueError(f'{label}: expected resource id {expected_id}, got {value.get("id") if isinstance(value, dict) else None}')


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def fetch_resource(kind: str, pokemon_id: int, opener: Callable = urlopen) -> bytes:
    url = f'{API}{kind}/{pokemon_id}/'
    request = Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/json'})
    with opener(request, timeout=45) as response:
        raw = response.read()
    resource_id(raw, pokemon_id, f'{kind}/{pokemon_id}')
    return raw


def expected_keys() -> list[tuple[str, int]]:
    return [(kind, pokemon_id) for kind in KINDS for pokemon_id in IDS]


def verify_offline(root: Path) -> int:
    manifest_path = root / STAGING / 'manifest.json'
    if not manifest_path.is_file():
        raise ValueError(f'Missing staging manifest: {manifest_path}')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if manifest.get('provider') != 'PokeAPI' or manifest.get('scope') != 'Gen I reference resources (pokemon and pokemon-species IDs 1-151)':
        raise ValueError('Staging manifest provider/scope does not match this cache.')
    entries = manifest.get('resources')
    if not isinstance(entries, list):
        raise ValueError('Staging manifest resources must be a list.')
    by_key = _unique_resource_entries(entries, 'staging')
    for kind, pokemon_id in expected_keys():
        key = (kind, pokemon_id)
        entry = by_key.get(key)
        rel = f'{STAGING.as_posix()}/{kind}/{pokemon_id}.json'
        path = root / rel
        url = f'{API}{kind}/{pokemon_id}/'
        if entry is None or entry.get('path') != rel or entry.get('url') != url:
            raise ValueError(f'Missing or invalid manifest entry: {kind}/{pokemon_id}')
        if not path.is_file():
            raise ValueError(f'Missing staged resource: {path}')
        raw = path.read_bytes()
        resource_id(raw, pokemon_id, f'{kind}/{pokemon_id}')
        if entry.get('sha256') != digest(raw):
            raise ValueError(f'SHA-256 mismatch: {path}')
    return len(by_key)


def _unique_resource_entries(entries: object, label: str) -> dict[tuple[object, object], dict]:
    if not isinstance(entries, list) or len(entries) != len(expected_keys()):
        raise ValueError(f'Expected {len(expected_keys())} {label} resources with no duplicates.')
    by_key: dict[tuple[object, object], dict] = {}
    for entry in entries:
        if not isinstance(entry, dict):
            raise ValueError(f'{label} manifest entries must be objects.')
        key = (entry.get('kind'), entry.get('id'))
        if key in by_key:
            raise ValueError(f'Duplicate {label} manifest resource: {key[0]}/{key[1]}')
        by_key[key] = entry
    if set(by_key) != set(expected_keys()):
        raise ValueError(f'{label} manifest must list each pokemon and pokemon-species ID 1-151 exactly once.')
    return by_key


def publish_reference(root: Path) -> int:
    """Promote staged responses into canonical reference sources; never run implicitly."""
    verify_offline(root)
    staging_manifest = json.loads((root / STAGING / 'manifest.json').read_text(encoding='utf-8'))
    entries = _unique_resource_entries(staging_manifest.get('resources'), 'staging')
    canonical_entries = []
    missing_canonical: list[tuple[Path, bytes]] = []
    for kind, pokemon_id in expected_keys():
        staged_entry = entries[(kind, pokemon_id)]
        staged_path = root / staged_entry['path']
        raw = staged_path.read_bytes()
        canonical_rel = f'{CANONICAL.as_posix()}/{kind}-{pokemon_id}.json'
        canonical_path = root / canonical_rel
        expected_hash = digest(raw)
        if canonical_path.exists():
            if digest(canonical_path.read_bytes()) != expected_hash:
                raise ValueError(f'Canonical cache conflict; refusing to overwrite {canonical_path}.')
        else:
            missing_canonical.append((canonical_path, raw))
        value = json.loads(raw)
        name = value.get('name')
        if not isinstance(name, str) or not name:
            raise ValueError(f'Missing resource name: {kind}/{pokemon_id}')
        canonical_entries.append({
            'kind': kind, 'id': pokemon_id, 'name': name,
            'url': f'{API}{kind}/{pokemon_id}/', 'path': canonical_rel, 'sha256': expected_hash,
        })
    for canonical_path, raw in missing_canonical:
        canonical_path.parent.mkdir(parents=True, exist_ok=True)
        canonical_path.write_bytes(raw)
    manifest = {
        'version': 1,
        'provider': 'PokeAPI',
        'scope': 'Reference-only Gen I baseline; species IDs 1-151; not a runtime registration.',
        'speciesIds': list(IDS),
        'resources': canonical_entries,
    }
    target = root / PUBLISHED_MANIFEST
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return len(canonical_entries)


def verify_published_offline(root: Path) -> int:
    manifest_path = root / PUBLISHED_MANIFEST
    if not manifest_path.is_file():
        raise ValueError(f'Missing published reference manifest: {manifest_path}')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if manifest.get('provider') != 'PokeAPI' or manifest.get('scope') != 'Reference-only Gen I baseline; species IDs 1-151; not a runtime registration.':
        raise ValueError('Published reference manifest provider/scope does not match.')
    if manifest.get('speciesIds') != list(IDS):
        raise ValueError('Published reference manifest must declare species IDs 1-151.')
    entries = _unique_resource_entries(manifest.get('resources'), 'published')
    names: dict[int, dict[str, str]] = {pokemon_id: {} for pokemon_id in IDS}
    for kind, pokemon_id in expected_keys():
        entry = entries[(kind, pokemon_id)]
        rel = f'{CANONICAL.as_posix()}/{kind}-{pokemon_id}.json'
        url = f'{API}{kind}/{pokemon_id}/'
        path = root / rel
        if entry.get('path') != rel or entry.get('url') != url:
            raise ValueError(f'Invalid published path or URL: {kind}/{pokemon_id}')
        if not path.is_file():
            raise ValueError(f'Missing published resource: {path}')
        raw = path.read_bytes()
        resource_id(raw, pokemon_id, f'{kind}/{pokemon_id}')
        value = json.loads(raw)
        if not isinstance(entry.get('name'), str) or not entry['name'] or value.get('name') != entry['name']:
            raise ValueError(f'Resource name mismatch: {kind}/{pokemon_id}')
        if entry.get('sha256') != digest(raw):
            raise ValueError(f'SHA-256 mismatch: {path}')
        names[pokemon_id][kind] = value['name']
    for pokemon_id, pair in names.items():
        if pair['pokemon'] != pair['pokemon-species']:
            raise ValueError(f'Pokémon/species name mismatch for ID {pokemon_id}.')
    return len(entries)


def stage(root: Path, fetch: bool = False, check_offline: bool = False, *, opener: Callable = urlopen, max_workers: int = 4) -> tuple[int, int]:
    if check_offline:
        return verify_offline(root), 0
    if max_workers < 1 or max_workers > 4:
        raise ValueError('max_workers must be between 1 and 4.')
    data: dict[tuple[str, int], tuple[bytes, str]] = {}
    missing: list[tuple[str, int]] = []
    for kind, pokemon_id in expected_keys():
        canonical = root / CANONICAL / f'{kind}-{pokemon_id}.json'
        staged = root / STAGING / kind / f'{pokemon_id}.json'
        source: str | None = None
        path: Path | None = None
        if canonical.is_file():
            path, source = canonical, 'canonical-cache'
        elif staged.is_file():
            path, source = staged, 'staging-cache'
        if path is not None:
            raw = path.read_bytes()
            resource_id(raw, pokemon_id, f'{kind}/{pokemon_id}')
            data[(kind, pokemon_id)] = raw, source
        else:
            missing.append((kind, pokemon_id))

    fetched = 0
    if missing and not fetch:
        preview = ', '.join(f'{kind}/{pokemon_id}' for kind, pokemon_id in missing[:8])
        raise ValueError(f'{len(missing)} Gen I resources are missing; first: {preview}. Run with --fetch.')
    if missing:
        results: dict[tuple[str, int], bytes] = {}
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            futures = {pool.submit(fetch_resource, kind, pokemon_id, opener): (kind, pokemon_id) for kind, pokemon_id in missing}
            for future in as_completed(futures):
                key = futures[future]
                results[key] = future.result()
        for key, raw in results.items():
            data[key] = raw, 'PokeAPI-fetch'
            fetched += 1

    resources = []
    for kind, pokemon_id in expected_keys():
        raw, source = data[(kind, pokemon_id)]
        rel = f'{STAGING.as_posix()}/{kind}/{pokemon_id}.json'
        target = root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(raw)
        resources.append({
            'kind': kind,
            'id': pokemon_id,
            'url': f'{API}{kind}/{pokemon_id}/',
            'path': rel,
            'sha256': digest(raw),
            'source': source,
            **({'canonicalPath': f'{CANONICAL.as_posix()}/{kind}-{pokemon_id}.json'} if source == 'canonical-cache' else {}),
        })
    manifest = {
        'version': 1,
        'provider': 'PokeAPI',
        'scope': 'Gen I reference resources (pokemon and pokemon-species IDs 1-151)',
        'resources': resources,
    }
    manifest_path = root / STAGING / 'manifest.json'
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return len(data) - fetched, fetched


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument('--fetch', action='store_true', help='Fetch missing resources from the public PokéAPI.')
    modes.add_argument('--check-offline', action='store_true', help='Verify the staged resource set and SHA-256 manifest without network access.')
    modes.add_argument('--publish-reference', action='store_true', help='Promote verified staging into canonical reference-only source files.')
    modes.add_argument('--check-published-offline', action='store_true', help='Verify published canonical sources and manifest without network access.')
    args = parser.parse_args(argv)
    if args.publish_reference:
        print(f'Published {publish_reference(ROOT)} reference resources to {ROOT / PUBLISHED_MANIFEST}.')
        return 0
    if args.check_published_offline:
        print(f'Offline verified: {verify_published_offline(ROOT)} published Gen I reference resources.')
        return 0
    cached, fetched = stage(ROOT, args.fetch, args.check_offline)
    if args.check_offline:
        print(f'Offline verified: {cached} Gen I reference resources.')
    else:
        print(f'Staged {cached} cached resources; fetched {fetched} missing resources into {ROOT / STAGING}.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
