"""Lokaler Dashboard-Server (nur 127.0.0.1): /api/state und statische Dateien."""

from __future__ import annotations

import argparse
import json
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

import clock
import limits
from model import (
    INACTIVE_DEFAULT,
    EventStore,
    build_state,
    load_ampel_sessions,
    read_agent_models,
    read_agent_names,
)
from paths import agents_dir, archive_dir, docs_dir, events_file, studio_home
from studio_docs import bundle

DASHBOARD = Path(__file__).resolve().parent / "dashboard"
HOST = "127.0.0.1"
ARCHIVE_SUFFIXES = {".md", ".jsonl", ".txt"}
STATE_LIMITS_MAX_AGE = 3600


class Handler(SimpleHTTPRequestHandler):
    def __init__(
        self, *args, store, agents, inactive_after, dashboard, docs, archive, **kwargs
    ):
        self.store = store
        self.agents = agents
        self.inactive_after = inactive_after
        self.dashboard = dashboard
        self.docs = docs
        self.archive = archive
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
            if url.path.startswith("/archiv/"):
                self.send_archive(unquote(url.path[len("/archiv/") :]))
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

    def send_archive(self, rel: str) -> None:
        """Archivierte Briefings/Berichte als Klartext; nur innerhalb des Archivs."""
        root = self.archive.resolve()
        target = (root / rel).resolve()
        if (
            root not in target.parents
            or target.suffix not in ARCHIVE_SUFFIXES
            or not target.is_file()
        ):
            self.send_error(404)
            return
        body = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def send_state(self, session: str, heartbeats: bool = True) -> None:
        state = build_state(
            self.store.events(),
            clock.timestamp(),
            read_agent_models(self.agents),
            session=session,
            inactive_after=self.inactive_after,
            heartbeats=heartbeats,
            agent_names=read_agent_names(self.agents),
            ampel_sessions=load_ampel_sessions(Path(self.docs) / "metriken"),
        )
        state["docs"] = bundle(self.docs, self.agents)
        state["limits"] = limits_state(clock.timestamp())
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


def limits_state(now: float) -> dict | None:
    """Letzte Limit-Werte mit Alter und Ampel; None, wenn nichts Frisches da ist."""
    data = limits.read_fresh(studio_home() / "limits.json", now, STATE_LIMITS_MAX_AGE)
    if not data:
        return None
    data["age_s"] = max(0, now - data["ts"])
    data["light"] = limits.light(data.get("five_hour_pct"))
    return data


def make_server(
    port: int,
    events_path: Path,
    agents: Path,
    inactive_after: float,
    dashboard: Path = DASHBOARD,
    docs: Path | None = None,
    archive: Path | None = None,
) -> ThreadingHTTPServer:
    handler = partial(
        Handler,
        store=EventStore(events_path),
        agents=agents,
        inactive_after=inactive_after,
        dashboard=dashboard.resolve(),
        docs=docs if docs is not None else docs_dir(),
        archive=archive if archive is not None else archive_dir(),
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
