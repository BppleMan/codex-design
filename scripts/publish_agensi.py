#!/usr/bin/env python3
"""Publish a GitHub release through Agensi's Streamable HTTP MCP API."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlsplit
from urllib.request import Request, urlopen

from validate import markdown_targets

ENDPOINT = "https://mcp.agensi.io/mcp"
PROTOCOL = "2025-03-26"
MAX_FILES = 100
MAX_BYTES = 5 * 1024 * 1024
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico"}


def git(root: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(root), *args], text=True)


def build_package(root: Path, repository: str, revision: str) -> tuple[list[dict], list[str]]:
    """Use tracked files only; retain image references through immutable GitHub URLs."""
    root = root.resolve()
    paths = [Path(p) for p in git(root, "ls-files", "-z").split("\0") if p]
    files: dict[Path, str] = {}
    images: set[Path] = set()
    for relative in paths:
        if relative.parts[0] in {".github", "tests"} or relative == Path("scripts/publish_agensi.py"):
            continue
        source = root / relative
        if source.is_symlink() or not source.resolve().is_relative_to(root):
            raise ValueError(f"Cannot publish symlink: {relative}")
        if relative.name == ".env" or relative.name.startswith(".env."):
            raise ValueError(f"Cannot publish environment file: {relative}")
        try:
            raw = source.read_bytes()
            if b"\0" in raw:
                raise UnicodeDecodeError("utf-8", raw, 0, 1, "binary NUL")
            files[relative] = raw.decode("utf-8")
        except UnicodeDecodeError:
            if relative.suffix.lower() not in IMAGE_SUFFIXES:
                raise ValueError(f"MCP does not accept this binary file: {relative}") from None
            images.add(relative)
    if Path("SKILL.md") not in files:
        raise ValueError("Package is missing SKILL.md")
    for relative, content in files.items():
        if relative.suffix.lower() != ".md":
            continue
        for target in markdown_targets(content):
            parsed = urlsplit(target)
            if parsed.scheme or target.startswith("//") or not parsed.path:
                continue
            destination = (root / relative.parent / unquote(parsed.path)).resolve()
            if not destination.is_relative_to(root):
                raise ValueError(f"Link escapes package: {relative}: {target}")
            linked = destination.relative_to(root)
            if linked in images or (linked in paths and linked not in files):
                remote = (
                    f"https://raw.githubusercontent.com/{repository}/{quote(revision, safe='')}/"
                    f"{quote(linked.as_posix(), safe='/')}"
                )
                if parsed.fragment:
                    remote += "#" + parsed.fragment
                content = content.replace(target, remote)
            elif not destination.is_dir() and linked not in files:
                raise ValueError(f"Link target is not in the tracked package: {relative}: {target}")
        files[relative] = content
    result = [{"path": p.as_posix(), "content": content} for p, content in sorted(files.items())]
    size = sum(len(f["content"].encode("utf-8")) for f in result)
    if len(result) > MAX_FILES or size > MAX_BYTES:
        raise ValueError(f"MCP package exceeds 100 files / 5 MiB: {len(result)} files, {size} bytes")
    return result, sorted(p.as_posix() for p in images)


def decode_response(raw: bytes, request_id: int) -> dict:
    """Agensi returns JSON for initialize and SSE for tools/list and tools/call."""
    text = raw.decode("utf-8")
    if text.lstrip().startswith("{"):
        messages = [json.loads(text)]
    else:
        messages = []
        for event in text.replace("\r\n", "\n").split("\n\n"):
            data = "\n".join(line[5:].lstrip() for line in event.splitlines() if line.startswith("data:"))
            if data:
                messages.append(json.loads(data))
    for message in messages:
        if message.get("id") == request_id:
            if "error" in message:
                raise RuntimeError(str(message["error"].get("message", "MCP request failed")))
            if not isinstance(message.get("result"), dict):
                raise RuntimeError("MCP response has no result object")
            return message["result"]
    raise RuntimeError("MCP response did not include the matching request ID")


class AgensiClient:
    def __init__(self, key: str):
        self.key = key
        self.session: str | None = None
        self.request_id = 0

    def request(self, method: str, params: dict | None = None, *, notification: bool = False) -> dict:
        self.request_id += 1
        message: dict = {"jsonrpc": "2.0", "method": method, "params": params or {}}
        if not notification:
            message["id"] = self.request_id
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "Authorization": f"Bearer {self.key}",
            "MCP-Protocol-Version": PROTOCOL,
        }
        if self.session:
            headers["Mcp-Session-Id"] = self.session
        request = Request(ENDPOINT, json.dumps(message).encode("utf-8"), headers, method="POST")
        try:
            with urlopen(request, timeout=30) as response:
                self.session = response.headers.get("Mcp-Session-Id", self.session)
                raw = response.read(MAX_BYTES + 1)
        except HTTPError as error:
            try:
                detail = error.read(2000).decode("utf-8", errors="replace").replace(self.key, "[redacted]")
            finally:
                error.close()
            raise RuntimeError(f"Agensi HTTP {error.code}: {detail}") from None
        except URLError as error:
            raise RuntimeError(f"Agensi connection failed: {error.reason}") from None
        if len(raw) > MAX_BYTES:
            raise RuntimeError("Agensi response exceeds 5 MiB")
        return {} if notification else decode_response(raw, self.request_id)

    def initialize(self) -> None:
        result = self.request("initialize", {
            "protocolVersion": PROTOCOL,
            "capabilities": {},
            "clientInfo": {"name": "codex-design-release", "version": "1.0"},
        })
        if result.get("protocolVersion") != PROTOCOL:
            raise RuntimeError("Agensi negotiated an unsupported MCP protocol version")
        self.request("notifications/initialized", notification=True)

    def call(self, name: str, arguments: dict) -> dict:
        result = self.request("tools/call", {"name": name, "arguments": arguments})
        if result.get("isError"):
            text = "\n".join(c.get("text", "") for c in result.get("content", []) if c.get("type") == "text")
            raise RuntimeError(text or f"Agensi {name} failed")
        structured = result.get("structuredContent")
        if isinstance(structured, dict):
            payload = structured
        else:
            text = "\n".join(c.get("text", "") for c in result.get("content", []) if c.get("type") == "text")
            try:
                payload = json.loads(text)
            except json.JSONDecodeError:
                detail = text.strip().replace(self.key, "[redacted]")[:2000]
                raise RuntimeError(
                    f"Agensi {name} returned an unstructured tool response: {detail or '(empty response)'}; "
                    "verify the result in Creator Studio"
                ) from None
        if not isinstance(payload, dict):
            raise RuntimeError("Agensi returned an unexpected tool result")
        if (payload.get("error") or payload.get("success") is False
                or payload.get("status") in {"error", "auth_required", "forbidden", "not_found"}):
            raise RuntimeError(str(payload.get("error") or payload.get("message") or "Agensi rejected the update"))
        return payload


def release_details(event: dict, version: str | None) -> tuple[str, str]:
    release = event.get("release", {})
    label = version or release.get("tag_name")
    if not isinstance(label, str) or not label.strip():
        raise ValueError("Provide --version for a manual run, or use a published GitHub Release")
    changelog = release.get("body") or f"Codex Design {label}"
    return label.strip(), changelog


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--version")
    parser.add_argument("--dry-run", action="store_true", help="Build and validate the payload without contacting Agensi")
    parser.add_argument("--output", type=Path, help="Optionally save the request payload (never includes credentials)")
    args = parser.parse_args()
    key = os.environ.get("AGENSI_API_KEY", "")
    try:
        event_path = os.environ.get("GITHUB_EVENT_PATH")
        event = json.loads(Path(event_path).read_text()) if event_path else {}
        version, changelog = release_details(event, args.version)
        repository = os.environ.get("GITHUB_REPOSITORY", "BppleMan/codex-design")
        revision = git(args.root, "rev-parse", "HEAD").strip()
        files, images = build_package(args.root, repository, revision)
        slug = os.environ.get("AGENSI_SKILL_SLUG", "").strip()
        if not slug and args.dry_run:
            slug = "unconfigured-dry-run"
        if not slug:
            raise ValueError("Set the AGENSI_SKILL_SLUG repository variable to your existing Agensi listing slug")
        payload = {"skill_slug": slug, "version": version, "changelog": changelog, "files": files}
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Prepared {len(files)} text files for {slug} version {version}; revision {revision}.")
        if images:
            print(f"Referenced {len(images)} repository images through immutable GitHub URLs.")
        if args.dry_run:
            print("Dry run complete. No request was sent to Agensi.")
            return 0
        if not key:
            raise ValueError("Set the AGENSI_API_KEY GitHub Actions secret")
        client = AgensiClient(key)
        client.initialize()
        response = client.call("update_skill", payload)
        status = response.get("status", "request accepted")
        print(f"Agensi update_skill completed: {status}.")
        summary = os.environ.get("GITHUB_STEP_SUMMARY")
        if summary:
            with Path(summary).open("a", encoding="utf-8") as stream:
                stream.write(f"Agensi update submitted for `{slug}`, version `{version}` ({len(files)} text files).\n")
        return 0
    except (ValueError, RuntimeError, OSError, subprocess.CalledProcessError) as error:
        print(f"ERROR: {str(error).replace(key, '[redacted]') if key else error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
