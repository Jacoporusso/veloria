import csv
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from asset_register_validation import validate_asset_register


class AssetRegisterValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.register = self.root / "assets" / "ASSET_REGISTER.csv"
        self.register.parent.mkdir()
        self.public = self.root / "public"
        self.image = self.public / "assets" / "map.png"
        self.image.parent.mkdir(parents=True)
        self.image.write_bytes(b"test image")
        self.headers = ["asset_id", "filename", "creator", "source_url", "license", "usage_permission", "status"]
        self.row = {
            "asset_id": "map-ground-v1",
            "filename": "../public/assets/map.png",
            "creator": "Veloria project",
            "source_url": "",
            "license": "Original prototype artwork",
            "usage_permission": "Use in the prototype",
            "status": "prototype-use",
        }

    def tearDown(self):
        self.temp_dir.cleanup()

    def write_register(self, rows):
        with self.register.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=self.headers)
            writer.writeheader()
            writer.writerows(rows)

    def validate(self):
        return validate_asset_register(self.register, self.root, self.public)

    def test_accepts_registered_public_media_and_original_assets_without_external_url(self):
        icon = self.public / "icons" / "mark.svg"
        icon.parent.mkdir()
        icon.write_text("<svg/>", encoding="utf-8")
        self.write_register([
            self.row,
            {**self.row, "asset_id": "app-mark-v1", "filename": "../public/icons/mark.svg"},
        ])

        rows, paths = self.validate()
        self.assertEqual(len(rows), 2)
        self.assertEqual(paths, {self.image.resolve(), icon.resolve()})

    def test_rejects_public_media_missing_from_register(self):
        self.write_register([self.row])
        (self.public / "unregistered.png").write_bytes(b"unregistered")

        with self.assertRaisesRegex(AssertionError, "Public media is missing"):
            self.validate()

    def test_rejects_duplicate_ids_and_paths(self):
        self.write_register([self.row, self.row])
        with self.assertRaisesRegex(AssertionError, "Duplicate registered asset ID"):
            self.validate()

        self.write_register([
            self.row,
            {**self.row, "asset_id": "different-id"},
        ])
        with self.assertRaisesRegex(AssertionError, "Duplicate registered asset path"):
            self.validate()

    def test_rejects_paths_outside_repository_and_missing_rights_fields(self):
        outside = self.root.parent / "outside-veloria-test.png"
        outside.write_bytes(b"outside")
        try:
            self.write_register([{**self.row, "filename": str(outside)}])
            with self.assertRaisesRegex(AssertionError, "escapes the repository"):
                self.validate()
        finally:
            outside.unlink(missing_ok=True)

        self.write_register([{**self.row, "license": ""}])
        with self.assertRaisesRegex(AssertionError, "license"):
            self.validate()

    def test_external_creator_must_have_a_traceable_source(self):
        self.write_register([{**self.row, "creator": "External artist"}])
        with self.assertRaisesRegex(AssertionError, "needs a source_url"):
            self.validate()

        self.write_register([{**self.row, "creator": "External artist", "source_url": "https://assets.example/item"}])
        self.assertEqual(len(self.validate()[0]), 1)

    def test_registered_webp_must_have_a_valid_container_signature(self):
        webp = self.public / "assets" / "map.webp"
        webp.write_bytes(b"RIFF\x00\x00\x00\x00WEBPtest")
        row = {**self.row, "asset_id": "map-ground-webp", "filename": "../public/assets/map.webp"}
        self.write_register([self.row, row])
        self.assertEqual(len(self.validate()[0]), 2)

        webp.write_bytes(b"not a webp image")
        with self.assertRaisesRegex(AssertionError, "invalid header"):
            self.validate()


if __name__ == "__main__":
    unittest.main()
