"""Lokaler Dashboard-Server (nur 127.0.0.1): /api/state und statische Dateien."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from model import INACTIVE_DEFAULT, EventStore, build_state, read_agent_models
from paths import agents_dir, events_file

DASHBOARD = Path(__file__).resolve().parent / "dashboard"
HOST = "127.0.0.1"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, store, agents, inactive_after, dashboard, **kwargs):
        self.store = store
        self.agents = agents
        self.inactive_after = inactive_after
        self.dashboard = dashboard
        super().__init__(*args, directory=str(dashboard), **kwargs)

    def host_allowed(self) -> bool:
        """DNS-Rebinding-Schutz: nur Host 127.0.0.1/localhost mit eigenem Port."""
        port = self.server.server_address[1]
        allowed = {f"127.0.0.1:{port}", f"localhost:{port}"}
        return self.headers.get("Host", "") in allowed

    def route(self, serve_static) -> None:
        try:
            if not self.host_allowed():
                self.send_error(403)
                return
            url = urlparse(self.path)
            if url.path == "/api/state":
                query = parse_qs(url.query)
                session = query.get("session", ["latest"])[0]
                heartbeats = query.get("heartbeats", ["1"])[0] != "0"
                self.send_state(session, heartbeats)
                return
            if url.path != "/":
                target = (self.dashboard / unquote(url.path).lstrip("/")).resolve()
                if self.dashboard not in target.parents or not target.is_file():
                    self.send_error(404)
                    return
            serve_static()
        except (ValueError, OSError):
            self.send_error(404)
        except Exception:  # noqa: BLE001 — Server muss oben bleiben
            self.send_error(500)

    def do_GET(self):
        self.route(super().do_GET)

    def do_HEAD(self):
        self.route(super().do_HEAD)

    def list_directory(self, path):
        self.send_error(404)

    def send_state(self, session: str, heartbeats: bool = True) -> None:
        state = build_state(
            self.store.events(),
            time.time(),
            read_agent_models(self.agents),
            session=session,
            inactive_after=self.inactive_after,
            heartbeats=heartbeats,
        )
        body = json.dumps(state, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:",
        )
        super().end_headers()

    def log_message(self, format, *args):
        return


def make_server(
    port: int,
    events_path: Path,
    agents: Path,
    inactive_after: float,
    dashboard: Path = DASHBOARD,
) -> ThreadingHTTPServer:
    handler = partial(
        Handler,
        store=EventStore(events_path),
        agents=agents,
        inactive_after=inactive_after,
        dashboard=dashboard.resolve(),
    )
    return ThreadingHTTPServer((HOST, port), handler)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Studio-Dashboard-Server")
    parser.add_argument(
        "--port", type=int, default=int(os.environ.get("STUDIO_PORT", "8765"))
    )
    args = parser.parse_args(argv)
    inactive = float(os.environ.get("STUDIO_INACTIVE_SECONDS", INACTIVE_DEFAULT))
    httpd = make_server(args.port, events_file(), agents_dir(), inactive)
    print(f"Studio-Dashboard: http://{HOST}:{args.port}/", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
