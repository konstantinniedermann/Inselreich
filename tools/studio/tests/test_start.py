import os
import signal
import socket
import subprocess
import tempfile
import time
import unittest
import urllib.request
from pathlib import Path

START = Path(__file__).resolve().parent.parent / "start.sh"


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class StartScriptTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.port = free_port()
        self.url = f"http://127.0.0.1:{self.port}/"
        # nur für Tests: eigener Studio-Ordner und freier Port
        self.env = {
            **os.environ,
            "STUDIO_HOME": self.tmp.name,
            "STUDIO_PORT": str(self.port),
        }
        self.addCleanup(self.stop)

    def stop(self):
        self.run_script("stop")
        self.tmp.cleanup()

    @staticmethod
    def kill(pid):
        try:
            os.kill(pid, signal.SIGTERM)
        except ProcessLookupError:
            pass

    def run_script(self, *args, timeout=60):
        return subprocess.run(
            ["bash", str(START), *args],
            env=self.env,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )

    def test_start_reports_ready(self):
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(self.url, result.stdout)
        with urllib.request.urlopen(self.url, timeout=5) as response:
            self.assertEqual(response.status, 200)

    def test_second_start_reports_running(self):
        self.assertEqual(self.run_script().returncode, 0)
        second = self.run_script()
        self.assertEqual(second.returncode, 0)
        self.assertIn("läuft bereits", second.stdout)

    def test_running_server_without_pid_file(self):
        self.assertEqual(self.run_script().returncode, 0)
        pid_file = Path(self.tmp.name) / "server.pid"
        pid = int(pid_file.read_text())
        self.addCleanup(self.kill, pid)
        pid_file.unlink()
        second = self.run_script()
        self.assertEqual(second.returncode, 0)
        self.assertIn("läuft bereits", second.stdout)
        self.assertNotIn("Address already in use", second.stdout + second.stderr)

    def test_dead_process_reports_failure_fast(self):
        with socket.socket() as blocker:
            blocker.bind(("127.0.0.1", self.port))
            blocker.listen(1)  # nimmt Verbindungen an, spricht aber kein HTTP
            began = time.monotonic()
            result = self.run_script()
            elapsed = time.monotonic() - began
        self.assertEqual(result.returncode, 1)
        self.assertIn("startet nicht", result.stderr)
        self.assertLess(elapsed, 20)


if __name__ == "__main__":
    unittest.main()
