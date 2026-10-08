"""Behavioral regression tests against disposable packages, not production prose."""

import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "validate.py"
SPEC = importlib.util.spec_from_file_location("skill_validator", SCRIPT)
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


class PackageValidationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name) / "package"
        self.root.mkdir()
        self.write("SKILL.md", "---\nname: codex-design\ndescription: A useful prototype design workflow.\n---\n\nUse the [guide](references/guide.md).\n")
        self.write("agents/openai.yaml", "interface:\n  display_name: Design\n  short_description: Prototype together\n  default_prompt: Use $codex-design to explore this idea.\n")
        self.write("README.md", "# A portable skill\n[中文](README.zh-CN.md)\n")
        self.write("README.zh-CN.md", "# 原型设计\n[English](README.md)\n")
        # Deliberately abbreviated: tests only the promised license identity check.
        self.write("LICENSE", "Apache License\nVersion 2.0, January 2004\nTERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION\nGrant of Copyright License\nGrant of Patent License\n")
        self.write("references/guide.md", "# Guide\n[Skill](../SKILL.md#instructions)\n")

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def errors(self):
        return "\n".join(validator.validate(self.root))

    def test_valid_package_is_portable(self):
        self.assertEqual(validator.validate(self.root), [])

    def test_missing_required_release_documents(self):
        for name in ("README.md", "README.zh-CN.md", "LICENSE"):
            with self.subTest(name=name):
                path = self.root / name
                original = path.read_text()
                path.unlink()
                self.assertIn(f"missing required file: {name}", self.errors())
                self.write(name, original)

    def test_malformed_and_ambiguous_frontmatter(self):
        for frontmatter in ("name: [\n", "- codex-design\n", "name: codex-design\nname: other\n", "name: codex-design\ndescription: false\n"):
            with self.subTest(frontmatter=frontmatter):
                self.write("SKILL.md", f"---\n{frontmatter}---\nInstructions\n")
                self.assertTrue(validator.validate(self.root))

    def test_missing_frontmatter_and_wrong_skill_identity(self):
        for text in ("# Instructions", "---\nname: other\ndescription: Useful\n---\nInstructions"):
            with self.subTest(text=text):
                self.write("SKILL.md", text)
                self.assertIn("SKILL.md", self.errors())

    def test_interface_requires_strings_and_matching_invocation(self):
        for interface in ("[]", "{display_name: false}", "{display_name: Design, short_description: Useful, default_prompt: Use $codex-design-old}"):
            with self.subTest(interface=interface):
                self.write("agents/openai.yaml", f"interface: {interface}\n")
                self.assertIn("agents/openai.yaml", self.errors())

    def test_markdown_links_images_and_reference_definitions(self):
        self.write("assets/view (large).svg", "<svg/>")
        self.write("README.md", '[guide](references/guide.md?view=1#guide)\n![preview](assets/view%20(large).svg "Preview")\n[guide][ref]\n[ref]: <references/guide.md> "Guide"\n[remote](https://example.com/no-local-file)\n[mail](mailto:hi@example.com)\n[heading](#overview)\n')
        self.assertEqual(validator.validate(self.root), [])
        self.write("README.md", "![missing](assets/missing.svg)\n[ref]: absent.md\n")
        self.assertIn("assets/missing.svg", self.errors())
        self.assertIn("absent.md", self.errors())

    def test_code_examples_are_not_interpreted_as_local_links(self):
        self.write("README.md", "`[example](not-a-file)`\n```md\n![example](also-not-a-file)\n```\n")
        self.assertEqual(validator.validate(self.root), [])

    def test_missing_reference_definition_is_reported(self):
        self.write("README.md", "![preview][missing]\n[Guide][]\n")
        self.assertIn("unresolved Markdown reference: 'missing'", self.errors())
        self.assertIn("unresolved Markdown reference: 'Guide'", self.errors())

    def test_embedded_html_image_and_link_targets(self):
        self.write("assets/cover.svg", "<svg/>")
        self.write("README.md", '<a href="SKILL.md"><img src="assets/cover.svg" /></a>\n<img src="https://example.com/badge.svg">\n')
        self.assertEqual(validator.validate(self.root), [])
        (self.root / "assets/cover.svg").unlink()
        self.assertIn("broken local link: 'assets/cover.svg'", self.errors())
        self.write("README.md", '<a href="missing.md">Documentation</a>\n')
        self.assertIn("broken local link: 'missing.md'", self.errors())

    def test_required_documents_cannot_be_empty(self):
        self.write("README.md", " \n")
        self.assertIn("README.md: required file is empty", self.errors())

    def test_path_traversal_is_rejected_even_when_target_exists(self):
        outside = self.root.parent / "outside.md"
        outside.write_text("outside", encoding="utf-8")
        for target in ("../outside.md", "%2e%2e/outside.md", "..%5coutside.md"):
            with self.subTest(target=target):
                self.write("README.md", f"[outside]({target})\n")
                self.assertIn("escapes package", self.errors())

    def test_symlink_cannot_hide_an_external_dependency(self):
        outside = self.root.parent / "outside.md"
        outside.write_text("outside", encoding="utf-8")
        (self.root / "external.md").symlink_to(outside)
        self.write("README.md", "[external](external.md)\n")
        self.assertIn("escapes package", self.errors())

    def test_machine_paths_in_prose_or_code_are_rejected(self):
        for path in ("/Users/alice/work/design", "/home/alice/design", r"C:\Users\alice\design"):
            with self.subTest(path=path):
                self.write("README.md", f"Example: `{path}`\n")
                self.assertIn("machine-specific absolute path", self.errors())

    def test_absolute_and_file_links_are_not_portable(self):
        for target in ("/assets/image.svg", "file:///etc/hosts", "~/design.md"):
            with self.subTest(target=target):
                self.write("README.md", f"[file]({target})\n")
                self.assertIn("must be relative", self.errors())

    def test_wrong_license_is_detected(self):
        self.write("LICENSE", "MIT License\nPermission is hereby granted...\n")
        self.assertIn("Apache License 2.0", self.errors())

    def test_cli_exit_status_from_another_directory(self):
        command = [sys.executable, str(SCRIPT), str(self.root)]
        valid = subprocess.run(command, cwd=self.root.parent, capture_output=True, text=True)
        self.assertEqual(valid.returncode, 0, valid.stderr)
        (self.root / "LICENSE").unlink()
        invalid = subprocess.run(command, cwd=self.root.parent, capture_output=True, text=True)
        self.assertNotEqual(invalid.returncode, 0)
        self.assertIn("LICENSE", invalid.stderr)


if __name__ == "__main__":
    unittest.main()
