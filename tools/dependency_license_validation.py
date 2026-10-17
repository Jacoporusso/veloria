"""Create and verify a traceable license inventory from npm's lockfile."""
import csv
import json
from pathlib import Path


DEPENDENCY_COLUMNS = ("package_path", "version", "license", "resolved", "integrity", "dev", "optional")


def dependency_rows(lockfile: Path):
    lock = json.loads(lockfile.read_text(encoding="utf-8"))
    packages = lock.get("packages")
    if not isinstance(packages, dict):
        raise AssertionError("package-lock.json must use the npm packages map")

    rows = []
    for package_path, package in sorted(packages.items()):
        if not package_path.startswith("node_modules/"):
            continue
        license_id = package.get("license")
        if not isinstance(license_id, str) or not license_id.strip():
            raise AssertionError(f"Locked dependency has no license metadata: {package_path}")
        if not isinstance(package.get("version"), str) or not package["version"].strip():
            raise AssertionError(f"Locked dependency has no version: {package_path}")
        if not isinstance(package.get("resolved"), str) or not package["resolved"].strip():
            raise AssertionError(f"Locked dependency has no resolved source: {package_path}")
        rows.append({
            "package_path": package_path,
            "version": package["version"],
            "license": license_id.strip(),
            "resolved": package["resolved"],
            "integrity": package.get("integrity", ""),
            "dev": str(bool(package.get("dev", False))).lower(),
            "optional": str(bool(package.get("optional", False))).lower(),
        })
    if not rows:
        raise AssertionError("package-lock.json contains no locked dependencies")
    return rows


def write_dependency_register(lockfile: Path, output_path: Path):
    rows = dependency_rows(lockfile)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=DEPENDENCY_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    return rows


def validate_dependency_register(lockfile: Path, register_path: Path):
    expected = dependency_rows(lockfile)
    if not register_path.is_file():
        raise AssertionError(f"Dependency license register not found: {register_path}")
    with register_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        missing_columns = set(DEPENDENCY_COLUMNS).difference(reader.fieldnames or [])
        if missing_columns:
            raise AssertionError(f"Dependency register is missing columns: {', '.join(sorted(missing_columns))}")
        actual = list(reader)
    if actual != expected:
        expected_by_path = {row["package_path"]: row for row in expected}
        actual_by_path = {row["package_path"]: row for row in actual}
        missing = sorted(set(expected_by_path).difference(actual_by_path))
        extra = sorted(set(actual_by_path).difference(expected_by_path))
        stale = sorted(
            package_path for package_path in set(expected_by_path).intersection(actual_by_path)
            if expected_by_path[package_path] != actual_by_path[package_path]
        )
        details = []
        if missing:
            details.append(f"missing: {', '.join(missing)}")
        if extra:
            details.append(f"extra: {', '.join(extra)}")
        if stale:
            details.append(f"stale: {', '.join(stale)}")
        raise AssertionError(f"Dependency license register differs from package-lock.json ({'; '.join(details)})")
    return actual
