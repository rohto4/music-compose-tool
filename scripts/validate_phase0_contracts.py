"""Dependency-free checks for Phase 0 contract fixtures.

This is intentionally narrower than a complete JSON Schema implementation.
It checks the cross-field and trust-boundary invariants that JSON Schema does
not express by itself, while also proving that every schema and fixture parses.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_DIR = ROOT / "docs" / "spec" / "schema"
FIXTURE_DIR = ROOT / "docs" / "spec" / "fixtures"
SHA256 = re.compile(r"^[a-f0-9]{64}$")
DRIVE_PATH = re.compile(r"^[A-Za-z]:")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as source:
        return json.load(source)


def assert_safe_relative_path(value: str | None) -> None:
    if value is None:
        return
    normalized = value.replace("\\", "/")
    assert not DRIVE_PATH.match(normalized), "drive-qualified path is forbidden"
    assert not normalized.startswith("/"), "absolute path is forbidden"
    assert ".." not in normalized.split("/"), "parent traversal is forbidden"


def validate_project(data: dict[str, Any]) -> None:
    assert data["formatVersion"] == "0.1.0"
    assert data["musicalGrid"]["ppq"] == 480
    assert data["revision"] >= 0
    saved_revision = data.get("savedRevision")
    assert saved_revision is None or 0 <= saved_revision <= data["revision"]

    previous_end = 0
    for section in data["arrangement"]["sections"]:
        assert section["startBar"] >= previous_end, "sections overlap or are unordered"
        assert section["bars"] >= 1
        assert 0 <= section["energyStart"] <= 1
        assert 0 <= section["energyEnd"] <= 1
        previous_end = section["startBar"] + section["bars"]

    note_ids: set[str] = set()
    for note in data["melody"]["notes"]:
        assert note["id"] not in note_ids, "duplicate note id"
        note_ids.add(note["id"])
        assert 0 <= note["pitch"] <= 127
        assert note["startTick"] >= 0
        assert note["durationTick"] >= 1
        assert 1 <= note["velocity"] <= 127

    asset_refs = set(data["assetRefs"])
    assert len(asset_refs) == len(data["assetRefs"]), "duplicate asset reference"
    humming_asset_id = data["creativeIntent"].get("hummingAssetId")
    assert humming_asset_id is None or humming_asset_id in asset_refs
    for track in data["tracks"]:
        for block in track["blocks"]:
            assert block["assetId"] in asset_refs, "track block references an unknown asset"
    for candidate in data["generationCandidates"]:
        assert set(candidate.get("inputAssetIds", [])).issubset(asset_refs)
        output_asset_id = candidate.get("outputAssetId")
        assert output_asset_id is None or output_asset_id in asset_refs


def validate_asset(data: dict[str, Any]) -> None:
    assert SHA256.fullmatch(data["integrity"]["sha256"])
    assert data["integrity"]["bytes"] >= 0
    assert_safe_relative_path(data["storage"].get("relativePath"))
    if data["storage"]["kind"] == "embedded":
        assert data["storage"].get("relativePath"), "embedded asset requires a relative path"
    if data["sharePolicy"]["bundleAllowed"]:
        assert data["license"]["redistribution"] == "allowed"
    if data["license"]["redistribution"] in {"forbidden", "unknown", "render-only"}:
        assert not data["sharePolicy"]["bundleAllowed"]
    if data["sharePolicy"].get("aiProcessingAllowed"):
        assert data["license"]["aiProcessing"] == "allowed"
    if data["sharePolicy"].get("publicShareAllowed"):
        assert data["sharePolicy"]["renderAllowed"]


def validate_arrangement(data: dict[str, Any]) -> None:
    assert data["formatVersion"] == "0.1.0"
    assert data["lengthBars"] >= 1
    total_bars = sum(section["bars"] for section in data["sections"])
    assert total_bars == data["lengthBars"], "section bars must equal lengthBars"
    for section in data["sections"]:
        assert 0 <= section["energyStart"] <= 1
        assert 0 <= section["energyEnd"] <= 1


def expect_failure(label: str, validator: Any, path: Path) -> None:
    try:
        validator(load_json(path))
    except (AssertionError, KeyError, TypeError, ValueError):
        print(f"PASS negative: {label}")
        return
    raise AssertionError(f"negative fixture unexpectedly passed: {label}")


def main() -> int:
    schema_files = sorted(SCHEMA_DIR.glob("*.schema.json"))
    assert len(schema_files) == 3, "expected exactly three Phase 0 schemas"
    for schema_file in schema_files:
        schema = load_json(schema_file)
        assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"
        assert schema["type"] == "object"
        print(f"PASS parse schema: {schema_file.relative_to(ROOT)}")

    positive_cases = [
        ("project", validate_project, FIXTURE_DIR / "cute-future-bass-project.json"),
        ("asset", validate_asset, FIXTURE_DIR / "user-humming-asset.json"),
        ("arrangement", validate_arrangement, FIXTURE_DIR / "cute-future-bass-arrangement.json"),
    ]
    for label, validator, path in positive_cases:
        validator(load_json(path))
        print(f"PASS positive: {label}")

    negative_cases = [
        ("project invalid note", validate_project, FIXTURE_DIR / "invalid" / "project-invalid-note.json"),
        ("asset path traversal", validate_asset, FIXTURE_DIR / "invalid" / "asset-path-traversal.json"),
        (
            "arrangement length mismatch",
            validate_arrangement,
            FIXTURE_DIR / "invalid" / "arrangement-length-mismatch.json",
        ),
    ]
    for label, validator, path in negative_cases:
        expect_failure(label, validator, path)

    print("PASS Phase 0 contract fixtures: 3 positive, 3 negative")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        raise SystemExit(1)
