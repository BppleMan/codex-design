#!/usr/bin/env python3
"""Validate a portable Codex skill package without contacting external services.

Checks ordinary Markdown inline/image links, single-line reference definitions,
and HTML image/link elements embedded in Markdown.
Code examples are excluded from link checking. Remote URLs and heading fragments
are not fetched or resolved; this is a package integrity check, not a Markdown
renderer, secret scanner, or legal review.
"""

from __future__ import annotations

import argparse
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

import yaml


class UniqueKeyLoader(yaml.SafeLoader):
    """Reject ambiguous metadata instead of silently keeping the last key."""


def unique_mapping(loader, node, deep=False):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            raise yaml.constructor.ConstructorError(
                None, None, f"duplicate key: {key}", key_node.start_mark
            )
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


UniqueKeyLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping
)


def yaml_mapping(text: str, label: str, errors: list[str]) -> dict:
    try:
        data = yaml.load(text, Loader=UniqueKeyLoader)
    except (yaml.YAMLError, TypeError) as error:
        errors.append(f"{label}: invalid YAML ({error})")
        return {}
    if not isinstance(data, dict):
        errors.append(f"{label}: expected a YAML mapping")
        return {}
    return data


def nonempty_string(mapping: dict, key: str, label: str, errors: list[str]) -> str:
    value = mapping.get(key)
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label}: {key} must be a nonempty string")
        return ""
    return value


def without_code(text: str) -> str:
    lines = []
    fence = None
    for line in text.splitlines(keepends=True):
        marker = re.match(r"^ {0,3}(`{3,}|~{3,})", line)
        if fence:
            if marker and marker[1][0] == fence[0] and len(marker[1]) >= len(fence):
                fence = None
            lines.append("\n")
        elif marker:
            fence = marker[1]
            lines.append("\n")
        else:
            lines.append(re.sub(r"(`+).*?\1", "", line))
    return "".join(lines)


def destination(text: str, start: int) -> str:
    """Read an angle-wrapped or balanced, optionally escaped link destination."""
    index = start
    while index < len(text) and text[index].isspace():
        index += 1
    if index < len(text) and text[index] == "<":
        end = text.find(">", index + 1)
        return text[index + 1:end] if end >= 0 else ""
    begin, depth = index, 0
    while index < len(text):
        char = text[index]
        if char == "\\" and index + 1 < len(text):
            index += 2
            continue
        if char.isspace() or (char == ")" and depth == 0):
            break
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
        index += 1
    return text[begin:index]


def markdown_targets(text: str):
    clean = without_code(text)
    # Definitions cover full, collapsed, and shortcut reference links/images.
    for match in re.finditer(r"^ {0,3}\[[^\]\n]+\]:[ \t]*", clean, re.MULTILINE):
        yield destination(clean, match.end())
    for match in re.finditer(r"!?\[(?:\\.|[^\]\\])*\]\(", clean):
        yield destination(clean, match.end())
    html = HTMLTargets()
    html.feed(clean)
    yield from html.targets


class HTMLTargets(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.targets = []

    def handle_starttag(self, tag, attrs):
        attribute = {"img": "src", "a": "href"}.get(tag)
        if attribute:
            for name, value in attrs:
                if name == attribute and value:
                    self.targets.append(value)


def unresolved_references(text: str):
    clean = without_code(text)
    normalize = lambda label: " ".join(label.split()).casefold()
    defined = {normalize(match[1]) for match in re.finditer(
        r"^ {0,3}\[([^\]\n]+)\]:", clean, re.MULTILINE
    )}
    for match in re.finditer(r"!?\[((?:\\.|[^\]\\])*)\]\[([^\]\n]*)\]", clean):
        label = match[2] or match[1]
        if normalize(label) not in defined:
            yield label


def check_target(target: str, source: Path, root: Path, errors: list[str]) -> None:
    target = re.sub(r"\\([\\`*{}\[\]()#+.!_<> -])", r"\1", target)
    try:
        parsed = urlsplit(target)
    except ValueError:
        errors.append(f"{source.relative_to(root)}: invalid link {target!r}")
        return
    if parsed.scheme and parsed.scheme.lower() != "file":
        if not re.match(r"^[A-Za-z]:[\\/]", target):
            return
    if target.startswith("//"):
        return
    path = unquote(parsed.path)
    if not path and not parsed.scheme:
        return  # Same-page heading or empty link.
    label = str(source.relative_to(root))
    if parsed.scheme or path.startswith(("/", "\\", "~/")):
        errors.append(f"{label}: local link must be relative: {target!r}")
        return
    resolved = (source.parent / path.replace("\\", "/")).resolve()
    if not resolved.is_relative_to(root):
        errors.append(f"{label}: local link escapes package: {target!r}")
    elif not resolved.exists():
        errors.append(f"{label}: broken local link: {target!r}")


# Scan publishable prose/metadata, including examples; source test fixtures are not
# prose and deliberately contain invalid paths for regression coverage.
MACHINE_PATH = re.compile(
    r"(?<![\w:/])(?:/(?:Users|home|root|Volumes|private|tmp|var|workspace|workspaces|mnt)/[^\s`\"'<>]+"
    r"|[A-Za-z]:[\\/](?:Users|Documents and Settings)[\\/][^\n`\"'<>]+)"
)


def validate(root: Path) -> list[str]:
    root = root.resolve()
    errors: list[str] = []
    required = ("SKILL.md", "agents/openai.yaml", "README.md", "README.zh-CN.md", "LICENSE")
    contents = {}
    for name in required:
        path = root / name
        if not path.is_file():
            errors.append(f"missing required file: {name}")
            continue
        if not path.resolve().is_relative_to(root):
            errors.append(f"{name}: symlink escapes package")
            continue
        try:
            contents[name] = path.read_text(encoding="utf-8")
            if not contents[name].strip():
                errors.append(f"{name}: required file is empty")
        except (OSError, UnicodeError) as error:
            errors.append(f"{name}: cannot read UTF-8 text ({error})")

    if "SKILL.md" in contents:
        match = re.match(r"\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)", contents["SKILL.md"], re.DOTALL)
        if not match:
            errors.append("SKILL.md: missing or unclosed YAML frontmatter")
        else:
            metadata = yaml_mapping(match[1], "SKILL.md frontmatter", errors)
            if nonempty_string(metadata, "name", "SKILL.md", errors) != "codex-design":
                errors.append("SKILL.md: name must identify codex-design")
            nonempty_string(metadata, "description", "SKILL.md", errors)
            if not contents["SKILL.md"][match.end():].strip():
                errors.append("SKILL.md: skill instructions are empty")

    if "agents/openai.yaml" in contents:
        metadata = yaml_mapping(contents["agents/openai.yaml"], "agents/openai.yaml", errors)
        interface = metadata.get("interface")
        if not isinstance(interface, dict):
            errors.append("agents/openai.yaml: interface must be a mapping")
        else:
            for key in ("display_name", "short_description", "default_prompt"):
                value = nonempty_string(interface, key, "agents/openai.yaml interface", errors)
                if key == "default_prompt" and not re.search(r"\$codex-design(?![\w-])", value):
                    errors.append("agents/openai.yaml: default_prompt must invoke $codex-design")
            for key in ("icon_small", "icon_large"):
                if key in interface:
                    value = nonempty_string(interface, key, "agents/openai.yaml interface", errors)
                    check_target(value, root / "SKILL.md", root, errors)

    if "LICENSE" in contents:
        license_text = contents["LICENSE"]
        markers = (r"Apache License\s+Version 2\.0, January 2004",
                   r"TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION",
                   r"Grant of Copyright License", r"Grant of Patent License")
        if not all(re.search(marker, license_text) for marker in markers):
            errors.append("LICENSE: expected the Apache License 2.0 header and grant sections")

    for source in sorted(root.rglob("*")):
        relative = source.relative_to(root)
        if any(part in {".git", ".venv", "venv", "node_modules", "__pycache__"} for part in relative.parts):
            continue
        if source.suffix.lower() not in {".md", ".yaml", ".yml", ".txt"} or not source.is_file():
            continue
        if not source.resolve().is_relative_to(root):
            errors.append(f"{relative}: symlink escapes package")
            continue
        try:
            text = source.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as error:
            errors.append(f"{relative}: cannot read UTF-8 text ({error})")
            continue
        for match in MACHINE_PATH.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            errors.append(f"{relative}:{line}: machine-specific absolute path")
        if source.suffix.lower() == ".md":
            for target in markdown_targets(text):
                check_target(target, source, root, errors)
            for label in unresolved_references(text):
                errors.append(f"{relative}: unresolved Markdown reference: {label!r}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    errors = validate(args.root)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("Skill package validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
