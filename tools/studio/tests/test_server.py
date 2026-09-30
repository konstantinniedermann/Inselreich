import http.client
import json
import tempfile
import threading
import unittest
from pathlib import Path

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
        self.httpd = server.make_server(0, events, Path(self.tmp.name), 300.0)
        self.port = self.httpd.server_address[1]
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def tearDown(self):
        self.httpd.shutdown()
        self.httpd.server_close()
        self.tmp.cleanup()

    def get(self, path):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        conn.request("GET", path)
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


if __name__ == "__main__":
    unittest.main()
