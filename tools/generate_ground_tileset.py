"""Build the original 32px ground atlas used by the prototype Tiled maps."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "assets" / "tilesets" / "veloria-ground-v1.png"
TILE = 32
COLORS = {
    "grass": (131, 156, 103), "grass_light": (147, 168, 115), "grass_dark": (112, 140, 91),
    "path": (200, 183, 138), "path_light": (213, 196, 154), "path_dark": (181, 163, 119),
    "water": (83, 125, 122), "water_light": (129, 170, 160), "leaf": (96, 126, 86),
    "wood": (121, 91, 61), "stone": (198, 182, 143),
}

atlas = Image.new("RGBA", (TILE * 6, TILE), (0, 0, 0, 0))
for tile_id in range(6):
    tile = Image.new("RGBA", (TILE, TILE), COLORS["grass"])
    draw = ImageDraw.Draw(tile)
    seed = tile_id * 991 + 71
    if tile_id == 0:  # grass, subtle 2px blades
        for i in range(15):
            x = (seed * (i + 11) * 17) % 30 + 1
            y = (seed * (i + 7) * 29) % 30 + 1
            draw.rectangle((x, y, x + 1, y + (i % 3)), fill=COLORS["grass_light"] if i % 2 else COLORS["grass_dark"])
        for x, y in ((6, 8), (22, 19)):
            draw.rectangle((x, y, x + 2, y + 2), fill=(226, 206, 156))
            draw.point((x + 3, y + 2), fill=(238, 231, 203))
    elif tile_id == 1:  # packed earth path
        tile.paste(Image.new("RGBA", tile.size, COLORS["path"]), (0, 0))
        for i in range(12):
            x = (seed * (i + 3) * 13) % 29
            y = (seed * (i + 5) * 23) % 29
            color = COLORS["path_light"] if i % 2 else COLORS["path_dark"]
            draw.rectangle((x, y, x + 2, y + 1), fill=color)
        draw.point((7, 25), fill=COLORS["stone"])
    elif tile_id == 2:  # village stream
        tile.paste(Image.new("RGBA", tile.size, COLORS["water"]), (0, 0))
        for y in range(4, TILE, 8):
            x = (y * 7 + seed) % 20
            draw.rectangle((x, y, x + 7, y + 1), fill=COLORS["water_light"])
            draw.rectangle((x + 9, y + 2, min(30, x + 14), y + 2), fill=(164, 195, 173))
        draw.rectangle((4, 7, 6, 8), fill=(164, 195, 173))
    elif tile_id == 3:  # encounter grass
        for i in range(19):
            x = (seed * (i + 2) * 19) % 30 + 1
            y = (seed * (i + 4) * 11) % 30 + 1
            draw.rectangle((x, y, x + 2, y + 5), fill=COLORS["leaf"] if i % 2 else COLORS["grass_dark"])
            draw.point((x + 1, y), fill=COLORS["grass_light"])
    elif tile_id == 4:  # wood bridge
        tile.paste(Image.new("RGBA", tile.size, COLORS["path_dark"]), (0, 0))
        draw.rectangle((0, 2, 31, 29), fill=COLORS["wood"])
        for y in range(4, 30, 5):
            draw.rectangle((1, y, 30, y + 2), fill=(151, 116, 78))
            draw.line((1, y + 3, 30, y + 3), fill=(70, 53, 39))
    else:  # old stone paving
        tile.paste(Image.new("RGBA", tile.size, (112, 124, 104)), (0, 0))
        for y in range(2, 32, 10):
            offset = 0 if (y // 10) % 2 else 8
            for x in range(-8 + offset, 32, 16):
                draw.rectangle((x + 1, y + 1, x + 13, y + 7), fill=COLORS["stone"], outline=(153, 145, 115))
    atlas.alpha_composite(tile, (tile_id * TILE, 0))

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
atlas.save(OUTPUT, optimize=True)
print(f"Wrote {OUTPUT}")
