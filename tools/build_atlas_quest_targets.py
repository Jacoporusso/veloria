"""Index physical quest-event sources from Tiled and content; never invent coordinates."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'content/journey/atlas-quest-targets.v1.json'


def events(value):
    found = set()
    if isinstance(value, dict):
        for key, child in value.items():
            if key.lower().endswith('event') and isinstance(child, str) and '/' in child:
                found.add(child)
            found.update(events(child))
    elif isinstance(value, list):
        for child in value:
            found.update(events(child))
    return found


def build():
    read = lambda path: json.loads(path.read_text(encoding='utf-8-sig'))
    dialogue = read(ROOT / 'content/dialogue/world.v1.json')
    configs = {}
    for folder in ('regulators', 'trainers', 'puzzles'):
        for path in sorted((ROOT / 'content' / folder).glob('*.json')):
            data = read(path)
            if isinstance(data, dict) and 'id' in data:
                configs[data['id']] = data
    targets = {}

    def add(event, map_id, name, x, y, source):
        point = dict(mapId=map_id, objectName=name, x=x, y=y, source=source)
        if point not in targets.setdefault(event, []):
            targets[event].append(point)

    for path in sorted((ROOT / 'content/maps').glob('*.map.json')):
        metadata = read(path)
        spawn = metadata['spawns'][0]
        add(f"area/{metadata['id']}/enter", metadata['id'], f"Ingresso · {metadata['displayName']}",
            spawn['x'] * 32 + 16, spawn['y'] * 32 + 35, f"{path.relative_to(ROOT).as_posix()}#/spawns/0")
        tiled_path = ROOT / 'public' / metadata['tiledAsset']
        tiled = read(tiled_path)
        for layer in tiled['layers']:
            if layer['name'] not in ('characters', 'interactions', 'triggers'):
                continue
            for obj in layer.get('objects', []):
                props = {p['name']: p['value'] for p in obj.get('properties', [])}
                bound = events(props)
                bound.update(events(dialogue.get(props.get('dialogueId'), {})))
                for key in ('regulatorId', 'trainerId', 'routerId'):
                    bound.update(events(configs.get(props.get(key), {})))
                for event in sorted(bound):
                    add(event, metadata['id'], obj.get('name') or 'Obiettivo',
                        obj['x'] + obj.get('width', 32) / 2, obj['y'] + obj.get('height', 32) / 2 + 19,
                        f"{tiled_path.relative_to(ROOT).as_posix()}#object-{obj['id']}")
    return dict(version=1, events={key: targets[key] for key in sorted(targets)})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    content = build()
    if args.check:
        if not OUTPUT.exists() or json.loads(OUTPUT.read_text(encoding='utf-8')) != content:
            raise SystemExit('Atlas quest targets are stale: run python tools/build_atlas_quest_targets.py')
    else:
        OUTPUT.write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"{'Verified' if args.check else 'Wrote'} physical targets for {len(content['events'])} quest events")


if __name__ == '__main__':
    main()
