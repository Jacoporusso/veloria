"""Detect UTF-8 text accidentally decoded as Windows-1252 in player-facing JSON."""
import json


def repair_mojibake(text):
    for _ in range(3):
        result = []
        index = 0
        while index < len(text):
            char = text[index]
            size = {'Â': 2, 'Ã': 2, 'â': 3, 'ð': 4}.get(char, 0)
            if size:
                try:
                    decoded = text[index:index + size].encode('cp1252').decode('utf-8')
                    if len(decoded) == 1:
                        result.append(decoded)
                        index += size
                        continue
                except (UnicodeEncodeError, UnicodeDecodeError):
                    pass
            result.append(char)
            index += 1
        repaired = ''.join(result)
        if repaired == text:
            return text
        text = repaired
    return text


def validate_localized_text(root):
    paths = [*sorted((root / 'content/maps').glob('*.json')),
             *sorted((root / 'public/tilemaps').glob('*.tmj')),
             root / 'content/dialogue/world.v1.json']
    def inspect(value, label):
        if isinstance(value, str):
            if repair_mojibake(value) != value or '\ufffd' in value:
                raise AssertionError(f'Corrupted localized text: {label}')
        elif isinstance(value, dict):
            for key, item in value.items():
                inspect(item, f'{label}.{key}')
        elif isinstance(value, list):
            for index, item in enumerate(value):
                inspect(item, f'{label}[{index}]')
    for path in paths:
        inspect(json.loads(path.read_text(encoding='utf-8')), path.relative_to(root).as_posix())
    return len(paths)
