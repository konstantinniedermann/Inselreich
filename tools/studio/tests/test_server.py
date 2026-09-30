import http.client
import json
import os
import tempfile
import threading
import unittest
from pathlib import Path
from unittest import mock

import server


class ServerTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        events = Path(self.tmp.name) / "events.jsonl"
        events.write_text(
            '{"kind":"agent_start","ts":"2026-09-30T12:00:00.000Z","session_id":"s1",'
            '"agent_id":"a1","role":"lead-qa","source":"hook"}\n',
            "utf-8",
        )
        self.dash = Path(self.tmp.name) / "dash"
        self.dash.mkdir()
        (self.dash / "index.html").write_text("<html></html>", "utf-8")
        secret = Path(self.tmp.name) / "secret.txt"
        secret.write_text("geheim", "utf-8")
        os.symlink(secret, self.dash / "link.txt")
        self.httpd = server.make_server(
            0, events, Path(self.tmp.name), 300.0, dashboard=self.dash
        )
        self.port = self.httpd.server_address[1]
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def tearDown(self):
        self.httpd.shutdown()
        self.httpd.server_close()
        self.tmp.cleanup()

    def get(self, path, method="GET", headers=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        conn.request(method, path, headers=headers or {})
        response = conn.getresponse()
        body = response.read()
        conn.close()
        return response.status, response.getheader("Content-Type", ""), body

    def test_binds_localhost_only(self):
        self.assertEqual(self.httpd.server_address[0], "127.0.0.1")

    def test_api_state(self):
        status, ctype, body = self.get("/api/state?session=all")
        self.assertEqual(status, 200)
        self.assertIn("application/json", ctype)
        state = json.loads(body)
        self.assertEqual(state["tree"][0]["children"][0]["role"], "lead-qa")

    def test_index_served(self):
        status, _, body = self.get("/")
        self.assertEqual(status, 200)
        self.assertIn(b"<html", body.lower())

    def test_no_path_outside_dashboard(self):
        for path in (
            "/../server.py",
            "/%2e%2e/server.py",
            "/../../.claude/settings.json",
        ):
            status, _, _ = self.get(path)
            self.assertEqual(status, 404, path)

    def test_no_directory_listing(self):
        status, _, _ = self.get("/nichtda/")
        self.assertEqual(status, 404)

    def test_nul_byte_is_404_and_server_survives(self):
        status, _, _ = self.get("/%00")
        self.assertEqual(status, 404)
        self.assertEqual(self.get("/")[0], 200)

    def test_symlink_out_of_dashboard_blocked(self):
        self.assertEqual(self.get("/link.txt")[0], 404)
        self.assertEqual(self.get("/link.txt", method="HEAD")[0], 404)

    def test_foreign_host_rejected(self):
        for path in ("/", "/api/state"):
            status, _, _ = self.get(path, headers={"Host": "evil.example"})
            self.assertEqual(status, 403, path)
        ok = self.get("/", headers={"Host": f"localhost:{self.port}"})
        self.assertEqual(ok[0], 200)

    def test_internal_error_is_500_and_server_survives(self):
        with mock.patch.object(server, "build_state", side_effect=RuntimeError("x")):
            self.assertEqual(self.get("/api/state")[0], 500)
        self.assertEqual(self.get("/api/state")[0], 200)


if __name__ == "__main__":
    unittest.main()
