"""Studio-Telemetrie: Events → Zustand fürs Dashboard.

Regeln: docs/superpowers/specs/2026-09-30-studio-design.md, Abschnitt
„Zuordnungsregeln". Bis auf EventStore und read_agent_models reine Funktionen.
"""

from __future__ import annotations

import contextlib
import json
import threading
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import effort
import graph
import studio_docs
from graph import GRAPH_ROWS, MESSAGE_TEXT_MAX, PAUSE_GAP  # noqa: F401

INACTIVE_DEFAULT = 300.0
BIND_WINDOW = 30.0
FEED_SIZE = 80
HEARTBEAT_TOOLS = 4
PULSE_MINUTES = 60
CHRONICLE_SIZE = 200
TEXT_MAX = 160
SHORT_TASK = 30
DIRECTOR_NAME = ("Boss Bruno", "Projektleiter", "🎬")
FOREIGN_NAME = "Aushilfe"
FOREIGN_EMOJI = "🧑‍🔧"
LIVE = frozenset({"active", "delegated", "waiting", "blocked"})
FINAL = frozenset({"done", "failed", "ended"})
DEPARTMENTS = ("production", "design", "tech", "art", "qa")
DIRECTOR = "studio-director"
CI_SESSION = "ci"  # Pseudo-Session der CI-Events (ci.py)
AGENT_MESSAGE_TASK = "Meldung eines Agenten"  # gleicher Text wie in hook.py
PUBLIC = (
    "key",
    "session_id",
    "agent_id",
    "role",
    "persona",
    "level",
    "department",
    "model",
    "task",
    "summary",
    "package",
    "persona_version",
    "milestone",
    "started",
    "stopped",
    "last_seen",
    "name",
    "title",
    "emoji",
    "instance",
    "task_short",
)


def parse_ts(value: object) -> float:
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp()
    except ValueError:
        return 0.0


def classify(role: str) -> tuple[int, str]:
    """Ebene und Bereich aus dem Rollennamen (Namensschema R11, Stabsstellen R28)."""
    if role in ("main", DIRECTOR):
        return 0, "studio"
    if role.startswith("studio-"):
        return 1, "studio"
    if role.startswith("lead-"):
        department = role[len("lead-") :]
        return 1, department if department in DEPARTMENTS else "extern"
    prefix = role.split("-", 1)[0]
    return 2, prefix if prefix in DEPARTMENTS else "extern"


def read_agent_names(agents_dir: Path) -> dict[str, dict]:
    """rolle → {name, title, emoji} aus studio-name/-title/-emoji der Frontmatter."""
    names: dict[str, dict] = {}
    for role, meta in studio_docs.persona_meta(agents_dir).items():
        entry = {
            field: meta[f"studio_{field}"]
            for field in ("name", "title", "emoji")
            if meta.get(f"studio_{field}")
        }
        if entry:
            names[role] = entry
    return names


def identity(role: str, names: dict[str, dict]) -> tuple[str, str, str]:
    """(Name, Titel, Emoji) einer Rolle; Rückfall je Feld (T3)."""
    if role in (DIRECTOR, "main"):
        fallback = DIRECTOR_NAME
    else:
        fallback = (FOREIGN_NAME, role, FOREIGN_EMOJI)
    entry = names.get(role) or {}
    return (
        entry.get("name") or fallback[0],
        entry.get("title") or fallback[1],
        entry.get("emoji") or fallback[2],
    )


def read_agent_models(agents_dir: Path) -> dict[str, str]:
    """name → model aus der Frontmatter von .claude/agents/*.md."""
    models: dict[str, str] = {}
    if not agents_dir.is_dir():
        return models
    for path in sorted(agents_dir.glob("*.md")):
        lines = path.read_text(encoding="utf-8").splitlines()
        if not lines or lines[0].strip() != "---":
            continue
        meta: dict[str, str] = {}
        for line in lines[1:]:
            if line.strip() == "---":
                break
            key, sep, value = line.partition(":")
            if sep:
                meta[key.strip()] = value.strip()
        if meta.get("name"):
            models[meta["name"]] = meta.get("model") or "inherit"
    return models


class EventStore:
    """Liest events.jsonl inkrementell; kaputte und halbe Zeilen werden übersprungen."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self._offset = 0
        self._inode = None
        self._events: list[dict] = []
        self._lock = threading.Lock()

    def events(self) -> list[dict]:
        with self._lock:
            try:
                info = self.path.stat()
            except OSError:
                self._offset, self._inode, self._events = 0, None, []
                return []
            if info.st_ino != self._inode or info.st_size < self._offset:
                self._offset, self._inode, self._events = 0, info.st_ino, []
            with open(self.path, "rb") as handle:
                handle.seek(self._offset)
                chunk = handle.read()
            end = chunk.rfind(b"\n") + 1
            for raw in chunk[:end].splitlines():
                try:
                    event = json.loads(raw)
                except ValueError:
                    continue
                if isinstance(event, dict):
                    self._events.append(event)
            self._offset += end
            return list(self._events)


def _package(event: dict) -> str:
    """Paket-ID; alte Events tragen ``package`` statt ``package_id``."""
    return str(event.get("package_id") or event.get("package") or "")


def _estimate(value: object) -> dict | None:
    """Schätzung nur mit echten Zahlen (keine Strings, keine Bools)."""
    if not isinstance(value, dict):
        return None
    clean = {
        k: value[k]
        for k in ("minutes", "tools")
        if isinstance(value.get(k), (int, float)) and not isinstance(value[k], bool)
    }
    return clean or None


def _short(text: object, limit: int = TEXT_MAX) -> str:
    text = " ".join(str(text or "").split())
    return text if len(text) <= limit else text[:limit] + "…"


class _Builder:
    def __init__(
        self,
        agent_models: dict[str, str],
        now: float,
        agent_names: dict[str, dict] | None = None,
    ) -> None:
        self.models = agent_models
        self.names = agent_names or {}
        self.now = now
        self.nodes: dict[str, dict] = {}
        self.sessions: dict[str, dict] = {}
        self.pending: dict[str, list[dict]] = {}
        self.spawns: dict[tuple[str, str], dict] = {}
        self.seq = 0
        self.binds: dict[str, list[tuple[float, str, str]]] = {}
        self.trace: dict[str, list[dict]] = {}
        self.index = 0
        self.current_ts = ""
        self.budgets: dict[str, dict] = {}
        self.board: dict[str, dict] = {}
        self.decisions: dict[str, dict] = {}
        self.chronicle: list[dict] = []
        self.feed: list[dict] = []
        self.results: dict[tuple[str, str], dict] = {}
        self.timeline: list[tuple[float, str, str]] = []
        self.retros: list[dict] = []
        self.ci: dict[str, dict] = {}
        self.queue: dict[str, dict] = {}
        self.milestones_by_id: dict[str, dict] = {}

    # --- Knoten -------------------------------------------------------------

    def node(
        self, sid: str, agent_id: str, ts: float, role: str = "", touch: bool = True
    ) -> dict:
        if not isinstance(role, str):
            raise TypeError("role must be a string")
        key = f"{sid}:{agent_id}"
        node = self.nodes.get(key)
        if node is None:
            is_main = agent_id == "main"
            node = {
                "key": key,
                "session_id": sid,
                "agent_id": agent_id,
                "parent": None,
                "children": [],
                "role": "",
                "persona": "",
                "level": 0,
                "department": "studio",
                "model": "",
                "status": "idle" if is_main else "active",
                "task": "",
                "summary": "",
                "package": "",
                "persona_version": "",
                "handbook_version": "",
                "milestone": "",
                "estimate": None,
                "briefing": "",
                "report": "",
                "usage": {},
                "tool_calls": None,
                "reported": None,
                "resumes": 0,
                "max_gap": 0.0,
                "delegated_at": None,
                "started": ts,
                "stopped": None,
                "last_seen": ts,
                "name": "",
                "title": "",
                "emoji": "",
                "instance": 1,
                "task_short": "",
                "_base_name": "",
                "_pulse": ts,
                "_signal": is_main,
                "_first": (ts, self.current_ts, self.index),
                "_confirmed": False,
                "_chron": False,
                "_type": "",
                "_started": False,
                "_runs": [],
                "_last_text": "",
                "_entry": None,
            }
            self.nodes[key] = node
            self.set_role(node, DIRECTOR if is_main else (role or "unbekannt"))
            if not is_main:
                self.reparent(node, self.node(sid, "main", ts, touch=False)["key"])
        if touch:
            self.touch(node, ts)
        return node

    def touch(self, node: dict, ts: float) -> None:
        """Lebenszeichen: grösste Lücke merken (nur bei lebendem Status).

        Wartet ein Knoten auf lebende Kinder, gilt keine Lücke; Aktivität eines
        Kindes zählt als Lebenszeichen der Vorfahren.
        """
        waiting = any(
            self.nodes[c]["status"] in LIVE for c in node["children"] if c in self.nodes
        )
        if node["status"] in LIVE and not waiting:
            since = max(node["last_seen"], node["_pulse"])
            node["max_gap"] = max(node["max_gap"], ts - since)
        node["last_seen"] = max(node["last_seen"], ts)
        ancestor = self.nodes.get(node["parent"] or "")
        while ancestor is not None:
            ancestor["_pulse"] = max(ancestor["_pulse"], ts)
            ancestor = self.nodes.get(ancestor["parent"] or "")

    @staticmethod
    def count_tool(node: dict) -> None:
        node["tool_calls"] = (node["tool_calls"] or 0) + 1

    def set_role(self, node: dict, role: str) -> None:
        node["role"] = role
        node["level"], node["department"] = classify(role)
        if node["agent_id"] != "main":
            node["model"] = self.models.get(role, node["model"] or "inherit")

    @staticmethod
    def close_run(node: dict, ts: float) -> None:
        if node["_runs"] and node["_runs"][-1][1] is None:
            node["_runs"][-1][1] = ts

    def reparent(self, node: dict, parent_key: str) -> None:
        if node["agent_id"] == "main" or node["parent"] == parent_key:
            return
        ancestor = parent_key
        while ancestor is not None:  # kein Zyklus, auch nicht ueber mehrere Ebenen
            if ancestor == node["key"]:
                return
            ancestor = self.nodes[ancestor]["parent"]
        if node["parent"] in self.nodes:
            siblings = self.nodes[node["parent"]]["children"]
            if node["key"] in siblings:
                siblings.remove(node["key"])
        node["parent"] = parent_key
        self.nodes[parent_key]["children"].append(node["key"])

    def add_chronicle(self, node: dict, ts: float, text: str) -> None:
        if not text or text == node["_last_text"]:
            return
        node["_last_text"] = text
        node["_chron"] = True
        self.chronicle.append(
            {
                "ts": datetime.fromtimestamp(ts, timezone.utc)
                .astimezone()
                .isoformat(timespec="seconds"),
                "t": ts,
                "session_id": node["session_id"],
                "department": node["department"],
                "role": node["role"],
                "text": _short(text, 400),
                "_key": node["key"],
            }
        )

    # --- Events -------------------------------------------------------------

    def record(self, sid: str, kind: str, ts: float, key: str, **fields) -> None:
        """Ereignisliste für den Graph-Nachlauf (P37)."""
        self.trace.setdefault(sid, []).append(
            {"i": self.index, "kind": kind, "t": ts, "ts": self.current_ts, "key": key}
            | fields
        )

    def signal(self, event: dict, sid: str) -> None:
        """Jedes Event ausser agent_stop ohne Rolle macht einen Knoten sichtbar (P31)."""
        if event.get("source") == "log":
            return
        if event.get("kind") == "agent_stop" and not event.get("role"):
            return
        node = self.nodes.get(f"{sid}:{event.get('agent_id') or 'main'}")
        if node is not None:
            node["_signal"] = True

    def hidden(self, key: str) -> bool:
        """stop-only-Knoten: nur ein agent_stop ohne Rolle, sonst nichts (P31)."""
        node = self.nodes[key]
        return node["agent_id"] != "main" and not node["_signal"]

    def graph_record(self, record: dict) -> dict:
        if record["kind"] != "spawn":
            return record
        child = record["entry"]["child"]
        return {k: v for k, v in record.items() if k != "entry"} | {
            "child": child["key"] if child is not None else None
        }

    def layouts(self) -> dict[str, graph.Layout]:
        """Je Session das Graph-Layout; daraus die Instanznummern (P9, P21)."""
        result: dict[str, graph.Layout] = {}
        for sid in self.sessions:
            info = {
                key: {
                    "agent_id": node["agent_id"],
                    "role": node["role"],
                    "department": node["department"],
                    "parent": node["parent"],
                    "base_name": node["_base_name"],
                    "task": node["task"],
                    "first": node["_first"],
                    "log_only": node["agent_id"].startswith("log:"),
                }
                for key, node in self.nodes.items()
                if node["session_id"] == sid and not self.hidden(key)
            }
            with contextlib.suppress(Exception):  # der Graph kippt nie den Zustand
                records = [self.graph_record(r) for r in self.trace.get(sid, [])]
                layout = graph.Layout(sid, records, info)
                numbers = graph.instances(info, layout.run_times())
                for key, number in numbers.items():
                    node = self.nodes[key]
                    node["instance"] = number
                    suffix = f" ({number})" if number > 1 else ""
                    node["name"] = node["_base_name"] + suffix
                result[sid] = layout
        return result

    def message_texts(self, feed: list[dict], layouts: dict) -> None:
        """Feed-Zeile „✉ → <Empfänger>: <Text>" (T2)."""
        for entry in feed:
            if entry["kind"] != "message" or entry["session_id"] not in layouts:
                continue
            target = layouts[entry["session_id"]].resolve(entry.get("_to", ""))
            who = self.nodes[target]["name"] if target else f"? {entry.get('_to', '')}"
            entry["text"] = _short(f"✉ → {who.strip()}: {entry.get('_text', '')}", 140)

    def graph_view(self, chosen: str | None, layouts: dict) -> dict | None:
        if chosen in (None, "all"):
            return None
        if chosen not in layouts:
            return {"session": chosen, "columns": 0, "truncated": False, "rows": []}
        names = {
            k: n["name"] for k, n in self.nodes.items() if n["session_id"] == chosen
        }
        return layouts[chosen].render(names)

    def identities(self) -> None:
        """Name, Titel, Emoji und Kurzaufgabe je sichtbarem Knoten (T3, T6)."""
        for key, node in self.nodes.items():
            if self.hidden(key):
                continue
            name, node["title"], node["emoji"] = identity(node["role"], self.names)
            node["name"] = node["_base_name"] = name
            node["task_short"] = _short(node["task"], SHORT_TASK)

    def apply(self, event: dict) -> None:
        self.index += 1
        self.current_ts = str(event.get("ts") or "")
        ts = parse_ts(event.get("ts"))
        sid = str(event.get("session_id") or "unbekannt")
        # CI-Läufe gehören zu den Sessions, in deren Zeitraum sie fallen (result)
        if event.get("kind") != "ci" and sid != CI_SESSION:
            session = self.sessions.setdefault(
                sid, {"id": sid, "started": ts, "last": ts, "ended": None}
            )
            session["last"] = max(session["last"], ts)
        handler = getattr(self, "on_" + str(event.get("kind", "")), None)
        if handler is not None:
            handler(event, ts, sid)
        self.signal(event, sid)
        self.add_feed(event, ts, sid)

    def agent(self, event: dict, ts: float, sid: str) -> dict:
        node = self.node(
            sid, str(event.get("agent_id") or "main"), ts, event.get("role", "")
        )
        self.stamp(node, event, ("handbook_version",))
        return node

    @staticmethod
    def stamp(node: dict, event: dict, fields: tuple[str, ...]) -> None:
        for field in fields:
            if event.get(field):
                node[field] = str(event[field])

    def on_session_start(self, event, ts, sid):
        self.sessions[sid]["ended"] = None  # Neustart: Session läuft wieder
        main = self.node(sid, "main", ts)
        self.record(sid, "session_start", ts, main["key"])
        main["status"] = "idle"
        main["model"] = event.get("model") or main["model"]

    def on_prompt(self, event, ts, sid):
        main = self.node(sid, "main", ts)
        main["status"] = "active"
        # Dauer von L0 = Summe der Turns (Prompt → Turn-Ende); ein offener Turn läuft
        if not main["_runs"] or main["_runs"][-1][1] is not None:
            main["_runs"].append([ts, None])
        # Meldungen von Agenten sind kein neuer Auftrag: bisherige Aufgabe behalten.
        if event.get("task") != AGENT_MESSAGE_TASK:
            main["task"] = event.get("task") or main["task"]

    def on_turn_end(self, event, ts, sid):
        main = self.node(sid, "main", ts)
        main["status"] = "idle"
        self.close_run(main, ts)
        main["summary"] = event.get("summary") or main["summary"]

    def on_session_end(self, event, ts, sid):
        self.sessions[sid]["ended"] = ts
        self.record(sid, "session_end", ts, self.node(sid, "main", ts)["key"])
        for node in self.nodes.values():
            if node["session_id"] == sid and node["status"] not in FINAL:
                node["status"], node["stopped"] = "ended", ts
                self.close_run(node, ts)

    def on_spawn(self, event, ts, sid):
        parent = self.agent(event, ts, sid)
        self.count_tool(parent)
        self.seq += 1
        estimate = _estimate(event.get("estimate"))
        entry = {
            "ts": ts,
            "estimate": estimate,
            "milestone": str(event.get("milestone") or ""),
            "briefing": str(event.get("briefing") or ""),
            "persona_version": str(event.get("persona_version") or ""),
            "parent": parent["key"],
            "type": event.get("subagent_type") or "general-purpose",
            "persona": event.get("persona") or "",
            "package": _package(event),
            "model": event.get("model") or "",
            "task": event.get("description") or "",
            "tid": str(event.get("tool_use_id") or ""),
            "seq": self.seq,
            "child": None,
        }
        self.pending.setdefault(sid, []).append(entry)
        self.record(
            sid, "spawn", ts, parent["key"], entry=entry, description=entry["task"]
        )
        if entry["tid"]:
            self.spawns[(sid, entry["tid"])] = entry

    def release(self, sid: str, entry: dict) -> None:
        """Entry wieder zur Zuordnung freigeben (Reihenfolge nach Spawn)."""
        entry["child"] = None
        queue = self.pending.setdefault(sid, [])
        if entry not in queue:
            queue.append(entry)
            queue.sort(key=lambda e: e["seq"])

    def assign(self, sid: str, node: dict, entry: dict, reparent: bool = True) -> None:
        """Spawn-Angaben (Rolle, Paket, Aufgabe, Modell) dem Knoten zuweisen."""
        old = node["_entry"]
        if old is not None and old is not entry and old["child"] is node:
            self.release(sid, old)
        other = entry["child"]
        if other is not None and other is not node:
            other["_entry"] = None
        entry["child"] = node
        node["_entry"] = entry
        queue = self.pending.get(sid, [])
        if entry in queue:
            queue.remove(entry)
        if reparent:
            self.reparent(node, entry["parent"])
        typ = node["_type"] or entry["type"]
        node["persona"] = entry["persona"]
        self.set_role(node, entry["persona"] or typ)
        node["package"] = entry["package"]
        node["task"] = entry["task"]
        node["estimate"] = entry["estimate"]
        node["milestone"] = entry["milestone"]
        node["briefing"] = entry["briefing"]
        node["delegated_at"] = entry["ts"]
        node["persona_version"] = node["persona_version"] or entry["persona_version"]
        node["model"] = (
            entry["model"]
            or self.models.get(node["role"])
            or self.models.get(typ)
            or "inherit"
        )

    def on_spawned(self, event, ts, sid):
        child_id = str(event.get("child_id") or "")
        caller = str(event.get("agent_id") or "main")
        if not child_id or child_id == "main" or child_id == caller:
            return
        parent = self.agent(event, ts, sid)
        child = self.node(sid, child_id, ts, touch=False)
        self.reparent(child, parent["key"])
        child["_confirmed"] = True
        child["_signal"] = True
        reported = {
            "duration_ms": event.get("duration_ms"),
            "tool_count": event.get("tool_count"),
            "resolved_model": event.get("resolved_model"),
        }
        if any(v is not None for v in reported.values()):
            child["reported"] = reported
        entry = self.spawns.get((sid, str(event.get("tool_use_id") or "")))
        if entry is not None:
            self.assign(sid, child, entry, reparent=False)
        # Vordergrund-Agent ohne SubagentStop (z. B. web-fetch): status entscheidet
        if event.get("status") == "completed" and child["status"] not in (
            "done",
            "failed",
        ):
            child["status"], child["stopped"] = "done", ts
            if not child["_runs"]:  # nur Heartbeats: Lauf aus gemeldeter Dauer
                ms = event.get("duration_ms")
                begin = ts - ms / 1000 if isinstance(ms, (int, float)) else None
                child["_runs"].append(
                    [child["started"] if begin is None else begin, ts]
                )
            self.close_run(child, ts)
            self.add_chronicle(child, ts, child["summary"] or child["task"])

    def on_agent_start(self, event, ts, sid):
        typ = event.get("role") or "general-purpose"
        agent_id = str(event.get("agent_id") or "main")
        if agent_id == "main":
            return
        node = self.node(sid, agent_id, ts, typ)
        self.stamp(node, event, ("persona_version", "handbook_version"))
        node["tool_calls"] = node["tool_calls"] or 0
        self.record(sid, "agent_start", ts, node["key"], resume=node["_started"])
        if node["_started"]:  # Fortsetzen per SendMessage: kein neuer Start
            node["resumes"] += 1
            node["status"], node["stopped"] = "active", None
            if not node["_runs"] or node["_runs"][-1][1] is not None:
                node["_runs"].append([ts, None])  # offener Lauf bleibt der einzige
            node["summary"], node["_chron"] = "", False
            return
        node["_started"] = True
        node["_runs"].append([ts, None])
        node["status"], node["started"] = "active", ts
        node["_type"] = typ
        if node["_entry"] is not None:
            self.assign(sid, node, node["_entry"], reparent=False)
            return
        candidates = [p for p in self.pending.get(sid, []) if p["type"] == typ]
        if node["_confirmed"]:
            own = [p for p in candidates if p["parent"] == node["parent"]]
            candidates = own or candidates
        self.set_role(node, typ)
        if candidates:
            self.assign(sid, node, candidates[0], reparent=not node["_confirmed"])

    def on_agent_stop(self, event, ts, sid):
        node = self.agent(event, ts, sid)
        self.record(sid, "agent_stop", ts, node["key"], summary=event.get("summary"))
        self.stamp(node, event, ("persona_version", "handbook_version"))
        if isinstance(event.get("usage"), dict):
            node["usage"] = event["usage"]
        node["report"] = str(event.get("report") or node["report"])
        node["status"] = "failed" if node["status"] == "failed" else "done"
        node["stopped"] = ts
        self.close_run(node, ts)
        if not node["summary"]:
            node["summary"] = event.get("summary") or ""
        if not node["_chron"]:
            self.add_chronicle(node, ts, node["summary"] or node["task"])

    def on_message(self, event, ts, sid):
        sender = self.agent(event, ts, sid)  # Lebenszeichen wie ein Heartbeat (T2)
        self.count_tool(sender)  # SendMessage bleibt ein Tool-Aufruf (Aufwand)
        self.record(
            sid,
            "message",
            ts,
            sender["key"],
            to=str(event.get("to") or ""),
            text=str(event.get("text") or ""),
        )

    def on_heartbeat(self, event, ts, sid):
        self.count_tool(self.agent(event, ts, sid))

    def on_bind(self, event, ts, sid):
        node = self.agent(event, ts, sid)
        self.count_tool(node)
        role = event.get("role") or ""
        if role:
            self.binds.setdefault(sid, []).append((ts, role, node["key"]))
        node["package"] = node["package"] or _package(event)

    def resolve(self, sid: str, role: str, package: str, ts: float) -> dict:
        if role in (DIRECTOR, "main"):
            return self.node(sid, "main", ts)
        for bind_ts, bind_role, key in reversed(self.binds.get(sid, [])):
            if ts - bind_ts > BIND_WINDOW:
                break
            if bind_role == role and ts >= bind_ts:
                return self.nodes[key]
        candidates = [
            n
            for n in self.nodes.values()
            if n["session_id"] == sid
            and n["agent_id"] != "main"
            and n["role"] == role
            and n["status"] not in FINAL
        ]
        if package:
            candidates = [
                n for n in candidates if n["package"] == package
            ] or candidates
        if candidates:
            return max(candidates, key=lambda n: n["started"])
        return self.node(sid, f"log:{role}", ts, role)

    def on_status(self, event, ts, sid):
        node = self.resolve(sid, event.get("role") or "", _package(event), ts)
        node["_signal"] = True
        self.record(
            sid,
            "status",
            ts,
            node["key"],
            status=event.get("status") or "",
            task=event.get("task") or "",
            summary=event.get("summary") or "",
        )
        self.touch(node, ts)
        self.stamp(node, event, ("handbook_version", "milestone"))
        status = event.get("status") or ""
        if status:
            node["status"] = status
            if status in FINAL:
                node["stopped"] = ts
                self.close_run(node, ts)
        for field in ("task", "summary"):
            if event.get(field):
                node[field] = event[field]
        if _package(event):
            node["package"] = _package(event)
        if status == "done" and event.get("summary"):
            self.add_chronicle(node, ts, event["summary"])

    def on_budget(self, event, ts, sid):
        lead = event.get("role") or ""
        grant = event.get("budget") or {}
        phase = grant.get("phase") or "Standard"
        granted = int(grant.get("granted") or 0)
        parallel = int(grant.get("parallel") or 0)
        current = self.budgets.get(lead)
        if current is None or current["phase"] != phase:
            current = {
                "lead": lead,
                "phase": phase,
                "granted": 0,
                "parallel": 0,
                "since": ts,
            }
            self.budgets[lead] = current
        current["granted"] += granted
        if parallel:
            current["parallel"] = parallel

    def on_package(self, event, ts, sid):
        key = _package(event)
        item = self.board.setdefault(key, {"id": key})
        for field in ("title", "owner", "status", "milestone"):
            if event.get(field):
                item[field] = event[field]
        blocked = event.get("blocked_by") or []
        if isinstance(blocked, str):
            blocked = [b.strip() for b in blocked.split(",") if b.strip()]
        item["blocked_by"] = list(blocked)
        item["ts"] = event.get("ts", "")

    def on_decision(self, event, ts, sid):
        key = str(event.get("decision_id") or "")
        item = self.decisions.setdefault(key, {"id": key, "resolved": None})
        if event.get("resolution"):
            item["resolved"] = event["resolution"]
            return
        item.update(
            {
                "for": event.get("for") or "l0",
                "question": event.get("question") or "",
                "recommendation": event.get("recommendation") or "",
                "from": event.get("role") or "",
                "ts": event.get("ts", ""),
                "session_id": sid,
                "resolved": None,
            }
        )

    def on_usage(self, event, ts, sid):
        node = self.agent(event, ts, sid)
        if isinstance(event.get("usage"), dict):
            node["usage"] = event["usage"]
        if event.get("session_cost") is not None:
            self.sessions[sid]["cost"] = event["session_cost"]

    def on_result(self, event, ts, sid):
        try:
            rounds = int(event.get("review_rounds") or 0)
        except (TypeError, ValueError):
            rounds = 0
        package, worker = _package(event), str(event.get("worker") or "")
        role = str(event.get("role") or "")
        self.results[(package, worker or role)] = {
            "t": ts,
            "ts": event.get("ts", ""),
            "session_id": sid,
            "package": package,
            "role": role,
            "worker": worker,
            "outcome": str(event.get("outcome") or ""),
            "review_rounds": rounds,
            "milestone": str(event.get("milestone") or ""),
        }

    def on_milestone(self, event, ts, sid):
        ident = str(event.get("milestone") or "")
        status = str(event.get("status") or "")
        if not ident or status not in ("start", "done"):
            return
        item = self.milestones_by_id.setdefault(
            ident, {"id": ident, "title": "", "status": "", "started": None}
        )
        item["title"] = str(event.get("title") or item["title"])
        item["status"] = "done" if status == "done" else "running"
        if status == "start":
            item["started"] = ts
        else:
            item["done"] = ts
        self.timeline.append((ts, ident, status))

    def on_retro(self, event, ts, sid):
        triggers = event.get("triggers")
        triggers = triggers if isinstance(triggers, list) else []
        self.retros.append(
            {
                "id": str(event.get("retro_id") or ""),
                "kind": str(event.get("retro_kind") or ""),
                "triggers": [str(t) for t in triggers],
                "report": str(event.get("report") or ""),
                "t": ts,
                "session_id": sid,
            }
        )

    def on_ci(self, event, ts, sid):
        run = str(event.get("run_id") or "")
        if not run:
            return
        self.ci[run] = {
            "run_id": run,
            "conclusion": str(event.get("conclusion") or ""),
            "branch": str(event.get("branch") or ""),
            "sha": str(event.get("sha") or ""),
            "workflow": str(event.get("workflow") or ""),
            "t": parse_ts(event.get("created")) or ts,
            "session_id": sid,
        }

    def on_queue(self, event, ts, sid):
        key = str(event.get("queue_id") or "")
        if not key:
            return
        item = self.queue.setdefault(
            key, {"id": key, "state": "open", "session_id": sid, "t": ts}
        )
        action = event.get("action")
        if action == "add":
            item.update(
                question=str(event.get("question") or ""),
                blocks=event.get("blocks") or [],
                role=str(event.get("role") or ""),
                state="open",
            )
        elif action == "answer":
            item["state"] = "answered"
        elif action == "done":
            item["state"] = "done"

    def add_feed(self, event: dict, ts: float, sid: str) -> None:
        if event.get("source") == "log" and event.get("role"):
            role = event["role"]
            department = classify(role)[1]
        else:
            node = self.nodes.get(f"{sid}:{event.get('agent_id') or 'main'}")
            role = node["role"] if node else (event.get("role") or DIRECTOR)
            department = node["department"] if node else classify(role)[1]
        text = next(
            (
                event[f]
                for f in (
                    "tool",
                    "task",
                    "summary",
                    "description",
                    "question",
                    "resolution",
                    "title",
                )
                if event.get(f)
            ),
            "",
        )
        if event.get("kind") == "spawn":
            target = event.get("persona") or event.get("subagent_type") or ""
            text = f"→ {target}: {event.get('description') or ''}"
        self.feed.append(
            {
                "ts": event.get("ts", ""),
                "t": ts,
                "session_id": sid,
                "role": role,
                "department": department,
                "kind": event.get("kind", ""),
                "status": event.get("status", ""),
                "text": _short(text, 140),
                "_agent": f"{sid}:{event.get('agent_id') or ''}",
            }
        )
        if event.get("kind") == "message":  # Text erst im Nachlauf (Namen, P2)
            self.feed[-1]["_to"] = str(event.get("to") or "")
            self.feed[-1]["_text"] = str(event.get("text") or "")

    # --- Ergebnis -----------------------------------------------------------

    def result(
        self, session: str | None, inactive_after: float, heartbeats: bool = True
    ) -> dict:
        ordered = sorted(self.sessions.values(), key=lambda s: s["last"], reverse=True)
        if session in (None, "", "latest"):
            chosen = ordered[0]["id"] if ordered else None
            scope = {chosen} if chosen else set()
        elif session == "all":
            chosen, scope = "all", {s["id"] for s in ordered}
        else:
            chosen, scope = session, {session}

        self.finalize()
        self.identities()
        layouts = self.layouts()
        views = {
            key: self.view(node, inactive_after) for key, node in self.nodes.items()
        }

        def tree(key: str) -> dict:
            node = dict(views[key])
            children = sorted(
                (k for k in self.nodes[key]["children"] if not self.hidden(k)),
                key=lambda k: self.nodes[k]["started"],
            )
            node["children"] = [tree(k) for k in children]
            return node

        roots = [
            tree(f"{s['id']}:main")
            for s in ordered
            if s["id"] in scope and f"{s['id']}:main" in self.nodes
        ]
        in_scope = [
            v
            for k, v in views.items()
            if v["session_id"] in scope and not self.hidden(k)
        ]
        counts = Counter(v["status"] for v in in_scope)
        counts["inactive"] = sum(1 for v in in_scope if v["inactive"])
        feed = [f for f in self.feed if f["session_id"] in scope]
        self.message_texts(feed, layouts)
        chronicle = [
            {k: v for k, v in c.items() if k != "_key"}
            for c in self.chronicle
            if c["session_id"] in scope and not self.hidden(c["_key"])
        ]
        records = [effort.record(n, self.nodes) for n in self.nodes.values()]
        mine = [r for r in records if r["session_id"] in scope]
        results = [r for r in self.results.values() if r["session_id"] in scope]
        ci_runs = self.ci_in_scope(ordered, scope, chosen == "all")
        escalations = [
            d
            for d in self.decisions.values()
            if d.get("for") == "l0" and d.get("session_id") in scope
        ] + [q for q in self.queue.values() if q["session_id"] in scope]
        inactive_keys = [k for k, v in views.items() if v["inactive"]]
        return {
            "now": self.now,
            "session": chosen,
            "sessions": ordered,
            "tree": roots,
            "counts": dict(counts),
            "chronicle": sorted(chronicle, key=lambda c: c["t"], reverse=True)[
                :CHRONICLE_SIZE
            ],
            "budgets": self.budget_view(),
            "board": self.board_view(),
            "decisions": sorted(
                (
                    {
                        k: d.get(k, "")
                        for k in (
                            "id",
                            "for",
                            "question",
                            "recommendation",
                            "from",
                            "ts",
                        )
                    }
                    for d in self.decisions.values()
                    if not d.get("resolved")
                ),
                key=lambda d: d["ts"],
            ),
            "feed": _collapse_feed(feed, heartbeats)[:FEED_SIZE],
            "pulse": self.pulse(feed),
            "departments": ["studio", *DEPARTMENTS, "extern"],
            "records": mine,
            "delegations": effort.delegations(mine, results),
            "effort": effort.aggregate(mine),
            "quality": effort.quality(
                mine, results, ci_runs, escalations, inactive_after
            ),
            "incidents": self.incident_list(records, inactive_keys),
            "milestones": self.milestone_view(),
            "session_costs": [
                {"session_id": s["id"], "cost": s["cost"]}
                for s in ordered
                if s["id"] in scope and s.get("cost") is not None
            ],
            "queue": [q for q in self.queue.values() if q["session_id"] in scope],
            "graph": self.graph_view(chosen, layouts),
        }

    def ci_in_scope(self, sessions: list[dict], scope: set, every: bool) -> list[dict]:
        """CI-Läufe, deren Zeitpunkt (created, sonst ts) in eine Session fällt."""
        if every:
            return list(self.ci.values())
        windows = [(s["started"], s["last"]) for s in sessions if s["id"] in scope]
        return [
            run
            for run in self.ci.values()
            if any(start <= run["t"] <= end for start, end in windows)
        ]

    def finalize(self) -> None:
        """Meilenstein je Knoten: Kopfzeile, Paket, Vorfahr, laufender Meilenstein."""

        def explicit(node: dict, seen: set[str]) -> str:
            if node["milestone"]:
                return node["milestone"]
            item = self.board.get(node["package"]) or {}
            if item.get("milestone"):
                return item["milestone"]
            parent = self.nodes.get(node["parent"] or "")
            if parent is None or parent["key"] in seen:
                return ""
            return explicit(parent, seen | {node["key"]})

        for node in self.nodes.values():
            node["milestone"] = explicit(node, set()) or self.running_milestone(
                node["started"]
            )

    def running_milestone(self, t: float) -> str:
        current = ""
        for stamp, ident, status in self.timeline:
            if stamp > t:
                break
            current = ident if status == "start" else ""
        return current

    def milestone_view(self) -> list[dict]:
        return [dict(m) for m in self.milestones_by_id.values()]

    def incident_list(
        self, records: list[dict], inactive_keys: list[str]
    ) -> list[dict]:
        acknowledged = {t for retro in self.retros for t in retro["triggers"]}
        return effort.incidents(
            records,
            list(self.results.values()),
            list(self.ci.values()),
            self.budget_view(),
            self.milestone_view(),
            acknowledged,
            inactive_keys,
        )

    def view(self, node: dict, inactive_after: float) -> dict:
        live_children = [c for c in node["children"] if self.nodes[c]["status"] in LIVE]
        status = node["status"]
        if status == "active" and live_children:
            status = "delegated"
        quiet = self.now - node["last_seen"]
        inactive = status in LIVE and not live_children and quiet > inactive_after
        view = {field: node[field] for field in PUBLIC}
        view.update(status=status, inactive=inactive, idle_seconds=round(max(quiet, 0)))
        return view

    def budget_view(self) -> list[dict]:
        leads = set(self.budgets)
        leads |= {
            n["role"] for n in self.nodes.values() if n["level"] == 1 and n["children"]
        }
        rows = []
        for lead in sorted(leads):
            plan = self.budgets.get(
                lead,
                {"phase": "ohne Freigabe", "granted": 0, "parallel": 0, "since": 0.0},
            )
            children = [
                self.nodes[c]
                for n in self.nodes.values()
                if n["role"] == lead
                for c in n["children"]
                if self.nodes[c]["started"] >= plan["since"]
            ]
            spans = []
            for c in children:
                if c["_runs"]:
                    spans += [(a, self.now if b is None else b) for a, b in c["_runs"]]
                else:
                    end = c["stopped"] if c["stopped"] is not None else self.now
                    spans.append((c["started"], end))
            spans.sort()
            peak = 0
            for start, _ in spans:
                peak = max(peak, sum(1 for s, e in spans if s <= start < e))
            used = len(children)
            rows.append(
                {
                    "lead": lead,
                    "phase": plan["phase"],
                    "granted": plan["granted"],
                    "parallel": plan["parallel"],
                    "used": used,
                    "parallel_used": peak,
                    "overrun": used > plan["granted"]
                    or (plan["parallel"] > 0 and peak > plan["parallel"]),
                    "model_mix": dict(
                        Counter(c["model"] or "inherit" for c in children)
                    ),
                }
            )
        return rows

    def board_view(self) -> list[dict]:
        items = []
        for item in self.board.values():
            row = {
                "id": item["id"],
                "title": item.get("title", ""),
                "owner": item.get("owner", ""),
                "status": item.get("status", "open"),
                "blocked_by": item.get("blocked_by", []),
                "milestone": item.get("milestone", ""),
                "ts": item.get("ts", ""),
            }
            row["blocks"] = sorted(
                other["id"]
                for other in self.board.values()
                if item["id"] in other.get("blocked_by", [])
            )
            items.append(row)
        return sorted(items, key=lambda r: (r["milestone"], r["id"]))

    def pulse(self, feed: list[dict]) -> list[dict]:
        last = int(self.now // 60)
        buckets = {m: Counter() for m in range(last - PULSE_MINUTES + 1, last + 1)}
        for entry in feed:
            minute = int(entry["t"] // 60)
            if minute in buckets:
                buckets[minute][entry["department"]] += 1
        return [
            {
                "minute": datetime.fromtimestamp(m * 60, timezone.utc)
                .astimezone()
                .strftime("%H:%M"),
                "total": sum(c.values()),
                "by": dict(c),
            }
            for m, c in buckets.items()
        ]


def _heartbeat_text(tools: list[str], count: int) -> str:
    names = ", ".join(tools[:HEARTBEAT_TOOLS])
    if len(tools) > HEARTBEAT_TOOLS:
        names += ", …"
    return f"{names} ×{count}" if count > 1 else names


def _collapse_feed(feed: list[dict], heartbeats: bool) -> list[dict]:
    """Heartbeat-Läufe je Agent zu einer Zeile zusammenfassen, neueste zuerst.

    Ein Lauf endet, sobald derselbe Agent (gleicher Schlüssel oder gleiche Rolle
    in derselben Session) ein anderes Event erzeugt. Ohne ``heartbeats`` fallen
    alle Heartbeat-Zeilen weg.
    """
    rows: list[dict] = []
    runs: dict[str, dict] = {}
    for entry in sorted(feed, key=lambda f: f["t"]):
        row = {k: v for k, v in entry.items() if not k.startswith("_")}
        if entry["kind"] != "heartbeat":
            for key, run in list(runs.items()):
                if key == entry["_agent"] or (
                    run["session_id"] == entry["session_id"]
                    and run["role"] == entry["role"]
                ):
                    del runs[key]
            rows.append(row)
            continue
        if not heartbeats:
            continue
        run = runs.get(entry["_agent"])
        if run is None:
            run = row | {"count": 0, "first_t": entry["t"], "_tools": []}
            runs[entry["_agent"]] = run
            rows.append(run)
        run["count"] += 1
        run["t"], run["ts"] = entry["t"], entry["ts"]
        if entry["text"] and entry["text"] not in run["_tools"]:
            run["_tools"].append(entry["text"])
        run["text"] = _heartbeat_text(run["_tools"], run["count"])
    for row in rows:
        row.pop("_tools", None)
    return sorted(rows, key=lambda f: f["t"], reverse=True)


def build_state(
    events: list[dict],
    now: float,
    agent_models: dict[str, str],
    session: str | None = None,
    inactive_after: float = INACTIVE_DEFAULT,
    heartbeats: bool = True,
    agent_names: dict[str, dict] | None = None,
) -> dict:
    builder = _Builder(agent_models, now, agent_names)
    ordered = sorted(
        (e for e in events if isinstance(e, dict)), key=lambda e: parse_ts(e.get("ts"))
    )
    for event in ordered:
        # ein kaputtes Event darf nie den ganzen Stand kippen
        with contextlib.suppress(Exception):
            builder.apply(event)
    return builder.result(session, inactive_after, heartbeats)


def pending_incidents(
    events: list[dict], now: float, inactive_after: float = INACTIVE_DEFAULT
) -> list[dict]:
    """Offene Vorfälle über alle Sessions (ohne erledigte Retro-Auslöser)."""
    return build_state(events, now, {}, "all", inactive_after, False)["incidents"]
