"""Contract and packaging checks; no Agensi account or network requests."""
from __future__ import annotations
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import publish_agensi as publish


class PackageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        self.write("SKILL.md", "---\nname: codex-design\ndescription: Design products.\n---\nBuild a prototype.\n")

    def write(self, name, content):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content if isinstance(content, bytes) else content.encode())
        subprocess.run(["git", "-C", str(self.root), "add", "--", name], check=True)

    def package(self):
        return publish.build_package(self.root, "BppleMan/codex-design", "a" * 40)

    def test_only_tracked_runtime_files_are_collected(self):
        self.write("assets/starter/.gitignore", "node_modules\n")
        self.write("references/guide.md", "Use the prototype.")
        self.write(".github/workflows/release.yml", "name: CI")
        (self.root / "untracked-secret.txt").write_text("private")
        files, images = self.package()
        self.assertEqual({f["path"] for f in files}, {"SKILL.md", "assets/starter/.gitignore", "references/guide.md"})
        self.assertEqual(images, [])

    def test_binary_image_links_work_from_markdown_and_html(self):
        self.write("docs/images/demo.png", b"\x89PNG\r\n\x1a\n\x00")
        self.write("docs/example.md", '![Demo](images/demo.png)\n<img src="images/demo.png" />\n')
        files, images = self.package()
        content = next(f["content"] for f in files if f["path"] == "docs/example.md")
        expected = f"https://raw.githubusercontent.com/BppleMan/codex-design/{'a' * 40}/docs/images/demo.png"
        self.assertEqual(content.count(expected), 2)
        self.assertEqual(images, ["docs/images/demo.png"])
        self.assertNotIn("docs/images/demo.png", {f["path"] for f in files})

    def test_tracked_environment_file_is_rejected(self):
        self.write(".env.production", "SECRET=private")
        with self.assertRaisesRegex(ValueError, "environment file"):
            self.package()

    def test_unknown_binary_is_rejected(self):
        self.write("helper.bin", b"binary\x00")
        with self.assertRaisesRegex(ValueError, "binary file"):
            self.package()

    def test_symlink_is_rejected(self):
        (self.root / "link.md").symlink_to(self.root / "SKILL.md")
        subprocess.run(["git", "-C", str(self.root), "add", "link.md"], check=True)
        with self.assertRaisesRegex(ValueError, "symlink"):
            self.package()

    def test_package_limits_are_checked_before_upload(self):
        for name, limit in [("MAX_FILES", 0), ("MAX_BYTES", 1)]:
            with self.subTest(limit=name), patch.object(publish, name, limit):
                with self.assertRaisesRegex(ValueError, "exceeds"):
                    self.package()

    def test_untracked_link_target_is_not_silently_omitted(self):
        self.write("README.md", "[Guide](local-guide.md)")
        (self.root / "local-guide.md").write_text("Untracked guide")
        with self.assertRaisesRegex(ValueError, "not in the tracked package"):
            self.package()


class ProtocolTests(unittest.TestCase):
    def test_json_and_sse_select_only_the_matching_response(self):
        wire = {"jsonrpc": "2.0", "id": 7, "result": {"ok": True}}
        self.assertEqual(publish.decode_response(json.dumps(wire).encode(), 7), {"ok": True})
        sse = ': heartbeat\r\n\r\ndata: {"jsonrpc":"2.0","method":"ping"}\r\n\r\nevent: message\r\ndata: ' + json.dumps(wire) + '\r\n\r\n'
        self.assertEqual(publish.decode_response(sse.encode(), 7), {"ok": True})

    def test_rpc_error_and_missing_id_are_not_success(self):
        with self.assertRaisesRegex(RuntimeError, "denied"):
            publish.decode_response(b'{"id":1,"error":{"message":"denied"}}', 1)
        with self.assertRaisesRegex(RuntimeError, "matching request"):
            publish.decode_response(b'{"id":2,"result":{}}', 1)

    def test_http_error_is_not_retried_and_secret_is_redacted(self):
        error = HTTPError(publish.ENDPOINT, 401, "unauthorized", {}, io.BytesIO(b"bad secret-token"))
        with patch.object(publish, "urlopen", side_effect=error) as transport:
            with self.assertRaisesRegex(RuntimeError, "HTTP 401") as failure:
                publish.AgensiClient("secret-token").request("initialize")
        self.assertNotIn("secret-token", str(failure.exception))
        transport.assert_called_once()

    def test_transport_auth_session_and_notification(self):
        response = MagicMock()
        response.__enter__.return_value = response
        response.headers = {"Mcp-Session-Id": "session-1"}
        response.read.side_effect = [b'{"id":1,"result":{"protocolVersion":"2025-03-26"}}', b""]
        with patch.object(publish, "urlopen", return_value=response) as transport:
            publish.AgensiClient("secret-token").initialize()
        requests = [call.args[0] for call in transport.call_args_list]
        self.assertEqual(requests[0].get_header("Authorization"), "Bearer secret-token")
        self.assertEqual(requests[1].get_header("Mcp-session-id"), "session-1")
        self.assertNotIn("id", json.loads(requests[1].data))

    def test_tool_failures_are_not_reported_as_updates(self):
        client = publish.AgensiClient("secret-token")
        for response in [
            {"isError": True, "content": [{"type": "text", "text": "Denied"}]},
            {"content": [{"type": "text", "text": '{"error":"Missing skill"}'}]},
            {"structuredContent": {"status": "forbidden", "message": "Denied"}},
            {"content": [{"type": "text", "text": "Sign in first"}]},
        ]:
            with self.subTest(response=response), patch.object(client, "request", return_value=response):
                with self.assertRaises(RuntimeError):
                    client.call("update_skill", {})
        with patch.object(client, "request", return_value={"content": [{"type": "text", "text": '{"status":"pending"}'}]}):
            self.assertEqual(client.call("update_skill", {}), {"status": "pending"})

    def test_profile_failure_without_is_error_preserves_the_diagnostic(self):
        client = publish.AgensiClient("secret-token")
        response = {"content": [{"type": "text", "text":
            "We couldn't load your Agensi profile. Try again in a moment. secret-token"}]}
        with patch.object(client, "request", return_value=response):
            with self.assertRaisesRegex(RuntimeError, "couldn't load your Agensi profile") as failure:
                client.call("update_skill", {})
        self.assertNotIn("secret-token", str(failure.exception))

    def test_release_text_is_data_not_shell_code(self):
        label, body = publish.release_details({"release": {"tag_name": "v1.1.0", "body": "Use `$value` and $(literal).\nSecond line."}}, None)
        self.assertEqual(label, "v1.1.0")
        self.assertEqual(body, "Use `$value` and $(literal).\nSecond line.")
        self.assertEqual(publish.release_details({}, "v2.0.0"), ("v2.0.0", "Codex Design v2.0.0"))
        with self.assertRaises(ValueError):
            publish.release_details({}, None)


if __name__ == "__main__":
    unittest.main()
