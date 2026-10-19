"""Validate authored fishing interactions before a map reaches the browser."""
import math


def validate_fishing_spot(properties, map_id, tables, items, flags):
    table_id = properties.get("encounterTableId")
    table = tables.get(table_id)
    if not table or table.get("mapId") != map_id or table.get("method") != "fishing":
        raise ValueError(f"Fishing spot needs a fishing table belonging to {map_id}: {table_id}")
    if properties.get("requiredItemId") not in items:
        raise ValueError("Fishing spot requires a registered equipment item")
    chance = properties.get("biteChance")
    if isinstance(chance, bool) or not isinstance(chance, (int, float)) or not math.isfinite(chance) or not 0 <= chance <= 1:
        raise ValueError("Fishing spot biteChance must be a finite probability")
    if "requiredFlag" in properties and properties["requiredFlag"] not in flags:
        raise ValueError("Fishing spot requires an unregistered quest flag")
