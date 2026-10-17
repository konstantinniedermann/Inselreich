import contextlib
import hashlib
import io
import json
import os
import re
import signal
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path
from typing import ClassVar
from unittest import mock

import efficiency
import metrics
import model
import paths as paths_module
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

    def test_vitest_collection_error_gives_file_name(self):
        lines = ["FAIL  tests/ui/foo.test.ts [ tests/ui/foo.test.ts ]"]
        self.assertEqual(testrun.parse_names(lines, "vitest"), ["tests/ui/foo.test.ts"])

    def test_unittest_import_error_gives_module_name(self):
        lines = ["ERROR: tests.test_x (unittest.loader._FailedTest.tests.test_x)"]
        self.assertEqual(testrun.parse_names(lines, "studio"), ["tests.test_x"])

    def test_success_lines_give_no_names(self):
        lines = [" \u2713 tests/ui/foo.test.ts (3 tests)", "ok: tests.test_x"]
        self.assertEqual(testrun.parse_names(lines, "vitest"), [])
        self.assertEqual(testrun.parse_names(lines, "studio"), [])

    def test_names_capped(self):
        lines = [f"FAIL: test_{i} (m.K.test_{i})" for i in range(80)]
        lines.append("FAIL: test_long (m.K." + "x" * 300 + ")")
        names = testrun.parse_names(lines, "studio")
        self.assertEqual(len(names), 50)
        self.assertTrue(all(len(n) <= 200 for n in names))


class MessagesTest(unittest.TestCase):
    NAME = "tests/render/terrain.test.ts > R170 > Kachelraster"

    def vitest(self, *body):
        return [f" FAIL  {self.NAME}", *body, " FAIL  tests/b.test.ts > Anderer"]

    def test_timeout_message(self):
        lines = self.vitest("Error: Test timed out in 5000ms.", " \u276f x.ts:1")
        found = testrun.parse_messages(lines, "vitest")
        self.assertEqual(found[self.NAME], "Error: Test timed out in 5000ms.")

    def test_assertion_message_first_line(self):
        lines = self.vitest(
            " \u276f tests/x.ts:9",
            "AssertionError: expected 2.4 to be less than or equal to 2.3",
            "Error: spaeter",
        )
        found = testrun.parse_messages(lines, "vitest")
        self.assertEqual(
            found[self.NAME],
            "AssertionError: expected 2.4 to be less than or equal to 2.3",
        )

    def test_long_message_is_cut(self):
        found = testrun.parse_messages(self.vitest("Error: " + "x" * 500), "vitest")
        self.assertEqual(len(found[self.NAME]), 200)

    def test_message_belongs_to_its_own_name_only(self):
        lines = self.vitest()
        lines.append("Error: gehoert zu b")
        found = testrun.parse_messages(lines, "vitest")
        self.assertNotIn(self.NAME, found)
        self.assertEqual(found["tests/b.test.ts > Anderer"], "Error: gehoert zu b")

    def test_unittest_message(self):
        lines = [
            "FAIL: test_x (test_mod.Klasse.test_x)",
            "-" * 20,
            "Traceback (most recent call last):",
            '  File "x.py", line 3, in test_x',
            "AssertionError: 1 != 2",
            "=" * 20,
            "ERROR: test_y (test_mod.Andere.test_y)",
        ]
        found = testrun.parse_messages(lines, "studio")
        self.assertEqual(found, {"Klasse.test_x": "AssertionError: 1 != 2"})

    def test_no_message_gives_empty(self):
        self.assertEqual(
            testrun.parse_messages(self.vitest(" \u276f x.ts:1"), "vitest"), {}
        )

    def test_red_event_carries_messages_and_names(self):
        lines = self.vitest("Error: Test timed out in 5000ms.")
        event = testrun.build_event("vitest", 1, lines)
        self.assertEqual(event["names"], [self.NAME, "tests/b.test.ts > Anderer"])
        self.assertEqual(
            event["messages"], {self.NAME: "Error: Test timed out in 5000ms."}
        )

    def test_red_event_without_message_has_no_messages_key(self):
        event = testrun.build_event("vitest", 1, self.vitest())
        self.assertIn("names", event)
        self.assertNotIn("messages", event)

    def test_green_event_has_neither(self):
        event = testrun.build_event("vitest", 0, self.vitest("Error: x"))
        self.assertNotIn("names", event)
        self.assertNotIn("messages", event)

    def test_event_carries_working_tree(self):
        event = testrun.build_event("vitest", 0, [])
        self.assertIn("tree", event)
        self.assertIsInstance(event["tree"], str)
        self.assertNotIn("/Users", event["tree"])  # relativ zur Repo-Wurzel

    def test_tree_failure_drops_field_but_event_stays(self):
        real = testrun._git

        def broken(*args):
            if "--show-toplevel" in args or "--git-common-dir" in args:
                raise OSError("kein git")
            return real(*args)

        with mock.patch.object(testrun, "_git", broken):
            event = testrun.build_event("vitest", 0, [])
        self.assertNotIn("tree", event)
        self.assertEqual(event["kind"], "test_passed")

    def test_unparsable_input_never_raises(self):
        self.assertEqual(testrun.parse_messages([None, 3], "vitest"), {})


class RunBase(unittest.TestCase):
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


class RunTest(RunBase):
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
        self.assertEqual([e["kind"] for e in self.events()], ["test_aborted"])

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

    # --- Eskalation, Prozessgruppe, Abbruch-Ereignis (T05) -------------------

    def spawn_stubborn_family(self):
        """Kind und Enkel ignorieren SIGTERM; meldet Bereitschaft per Datei."""
        base = self.home.parent
        base.mkdir(parents=True, exist_ok=True)
        ready = base / "ready"
        grandchild = (
            "import signal, time, pathlib; signal.signal(signal.SIGTERM, signal.SIG_IGN); "
            f"pathlib.Path({str(base / 'gready')!r}).write_text(str(__import__('os').getpid())); "
            "time.sleep(60)"
        )
        child = (
            "import os, signal, subprocess, sys, time, pathlib; "
            "signal.signal(signal.SIGTERM, signal.SIG_IGN); "
            f"subprocess.Popen([sys.executable, '-c', {grandchild!r}]); "
            f"g = pathlib.Path({str(base / 'gready')!r}); "
            "\nwhile not g.exists() or not g.read_text(): time.sleep(0.01)\n"
            f"pathlib.Path({str(ready)!r}).write_text(f'{{os.getpid()}} {{g.read_text()}}'); "
            "time.sleep(60)"
        )
        return ready, py(child)

    def interrupt_when_ready(self, ready, sig=signal.SIGINT):
        def wait_then_signal():
            while not ready.exists() or not ready.read_text().count(" "):
                time.sleep(0.01)
            os.kill(os.getpid(), sig)

        threading.Thread(target=wait_then_signal, daemon=True).start()

    def assert_dead(self, pids):
        for pid in pids:
            for _ in range(300):
                try:
                    os.kill(pid, 0)
                except ProcessLookupError:
                    break
                time.sleep(0.01)
            else:
                os.kill(pid, signal.SIGKILL)  # Aufräumen, dann Test rot
                self.fail(f"Prozess {pid} lebt noch")

    def test_sigterm_ignoring_family_is_killed_on_ctrl_c(self):
        ready, child = self.spawn_stubborn_family()
        self.interrupt_when_ready(ready)
        with mock.patch.object(testrun, "GRACE", 0.3):
            began = time.monotonic()
            code, _, err = self.run_main(["--suite", "studio"], child)
        self.assertEqual(code, 128 + signal.SIGINT)
        self.assertNotIn("Traceback", err)
        self.assertLess(time.monotonic() - began, 10)
        self.assert_dead([int(x) for x in ready.read_text().split()])

    def test_terminate_signal_stops_family_and_exits_130(self):
        ready, child = self.spawn_stubborn_family()
        self.interrupt_when_ready(ready, signal.SIGTERM)
        previous = signal.getsignal(signal.SIGTERM)
        with mock.patch.object(testrun, "GRACE", 0.3):
            code, _, _ = self.run_main(["--suite", "studio"], child)
        self.assertEqual(code, 130)
        self.assertEqual(signal.getsignal(signal.SIGTERM), previous)
        self.assert_dead([int(x) for x in ready.read_text().split()])
        self.assertEqual([e["kind"] for e in self.events()], ["test_aborted"])

    def test_second_interrupt_during_grace_still_kills_family(self):
        ready, child = self.spawn_stubborn_family()
        self.interrupt_when_ready(ready)
        real = testrun._group_alive
        fired = []

        def alive_then_interrupt(pgid):
            if not fired:  # zweiter Ctrl-C mitten in der Schonfrist
                fired.append(True)
                os.kill(os.getpid(), signal.SIGINT)
            return real(pgid)

        with (
            mock.patch.object(testrun, "GRACE", 0.5),
            mock.patch.object(testrun, "_group_alive", alive_then_interrupt),
        ):
            code, _, _ = self.run_main(["--suite", "studio"], child)
        self.assertEqual(code, 130)
        self.assertTrue(fired)
        self.assert_dead([int(x) for x in ready.read_text().split()])

    def test_signals_blocked_before_ignore_and_mask_restored(self):
        calls = []
        old_mask = {signal.SIGUSR2}
        interrupts = {signal.SIGINT, signal.SIGTERM, signal.SIGHUP}

        def fake_mask(how, sigs):
            calls.append(("mask", how, set(sigs)))
            return old_mask

        real_signal = signal.signal

        def fake_signal(sig, handler):
            if handler == signal.SIG_IGN:
                calls.append(("ignore", sig))
            return real_signal(sig, handler)

        proc = subprocess.Popen(["sleep", "30"], start_new_session=True)
        with (
            mock.patch("signal.pthread_sigmask", fake_mask),
            mock.patch("signal.signal", fake_signal),
            mock.patch.object(testrun, "GRACE", 0.5),
        ):
            testrun._stop_group(proc)
        self.assertEqual(calls[0], ("mask", signal.SIG_BLOCK, interrupts))
        first_ignore = next(i for i, c in enumerate(calls) if c[0] == "ignore")
        self.assertGreater(first_ignore, 0)
        masks = [c for c in calls if c[0] == "mask"]
        self.assertEqual(masks[-1], ("mask", signal.SIG_SETMASK, old_mask))
        self.assertGreater(calls.index(masks[-1]), first_ignore)
        self.assertIsNotNone(proc.poll())

    def test_interrupt_signals_tolerate_missing_sighup(self):
        class NoHup:
            SIGINT = signal.SIGINT
            SIGTERM = signal.SIGTERM

        self.assertEqual(
            testrun._interrupt_signals(NoHup), (signal.SIGINT, signal.SIGTERM)
        )
        self.assertIn(signal.SIGINT, testrun._INTERRUPTS)

    def test_child_gets_own_process_group(self):
        code, out, _ = self.run_main(
            ["--suite", "studio"], py("import os; print(os.getpgrp() == os.getpid())")
        )
        self.assertEqual(code, 0)
        self.assertIn("True", out)

    def test_keyboard_interrupt_records_aborted(self):
        with mock.patch.object(testrun, "_run", side_effect=KeyboardInterrupt):
            code, _, _ = self.run_main(["--suite", "vitest"], py("pass"))
        self.assertEqual(code, 130)
        (event,) = self.events()
        self.assertEqual(event["kind"], "test_aborted")
        self.assertEqual(event["suite"], "vitest")
        self.assertEqual(event["source"], "make")
        for field in ("commit", "diff", "ts", "session_id"):
            self.assertIn(field, event)
        self.assertNotIn("names", event)

    def test_aborted_not_written_in_ci(self):
        with (
            mock.patch.dict(os.environ, {"CI": "true"}),
            mock.patch.object(testrun, "_run", side_effect=KeyboardInterrupt),
        ):
            self.run_main(["--suite", "studio"], py("pass"))
        self.assertEqual(self.events(), [])

    def test_record_aborted_swallows_write_errors(self):
        err = io.StringIO()
        with (
            mock.patch.object(paths_module, "append_event", side_effect=OSError("x")),
            contextlib.redirect_stderr(err),
        ):
            testrun._record_aborted("studio")  # wirft nicht
        self.assertIn("testrun: Abbruch-Event nicht geschrieben (x)", err.getvalue())
        with (
            mock.patch.object(testrun, "_run", side_effect=KeyboardInterrupt),
            mock.patch.object(paths_module, "append_event", side_effect=OSError("x")),
        ):
            code, _, err = self.run_main(["--suite", "studio"], py("pass"))
        self.assertEqual(code, 130)  # KeyboardInterrupt bleibt Abbruch, nicht Fehler
        self.assertIn("testrun:", err)

    def test_missing_command_does_not_raise(self):
        code, _, err = self.run_main(["--suite", "studio"], ["/nicht/vorhanden"])
        self.assertNotEqual(code, 0)
        self.assertIn("testrun:", err)


class LoadWorkersTest(RunBase):
    ECHO = "import os; print(os.environ.get('VITEST_MAX_WORKERS', 'unset'))"

    def run_with_load(self, load, suite="vitest", preset=None):
        env = {} if preset is None else {"VITEST_MAX_WORKERS": preset}
        with (
            mock.patch.dict(os.environ, env),
            mock.patch.object(testrun.os, "getloadavg", return_value=(load, 0, 0)),
        ):
            if preset is None:
                os.environ.pop("VITEST_MAX_WORKERS", None)
            _, out, _ = self.run_main(["--suite", suite], py(self.ECHO))
        return out.strip(), self.events()[-1]

    def test_passed_event_has_load_and_workers(self):
        _, event = self.run_with_load(3.04)
        self.assertEqual(event["kind"], "test_passed")
        self.assertEqual(event["load"], 3.0)
        self.assertIsInstance(event["workers"], int)

    def test_high_load_caps_workers_for_child(self):
        seen, event = self.run_with_load(9.0)
        self.assertEqual(seen, str(testrun.WORKER_CAP))
        self.assertEqual(event["workers"], testrun.WORKER_CAP)
        self.assertEqual(event["load"], 9.0)

    def test_load_band_below_testlock_limit_caps_workers(self):
        for load in (6.0, 7.5):
            with self.subTest(load=load):
                seen, event = self.run_with_load(load)
                self.assertEqual(seen, str(testrun.WORKER_CAP))
                self.assertEqual(event["workers"], testrun.WORKER_CAP)

    def test_load_just_below_cap_leaves_variable_alone(self):
        seen, _ = self.run_with_load(5.9)
        self.assertEqual(seen, "unset")

    def test_cap_is_below_testlock_limit(self):
        source = (
            Path(__file__).resolve().parents[2] / "testlock" / "testlock.ts"
        ).read_text(encoding="utf-8")
        match = re.search(r"export const LOAD_MAX\s*=\s*([\d.]+)", source)
        self.assertIsNotNone(match)
        self.assertLess(testrun.LOAD_CAP, float(match.group(1)))

    def test_low_load_leaves_variable_alone(self):
        seen, event = self.run_with_load(3.0)
        self.assertEqual(seen, "unset")
        self.assertEqual(event["workers"], max(1, (os.cpu_count() or 2) - 1))

    def test_preset_workers_are_kept(self):
        seen, event = self.run_with_load(9.0, preset="2")
        self.assertEqual(seen, "2")
        self.assertEqual(event["workers"], 2)

    def test_studio_suite_has_no_workers(self):
        seen, event = self.run_with_load(9.0, suite="studio")
        self.assertEqual(seen, "unset")
        self.assertNotIn("workers", event)
        self.assertEqual(event["load"], 9.0)

    def test_failed_event_has_start_load(self):
        with mock.patch.object(testrun.os, "getloadavg", return_value=(2.0, 0, 0)):
            self.run_main(["--suite", "studio"], py("raise SystemExit(1)"))
        self.assertEqual(self.events()[0]["load"], 2.0)

    def test_unreadable_load_drops_field_and_caps_nothing(self):
        with (
            mock.patch.dict(os.environ),
            mock.patch.object(testrun.os, "getloadavg", side_effect=OSError),
        ):
            os.environ.pop("VITEST_MAX_WORKERS", None)
            _, out, _ = self.run_main(["--suite", "vitest"], py(self.ECHO))
        self.assertEqual(out.strip(), "unset")
        self.assertNotIn("load", self.events()[0])


class AbortedEventConsumersTest(unittest.TestCase):
    """B3: test_aborted ändert weder Zustand, Flake-Verdacht noch Metriken."""

    BASE: ClassVar[tuple] = (
        {
            "kind": "session_start",
            "ts": "2026-09-30T12:00:00.000Z",
            "session_id": "s1",
            "agent_id": "main",
            "source": "hook",
            "status": "idle",
        },
        {
            "kind": "test_failed",
            "ts": "2026-09-30T12:00:01.000Z",
            "session_id": "s1",
            "agent_id": "",
            "source": "make",
            "suite": "studio",
            "commit": "abc",
            "diff": "d1",
            "names": ["K.test_a"],
            "exit": 1,
            "load": 1.0,
        },
        {
            "kind": "test_passed",
            "ts": "2026-09-30T12:00:03.000Z",
            "session_id": "s1",
            "agent_id": "",
            "source": "make",
            "suite": "studio",
            "commit": "abc",
            "diff": "d1",
        },
    )
    ABORTED: ClassVar[dict] = {
        "kind": "test_aborted",
        "ts": "2026-09-30T12:00:02.000Z",
        "session_id": "s1",
        "agent_id": "",
        "source": "make",
        "suite": "studio",
        "commit": "abc",
        "diff": "d1",
    }

    def with_aborted(self):
        return [*self.BASE, self.ABORTED]

    def test_build_state_unchanged_except_feed_line(self):
        now = 1_790_000_000.0
        plain = model.build_state(self.BASE, now, {}, "all")
        extra = model.build_state(self.with_aborted(), now, {}, "all")
        feed = extra.pop("feed")
        self.assertEqual(
            [line["kind"] for line in plain.pop("feed")],
            [line["kind"] for line in feed if line["kind"] != "test_aborted"],
        )
        self.assertEqual(
            json.dumps(plain, sort_keys=True), json.dumps(extra, sort_keys=True)
        )

    def test_flake_suspects_unchanged(self):
        self.assertEqual(
            efficiency.flake_suspects(self.with_aborted()),
            efficiency.flake_suspects(self.BASE),
        )
        self.assertEqual(efficiency.flake_suspects(self.BASE), ["K.test_a"])

    def test_aborted_between_red_and_green_keeps_suspect(self):
        self.assertIn("K.test_a", efficiency.flake_suspects(self.with_aborted()))

    def test_metrics_flakes_unchanged(self):
        self.assertEqual(
            metrics._with_flakes({}, self.with_aborted()),
            metrics._with_flakes({}, self.BASE),
        )

    def test_only_aborted_is_not_measured(self):
        self.assertIsNone(metrics._with_flakes({}, [self.ABORTED])["flakes"])


class DiffHashTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.repo = Path(tmp.name)
        self.git("init", "-q")
        self.git(
            "-c",
            "user.name=t",
            "-c",
            "user.email=t@t",
            "commit",
            "-q",
            "--allow-empty",
            "-m",
            "i",
        )
        previous = os.getcwd()
        os.chdir(self.repo)
        self.addCleanup(os.chdir, previous)

    def git(self, *args):
        subprocess.run(["git", *args], cwd=self.repo, check=True, capture_output=True)

    def test_clean_tree_is_empty_and_stable(self):
        self.assertEqual(testrun._diff_hash(), "")

    def test_diff_hash_sees_untracked_file(self):
        before = testrun._diff_hash()
        (self.repo / "neu.txt").write_text("a", "utf-8")
        created = testrun._diff_hash()
        self.assertNotEqual(before, created)
        self.assertEqual(testrun._diff_hash(), created)  # ohne Änderung stabil
        (self.repo / "neu.txt").write_text("abc", "utf-8")  # Grösse
        self.assertNotEqual(testrun._diff_hash(), created)

    def test_diff_hash_sees_mtime_change(self):
        file = self.repo / "neu.txt"
        file.write_text("a", "utf-8")
        first = testrun._diff_hash()
        stat = file.stat()
        os.utime(file, ns=(stat.st_atime_ns, stat.st_mtime_ns + 5_000_000_000))
        self.assertNotEqual(testrun._diff_hash(), first)

    def test_ignored_files_do_not_count(self):
        (self.repo / ".gitignore").write_text("*.log\n", "utf-8")
        self.git("add", ".gitignore")
        self.git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "g")
        before = testrun._diff_hash()
        (self.repo / "x.log").write_text("laut", "utf-8")
        self.assertEqual(testrun._diff_hash(), before)

    def test_tracked_diff_hash_is_bit_identical_to_old_algorithm(self):
        (self.repo / "t.txt").write_text("a", "utf-8")
        self.git("add", "t.txt")
        diff = subprocess.run(
            ["git", "diff", "HEAD", "--binary"],
            cwd=self.repo,
            check=True,
            capture_output=True,
        ).stdout
        self.assertEqual(testrun._diff_hash(), hashlib.sha1(diff).hexdigest()[:12])


if __name__ == "__main__":
    unittest.main()
