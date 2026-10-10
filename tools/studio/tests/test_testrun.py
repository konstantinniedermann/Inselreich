import contextlib
import io
import json
import os
import signal
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest import mock

import testrun

UNITTEST_OUT = """\
======================================================================
FAIL: test_x (test_mod.Klasse.test_x)
----------------------------------------------------------------------
AssertionError
======================================================================
ERROR: test_y (test_mod.Andere.test_y)
======================================================================
FAIL: test_x (test_mod.Klasse.test_x)
"""

VITEST_OUT = """\
 FAIL  |parallel| tests/ui/a.test.ts > Block > Fall
 FAIL  tests/sim/b.test.ts
 FAIL  |parallel| tests/ui/a.test.ts > Block > Fall
 ✓ tests/ok.test.ts
"""


def py(code: str) -> list[str]:
    return [sys.executable, "-c", code]


class ParserTest(unittest.TestCase):
    def test_unittest_names_parsed(self):
        names = testrun.parse_names(UNITTEST_OUT.splitlines(), "studio")
        self.assertEqual(names, ["Klasse.test_x", "Andere.test_y"])

    def test_vitest_names_parsed(self):
        names = testrun.parse_names(VITEST_OUT.splitlines(), "vitest")
        self.assertEqual(
            names, ["tests/ui/a.test.ts > Block > Fall", "tests/sim/b.test.ts"]
        )

    def test_names_capped(self):
        lines = [f"FAIL: test_{i} (m.K.test_{i})" for i in range(80)]
        lines.append("FAIL: test_long (m.K." + "x" * 300 + ")")
        names = testrun.parse_names(lines, "studio")
        self.assertEqual(len(names), 50)
        self.assertTrue(all(len(n) <= 200 for n in names))


class RunTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.home = Path(tmp.name) / "home"
        env = {"STUDIO_HOME": str(self.home)}
        patcher = mock.patch.dict(os.environ, env)
        patcher.start()
        self.addCleanup(patcher.stop)
        os.environ.pop("CI", None)

    def run_main(self, suite_args, command):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = testrun.main([*suite_args, "--", *command])
        return code, out.getvalue(), err.getvalue()

    def events(self):
        path = self.home / "events.jsonl"
        if not path.is_file():
            return []
        return [json.loads(x) for x in path.read_text("utf-8").splitlines()]

    def test_exit_and_output_pass_through(self):
        code, out, _ = self.run_main(
            ["--suite", "studio"],
            py("print('eins'); print('zwei'); raise SystemExit(4)"),
        )
        self.assertEqual(code, 4)
        self.assertIn("eins\n", out)
        self.assertIn("zwei\n", out)

    def test_stderr_is_merged_into_stdout(self):
        code, out, _ = self.run_main(
            ["--suite", "studio"],
            py("import sys; print('fehler', file=sys.stderr)"),
        )
        self.assertEqual(code, 0)
        self.assertIn("fehler", out)

    def test_failed_event_fields(self):
        code, _, _ = self.run_main(
            ["--suite", "studio"],
            py("print('FAIL: test_a (m.K.test_a)'); raise SystemExit(1)"),
        )
        self.assertEqual(code, 1)
        (event,) = self.events()
        self.assertEqual(event["kind"], "test_failed")
        self.assertEqual(event["source"], "make")
        self.assertEqual(event["suite"], "studio")
        self.assertEqual(event["names"], ["K.test_a"])
        self.assertEqual(event["exit"], 1)
        self.assertRegex(event["commit"], r"^[0-9a-f]{7,}$")
        # Nur Typ/Format: der Hash aus `git diff HEAD --binary` erfasst
        # ungetrackte Dateien nicht, ein Wert ist daher nicht vorhersagbar.
        self.assertRegex(event["diff"], r"^([0-9a-f]{12})?$")
        self.assertIsInstance(event["load"], (int, float))

    def test_passed_event(self):
        code, _, _ = self.run_main(["--suite", "vitest"], py("print('ok')"))
        self.assertEqual(code, 0)
        (event,) = self.events()
        self.assertEqual(event["kind"], "test_passed")
        self.assertEqual(event["suite"], "vitest")
        self.assertRegex(event["commit"], r"^[0-9a-f]{7,}$")
        self.assertRegex(event["diff"], r"^([0-9a-f]{12})?$")
        self.assertNotIn("names", event)

    def test_skip_exit_writes_nothing(self):
        code, _, _ = self.run_main(
            ["--suite", "vitest", "--skip-exit", "3"], py("raise SystemExit(3)")
        )
        self.assertEqual(code, 3)
        self.assertEqual(self.events(), [])

    def test_other_exit_with_skip_exit_still_logged(self):
        self.run_main(
            ["--suite", "vitest", "--skip-exit", "3"], py("raise SystemExit(1)")
        )
        self.assertEqual(self.events()[0]["kind"], "test_failed")

    def test_ci_writes_nothing(self):
        with mock.patch.dict(os.environ, {"CI": "true"}):
            code, _, _ = self.run_main(["--suite", "studio"], py("raise SystemExit(1)"))
        self.assertEqual(code, 1)
        self.assertEqual(self.events(), [])

    def test_event_error_keeps_exit(self):
        blocker = self.home.parent / "datei"
        blocker.write_text("x", "utf-8")
        with mock.patch.dict(os.environ, {"STUDIO_HOME": str(blocker)}):
            code, _, err = self.run_main(
                ["--suite", "studio"], py("raise SystemExit(2)")
            )
        self.assertEqual(code, 2)
        self.assertIn("testrun: Event nicht geschrieben (", err)

    def test_signal_exit_is_128_plus_n(self):
        code, _, _ = self.run_main(
            ["--suite", "studio"],
            py(
                "import os, signal; signal.signal(signal.SIGINT, signal.SIG_DFL); "
                "os.kill(os.getpid(), signal.SIGINT)"
            ),
        )
        self.assertEqual(code, 130)

    def test_ctrl_c_in_runner_exits_quietly(self):
        with mock.patch.object(testrun, "_run", side_effect=KeyboardInterrupt):
            code, _, err = self.run_main(["--suite", "studio"], py("pass"))
        self.assertEqual(code, 130)
        self.assertNotIn("Traceback", err)
        self.assertEqual(self.events(), [])

    def test_ctrl_c_stops_child(self):
        ready = self.home.parent / "ready"
        child = py(
            f"import time, pathlib; pathlib.Path({str(ready)!r}).write_text('x'); "
            "time.sleep(20)"
        )

        def interrupt_when_ready():
            while not ready.exists():
                time.sleep(0.01)
            os.kill(os.getpid(), signal.SIGINT)

        self.home.parent.mkdir(parents=True, exist_ok=True)
        threading.Thread(target=interrupt_when_ready, daemon=True).start()
        began = time.monotonic()
        code, _, err = self.run_main(["--suite", "studio"], child)
        self.assertEqual(code, 130)
        self.assertNotIn("Traceback", err)
        self.assertLess(time.monotonic() - began, 10)

    def test_missing_command_does_not_raise(self):
        code, _, err = self.run_main(["--suite", "studio"], ["/nicht/vorhanden"])
        self.assertNotEqual(code, 0)
        self.assertIn("testrun:", err)


if __name__ == "__main__":
    unittest.main()
