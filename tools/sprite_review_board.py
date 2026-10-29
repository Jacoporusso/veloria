"""Render alpha-composited QA previews; never rewrite production sprite pixels.

Hidden RGB under alpha zero can look like a backdrop in image viewers. These
opaque review boards show what a browser actually composites, alongside source
hashes so a reviewed candidate can be matched to the unchanged production file.
"""

import argparse
import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sprites', nargs='+', type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--columns', type=int, default=4)
    args = parser.parse_args()
    if not 1 <= args.columns <= 8:
        parser.error('--columns must be between 1 and 8')
    output = args.output.resolve()
    metadata = output.with_suffix('.json')
    sources = [path.resolve() for path in args.sprites]
    if output in sources or metadata in sources:
        parser.error('QA outputs must not replace source sprites')
    width, height = 256, 408
    columns = min(args.columns, len(sources))
    board = Image.new('RGB', (columns * width, math.ceil(len(sources) / columns) * height), '#dce8eb')
    draw = ImageDraw.Draw(board)
    records = []
    for index, path in enumerate(sources):
        with Image.open(path) as original:
            sprite = original.convert('RGBA')
        alpha = sprite.getchannel('A')
        composite = Image.alpha_composite(Image.new('RGBA', sprite.size, '#dce8eb'), sprite)
        preview = ImageOps.contain(composite.convert('RGB'), (width, height - 24), Image.Resampling.LANCZOS)
        x, y = index % columns * width, index // columns * height
        board.paste(preview, (x + (width - preview.width) // 2, y + 24))
        draw.text((x + 6, y + 6), path.stem, fill='#102d40')
        records.append({
            'source': path.as_posix(),
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'dimensions': list(sprite.size),
            'alphaRange': list(alpha.getextrema()),
            'alphaBounds': alpha.getbbox(),
            'corners': [alpha.getpixel(point) for point in [
                (0, 0), (sprite.width - 1, 0),
                (0, sprite.height - 1), (sprite.width - 1, sprite.height - 1),
            ]],
        })
    output.parent.mkdir(parents=True, exist_ok=True)
    board.save(output)
    metadata.write_text(json.dumps({
        'purpose': 'Opaque QA composition only; source images remain unchanged.',
        'background': '#dce8eb', 'sprites': records,
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Review board: {output}\nSource hashes: {metadata}')


if __name__ == '__main__':
    main()
