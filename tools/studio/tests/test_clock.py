import subprocess
import sys
import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

import clock

CLOCK_PY = Path(clock.__file__)
CALLS = "import time\nfrom datetime import UTC, datetime\n\na = datetime.now(UTC)\nb = time.time()\n"


def make_folder(root: Path) -> Path:
    (root / "tests").mkdir()
    (root / "a.py").write_text(CALLS + "# datetime.now() im Kommentar\n", "utf-8")
    (root / "clock.py").write_text(CALLS, "utf-8")
    (root / "tests" / "b.py").write_text(CALLS, "utf-8")
    return root


class ClockTest(unittest.TestCase):
    def test_now_is_utc_aware(self):
        value = clock.now()
        self.assertEqual(value.utcoffset(), timedelta(0))
        self.assertAlmostEqual(
            clock.timestamp(), datetime.now(UTC).timestamp(), delta=5
        )

    def test_frozen_fixed_and_restored(self):
        fixed = datetime(2026, 1, 2, 3, 4, 5, tzinfo=UTC)
        with clock.frozen(fixed):
            self.assertEqual(clock.now(), fixed)
            self.assertEqual(clock.timestamp(), fixed.timestamp())
        self.assertGreater(clock.now().year, 2025)
        self.assertNotEqual(clock.now(), fixed)

    def test_frozen_callable_advances(self):
        ticks = iter(range(1, 10))
        base = datetime(2026, 1, 1, tzinfo=UTC)
        with clock.frozen(lambda: base + timedelta(seconds=next(ticks))):
            self.assertEqual(clock.now(), base + timedelta(seconds=1))
            self.assertEqual(clock.now(), base + timedelta(seconds=2))

    def test_frozen_nested(self):
        outer = datetime(2026, 1, 1, tzinfo=UTC)
        inner = datetime(2027, 1, 1, tzinfo=UTC)
        with clock.frozen(outer):
            with clock.frozen(inner):
                self.assertEqual(clock.now(), inner)
            self.assertEqual(clock.now(), outer)

    def test_frozen_restored_after_error(self):
        fixed = datetime(2026, 1, 2, tzinfo=UTC)
        with self.assertRaises(RuntimeError), clock.frozen(fixed):
            raise RuntimeError
        self.assertNotEqual(clock.now(), fixed)

    def test_scan_finds_direct_calls(self):
        with tempfile.TemporaryDirectory() as tmp:
            found = clock.scan(make_folder(Path(tmp)))
        self.assertEqual(
            found,
            [
                ("a.py", 4, "a = datetime.now(UTC)"),
                ("a.py", 5, "b = time.time()"),
            ],
        )

    def test_check_exit_zero_with_findings(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = make_folder(Path(tmp))
            result = subprocess.run(
                [sys.executable, str(CLOCK_PY), "--check", str(folder)],
                check=False,
                capture_output=True,
                text=True,
            )
        self.assertEqual(result.returncode, 0)
        self.assertIn(
            "Warnung: direkter Uhraufruf a.py:4: a = datetime.now(UTC)", result.stdout
        )
        self.assertIn(
            "Warnung: direkter Uhraufruf a.py:5: b = time.time()", result.stdout
        )
        self.assertIn(
            "clock: 2 direkte Uhraufrufe (nur Warnung, R450 V2)", result.stdout
        )


if __name__ == "__main__":
    unittest.main()
