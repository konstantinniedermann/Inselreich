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
    def __init__(self, *args, store, agents, inactive_after, **kwargs):
        self.store = store
        self.agents = agents
        self.inactive_after = inactive_after
        super().__init__(*args, directory=str(DASHBOARD), **kwargs)

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/api/state":
            self.send_state(parse_qs(url.query).get("session", ["latest"])[0])
            return
        target = (DASHBOARD / unquote(url.path).lstrip("/")).resolve()
        if url.path != "/" and (
            DASHBOARD not in target.parents or not target.is_file()
        ):
            self.send_error(404)
            return
        super().do_GET()

    def list_directory(self, path):
        self.send_error(404)

    def send_state(self, session: str) -> None:
        state = build_state(
            self.store.events(),
            time.time(),
            read_agent_models(self.agents),
            session=session,
            inactive_after=self.inactive_after,
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
    port: int, events_path: Path, agents: Path, inactive_after: float
) -> ThreadingHTTPServer:
    handler = partial(
        Handler,
        store=EventStore(events_path),
        agents=agents,
        inactive_after=inactive_after,
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
