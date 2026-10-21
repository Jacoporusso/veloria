"""Validate the JSON Schema subset used by Veloria's versioned content schemas.

The content pipeline intentionally stays dependency-free. Unsupported schema
keywords fail closed so schema changes cannot silently bypass validation.
"""
import re
import json
from typing import Any


SUPPORTED_KEYWORDS = {
    "$schema", "title", "type", "additionalProperties", "required", "properties",
    "pattern", "minLength", "const", "enum", "minimum", "maximum", "minItems",
    "items", "oneOf", "uniqueItems", "minProperties", "maxItems",
}
SUPPORTED_TYPES = {"object", "array", "string", "integer", "number", "boolean", "null"}


def _check_supported_keywords(schema: dict[str, Any], path: str = "#") -> None:
    if not isinstance(schema, dict):
        raise AssertionError(f"Invalid JSON Schema object at {path}")
    unknown = set(schema) - SUPPORTED_KEYWORDS
    if unknown:
        raise AssertionError(f"Unsupported JSON Schema keyword(s) at {path}: {', '.join(sorted(unknown))}")
    if "type" in schema and (not isinstance(schema["type"], str) or schema["type"] not in SUPPORTED_TYPES):
        raise AssertionError(f"Unsupported JSON Schema type declaration at {path}")
    if "$schema" in schema and schema["$schema"] != "https://json-schema.org/draft/2020-12/schema":
        raise AssertionError(f"Unsupported JSON Schema dialect at {path}")
    if "additionalProperties" in schema and not isinstance(schema["additionalProperties"], (bool, dict)):
        raise AssertionError(f"Unsupported additionalProperties declaration at {path}")
    required = schema.get("required", [])
    if not isinstance(required, list) or not all(isinstance(name, str) for name in required):
        raise AssertionError(f"Invalid required declaration at {path}")
    for keyword in ("minLength", "minItems", "minProperties", "maxItems", "minimum", "maximum"):
        bound = schema.get(keyword)
        if bound is not None and (not isinstance(bound, (int, float)) or isinstance(bound, bool)):
            raise AssertionError(f"Invalid {keyword} declaration at {path}")
    for keyword in ("minLength", "minItems", "minProperties", "maxItems"):
        bound = schema.get(keyword)
        if bound is not None and (not isinstance(bound, int) or isinstance(bound, bool) or bound < 0):
            raise AssertionError(f"Invalid {keyword} declaration at {path}")
    if "pattern" in schema:
        if not isinstance(schema["pattern"], str):
            raise AssertionError(f"Invalid pattern declaration at {path}")
        try:
            re.compile(schema["pattern"])
        except re.error as error:
            raise AssertionError(f"Invalid regular expression in schema at {path}") from error
    if "enum" in schema and (not isinstance(schema["enum"], list) or not schema["enum"]):
        raise AssertionError(f"Invalid enum declaration at {path}")
    if "uniqueItems" in schema and not isinstance(schema["uniqueItems"], bool):
        raise AssertionError(f"Invalid uniqueItems declaration at {path}")
    if "properties" in schema:
        if not isinstance(schema["properties"], dict):
            raise AssertionError(f"Invalid properties object at {path}")
        for key, child in schema["properties"].items():
            _check_supported_keywords(child, f"{path}/properties/{key}")
    if "additionalProperties" in schema and isinstance(schema["additionalProperties"], dict):
        _check_supported_keywords(schema["additionalProperties"], f"{path}/additionalProperties")
    if "items" in schema:
        _check_supported_keywords(schema["items"], f"{path}/items")
    if "oneOf" in schema and (not isinstance(schema["oneOf"], list) or not schema["oneOf"]):
        raise AssertionError(f"Invalid oneOf declaration at {path}")
    for index, child in enumerate(schema.get("oneOf", [])):
        _check_supported_keywords(child, f"{path}/oneOf/{index}")


def _matches_type(value: Any, expected: str) -> bool:
    if expected == "object":
        return isinstance(value, dict)
    if expected == "array":
        return isinstance(value, list)
    if expected == "string":
        return isinstance(value, str)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected == "boolean":
        return isinstance(value, bool)
    if expected == "null":
        return value is None
    raise AssertionError(f"Unsupported JSON Schema type: {expected}")


def _validate(value: Any, schema: dict[str, Any], path: str, errors: list[str]) -> None:
    if "oneOf" in schema:
        matches = 0
        for branch in schema["oneOf"]:
            branch_errors: list[str] = []
            _validate(value, branch, path, branch_errors)
            matches += not branch_errors
        if matches != 1:
            errors.append(f"{path}: expected exactly one matching oneOf schema; matched {matches}")

    expected_type = schema.get("type")
    if expected_type and not _matches_type(value, expected_type):
        errors.append(f"{path}: expected {expected_type}")
        return

    if "const" in schema and value != schema["const"]:
        errors.append(f"{path}: expected constant {schema['const']!r}")
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: expected one of {schema['enum']!r}")

    if isinstance(value, dict):
        if len(value) < schema.get("minProperties", 0):
            errors.append(f"{path}: object has fewer than minProperties {schema['minProperties']}")
        missing = [key for key in schema.get("required", []) if key not in value]
        errors.extend(f"{path}: missing required property {key!r}" for key in missing)
        properties = schema.get("properties", {})
        for key, child_value in value.items():
            if key in properties:
                _validate(child_value, properties[key], f"{path}.{key}", errors)
            else:
                extra_schema = schema.get("additionalProperties", True)
                if extra_schema is False:
                    errors.append(f"{path}: additional property {key!r} is not allowed")
                elif isinstance(extra_schema, dict):
                    _validate(child_value, extra_schema, f"{path}.{key}", errors)

    if isinstance(value, str):
        if len(value) < schema.get("minLength", 0):
            errors.append(f"{path}: string is shorter than minLength {schema['minLength']}")
        pattern = schema.get("pattern")
        if pattern and re.search(pattern, value) is None:
            errors.append(f"{path}: string does not match pattern {pattern!r}")

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{path}: number is below minimum {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            errors.append(f"{path}: number is above maximum {schema['maximum']}")

    if isinstance(value, list):
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            errors.append(f"{path}: array has more than maxItems {schema['maxItems']}")
        if len(value) < schema.get("minItems", 0):
            errors.append(f"{path}: array has fewer than minItems {schema['minItems']}")
        if schema.get("uniqueItems") and len(value) != len({json.dumps(item, sort_keys=True, separators=(",", ":")) for item in value}):
            errors.append(f"{path}: array items must be unique")
        item_schema = schema.get("items")
        if item_schema:
            for index, item in enumerate(value):
                _validate(item, item_schema, f"{path}[{index}]", errors)


def validate_json_schema(value: Any, schema: dict[str, Any], document_name: str = "JSON document") -> None:
    """Raise AssertionError with the first useful location if value is invalid."""
    _check_supported_keywords(schema)
    errors: list[str] = []
    _validate(value, schema, "$", errors)
    if errors:
        raise AssertionError(f"{document_name} does not match its JSON Schema: {errors[0]}")
