"""Lokaler Dashboard-Server (nur 127.0.0.1): /api/state und statische Dateien."""

from __future__ import annotations

import argparse
import json
import os
import sys
import threading
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
STATE_CACHE_MAX_AGE = 2.0
STATE_CACHE_KEYS = 8
STATE_BUILD_DUTY = 30  # Aufbau höchstens alle 30 × Aufbaudauer (~3 % CPU)
STATE_THROTTLE_MAX = 90.0


class Handler(SimpleHTTPRequestHandler):
    def __init__(
        self,
        *args,
        store,
        agents,
        inactive_after,
        dashboard,
        docs,
        archive,
        cache,
        **kwargs,
    ):
        self.store = store
        self.agents = agents
        self.inactive_after = inactive_after
        self.dashboard = dashboard
        self.docs = docs
        self.archive = archive
        self.cache = cache
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
        except (BrokenPipeError, ConnectionResetError):
            return  # Client hat getrennt: nichts mehr zu senden, kein Trace
        except (ValueError, OSError):
            self.send_error_quietly(404)
        except Exception:  # noqa: BLE001 — Server muss oben bleiben
            self.send_error_quietly(500)

    def send_error_quietly(self, code: int) -> None:
        try:
            self.send_error(code)
        except OSError:
            pass  # Socket schon tot

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

    def events_stamp(self) -> tuple[int, int]:
        try:
            info = self.store.path.stat()
        except OSError:
            return (0, 0)
        return (info.st_mtime_ns, info.st_size)

    def state_body(self, session: str, heartbeats: bool) -> bytes:
        """Zustand als JSON, zwischengespeichert je (session, heartbeats) (T01).

        Treffer, solange der Eintrag höchstens STATE_CACHE_MAX_AGE alt ist und die
        Events-Datei unverändert; Wiederaufbau höchstens alle STATE_BUILD_DUTY ×
        Aufbaudauer, damit ein teurer Aufbau den Server nicht dauerhaft auslastet.
        """
        key = (session, heartbeats, *self.events_stamp())
        with self.cache["lock"]:
            now = clock.timestamp()
            entries = self.cache["entries"]
            hit = entries.get(key[:2])
            if hit and reusable(hit, key, now):
                return hit["body"]
            body = self.build_state_body(session, heartbeats)
            done = clock.timestamp()
            if len(entries) >= STATE_CACHE_KEYS:
                entries.clear()
            entries[key[:2]] = {
                "key": key,
                "ts": done,
                "cost": max(0.0, done - now),
                "body": body,
            }
            return body

    def build_state_body(self, session: str, heartbeats: bool) -> bytes:
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
        return json.dumps(state, ensure_ascii=False).encode("utf-8")

    def send_state(self, session: str, heartbeats: bool = True) -> None:
        body = self.state_body(session, heartbeats)
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


def reusable(hit: dict, key: tuple, now: float) -> bool:
    age = now - hit["ts"]
    if age < 0:
        return False
    throttle = min(STATE_THROTTLE_MAX, hit["cost"] * STATE_BUILD_DUTY)
    if age < throttle:
        return True
    return hit["key"] == key and age <= STATE_CACHE_MAX_AGE


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
        cache={"lock": threading.Lock(), "entries": {}},
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
