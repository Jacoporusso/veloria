import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from dependency_license_validation import write_dependency_register, validate_dependency_register


class DependencyLicenseValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.lockfile = self.root / "package-lock.json"
        self.register = self.root / "DEPENDENCY_LICENSES.csv"
        self.lock = {
            "name": "test",
            "packages": {
                "": {"name": "test", "version": "1.0.0"},
                "node_modules/phaser": {
                    "version": "3.90.0", "license": "MIT", "resolved": "https://registry.example/phaser.tgz",
                    "integrity": "sha512-phaser", "dev": False,
                },
                "node_modules/@test/tool": {
                    "version": "1.2.0", "license": "Apache-2.0", "resolved": "https://registry.example/tool.tgz",
                    "integrity": "sha512-tool", "dev": True, "optional": True,
                },
            },
        }
        self.write_lock()

    def tearDown(self):
        self.temp_dir.cleanup()

    def write_lock(self):
        self.lockfile.write_text(json.dumps(self.lock), encoding="utf-8")

    def test_generates_complete_current_inventory_from_lockfile(self):
        rows = write_dependency_register(self.lockfile, self.register)
        self.assertEqual(len(rows), 2)
        validated = validate_dependency_register(self.lockfile, self.register)
        tool = next(row for row in validated if row["package_path"] == "node_modules/@test/tool")
        self.assertEqual(tool["optional"], "true")

    def test_rejects_stale_inventory_after_lockfile_update(self):
        write_dependency_register(self.lockfile, self.register)
        self.lock["packages"]["node_modules/phaser"]["version"] = "3.91.0"
        self.write_lock()
        with self.assertRaisesRegex(AssertionError, "stale: node_modules/phaser"):
            validate_dependency_register(self.lockfile, self.register)

    def test_rejects_locked_dependencies_missing_license_or_source(self):
        self.lock["packages"]["node_modules/phaser"].pop("license")
        self.write_lock()
        with self.assertRaisesRegex(AssertionError, "no license metadata"):
            write_dependency_register(self.lockfile, self.register)

        self.lock["packages"]["node_modules/phaser"]["license"] = "MIT"
        self.lock["packages"]["node_modules/phaser"].pop("resolved")
        self.write_lock()
        with self.assertRaisesRegex(AssertionError, "no resolved source"):
            write_dependency_register(self.lockfile, self.register)


if __name__ == "__main__":
    unittest.main()
