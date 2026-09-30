import http.client
import json
import os
import tempfile
import threading
import time
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
        self.docs = Path(self.tmp.name) / "docs"
        self.docs.mkdir()
        (self.docs / "STUDIO.md").write_text("Version: 1.0\n", "utf-8")
        (self.docs / "warteschlange.md").write_text(
            "# Warteschlange\n\n---\n\n"
            "## N-001 · offen · 2026-09-30 · Frage\n- Frage: x\n",
            "utf-8",
        )
        self.archive = Path(self.tmp.name) / "archiv"
        (self.archive / "briefings").mkdir(parents=True)
        (self.archive / "briefings" / "a.md").write_text("Brief", "utf-8")
        (self.archive / "briefings" / "b.html").write_text("x", "utf-8")
        os.symlink(secret, self.archive / "briefings" / "out.md")
        self.httpd = server.make_server(
            0,
            events,
            Path(self.tmp.name),
            300.0,
            dashboard=self.dash,
            docs=self.docs,
            archive=self.archive,
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

    def test_state_limits_null_without_file(self):
        with mock.patch.dict(os.environ, {"STUDIO_HOME": self.tmp.name}):
            state = json.loads(self.get("/api/state?session=all")[2])
        self.assertIsNone(state["limits"])

    def test_state_limits_with_age_and_light(self):
        data = {"ts": time.time() - 1800, "five_hour_pct": 65, "context_pct": 18}
        (Path(self.tmp.name) / "limits.json").write_text(json.dumps(data), "utf-8")
        with mock.patch.dict(os.environ, {"STUDIO_HOME": self.tmp.name}):
            state = json.loads(self.get("/api/state?session=all")[2])
        self.assertEqual(state["limits"]["five_hour_pct"], 65)
        self.assertEqual(state["limits"]["light"], "gelb")
        self.assertAlmostEqual(state["limits"]["age_s"], 1800, delta=30)

    def test_state_survives_garbage_limits(self):
        data = {"ts": time.time(), "five_hour_pct": "viel", "context_pct": [1]}
        (Path(self.tmp.name) / "limits.json").write_text(json.dumps(data), "utf-8")
        with mock.patch.dict(os.environ, {"STUDIO_HOME": self.tmp.name}):
            status, _, body = self.get("/api/state?session=all")
        self.assertEqual(status, 200)
        self.assertIsNone(json.loads(body)["limits"]["light"])

    def test_state_limits_dropped_after_an_hour(self):
        data = {"ts": time.time() - 3700, "five_hour_pct": 65}
        (Path(self.tmp.name) / "limits.json").write_text(json.dumps(data), "utf-8")
        with mock.patch.dict(os.environ, {"STUDIO_HOME": self.tmp.name}):
            state = json.loads(self.get("/api/state?session=all")[2])
        self.assertIsNone(state["limits"])

    def test_heartbeats_query_passes_through(self):
        with mock.patch.object(server, "build_state", wraps=server.build_state) as spy:
            self.assertEqual(self.get("/api/state?heartbeats=0")[0], 200)
            self.assertIs(spy.call_args.kwargs["heartbeats"], False)
            self.assertEqual(self.get("/api/state")[0], 200)
            self.assertIs(spy.call_args.kwargs["heartbeats"], True)

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

    def test_state_contains_docs_and_new_fields(self):
        state = json.loads(self.get("/api/state")[2])
        self.assertEqual(state["docs"]["handbook_version"], "1.0")
        self.assertEqual(len(state["docs"]["queue"]), 1)
        for key in ("delegations", "effort", "quality", "incidents"):
            self.assertIn(key, state)

    def test_archive_serves_text(self):
        status, ctype, body = self.get("/archiv/briefings/a.md")
        self.assertEqual(status, 200)
        self.assertTrue(ctype.startswith("text/plain"))
        self.assertEqual(body, b"Brief")

    def test_archive_rejects_bad_paths(self):
        for path in (
            "/archiv/../events.jsonl",
            "/archiv/%2e%2e/events.jsonl",
            "/archiv/briefings/b.html",
            "/archiv/briefings/out.md",
            "/archiv/briefings",
            "/archiv/briefings/%00.md",
            "/archiv/",
        ):
            self.assertEqual(self.get(path)[0], 404, path)

    def test_archive_foreign_host_rejected(self):
        status, _, _ = self.get("/archiv/briefings/a.md", headers={"Host": "evil"})
        self.assertEqual(status, 403)

    def test_internal_error_is_500_and_server_survives(self):
        with mock.patch.object(server, "build_state", side_effect=RuntimeError("x")):
            self.assertEqual(self.get("/api/state")[0], 500)
        self.assertEqual(self.get("/api/state")[0], 200)


if __name__ == "__main__":
    unittest.main()
