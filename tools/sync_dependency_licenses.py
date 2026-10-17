#!/usr/bin/env python3
"""Refresh assets/DEPENDENCY_LICENSES.csv from package-lock.json."""
from pathlib import Path
from dependency_license_validation import write_dependency_register

ROOT = Path(__file__).resolve().parents[1]
records = write_dependency_register(ROOT / "package-lock.json", ROOT / "assets" / "DEPENDENCY_LICENSES.csv")
print(f"Wrote {len(records)} locked dependency license records to assets/DEPENDENCY_LICENSES.csv")
