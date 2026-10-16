import contextlib
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import pushcheck

CHECK_PUSH = "make check-push"
CHECK_TS = "node tools/zeitreserve/check.ts"
VITEST = "node tools/testlock/testlock.ts"
PERF = "make check-ci-perf"


class Harness:
    """Fake-Runner, Fake-Load, Fake-Schlaf und Fake-Git für pushcheck.main."""

    def __init__(self, test: unittest.TestCase, loads=(1.0,)):
        self.dir = Path(tempfile.mkdtemp())
        test.addCleanup(lambda: __import__("shutil").rmtree(self.dir, True))
        self.marked = self.dir / "marked.json"
        self.retry_out = self.dir / "retry.json"
        self.measurement = self.dir / "zeitreserve.json"
        self.studio = self.dir / "studio"
        self.loads = list(loads)
        self.sleeps = 0
        self.calls: list[tuple[str, dict | None]] = []
        self.handlers: dict[str, object] = {}
        self.git_states = [("abc", ""), ("abc", "")]
        self.output = io.StringIO()
        ps = self.dir / "ps.txt"
        ps.write_text("  11 90.0 node vitest worker\n  12 5.0 bash\n")
        patcher = mock.patch.dict(
            os.environ,
            {"STUDIO_HOME": str(self.studio), "LOADSNAP_PS_FIXTURE": str(ps)},
        )
        patcher.start()
        test.addCleanup(patcher.stop)

    def load(self) -> float:
        return self.loads.pop(0) if len(self.loads) > 1 else self.loads[0]

    def sleep(self, _seconds: float) -> None:
        self.sleeps += 1

    def git(self) -> tuple[str, str]:
        states = self.git_states
        return states.pop(0) if len(states) > 1 else states[0]

    def run(self, cmd, env=None) -> tuple[int, str]:
        key = " ".join(cmd)
        self.calls.append((key, env))
        for prefix, handler in self.handlers.items():
            if key.startswith(prefix):
                return handler(cmd) if callable(handler) else handler
        return 0, ""

    def names(self) -> list[str]:
        return [key for key, _ in self.calls]

    def count(self, prefix: str) -> int:
        return sum(1 for key in self.names() if key.startswith(prefix))

    def go(self) -> int:
        with contextlib.redirect_stdout(self.output):
            return pushcheck.main(
                run=self.run,
                load=self.load,
                sleep=self.sleep,
                git=self.git,
                marked=self.marked,
                retry_out=self.retry_out,
                measurement=self.measurement,
            )

    def events(self) -> list[dict]:
        path = self.studio / "events.jsonl"
        if not path.exists():
            return []
        return [json.loads(line) for line in path.read_text().splitlines()]

    def measure(self, load_start) -> None:
        data = {} if load_start is None else {"loadStart": load_start}
        self.measurement.write_text(json.dumps(data))

    def check_ts(self, code: int, marked=None, load_start=None):
        """check.ts --push: schreibt (oder löscht) die Liste und gibt den Code zurück."""

        def handler(cmd):
            if "--retry" in cmd:
                return 0, ""
            self.measure(load_start)
            if marked is not None:
                self.marked.write_text(marked)
            return code, ""

        self.handlers[CHECK_TS] = handler


class PushCheckTest(unittest.TestCase):
    def test_lint_rot_bricht_vor_check_push_ab(self):
        h = Harness(self)
        h.handlers["make lint"] = (2, "")
        self.assertEqual(h.go(), 1)
        self.assertEqual(h.count(CHECK_PUSH), 0)
        self.assertEqual(
            h.names()[:3], ["make conflicts", "npx tsc --noEmit", "make lint"]
        )
        self.assertEqual(h.count("make zeittests"), 0)

    def test_load_warten(self):
        h = Harness(
            self, loads=(*[1.0] * len(pushcheck.PRECHECKS), 5, 4, 2.9)
        )  # Stufen lesen den Load vorab
        h.check_ts(0, marked="[]")
        self.assertEqual(h.go(), 0)
        self.assertEqual(h.sleeps, 2)
        self.assertEqual(h.count(CHECK_PUSH), 1)

    def test_load_immer_hoch_gibt_exit_2(self):
        h = Harness(self, loads=(5,))
        self.assertEqual(h.go(), 2)
        self.assertEqual(h.count(CHECK_PUSH), 0)
        self.assertLessEqual(h.sleeps, pushcheck.WAIT_MAX_S // pushcheck.POLL_S + 1)

    def test_nachmessung_bei_exit_2_mit_markierten_dateien(self):
        h = Harness(self)
        h.check_ts(2, marked='["tests/ui/a.test.ts"]')
        self.assertEqual(h.go(), 0)
        self.assertEqual(h.count("make check "), 0)
        self.assertEqual(h.names().count(CHECK_PUSH), 1)
        vitest = [(k, e) for k, e in h.calls if k.startswith(VITEST)]
        self.assertEqual(len(vitest), 1)
        self.assertIn("vitest run tests/ui/a.test.ts --reporter", vitest[0][0])
        self.assertEqual(vitest[0][1]["ZEITRESERVE_OUT"], str(h.retry_out))
        self.assertEqual(sum("--retry" in k for k in h.names()), 1)

    def test_exit_1_wird_immer_nachgemessen(self):
        for load_start in (0.5, 2.5, 3.0, 3.6, None):
            with self.subTest(load_start=load_start):
                h = Harness(self)
                h.check_ts(1, marked='["tests/a.test.ts"]', load_start=load_start)
                h.handlers["make check-ci-perf"] = (0, "")
                code = h.go()
                self.assertEqual(h.count(VITEST), 1)
                self.assertEqual(code, 0)

    def test_markierungsliste_d1_und_b1(self):
        h = Harness(self)
        h.check_ts(2, marked="[]")
        self.assertEqual(h.go(), 0)
        self.assertEqual(h.count(VITEST), 0)
        h = Harness(self)
        h.check_ts(2, marked=None)
        self.assertEqual(h.go(), 2)
        h = Harness(self)
        h.check_ts(2, marked="kein json")
        self.assertEqual(h.go(), 2)
        self.assertEqual(h.count(VITEST), 0)

    def test_veraltete_markierung_wird_vor_check_push_geloescht(self):
        h = Harness(self)
        h.marked.write_text('["alt.test.ts"]')
        seen = {}

        def check_push(_cmd):
            seen["marked_existed"] = h.marked.exists()
            return 0, ""

        h.handlers[CHECK_PUSH] = check_push
        h.check_ts(2, marked=None)
        # check.ts löscht/schreibt nichts: Datei fehlt -> Exit 2
        self.assertEqual(h.go(), 2)
        self.assertFalse(seen["marked_existed"])
        self.assertEqual(h.count(VITEST), 0)

    def test_arbeitsbaum_veraendert(self):
        h = Harness(self)
        h.check_ts(0, marked="[]")
        h.git_states = [("abc", " M src/a.ts"), ("abc", " M src/a.ts\n M src/b.ts")]
        self.assertEqual(h.go(), 1)
        h = Harness(self)
        h.check_ts(0, marked="[]")
        h.git_states = [("abc", ""), ("def", "")]
        self.assertEqual(h.go(), 1)
        h = Harness(self)  # ungetrackte Dateien erscheinen nicht im Status
        h.check_ts(0, marked="[]")
        self.assertEqual(h.go(), 0)

    def test_perf_rot_und_testsperre(self):
        h = Harness(self)
        h.check_ts(0, marked="[]")
        h.handlers[PERF] = (1, "")
        self.assertEqual(h.go(), 1)
        h = Harness(self)
        h.handlers[CHECK_PUSH] = (2, "testlock: ABBRUCH, voller Testlauf läuft bereits")
        self.assertEqual(h.go(), 3)
        self.assertEqual(h.count(CHECK_TS), 0)
        h = Harness(self)
        h.handlers[CHECK_PUSH] = (2, "FAIL tests/x")
        self.assertEqual(h.go(), 1)

    def _retry_harness(self, retry_code: int):
        h = Harness(self)
        h.check_ts(2, marked='["tests/a.test.ts"]')
        base = h.handlers[CHECK_TS]

        def handler(cmd):
            return (retry_code, "") if "--retry" in cmd else base(cmd)

        h.handlers[CHECK_TS] = handler
        return h

    def test_ergebnis_der_nachmessung_wird_durchgereicht(self):
        for retry_code in (1, 2):
            with self.subTest(retry_code=retry_code):
                h = self._retry_harness(retry_code)
                self.assertEqual(h.go(), retry_code)
                self.assertEqual(h.count(PERF), 0)

    def test_testsperre_in_der_nachmessung_gibt_exit_3(self):
        h = Harness(self)
        h.check_ts(2, marked='["tests/a.test.ts"]')
        h.handlers[VITEST] = (2, "testlock: ABBRUCH, voller Testlauf läuft bereits")
        self.assertEqual(h.go(), 3)
        self.assertEqual(h.count(VITEST), 1)
        self.assertEqual(sum("--retry" in k for k in h.names()), 0)

    def test_exit_1_mit_leerer_oder_ungueltiger_liste(self):
        for marked, expected in (("[]", 1), (None, 2), ("kein json", 2)):
            with self.subTest(marked=marked):
                h = Harness(self)
                h.check_ts(1, marked=marked, load_start=3.6)
                self.assertEqual(h.go(), expected)
                self.assertEqual(h.count(VITEST), 0)
                self.assertEqual(h.count(PERF), 0)

    def test_nachmessung_wartet_zu_lange_auf_ruhe(self):
        h = Harness(self, loads=(1.0, 5.0))
        h.check_ts(2, marked='["tests/a.test.ts"]')
        self.assertEqual(h.go(), 2)
        self.assertEqual(h.count(VITEST), 0)
        self.assertEqual(sum("--retry" in k for k in h.names()), 0)
        self.assertEqual(h.count(PERF), 0)

    def test_vitest_der_nachmessung_rot_ohne_abbruch_gibt_exit_1(self):
        h = Harness(self)
        h.check_ts(2, marked='["tests/a.test.ts"]')
        h.handlers[VITEST] = (1, "FAIL tests/a.test.ts")
        self.assertEqual(h.go(), 1)
        self.assertEqual(sum("--retry" in k for k in h.names()), 0)

    def test_d1_ist_im_ereignis_und_in_der_schlusszeile_sichtbar(self):
        h = Harness(self)
        h.check_ts(2, marked="[]", load_start=6.2)
        self.assertEqual(h.go(), 0)
        (event,) = h.events()
        self.assertIs(event["d1"], True)
        self.assertEqual(event["main_load_start"], 6.2)
        last = h.output.getvalue().strip().splitlines()[-1]
        self.assertIn(" · D1 (Last 6.2, leere Liste)", last)
        h = Harness(self)
        h.check_ts(0, marked="[]", load_start=1.5)
        self.assertEqual(h.go(), 0)
        (event,) = h.events()
        self.assertIs(event["d1"], False)
        self.assertNotIn("D1", h.output.getvalue())

    def test_steps_tragen_load_je_stufe(self):
        h = Harness(self, loads=(1.04, 1.26, 1.5, 1.7, 2.9))
        h.check_ts(0, marked="[]")
        self.assertEqual(h.go(), 0)
        (event,) = h.events()
        loads = [step["load"] for step in event["steps"]]
        self.assertTrue(loads)
        self.assertEqual(loads[0], 1.0)
        self.assertTrue(all(isinstance(x, float) for x in loads))
        self.assertGreater(len(set(loads)), 1)

    def test_load_fehler_stoppt_stufe_nicht(self):
        h = Harness(self)

        def broken() -> float:
            raise OSError("kein getloadavg")

        h.load = broken
        h.check_ts(0, marked="[]")
        with mock.patch.object(pushcheck.Gate, "wait_quiet", return_value=True):
            self.assertEqual(h.go(), 0)
        (event,) = h.events()
        self.assertEqual(event["exit"], 0)
        self.assertTrue(all(step["load"] is None for step in event["steps"]))

    def test_wait_quiet_load_fehler_gilt_als_unruhig_und_wird_gezaehlt(self):
        h = Harness(self)

        def broken() -> float:
            raise OSError("kein getloadavg")

        h.load = broken
        h.check_ts(0, marked="[]")
        self.assertEqual(h.go(), 2)  # kein ruhiges Fenster bis zur Frist, kein Absturz
        (event,) = [e for e in h.events() if e["kind"] == "push_check"]
        self.assertGreater(event["load_errors"], 0)
        self.assertEqual(h.count(CHECK_PUSH), 0)

    def test_kein_ruhiges_fenster_schreibt_lastprotokoll(self):
        h = Harness(self, loads=(9.0,))
        h.check_ts(0, marked="[]")
        self.assertEqual(h.go(), 2)
        out = h.output.getvalue()
        self.assertIn("Lastprotokoll: Load 9.00", out)
        self.assertIn("Vitest-Worker: 1", out)
        snaps = [e for e in h.events() if e["kind"] == "load_abort"]
        (snap,) = snaps
        self.assertEqual(snap["source"], "pushcheck")
        self.assertEqual(snap["reason"], "kein_ruhiges_fenster")
        self.assertEqual(snap["top5"][0]["pid"], 11)

    def test_lastprotokoll_fehler_aendern_exit_nicht(self):
        h = Harness(self, loads=(9.0,))
        h.check_ts(0, marked="[]")
        with mock.patch("loadsnap.record", side_effect=OSError("voll")):
            self.assertEqual(h.go(), 2)

    def test_ereignis_schlusszeile_und_schreibfehler(self):
        h = Harness(self)
        h.check_ts(0, marked="[]")
        self.assertEqual(h.go(), 0)
        (event,) = h.events()
        self.assertEqual(event["kind"], "push_check")
        self.assertEqual(event["full_checks"], 1)
        self.assertEqual(event["exit"], 0)
        self.assertEqual(event["head"], "abc")
        self.assertEqual(event["retry_files"], 0)
        self.assertEqual(event["steps"][0]["name"], "conflicts")
        last = h.output.getvalue().strip().splitlines()[-1]
        self.assertRegex(
            last,
            r"^push-check: EXIT=0 · geprüfter Hash abc · check-push 1× · Nachmessung 0 \(0 Dateien\) · \d+:\d\d$",
        )
        h = Harness(self)
        h.check_ts(0, marked="[]")
        with mock.patch("paths.append_event", side_effect=OSError("voll")):
            self.assertEqual(h.go(), 0)


class GateTest(unittest.TestCase):
    """main_gate: strenge Zeitreserve nur für die markierten Dateien (R598 V1)."""

    def go(self, h: Harness) -> int:
        with contextlib.redirect_stdout(h.output):
            return pushcheck.main_gate(
                run=h.run,
                load=h.load,
                sleep=h.sleep,
                git=h.git,
                marked=h.marked,
                retry_out=h.retry_out,
                measurement=h.measurement,
            )

    def test_liste_wird_aus_aktueller_messung_neu_berechnet(self):
        """Veraltete Liste (anderer Lauf) darf nicht gemessen werden: Befund REL-21."""
        h = Harness(self)
        h.marked.write_text('["alt.test.ts"]')
        h.check_ts(0, marked='["neu1.test.ts", "neu2.test.ts"]')
        self.assertEqual(self.go(h), 0)
        (vitest,) = [k for k in h.names() if k.startswith(VITEST)]
        self.assertIn("neu1.test.ts", vitest)
        self.assertIn("neu2.test.ts", vitest)
        self.assertNotIn("alt.test.ts", vitest)

    def test_unbrauchbare_messung_loescht_liste_exit_2(self):
        h = Harness(self)
        h.marked.write_text('["alt.test.ts"]')
        h.handlers[CHECK_TS] = lambda cmd: (h.marked.unlink(), (2, ""))[1]
        self.assertEqual(self.go(h), 2)
        self.assertEqual(h.count(VITEST), 0)

    def test_gruen_nach_nachmessung(self):
        h = Harness(self)
        h.marked.write_text('["tests/a.test.ts"]')
        self.assertEqual(self.go(h), 0)
        self.assertEqual(h.count(VITEST), 1)
        self.assertEqual(h.count(CHECK_PUSH), 0)
        self.assertIn("zeitreserve-gate: grün", h.output.getvalue())

    def test_leere_liste_ist_gruen_mit_hinweis(self):
        h = Harness(self)
        h.marked.write_text("[]")
        self.assertEqual(self.go(h), 0)
        self.assertEqual(h.count(VITEST), 0)
        self.assertIn("nichts zu messen", h.output.getvalue())
        self.assertIn("zeitreserve-gate: grün", h.output.getvalue())

    def test_substanz_gibt_exit_1(self):
        h = Harness(self)
        h.marked.write_text('["a.ts", "b.ts"]')
        h.handlers[CHECK_TS] = (1, "")
        self.assertEqual(self.go(h), 1)
        self.assertIn("zeitreserve-gate: SUBSTANZ (2 Dateien", h.output.getvalue())

    def test_last_gibt_exit_2(self):
        h = Harness(self, loads=(5,))
        h.marked.write_text('["a.ts"]')
        self.assertEqual(self.go(h), 2)
        self.assertEqual(h.count(VITEST), 0)
        self.assertIn(
            "zeitreserve-gate: nicht belastbar (Last 5.0", h.output.getvalue()
        )

    def test_fehlende_liste_gibt_exit_2(self):
        h = Harness(self)
        self.assertEqual(self.go(h), 2)
        self.assertIn("zeitreserve-gate: nicht belastbar", h.output.getvalue())
        self.assertIn("Markierungsliste", h.output.getvalue())

    def test_ungueltige_liste_gibt_exit_2(self):
        h = Harness(self)
        h.marked.write_text("{kaputt")
        self.assertEqual(self.go(h), 2)

    def test_testsperre_gibt_exit_3(self):
        h = Harness(self)
        h.marked.write_text('["a.ts"]')
        h.handlers[VITEST] = (1, "testlock: ABBRUCH belegt")
        self.assertEqual(self.go(h), 3)
        self.assertIn("Testsperre", h.output.getvalue())

    def test_ereignis(self):
        h = Harness(self)
        h.marked.write_text('["a.ts"]')
        self.go(h)
        (event,) = [e for e in h.events() if e["kind"] == "zeitreserve_gate"]
        self.assertEqual(event["exit"], 0)
        self.assertEqual(event["retry_files"], 1)
        self.assertIn("duration_s", event)
        self.assertTrue(event["steps"])

    def test_ereignis_schreibfehler_aendert_exit_nicht(self):
        h = Harness(self)
        h.marked.write_text("[]")
        with (
            mock.patch.object(pushcheck.paths, "append_event", side_effect=OSError),
            contextlib.redirect_stderr(io.StringIO()),
        ):
            self.assertEqual(self.go(h), 0)


if __name__ == "__main__":
    unittest.main()
