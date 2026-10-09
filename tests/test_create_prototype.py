from pathlib import Path
import importlib.util
import json
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('create_prototype',Path(__file__).resolve().parents[1]/'scripts/create_prototype.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class CreatePrototypeTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)
        self.source=self.root/'source'
        (self.source/'src').mkdir(parents=True)
        (self.source/'package.json').write_text('{"name":"demo"}')
        (self.source/'src/project.json').write_text('{}')
        (self.source/'src/App.tsx').write_text('example')
        (self.source/'node_modules').mkdir()
        (self.source/'node_modules/ignore.txt').write_text('local dependency')
    def tearDown(self): self.temp.cleanup()
    def test_copy_is_portable_and_names_are_data(self):
        dest=module.create_prototype(self.root/'new','设计 "studio" <script>',self.source)
        data=json.loads((dest/'src/project.json').read_text())
        self.assertEqual(data['name'],'设计 "studio" <script>')
        self.assertTrue(data['example'])
        self.assertFalse((dest/'node_modules').exists())
        self.assertEqual((dest/'src/App.tsx').read_text(),'example')
    def test_existing_work_and_symlinks_are_never_overwritten(self):
        dest=self.root/'existing';dest.mkdir();(dest/'keep').write_text('user work')
        with self.assertRaises(ValueError): module.create_prototype(dest,'Demo',self.source)
        self.assertEqual((dest/'keep').read_text(),'user work')
        link=self.root/'link';link.symlink_to(self.root/'missing')
        with self.assertRaises(ValueError): module.create_prototype(link,'Demo',self.source)
    def test_separate_projects_get_separate_storage_identity(self):
        a=module.create_prototype(self.root/'a','Demo',self.source)
        b=module.create_prototype(self.root/'b','Demo',self.source)
        self.assertNotEqual(json.loads((a/'src/project.json').read_text())['id'],json.loads((b/'src/project.json').read_text())['id'])
    def test_invalid_name_and_self_copy_leave_no_destination(self):
        with self.assertRaises(ValueError): module.create_prototype(self.root/'bad',' ',self.source)
        self.assertFalse((self.root/'bad').exists())
        with self.assertRaises(ValueError): module.create_prototype(self.source/'recursive','Demo',self.source)
        self.assertFalse((self.source/'recursive').exists())

if __name__=='__main__': unittest.main()
