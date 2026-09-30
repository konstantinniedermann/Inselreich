import json
import os
import stat
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

import statusline

SCRIPT = Path(__file__).resolve().parents[1] / "statusline.py"
PAYLOAD = (
    '{"session_id":"t","rate_limits":{"five_hour":{"used_percentage":42,'
    '"resets_at":1790000000}},"context_window":{"used_percentage":18}}'
)


class StatuslineTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.home = Path(self.tmp.name) / "home"
        self.limits = self.home / "limits.json"

    def fake(self, body: str) -> str:
        path = Path(self.tmp.name) / "fake.sh"
        path.write_text("#!/bin/bash\n" + body, "utf-8")
        path.chmod(path.stat().st_mode | stat.S_IXUSR)
        return f"bash {path}"

    def run_line(self, stdin, command=None):
        env = {**os.environ, "STUDIO_HOME": str(self.home)}
        if command is None:
            env["STUDIO_STATUSLINE_CMD"] = "/nonexistent/skript"
        else:
            env["STUDIO_STATUSLINE_CMD"] = command
        proc = subprocess.run(
            [sys.executable, str(SCRIPT)],
            input=stdin if isinstance(stdin, bytes) else stdin.encode(),
            env=env,
            capture_output=True,
            timeout=15,
            check=False,
        )
        self.assertEqual(proc.returncode, 0)
        return proc.stdout.decode("utf-8")

    def test_writes_limits_and_appends_suffix(self):
        out = self.run_line(PAYLOAD, self.fake("echo 'Zeile eins'\necho 'zwei'\n"))
        self.assertEqual(out.splitlines(), ["Zeile eins | 5h 42 %", "zwei"])
        data = json.loads(self.limits.read_text("utf-8"))
        self.assertEqual(data["five_hour_pct"], 42)
        self.assertEqual(data["context_pct"], 18)

    def test_stdin_passed_through_unchanged(self):
        raw = PAYLOAD + "\n"
        sink = Path(self.tmp.name) / "seen.txt"
        self.run_line(raw, self.fake(f"cat > {sink}\necho ok\n"))
        self.assertEqual(sink.read_text("utf-8"), raw)

    def test_no_user_output_prints_only_suffix(self):
        self.assertEqual(
            self.run_line(PAYLOAD, self.fake("exit 0\n")).strip(), "5h 42 %"
        )

    def test_quoted_path_with_space(self):
        folder = Path(self.tmp.name) / "mit leerzeichen"
        folder.mkdir()
        script = folder / "s.sh"
        script.write_text("#!/bin/bash\necho gefunden\n", "utf-8")
        out = self.run_line(PAYLOAD, f"bash '{script}'")
        self.assertEqual(out.strip(), "gefunden | 5h 42 %")

    def test_hanging_script_times_out(self):
        command = self.fake("echo vorab\nexec sleep 30\n").split()
        with mock.patch.object(statusline, "TIMEOUT_S", 0.5):
            start = time.monotonic()
            out = statusline.user_output(
                b"{}", {"STUDIO_STATUSLINE_CMD": " ".join(command)}
            )
        self.assertLess(time.monotonic() - start, 10)
        self.assertIn(out, ("", "vorab\n"))

    def test_user_script_missing(self):
        self.assertEqual(self.run_line(PAYLOAD).strip(), "5h 42 %")

    def test_user_script_fails_keeps_partial_output(self):
        out = self.run_line(PAYLOAD, self.fake("echo teilweise\nexit 3\n"))
        self.assertEqual(out.strip(), "teilweise | 5h 42 %")

    def test_garbage_stdin_does_not_crash_or_write(self):
        out = self.run_line(b"\xff\xfe kein json", self.fake("echo unveraendert\n"))
        self.assertEqual(out.strip(), "unveraendert")
        self.assertFalse(self.limits.exists())

    def test_no_values_keeps_old_state(self):
        self.run_line(PAYLOAD, self.fake("echo a\n"))
        before = self.limits.read_text("utf-8")
        out = self.run_line('{"session_id":"t"}', self.fake("echo b\n"))
        self.assertEqual(out.strip(), "b")
        self.assertEqual(self.limits.read_text("utf-8"), before)

    def test_unwritable_home_is_silent(self):
        blocker = Path(self.tmp.name) / "datei"
        blocker.write_text("x", "utf-8")
        self.home = blocker / "sub"
        out = self.run_line(PAYLOAD, self.fake("echo a\n"))
        self.assertEqual(out.strip(), "a | 5h 42 %")


if __name__ == "__main__":
    unittest.main()
