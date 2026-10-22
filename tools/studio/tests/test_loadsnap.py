import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import loadsnap

PS = """\
  101  5.0 /usr/bin/something --long
  202 88.5 node /x/node_modules/vitest/dist/workers/forks.js
  203 77.0 node /x/node_modules/vitest/dist/workers/forks.js
  204 12.3 /Applications/Foo.app/Contents/MacOS/Foo
  205  1.0 vim
  206 50.0 node vitest run
  207  0.0 bash
"""
SCRIPT = Path(loadsnap.__file__).resolve()


class ParseTest(unittest.TestCase):
    def test_parse_top5_und_vitest(self):
        snap = loadsnap.parse_snapshot(PS, 9.25)
        self.assertEqual(snap["load"], 9.25)
        self.assertEqual([p["pid"] for p in snap["top5"]], [202, 203, 206, 204, 101])
        self.assertEqual(snap["top5"][0]["cpu"], 88.5)
        self.assertEqual(snap["vitest_workers"], 3)

    def test_befehl_wird_gekuerzt(self):
        text = "  1 10.0 " + "x" * 300
        snap = loadsnap.parse_snapshot(text, 1.0)
        self.assertLessEqual(len(snap["top5"][0]["cmd"]), loadsnap.CMD_MAX)

    def test_muell_zeilen_werden_ignoriert(self):
        snap = loadsnap.parse_snapshot("quatsch\n\n  7 abc cmd\n  8 2.0 ok", 0.5)
        self.assertEqual([p["pid"] for p in snap["top5"]], [8])

    def test_format_line(self):
        line = loadsnap.format_line(loadsnap.parse_snapshot(PS, 9.25))
        self.assertTrue(line.startswith("Lastprotokoll: Load 9.25"))
        self.assertIn("202 88.5%", line)
        self.assertIn("Vitest-Worker: 3", line)
        self.assertNotIn("\n", line)


class ScriptKlasseTest(unittest.TestCase):
    def script(self, cmd):
        return loadsnap.script_name(cmd)

    def test_script_interpreter_und_optionen(self):
        self.assertEqual(self.script("/usr/bin/python3.13 -u /a/b/pushcheck.py --x"), "pushcheck.py")
        self.assertEqual(self.script("python3 -m unittest discover"), "unittest")
        self.assertEqual(self.script("python3 -c print(1)"), "-c")
        self.assertEqual(self.script("node /x/tools/perf.mjs --n 3"), "perf.mjs")
        self.assertEqual(self.script("bash -e run.sh"), "run.sh")

    def test_script_ohne_argument_oder_interpreter(self):
        self.assertEqual(self.script("/x/Python.app/Contents/MacOS/Python a/b.py -v"), "b.py")
        self.assertEqual(self.script("vim"), "vim")
        self.assertEqual(self.script("python3"), "python3")
        self.assertEqual(self.script("/usr/bin/vim file.txt"), "vim")
        self.assertEqual(self.script("/Applications/Foo Bar.app/Contents/MacOS/Foo"), "Foo")
        self.assertEqual(self.script(""), "")

    def test_script_enthaelt_keine_argumente(self):
        self.assertEqual(self.script("python3 tool.py --token=geheim"), "tool.py")

    def test_klasse(self):
        root = "/Users/KN/CAS/projekte/anno-clone"
        k = lambda c: loadsnap.classify(c, root)  # noqa: E731
        self.assertEqual(k(f"python3 {root}/.worktrees/x/a.py"), "eigen")
        self.assertEqual(k("node /x/node_modules/vitest/dist/workers/forks.js"), "eigen")
        self.assertEqual(k("make check"), "eigen")
        self.assertEqual(k("/usr/bin/make studio-test"), "eigen")
        self.assertEqual(k("python3 pushcheck.py"), "eigen")
        self.assertEqual(k("Google Chrome --user-data-dir=/tmp/.studio/p"), "eigen")
        self.assertEqual(k("Google Chrome --user-data-dir=/Users/x/Library/Chrome"), "fremd")
        self.assertEqual(k("/Applications/Foo.app/Contents/MacOS/Foo"), "fremd")
        self.assertEqual(k("python3 other.py"), "fremd")

    def test_snapshot_summen_und_felder(self):
        text = (
            "  1 10.04 python3 /Users/KN/CAS/projekte/anno-clone/a.py\n"
            "  2 20.0 node vitest run\n"
            "  3 5.06 /Applications/Foo Bar.app/Contents/MacOS/Foo\n"
            "  4 1.0 vim\n"
            "  5 0.5 a\n  6 0.4 b\n  7 0.3 c\n"
        )
        snap = loadsnap.parse_snapshot(text, 1.0)
        self.assertEqual(snap["cpu_eigen"], 30.0)
        self.assertEqual(snap["cpu_fremd"], 7.3)
        top = snap["top5"]
        self.assertEqual(top[0]["pid"], 2)
        self.assertEqual(top[0]["script"], "vitest")
        self.assertEqual(top[0]["klasse"], "eigen")
        self.assertEqual(top[1]["script"], "a.py")
        self.assertEqual(top[2]["klasse"], "fremd")
        line = loadsnap.format_line(snap)
        self.assertIn("CPU eigen 30.0% / fremd 7.3%", line)
        self.assertNotIn("\n", line)

    def test_record_schreibt_neue_felder(self):
        d = tempfile.mkdtemp()
        self.addCleanup(lambda: __import__("shutil").rmtree(d, True))
        with mock.patch.dict(os.environ, {"STUDIO_HOME": d}):
            loadsnap.record("load", "manual", loadsnap.parse_snapshot(PS, 1.0))
        (ev,) = [json.loads(x) for x in (Path(d) / "events.jsonl").read_text().splitlines()]
        self.assertIn("cpu_eigen", ev)
        self.assertIn("cpu_fremd", ev)
        self.assertIn("script", ev["top5"][0])
        self.assertIn("klasse", ev["top5"][0])


class FixtureTest(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        self.addCleanup(lambda: __import__("shutil").rmtree(self.dir, True))
        self.ps = self.dir / "ps.txt"
        self.ps.write_text(PS)
        patcher = mock.patch.dict(
            os.environ,
            {"LOADSNAP_PS_FIXTURE": str(self.ps), "STUDIO_HOME": str(self.dir / "s")},
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def events(self):
        path = self.dir / "s" / "events.jsonl"
        if not path.exists():
            return []
        return [json.loads(x) for x in path.read_text().splitlines()]

    def test_real_snapshot_liest_fixture(self):
        snap = loadsnap.real_snapshot(load=4.0)
        self.assertEqual(snap["vitest_workers"], 3)
        self.assertEqual(snap["load"], 4.0)

    def test_real_snapshot_ohne_ps_ist_leer_statt_fehler(self):
        os.environ["LOADSNAP_PS_FIXTURE"] = str(self.dir / "fehlt.txt")
        snap = loadsnap.real_snapshot(load=2.0)
        self.assertEqual(snap["top5"], [])
        self.assertEqual(snap["vitest_workers"], 0)

    def test_record_schreibt_event(self):
        snap = loadsnap.parse_snapshot(PS, 9.0)
        loadsnap.record("load", "testlock", snap)
        (event,) = self.events()
        self.assertEqual(event["kind"], "load_abort")
        self.assertEqual(event["reason"], "load")
        self.assertEqual(event["source"], "testlock")
        self.assertEqual(event["load"], 9.0)
        self.assertEqual(event["vitest_workers"], 3)
        self.assertEqual(len(event["top5"]), 5)
        self.assertIn("ts", event)

    def test_cli_druckt_zeile_und_schreibt_event(self):
        p = subprocess.run(
            [sys.executable, str(SCRIPT), "--reason", "lock", "--source", "testlock",
             "--load", "9"],
            check=False, capture_output=True, text=True, env=os.environ.copy(),
        )  # fmt: skip
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertIn("Lastprotokoll: Load 9.00", p.stderr)
        (event,) = self.events()
        self.assertEqual(event["reason"], "lock")


if __name__ == "__main__":
    unittest.main()
