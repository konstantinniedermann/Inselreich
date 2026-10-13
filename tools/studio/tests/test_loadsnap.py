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
