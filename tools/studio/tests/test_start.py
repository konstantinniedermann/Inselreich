import os
import signal
import socket
import subprocess
import tempfile
import textwrap
import threading
import time
import unittest
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

START = Path(__file__).resolve().parent.parent / "start.sh"


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class ForeignHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = b"fremd"
        self.send_response(200)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


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

    def test_start_foreign_server_reports_port_busy(self):
        with HTTPServer(("127.0.0.1", self.port), ForeignHandler) as foreign:
            threading.Thread(target=foreign.serve_forever, daemon=True).start()
            result = self.run_script()
            foreign.shutdown()
        self.assertEqual(result.returncode, 1)
        self.assertIn(f"Port {self.port} belegt (kein Studio-Dashboard)", result.stderr)
        self.assertNotIn("läuft bereits", result.stdout)
        self.assertFalse((Path(self.tmp.name) / "server.pid").exists())

    def test_old_studio_without_ping_is_found_by_pid(self):
        fake_dir = Path(self.tmp.name) / "studio"
        fake_dir.mkdir()
        fake = fake_dir / "server.py"
        fake.write_text(
            textwrap.dedent(
                f"""
                from http.server import BaseHTTPRequestHandler, HTTPServer

                class H(BaseHTTPRequestHandler):
                    def do_GET(self):
                        self.send_error(404)

                HTTPServer(("127.0.0.1", {self.port}), H).serve_forever()
                """
            ),
            "utf-8",
        )
        proc = subprocess.Popen(["python3", str(fake)])
        self.addCleanup(proc.wait)
        self.addCleanup(proc.terminate)
        (Path(self.tmp.name) / "server.pid").write_text(str(proc.pid), "utf-8")
        time.sleep(0.5)
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("läuft bereits", result.stdout)


if __name__ == "__main__":
    unittest.main()
