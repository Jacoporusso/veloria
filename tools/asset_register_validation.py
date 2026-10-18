"""Validate registered assets and ensure public media has recorded provenance."""
import csv
import re
from pathlib import Path


REQUIRED_COLUMNS = {
    "asset_id", "filename", "creator", "source_url", "license", "usage_permission", "status",
}
MEDIA_EXTENSIONS = {
    ".avif", ".bmp", ".gif", ".jpeg", ".jpg", ".m4a", ".mp3", ".mp4", ".ogg",
    ".png", ".svg", ".wav", ".webm", ".webp",
}
ASSET_ID_PATTERN = re.compile(r"^[a-z0-9][a-z0-9._-]*$")
REQUIRED_VALUES = REQUIRED_COLUMNS - {"source_url"}
PROJECT_CREATOR_MARKERS = (
    "veloria project", "openai imagegen", "generato proceduralmente per veloria",
    "generato con ai per il concept veloria",
)


def validate_asset_register(register_path: Path, repository_root: Path, public_root: Path):
    """Return CSV rows and resolved registered paths, raising on incomplete audit data."""
    register_path = register_path.resolve()
    repository_root = repository_root.resolve()
    public_root = public_root.resolve()
    if not register_path.is_file():
        raise AssertionError(f"Asset register not found: {register_path}")

    with register_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        missing_columns = REQUIRED_COLUMNS.difference(reader.fieldnames or [])
        if missing_columns:
            raise AssertionError(f"Asset register is missing columns: {', '.join(sorted(missing_columns))}")
        rows = list(reader)
    if not rows:
        raise AssertionError("Asset register must not be empty")

    asset_ids = set()
    asset_paths = set()
    for row in rows:
        asset_id = (row.get("asset_id") or "").strip()
        if not ASSET_ID_PATTERN.fullmatch(asset_id):
            raise AssertionError(f"Asset register row has an invalid asset_id: {asset_id!r}")
        if asset_id in asset_ids:
            raise AssertionError(f"Duplicate registered asset ID: {asset_id}")
        asset_ids.add(asset_id)

        for field in REQUIRED_VALUES:
            if not (row.get(field) or "").strip():
                raise AssertionError(f"Asset register row is incomplete: {asset_id} ({field})")
        creator = row["creator"].strip().lower()
        if not row["source_url"].strip() and not any(marker in creator for marker in PROJECT_CREATOR_MARKERS):
            raise AssertionError(f"External asset needs a source_url: {asset_id}")

        path_value = (row.get("filename") or "").strip()
        asset_path = (register_path.parent / path_value).resolve()
        try:
            asset_path.relative_to(repository_root)
        except ValueError as error:
            raise AssertionError(f"Registered asset escapes the repository: {path_value}") from error
        if asset_path in asset_paths:
            raise AssertionError(f"Duplicate registered asset path: {path_value}")
        asset_paths.add(asset_path)
        if not asset_path.is_file():
            raise AssertionError(f"Registered asset file is missing: {path_value}")
        if asset_path.suffix.lower() == ".webp":
            with asset_path.open("rb") as media:
                signature = media.read(12)
            if len(signature) < 12 or signature[:4] != b"RIFF" or signature[8:12] != b"WEBP":
                raise AssertionError(f"Registered WebP file has an invalid header: {path_value}")

    unregistered = sorted(
        path for path in public_root.rglob("*")
        if path.is_file() and path.suffix.lower() in MEDIA_EXTENSIONS and path.resolve() not in asset_paths
    )
    if unregistered:
        relative_paths = [path.relative_to(repository_root).as_posix() for path in unregistered]
        raise AssertionError(f"Public media is missing from assets/ASSET_REGISTER.csv: {', '.join(relative_paths)}")

    return rows, asset_paths
