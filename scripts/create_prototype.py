#!/usr/bin/env python3
"""Copy the optional Web starter to a new directory without overwriting work."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re
import shutil
import uuid


def create_prototype(destination: Path, name: str, source: Path | None = None) -> Path:
    destination = destination.expanduser().absolute()
    if destination.exists() or destination.is_symlink():
        raise ValueError('Destination already exists; choose a new directory. Nothing was overwritten.')
    if not name.strip() or len(name) > 120:
        raise ValueError('Use a project name between 1 and 120 characters.')
    source = source or Path(__file__).resolve().parents[1] / 'assets' / 'prototype-starter'
    if destination.resolve().is_relative_to(source.resolve()):
        raise ValueError('Destination must be outside the starter directory.')
    if not (source / 'package.json').is_file() or not (source / 'src' / 'project.json').is_file():
        raise ValueError('The prototype starter is missing.')
    # copytree itself refuses a destination created concurrently.
    shutil.copytree(source, destination, ignore=shutil.ignore_patterns('node_modules', 'dist', '.git', '__pycache__', '.DS_Store', '*.local'))
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')[:70] or 'prototype'
    metadata = {'id': f'{slug}-{uuid.uuid4().hex[:8]}', 'name': name.strip(), 'revision': 'example-1', 'example': True}
    (destination / 'src' / 'project.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return destination


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', type=Path)
    parser.add_argument('--name', default='Threadline')
    args = parser.parse_args()
    try:
        result = create_prototype(args.destination, args.name)
    except (ValueError, OSError) as error:
        parser.exit(1, f'Error: {error}\n')
    print(f'Created: {result}')
    print('This is a mock example. Replace its product behavior and definition with your own.')
    print('Inside that directory: npm ci, then npm run dev -- --host 127.0.0.1')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
